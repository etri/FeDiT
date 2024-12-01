import cv2
import numpy as np
import PIL


# Numpy 배열을 PIL 이미지로 변환
def frame_to_pil(frame):    
    # OpenCV는 BGR 형식으로 이미지를 반환하므로, RGB로 변환합니다.
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Numpy 배열을 PIL 이미지로 변환
    return PIL.Image.fromarray(frame_rgb)

def noise(frame):
    (height, width) = frame.shape[:2]

    split_size = 2
    
    # 노이즈를 추가할 영역의 너비와 높이를 지정합니다.
    noise_area_width = width // split_size
    noise_area_height = height // split_size
    
    # 중앙에 위치할 노이즈 영역의 시작점(왼쪽 상단)을 계산합니다.
    x_start = (width - noise_area_width) // split_size
    y_start = (height - noise_area_height) // split_size

    # 중앙 영역에 해당하는 부분에만 노이즈를 생성합니다.
    noise = np.random.normal(0, 50, (noise_area_height, noise_area_width, 3)).astype(np.uint8)
    
    # 중앙 영역을 추출합니다.
    center_area = frame[y_start:y_start+noise_area_height, x_start:x_start+noise_area_width]

    # 중앙 영역에 노이즈를 더합니다.
    noisy_center = cv2.add(center_area, noise)

    # 원본 프레임에 노이즈가 추가된 중앙 영역을 다시 넣습니다.
    frame[y_start:y_start+noise_area_height, x_start:x_start+noise_area_width] = noisy_center
    
    return frame

def cal_image_diff(img1, img2):
    # 두 이미지 간의 절대 차이 계산
    difference = cv2.absdiff(img1, img2)
    # 차이 이미지를 이진화
    _, threshold_image = cv2.threshold(difference, 30, 255, cv2.THRESH_BINARY)
    return threshold_image

# PNG 이미지를 읽어 들이는 함수
def read_png_with_alpha(png_file_path):
    # 이미지를 읽어 알파 채널(투명도)과 함께 반환합니다.
    png_image = cv2.imread(png_file_path, cv2.IMREAD_UNCHANGED)
    # 알파 채널을 분리합니다.
    alpha_channel = png_image[:, :, 3]
    rgb_channels = png_image[:, :, :3]

    # 알파 채널을 사용해 마스크를 만듭니다.
    _, alpha_mask = cv2.threshold(alpha_channel, thresh=220, maxval=255, type=cv2.THRESH_BINARY)
    color_and_mask = cv2.merge([rgb_channels, alpha_mask])
    return color_and_mask