import multiprocessing
import queue
import time
from threading import Thread


from cap_from_youtube import cap_from_youtube
import cv2
import numpy as np
from regex import F
import torch
from transformers import SegformerFeatureExtractor

from segformer_manager import SegmentationInference
from src import utils
from src.alert import Alert
from src.overlay_manager import OverlayManager

batch_size = 4      # 배치 사이즈
image_size = None   # 이미지 크기
x_resolution = 1080
y_resolution = 960

url = 'rtsp://etri:etri1234@192.168.2.125:554/stream1'
cap = cv2.VideoCapture(url)
title = "Tapo CCTV cam"
x_start = 0
x_end = 720 
y_start = 0
y_end = 1280
pixel_percentage_threshold = 40
overlay_manager = OverlayManager('house.png', scale=0.2, position=(100, 100))

# url = 'https://youtu.be/qTNTZ8CVAX4'
# cap = cap_from_youtube(url, '1080p')
# title = "Mountain River1"
# x_start = 0
# x_end = x_start + x_resolution
# y_start = 600
# y_end = y_start + y_resolution
# pixel_percentage_threshold = 40
# overlay_manager = OverlayManager('house.png', scale=0.7, position=(270, 250))

# url = 'https://youtu.be/CoQtaW0BpDY'
# cap = cap_from_youtube(url, '1080p')
# title = "Mountain River2"
# x_start = 0
# x_end = x_start + x_resolution
# y_start = 550
# y_end = y_start + y_resolution
# pixel_percentage_threshold = 40
# overlay_manager = OverlayManager('house.png', scale=0.7, position=(100, 100))

# 사용자 설정 값
is_move = False
is_noise = False
is_overlay = False
keyValue = None

def move(frame):
    if 'rtsp' in url:
        return frame
    
    if is_move:
        return frame[x_start:x_end, y_start+350:y_end+350]
    else:
        return frame[x_start:x_end, y_start:y_end]

def preprocess_image(before_queue: queue.Queue):   
    # 첫 프레임 초기화
    global image_size
    global is_move
    global is_noise

    _, frame = cap.read()
    frame = move(frame)
    image_size = utils.frame_to_pil(frame).size[::-1]

    # GPU 준비
    feature_extractor = SegformerFeatureExtractor()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    while True:
        ret, frame = cap.read()

        if not ret:
            print("프레임을 읽을 수 없습니다.")
            continue

        # # 이미지 자르기
        # frame = move(frame)

        # # 노이즈 처리
        # if is_noise:
        #     frame = utils.noise(frame)

        # if is_overlay:
        #     overlay_manager.apply_overlay(frame)

        # Numpy 배열을 PIL 이미지로 변환
        image_pil = utils.frame_to_pil(frame)

        # 전처리합니다.
        inputs = feature_extractor(images=image_pil, return_tensors="pt", padding=True)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # 전처리된 데이터를 큐에 추가합니다.
        before_queue.put((frame, inputs))

def after_process(before_queue: queue.Queue, after_queue: queue.Queue, diff_queue: queue.Queue, 
                    segmenter: SegmentationInference):
    global is_move
    global is_noise
    global is_overlay
    global keyValue

    # 전체화면
    # if 'rtsp' not in url:
    cv2.namedWindow(title, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(title, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    # 처리 시작 시간 기록
    start_time = time.time()

    # 처리된 프레임 수를 추적하기 위한 카운터
    frame_count = 0

    while True:
        frame, pred_seg_np = after_queue.get()
        pred_img = segmenter.get_seg_overlay(frame, pred_seg_np)

        # 프레임 가로로 비교
        if 'rtsp' in url:
            cv2.imshow(title, pred_img)
        else:
            combined_image = np.hstack((frame, pred_img))
            cv2.imshow(title, combined_image)

        press_key = cv2.waitKey(1)
        if press_key == 27:  # esc
            break
        elif press_key == ord('m'):
            is_move = not is_move
            keyValue = press_key
        elif press_key == ord('n'):
            is_noise = not is_noise
            keyValue = press_key
        elif press_key == ord('h'):
            is_overlay = not is_overlay
            keyValue = press_key

        frame_count += 1

        # 현재까지의 경과 시간 계산
        elapsed_time = time.time() - start_time

        # 초당 프레임 처리 속도 계산
        if frame_count % 15 == 0:
            # 픽셀 단위 비교를 위해 프레임을 큐에 추가
            diff_queue.put(frame)
            fps = frame_count / elapsed_time
            print(f"초당 처리 프레임 수: {fps:.3f}, before_queue: {before_queue.qsize()}, after_queue: {after_queue.qsize()}, diff_queue: {diff_queue.qsize()}")

def diff_process(diff_queue: queue.Queue):
    history_frames = []         # 프레임 저장 리스트
    history_time_interval = 15  # 프레임 저장 간격
    frame_counter = 0           # 프레임 저장 간격 카운터

    # 첫번째 프레임 초기화
    frame = diff_queue.get()
    history_frames.append(frame)

    # 전체 해상도 필셀 수 계산 
    total_pixels = frame.shape[0] * frame.shape[1]

    alert = Alert()

    while True:
        frame = diff_queue.get()

        # 현재 프레임과 이전 10분 동안의 프레임들과의 차이를 계산
        pixel_count_sum = 0
        for history_frame in history_frames:
            difference_image = utils.cal_image_diff(history_frame, frame)
            pixel_count_sum += np.sum(difference_image > 0)
        
        # 이전 프레임의 픽셀 변경 사항 평균
        pixel_count_mean = int(pixel_count_sum / len(history_frames))

        # 전체 해상도 필셀 수 대비 변경된 픽셀 계산
        pixel_percentage = (pixel_count_mean / total_pixels) * 100

        # 움직임이 감지되면 알림 출력
        if pixel_percentage > pixel_percentage_threshold:  # 이 값은 실제 환경에 따라 조정되어야 함
            print(f'이상 감지 : {pixel_percentage}')
            alert.show_alert(frame, keyValue)
        else:
            alert.close_alert()
            # 프레임을 저장
            frame_counter += 1
            if frame_counter == history_time_interval:
                history_frames.append(frame)
                print("이상 의심 정도: ", pixel_percentage)
                frame_counter = 0

                # 10분이 지나면 가장 오래된 프레임을 제거
                if len(history_frames) > 30:
                    history_frames.pop(0)
                # else:
                    # print(f"현재 쌓인 프레임 데이터 : {len(history_frames)}")
       
def main():
    # 큐 초기화
    before_queue = queue.Queue()
    after_queue = queue.Queue()
    diff_queue = queue.Queue()

    # 전처리 스레드 시작
    thread = Thread(target=preprocess_image, args=(before_queue, ))
    thread.start()

    # image_size 정보가 초기화 될 때 까지대기
    for _ in range(10):
        if (image_size == None):
            time.sleep(1)
        else:
            break
    
    # 세그먼트 모델 초기화
    segmenter = SegmentationInference(
        before_queue, after_queue,                                              # 큐
        data_dir="./atlantis", model_name="segformer-b5/checkpoint-22080",      # 모델 위치
        batch_size=batch_size, interpolate_size=image_size                      # 하이퍼 파라미터
    )

    # 후처리 스레드 시작
    thread = Thread(target=after_process, args=(before_queue, after_queue, diff_queue, segmenter))
    thread.start()

    # 프레임 비교 스레드 시작
    thread = Thread(target=diff_process, args=(diff_queue, ))
    thread.start()

    # 세그먼트 모델 실행(무한 대기)
    segmenter.start()

    # 리소스 해제
    cap.release()
    cv2.destroyAllWindows()

if __name__=="__main__":
    main()