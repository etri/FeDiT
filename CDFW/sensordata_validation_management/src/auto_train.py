# warning 무시
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import absl.logging
absl.logging.set_verbosity(absl.logging.ERROR)

import pickle

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

import tensorflow as tf
from keras.models import Model

class AutoTrain():

    def __init__(self, name="infer"):
        # 기본 정보 초기화
        self.name = name

        # 파일 경로 초기화
        self.model_dir = "model"
        self.scaler_path = f'{self.model_dir}/scaler.pkl'

    def make_rolling_windows(self, window_size, data):
        result = []
        for i in range(window_size, len(data) + 1):
            # 현재 위치에서 window_size 만큼 앞으로 가서 데이터를 가져옴
            window = data[i-window_size:i]  
            result.append(window)
        return np.array(result)

    def load_csv_data(self):
        # csv 데이터 로딩
        try:
            csv_path = f"./data/{self.name}.csv"
            df = pd.read_csv(csv_path)
        except FileNotFoundError as e:
            print(f"{self.name} 데이터를 찾을 수 없음:", csv_path)
            raise e
        print(f"{self.name} 데이터 로딩 완료")
        print(df)
        return df

    def load_and_infer(self):
        # 학습 데이터 로딩
        df = self.load_csv_data()

        # 모델 불러오기
        model: Model = tf.saved_model.load(self.model_dir)
        input_shape = model.signatures['serving_default'].inputs[0].shape
        print(f"input_shape: {input_shape}")

        # 스케일러 불러오기
        with open(self.scaler_path, 'rb') as f:
            scaler: MinMaxScaler = pickle.load(f)

        # 입력 데이터 전처리
        scaled_data = scaler.transform(df)
        input_data = self.make_rolling_windows(input_shape[1], scaled_data)

        # 모델 추론
        predicted = model.serve(input_data)

        # 실제 입력 데이터와 예측 값 사이의 MAE 계산
        mae_list = tf.keras.losses.mean_absolute_error(input_data.reshape(-1), predicted.numpy().reshape(-1))
        return mae_list.numpy().mean()