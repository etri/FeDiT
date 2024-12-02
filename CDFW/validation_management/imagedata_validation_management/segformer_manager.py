import os
import json
import torch
import numpy as np
import torch.nn.functional as F
from transformers import SegformerForSemanticSegmentation

class SegmentationInference:
    def __init__(self, before_queue, after_quere, data_dir, model_name, batch_size, interpolate_size):
        # 큐 설정
        self.before_queue = before_queue
        self.after_queue = after_quere

        # GPU 사용 여부 설정
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # 모델 초기화
        self.model = SegformerForSemanticSegmentation.from_pretrained(model_name).to(device)

        # 배치 사이즈 정보 초기화
        self.batch_size = batch_size

        # 인터폴레이션 정보 초기화
        self.interpolate_size = interpolate_size

        # 라벨 정보 초기화
        self.label_names, self.palette = self.atlantis_palette(data_dir)
        self.palette = np.array(self.palette)

    def atlantis_palette(self, data_dir):
        with open(os.path.join(data_dir, 'labels_info_show.json')) as f:
            colormap_json = json.load(f)

        label_names = ["none"]
        colormap = [[0, 0, 0]]
        for item in colormap_json:
            label_names.append(item['name'])
            colormap.append(item['color'])

        return label_names, colormap
   
    def get_seg_overlay(self, image_np, seg):   
        # 인플레이스 연산을 사용하여 성능 향상
        color_seg = np.take(self.palette, seg, axis=0)
        image_np = image_np.astype(np.float32)  # 데이터 타입을 float32로 변경
        np.multiply(image_np, 0.5, out=image_np)
        np.add(image_np, color_seg * 0.5, out=image_np)

        # 데이터 타입이 이미 uint8이 아닌 경우에만 변환
        if image_np.dtype != np.uint8:
            result = image_np.astype(np.uint8)
        else:
            result = image_np

        return result

    def start(self):
        while True:
            original_frames = []
            batch_inputs = []

            while len(batch_inputs) < self.batch_size and not self.before_queue.empty():
                frame, inputs = self.before_queue.get()
                original_frames.append(frame)
                batch_inputs.append(inputs)

            if len(batch_inputs) == 0:
                continue  # 큐가 비어있고 더 이상 데이터가 없으면 넘어가기

            # 배치 데이터를 합칩니다.
            batched_inputs = {k: torch.cat([b[k] for b in batch_inputs], dim=0) for k in batch_inputs[0]}

            with torch.no_grad():
                outputs = self.model(**batched_inputs)
                logits = outputs.logits

            # 전체 배치에 대해 interpolate 적용
            upsampled_logits = F.interpolate(logits, size=self.interpolate_size, mode='bilinear', align_corners=False)

            # 결과를 CPU로 옮기고 numpy 배열로 변환
            pred_seg = upsampled_logits.argmax(dim=1)
            pred_seg_np = pred_seg.to('cpu').numpy()

            # 각 결과를 후처리 큐에 추가
            for frame, pred in zip(original_frames, pred_seg_np):
                self.after_queue.put((frame, pred))