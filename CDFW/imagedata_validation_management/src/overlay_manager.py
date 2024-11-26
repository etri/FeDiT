import cv2
import numpy as np

class OverlayManager:
    def __init__(self, image_path, scale=1.0, position=(0, 0)):
        self.image_path = image_path
        self.scale = scale
        self.position = position
        self.overlay_image = None
        self.alpha_mask = None
        self.inverted_mask = None
        self.overlay_rgb = None
        self.load_and_scale_image()

    def load_and_scale_image(self):
        # 이미지를 로드합니다.
        self.overlay_image = cv2.imread(self.image_path, cv2.IMREAD_UNCHANGED)
        if self.scale != 1.0:
            self.resize_overlay_image(self.scale)

    def resize_overlay_image(self, scale):
        # 이미지 크기 조정
        new_size = (int(self.overlay_image.shape[1] * scale), int(self.overlay_image.shape[0] * scale))
        self.overlay_image = cv2.resize(self.overlay_image, new_size, interpolation=cv2.INTER_AREA)
        self.prepare_overlay()

    def prepare_overlay(self):
        # 알파 채널을 이용해 마스크를 생성합니다.
        self.alpha_mask = self.overlay_image[:, :, 3] / 255.0
        self.inverted_mask = 1 - self.alpha_mask
        self.overlay_rgb = self.overlay_image[:, :, :3]

    def apply_overlay(self, frame):
        x_offset, y_offset = self.position
        # 오버레이 이미지가 프레임 경계를 넘어가지 않도록 검사합니다.
        y1, y2 = y_offset, min(y_offset + self.overlay_rgb.shape[0], frame.shape[0])
        x1, x2 = x_offset, min(x_offset + self.overlay_rgb.shape[1], frame.shape[1])

        # 프레임에 오버레이할 부분의 크기를 계산합니다.
        overlay_height = y2 - y1
        overlay_width = x2 - x1

        # 프레임에 적용할 오버레이 이미지와 마스크의 부분을 추출합니다.
        overlay_rgb_part = self.overlay_rgb[:overlay_height, :overlay_width]
        alpha_mask_part = self.alpha_mask[:overlay_height, :overlay_width]

        # 프레임의 오버레이 될 위치의 픽셀과 오버레이 이미지 픽셀을 결합합니다.
        frame[y1:y2, x1:x2] = frame[y1:y2, x1:x2] * (1 - alpha_mask_part)[:, :, np.newaxis] + overlay_rgb_part * alpha_mask_part[:, :, np.newaxis]