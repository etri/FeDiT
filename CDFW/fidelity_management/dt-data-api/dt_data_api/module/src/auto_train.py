# warning 무시
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import absl.logging
absl.logging.set_verbosity(absl.logging.ERROR)

import pickle

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler

import tensorflow as tf
import keras
from keras import layers
from keras.models import Model
from keras.callbacks import EarlyStopping

from .estimate_hyper_parameter import Estimater
from alive_progress import alive_bar

@keras.saving.register_keras_serializable()
class Autoencoder(Model):
    def __init__(self, layer_size, window_size, feature_n, **kwargs):
        super(Autoencoder, self).__init__(**kwargs)
        self.layer_size = layer_size
        self.window_size = window_size
        self.feature_n = feature_n

        assert layer_size >= 2, "layer_size should be at least 2"

        # 16 부터 2의 배수로 감소하는 layer_units 생성. ex) [~, 128, 64, 32, 16]
        start_units = 16 * (2 ** (layer_size - 1))
        layer_units = [start_units // (2 ** i) for i in range(layer_size - 1)] + [16]

        # 인코더 구성
        encoder_layers = [layers.LSTM(units, activation="relu", return_sequences=True) for units in layer_units[:-1]]
        encoder_layers.append(layers.LSTM(layer_units[-1], activation="relu", return_sequences=False))
        encoder_layers.append(layers.RepeatVector(window_size))
        self.encoder = tf.keras.Sequential(encoder_layers)

        # 디코더 구성
        decoder_layers = [layers.LSTM(layer_units[-1], activation="relu", return_sequences=True)]
        decoder_layers.extend([layers.LSTM(units, activation="relu", return_sequences=True) for units in layer_units[-2::-1]])
        decoder_layers.append(layers.TimeDistributed(layers.Dense(feature_n)))
        self.decoder = tf.keras.Sequential(decoder_layers)

    def call(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

    def get_config(self):
        config = super(Autoencoder, self).get_config()
        config.update({
            'layer_size': self.layer_size,
            'window_size': self.window_size,
            'feature_n': self.feature_n
        })
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

class AutoTrain():

    def __init__(self, window_size, layer_size, name="train"):
        # 기본 정보 초기화
        self.window_size = window_size
        self.layer_size = layer_size
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

    def train_and_save(self, patience = 100):
        # 하이퍼파라미터 추론 모듈 초기화
        self.estimater = Estimater()

        # 학습 데이터 로딩
        df = self.load_csv_data()

        # AutoEncoder 로딩 및 컴파일
        self.lstm_ae = Autoencoder(self.layer_size, self.window_size, df.shape[1])
        self.lstm_ae.compile(optimizer="adam", loss="mae")

        # 데이터 전처리
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(df)
        input_data = self.make_rolling_windows(self.window_size, scaled_data)
        print(f"테이터 전처리 완료: {input_data.shape}")

        # tf 모델 빌드
        input_shape = (None, self.window_size, df.shape[1])
        self.lstm_ae.build(input_shape)
        print("모델 구조:")
        self.lstm_ae.summary()

        # 모델 학습
        print(f"{self.name} 학습 시작")
        early_stopping = EarlyStopping(patience=patience)
        batch_size = self.estimater.get_batch_size(self.lstm_ae, input_data)
        hist = self.lstm_ae.fit(input_data, input_data, epochs=10000, batch_size=batch_size, validation_split=0.1, callbacks=[early_stopping])
        print("학습 완료")

        with alive_bar(3) as bar:
            # tf모델을 로컬에 임시 저장
            print("Tensorflow 모델 저장 시작")
            self.lstm_ae.export(self.model_dir)
            bar()
            print("Tensorflow 모델 저장 완료")

            # 스케일러를 로컬에 임시 저장
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(scaler, f)
            bar()
            print("스케일러 저장 완료")

            # 학습 그래프 저장
            fig, ax = plt.subplots(figsize=(14, 6), dpi=80)
            ax.plot(hist.history["loss"], "b", label="Train", linewidth=2)
            ax.plot(hist.history["val_loss"], "r", label="Validation", linewidth=2)
            ax.set_title("Model loss", fontsize=16)
            ax.set_ylabel("Loss (mae)")
            ax.set_xlabel("Epoch")
            ax.legend(loc="upper right")
            plt.savefig(f"{self.model_dir}/loss_chart.png")
            bar()
            print("학습 그래프 저장 완료")

        print(f"모델 저장이 완료되었습니다.")
    
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