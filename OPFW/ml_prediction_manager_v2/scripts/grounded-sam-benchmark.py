"""Real pretrained Grounding DINO + SAM inference; run inside a Jupyter kernel."""
import gc
import json
import os
from pathlib import Path
import time
import urllib.request

import numpy as np
from PIL import Image, ImageDraw
import psutil
import torch
from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor, SamModel, SamProcessor


def main():
    output = Path(os.getenv('GROUNDED_SAM_OUTPUT', '/home/jovyan/work'))
    output.mkdir(parents=True, exist_ok=True)
    assert torch.cuda.is_available(), 'A real CUDA GPU is required'
    torch.set_num_threads(1)
    torch.cuda.set_per_process_memory_fraction(0.85)
    report = {'gpu': torch.cuda.get_device_name(), 'torch': torch.__version__,
              'cuda': torch.version.cuda, 'precision': 'FP16 weights + autocast',
              'implementation': 'Transformers 4.51.3; no custom CUDA extensions',
              'dino_model': 'IDEA-Research/grounding-dino-tiny',
              'sam_model': 'facebook/sam-vit-base', 'measurements': []}

    def save():
        (output / 'grounded-sam-results.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

    def measure(stage, batch, function):
        gc.collect()
        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats()
        torch.cuda.synchronize()
        start = time.perf_counter()
        try:
            value = function()
            torch.cuda.synchronize()
            row = {'stage': stage, 'batch': batch, 'status': 'ok',
                   'seconds': round(time.perf_counter() - start, 3),
                   'peak_allocated_mib': round(torch.cuda.max_memory_allocated() / 2**20, 1),
                   'peak_reserved_mib': round(torch.cuda.max_memory_reserved() / 2**20, 1),
                   'process_rss_mib': round(psutil.Process().memory_info().rss / 2**20, 1)}
        except torch.OutOfMemoryError as error:
            value = None
            row = {'stage': stage, 'batch': batch, 'status': 'oom', 'error': str(error)}
            gc.collect()
            torch.cuda.empty_cache()
        report['measurements'].append(row)
        save()
        print('MEASUREMENT=' + json.dumps(row), flush=True)
        return value

    image_path = output / 'sample-car.png'
    if not image_path.exists():
        urllib.request.urlretrieve(
            'https://huggingface.co/ybelkada/segment-anything/resolve/main/assets/car.png', image_path)
    image = Image.open(image_path).convert('RGB')
    image.thumbnail((1024, 1024))
    report['image_size'] = list(image.size)
    print('Loading pretrained Grounding DINO Tiny', flush=True)
    dino_processor = AutoProcessor.from_pretrained(report['dino_model'])
    dino = AutoModelForZeroShotObjectDetection.from_pretrained(
        report['dino_model'], torch_dtype=torch.float16).eval().to('cuda')
    dino.config.disable_custom_kernels = True
    report['dino_revision'] = dino.config._commit_hash

    def detect(batch):
        inputs = dino_processor(images=[image] * batch, text=['a car. a wheel.'] * batch,
                                size={'shortest_edge': 640, 'longest_edge': 1024},
                                return_tensors='pt').to('cuda')
        with torch.inference_mode(), torch.autocast('cuda', dtype=torch.float16):
            prediction = dino(**inputs)
        # Padded text positions intentionally have -inf logits in Grounding DINO.
        assert not torch.isnan(prediction.logits).any(), 'NaN detection logits'
        assert torch.isfinite(prediction.pred_boxes).all(), 'Invalid detection boxes'
        detections = dino_processor.post_process_grounded_object_detection(
            prediction, inputs.input_ids, box_threshold=0.3, text_threshold=0.25,
            target_sizes=[image.size[::-1]] * batch)
        return [{key: value.cpu() if isinstance(value, torch.Tensor) else value
                 for key, value in detection.items()} for detection in detections]

    detections = measure('dino_images', 1, lambda: detect(1))
    assert detections and len(detections[0]['boxes']), 'No real objects detected'
    first = detections[0]
    report['detections'] = {key: value.tolist() if isinstance(value, torch.Tensor) else value
                            for key, value in first.items()}
    boxes = first['boxes'].tolist()
    for batch in [2, 4]:
        if measure('dino_images', batch, lambda batch=batch: detect(batch)) is None:
            break
    print('Loading pretrained SAM ViT-B; both models remain on GPU', flush=True)
    sam_processor = SamProcessor.from_pretrained(report['sam_model'])
    sam = SamModel.from_pretrained(report['sam_model'], torch_dtype=torch.float16).eval().to('cuda')
    report['sam_revision'] = sam.config._commit_hash
    sam_inputs = sam_processor(images=image, return_tensors='pt').to('cuda')

    def encode():
        with torch.inference_mode(), torch.autocast('cuda', dtype=torch.float16):
            return sam.get_image_embeddings(sam_inputs['pixel_values'])

    embeddings = measure('sam_image_encoder_both_resident', 1, encode)
    assert embeddings is not None, 'SAM encoder cannot fit with both models resident'

    def segment(batch, actual_boxes=None, image_embeddings=None):
        # Repeated real detected boxes isolate decoder batch scaling; not
        # a claim that this photo contains batch distinct objects.
        source_boxes = boxes if actual_boxes is None else actual_boxes
        selected = [source_boxes[index % len(source_boxes)] for index in range(batch)]
        inputs = sam_processor(images=image, input_boxes=[selected], return_tensors='pt').to('cuda')
        with torch.inference_mode(), torch.autocast('cuda', dtype=torch.float16):
            prediction = sam(image_embeddings=embeddings if image_embeddings is None else image_embeddings,
                             input_boxes=inputs['input_boxes'],
                             multimask_output=False)
        assert torch.isfinite(prediction.pred_masks).all() and torch.isfinite(prediction.iou_scores).all()
        masks = sam_processor.image_processor.post_process_masks(
            prediction.pred_masks.cpu().float(), inputs['original_sizes'].cpu(),
            inputs['reshaped_input_sizes'].cpu())[0]
        assert masks.shape[0] == batch and bool(masks.any()), 'Empty or invalid segmentation'
        return masks.numpy(), prediction.iou_scores.cpu().float().tolist()

    masks = None
    for batch in [1, 4, 8, 16, 32]:
        value = measure('sam_box_prompts_cached_embedding', batch, lambda batch=batch: segment(batch))
        if value is None:
            break
        if batch == 1:
            masks = value[0]
            report['sam_iou_scores'] = value[1]
    assert masks is not None
    def pipeline():
        current = detect(1)[0]['boxes'].tolist()
        assert current
        current_embeddings = encode()
        return segment(len(current), actual_boxes=current, image_embeddings=current_embeddings)

    for repeat in range(3):
        assert measure('pipeline_images_both_resident_repeat_' + str(repeat + 1), 1, pipeline) is not None
    mask = masks[0, 0]
    Image.fromarray(mask.astype('uint8') * 255).save(output / 'car-mask.png')
    overlay = np.array(image).copy()
    overlay[mask] = (overlay[mask] * 0.5 + np.array([0, 255, 0]) * 0.5).astype('uint8')
    annotation = Image.fromarray(overlay)
    drawing = ImageDraw.Draw(annotation)
    drawing.rectangle(boxes[0], outline='red', width=3)
    annotation.save(output / 'car-segmentation.png')
    report['completed'] = True
    save()
    print('GROUNDED_SAM_RESULT=' + json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
