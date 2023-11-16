import ml_collections
import numpy as np


def get_transformer_config():
    '''Transformer configurations'''

    config = simulaion_config()
    config.model_name = "CFDUnet"
    config.num_layers = 12
    config.hidden_size = 256 # 256, 512
    config.num_heads = 8
    config.mlp_dim = 1024 # 512, 1024
    config.rate = 0.2
    config.dimension_setting = [config.x_dim,config.y_dim,config.z_dim]
    # config.maximum_position_encoding = 840
    config.maximum_position_encoding = 2000
    return config


def simulaion_config():
    '''simulation dimension confiurations'''
    config = ml_collections.ConfigDict()
    config.x_dim=150
    config.y_dim=100
    config.z_dim=40
    return config


def driving_condition_max_value_config(operating_data):
    '''운전조건 속성별 최대값'''
    config = ml_collections.ConfigDict()
    iv_max = np.max(operating_data[:,1,0])
    config.iv_max=iv_max

    return config