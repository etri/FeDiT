# curl -X GET "http://127.0.0.1:5000/inference"



import base64
import multiprocessing
from flask import Flask, jsonify
import cv2
from torchvision import models, transforms
from PIL import Image
import torch
import io
import os
import copy
import glob
import argparse
import datetime

import numpy as np
import xml.etree.ElementTree as ET


app = Flask(__name__)




args = argparse.Namespace(
    root_path   = '../dataset/PKLot',
    checkpoint = 'last_ResNet18_0001_0.0056_0.9994.pth',
    time_str    = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y%m%d_%H%M%S'),
    num_workers = 4,
    cuda_index  = 2,
    batch_size  = 32,
    epochs = 1,
    lr = 1e-5,
    res = 112,
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')





class pklot_dataset(torch.utils.data.Dataset):
    def __init__(self, root_path, res=112):
        self.root_path = root_path
        self.res = res
        self.train = False
        self.source = list()
        self.target = list()
        for search, dirs, files in os.walk(self.root_path):
            for subdir in dirs:
                folder = os.path.join(search, subdir)
                images = np.array(sorted(glob.glob( os.path.join(folder, '*.jpg') )))
                labels = np.array(sorted(glob.glob( os.path.join(folder, '*.xml') )))
                found = list()
                for index, image_path in enumerate(images):
                    keyword = image_path[:-3] + 'xml'
                    results = np.where(labels == keyword)[0]
                    if len(results)==1:
                        self.source.append(image_path)
                        self.target.append(keyword)
        outlier = list()
        for index, target in enumerate(self.target):
            test = ET.parse(target)
            root = test.getroot()
            for sample in list(root.iter('space')):
                data = sample.items()
                if len(data) != 2 :
                    outlier.append(index)
                    break
        outlier.reverse()
        for index in outlier:
            del self.source[index]
            del self.target[index]
    def __len__(self):
        return len(self.source)
    def __getitem__(self, index):
        source = cv2.imread(self.source[index], cv2.IMREAD_COLOR)
        target = self.target[index]
        tree = ET.parse(target)
        root = tree.getroot()
        images = list()
        labels = list()
        counts = list()
        contours = list()
        for sample in list(root.iter('space')):
            data = sample.items()
            if len(data) > 1 :
                cls_id = int(sample.attrib['occupied'])
            else: 
                cls_id = 2
            points = list()
            min_x, min_y, max_x, max_y = 10000, 10000, 0, 0
            for i, rect in enumerate(sample.findall('contour/point')):
                x = int(rect.get('x')) 
                y = int(rect.get('y'))
                min_x = x if min_x > x else min_x
                min_y = y if min_y > y else min_y
                max_x = x if max_x < x else max_x
                max_y = y if max_y < y else max_y
                points.append([x,y])
            if len(points) < 1:
                for i, rect in enumerate(sample.findall('contour/Point')):
                    x = int(rect.get('x')) 
                    y = int(rect.get('y'))
                    min_x = x if min_x > x else min_x
                    min_y = y if min_y > y else min_y
                    max_x = x if max_x < x else max_x
                    max_y = y if max_y < y else max_y
                    points.append([x,y])

            select = np.array(points)
            mask = np.zeros( (source.shape[0],source.shape[1]), dtype=np.uint8)
            cv2.fillPoly(mask,[select],255)
            mask = cv2.cvtColor(mask,cv2.COLOR_GRAY2RGB)
            space = copy.deepcopy(source) & mask
            
            coors = [cls_id, points, [min_x,min_y,max_x-min_x,max_y-min_y]] 
            contours.append(coors)
            space = space[min_y:max_y, min_x:max_x]
            space = cv2.resize(space, dsize=(self.res,self.res), interpolation=cv2.INTER_NEAREST)
            
            images.append( space )
            labels.append( cls_id )
            
        images = torch.from_numpy(np.array(images)).float()
        labels = torch.from_numpy(np.array(labels)).long()
            
        return images, labels, counts, source, target, contours

def collate_fn(samples):
    images = [sample[0].permute(0,3,1,2) for sample in samples]
    labels = [sample[1] for sample in samples]
    counts = [sample[2] for sample in samples]
    source = [sample[3] for sample in samples]
    target = [sample[4] for sample in samples]
    contours = [sample[5] for sample in samples]
    return images, labels, counts, source, target, contours









def image_to_base64(cv_image: np.ndarray) -> bytes:
    cv_image_rgb = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(cv_image_rgb)
    buffered = io.BytesIO()
    pil_image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue())
    
    return img_str


def predict(shared_total, shared_results, shared_source_str, shared_output_str):
    print('** Setup **')
    model = models.resnet18()
    model.fc = torch.nn.Linear(model.fc.in_features, 2)
    model = model.to(device)
    model.load_state_dict( torch.load(args.checkpoint, map_location=device) )
    
    kwargs = {
        'num_workers': args.num_workers,
        'batch_size' : 1,
        'pin_memory' : True,
        'collate_fn' : collate_fn,
    }
    
    epoch = 0
    
    print('** Inference **')
    
    while True:
        print('- Epoch {}'.format(epoch+1))
        model.to(device)
        model.eval()
        dataset = pklot_dataset(args.root_path, res=args.res)
        loader = torch.utils.data.DataLoader(dataset, **kwargs, shuffle=True)
        
        with torch.no_grad():
            for images, labels, _, source, target, contours in loader:
                for image, _true, _line, output in zip(images, labels, contours, source):
                    logit = model(image.to(device)/255.)
                    _pred = torch.max(logit,1)[1].detach().cpu()
                    for i, box in enumerate(_line):
                        shared_results[5*i] = int(i+1)
                        shared_results[5*i+1] = int(box[2][0])
                        shared_results[5*i+2] = int(box[2][1])
                        shared_results[5*i+3] = int(box[2][2])
                        shared_results[5*i+4] = int(box[2][3])
                        
                    shared_source_str.value = image_to_base64(output)
                    
                    for meta, r in zip(_line,(_true==_pred)):
                        point = np.array(meta[1])
                        color = (0,255,0) if meta[0]==0 else (0,0,255)
                        output = cv2.polylines(output, [ point ], True, color, 5 )
                        center = tuple(np.mean(point,0).astype(np.int32))
                        if r.item():
                            cv2.circle(output,center,5,(255,0,0),-1)
                        else:
                            cv2.circle(output,center,5,(0,0,255),-1)

                    
                    shared_output_str.value = image_to_base64(output)
                    shared_total.value = len(_line)
                    print('  . Count: ', shared_total.value)

        


@app.route('/inference', methods=['GET'])
def inference_endpoint():
    print('** Response **')
    global shared_total, shared_results, shared_source_str, shared_output_str
    results = list()
    for i in range(shared_total.value):
        results.append({
            'id' : shared_results[5*i],
            'box': [shared_results[5*i+1],shared_results[5*i+2],shared_results[5*i+3],shared_results[5*i+4],]
        })
    return jsonify({
        "results": results,
        "source" : shared_source_str.value.decode(),
        "output" : shared_output_str.value.decode(),
    })

def run_server():
    app.run(debug=True, threaded=False)


def init_shared_memory():
    global shared_total, shared_results, shared_source_str, shared_output_str
    shared_total = multiprocessing.Value('i', 1)
    shared_results = multiprocessing.Array('i', 5*1000)
    shared_source_str = multiprocessing.Array('c', 10 * 1024 * 1024)
    shared_output_str = multiprocessing.Array('c', 10 * 1024 * 1024)


if __name__ == "__main__":
    multiprocessing.set_start_method('spawn', force=True)
    init_shared_memory()

    predictor_process = multiprocessing.Process(target=predict, args=(shared_total, shared_results, shared_source_str, shared_output_str))

    predictor_process.start()
    run_server()

    predictor_process.join()
