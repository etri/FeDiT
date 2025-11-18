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
#from alive_progress import alive_bar

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