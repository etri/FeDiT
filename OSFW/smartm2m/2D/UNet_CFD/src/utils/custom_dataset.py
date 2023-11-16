from torch.utils.data import Dataset
import cv2
import os
import numpy as np
import torch
import pandas as pd
import scipy.io
from tqdm import tqdm
from src.utils.generate_operating_condition import *
from src.utils.preprocess import *
from src.utils.config import *

class CustomDatasetUNet(Dataset):
    def __init__(self, transform=None, target_transform=None):
        
        # 입/출력데이터 (운전정보제외) 가져오기
        data_path = "dataset/preprocessed/"
        data_lst = os.listdir(data_path)
        ux_lst = []
        uy_lst = []
        p_lst = []
        boundary_lst = []
        for name in tqdm(data_lst):
            df = pd.read_csv(data_path+name)
            boundary_lst.append(df["boundary"])            
            ux_lst.append(df["ux"].values)
            uy_lst.append(df["uy"].values)
            p_lst.append(df["p"].values)
        boundary_data = np.array(boundary_lst)
        ux_data = np.array(ux_lst)
        uy_data = np.array(uy_lst)
        p_data = np.array(p_lst)
        
        # 입/출력 데이터 전처리
        dataset_config = get_dataset_config(ux_data,uy_data,p_data)
        xsize = dataset_config.xsize
        ysize = dataset_config.ysize
        ux_max = dataset_config.ux_max
        uy_max = dataset_config.uy_max
        p_max = dataset_config.p_max

        boundary_data = boundary_data.reshape(-1,xsize,ysize)
        ux_data = ux_data.reshape(-1,xsize,ysize)
        ux_data /= ux_max
        uy_data = uy_data.reshape(-1,xsize,ysize)
        uy_data /= uy_max
        p_data = p_data.reshape(-1,xsize,ysize)
        p_data /= p_max
        
        # 운전 정보 데이터
        operating_data = np.load('dataset/operating_condition.npy')
        char2idx,idx2char = generate_operating_data()
        operating_data=operating_division(operating_data,idx2char)
        operating_config=operating_condition_max_value_config(operating_data)
        operating_data=operating_scaling(operating_data,operating_config)

        special_token=[]
        special_value=[]
        for i in range(len(operating_data)):
            special_token.append(operating_data[:,0][i])
            special_value.append(operating_data[:,1][i])
        special_token=np.array(special_token)
        special_value=np.array(special_value)
    
        
        self.boundary_data = boundary_data
        self.special_token = special_token
        self.special_value = special_value
        self.Y_data = [ux_data,uy_data,p_data]

        self.transform = transform
        self.target_transform = target_transform

    def __len__(self):
        return len(self.boundary_data)

    def __getitem__(self,idx):

        # 입/출력데이터 (운전정보제외) 지정
        boundary = self.boundary_data[idx]
        ux = self.Y_data[0][idx]
        uy = self.Y_data[1][idx]
        p = self.Y_data[2][idx]
        
        # 운전정보데이터 지정
        special_token = self.special_token[idx]
        special_value = self.special_value[idx]
        
        # 데이터 전처리
        if self.transform:
            boundary = self.transform(boundary)
        if self.target_transform:
            ux = self.target_transform(ux)
            uy = self.target_transform(uy)
            p = self.target_transform(p)

        return boundary,special_token,special_value,ux,uy,p   

class CustomDatasetUNetPINN(Dataset):
    def __init__(self, transform=None, target_transform=None):
        
        # 입/출력데이터 (운전정보제외) 가져오기
        data_path = "dataset/preprocessed/"
        data_lst = os.listdir(data_path)
        x_pos_lst = []
        y_pos_lst = []
        ux_lst = []
        uy_lst = []
        p_lst = []
        boundary_lst = []
        for name in tqdm(data_lst):
            df = pd.read_csv(data_path+name)
            boundary_lst.append(df["boundary"])            
            ux_lst.append(df["ux"].values)
            uy_lst.append(df["uy"].values)
            p_lst.append(df["p"].values)
            x_pos_lst.append(df["x"].values)
            y_pos_lst.append(df["y"].values)
        boundary_data = np.array(boundary_lst)
        ux_data = np.array(ux_lst)
        uy_data = np.array(uy_lst)
        p_data = np.array(p_lst)
        x_pos_data = np.array(x_pos_lst)
        y_pos_data = np.array(y_pos_lst)
        
        # 입/출력 데이터 전처리
        dataset_config = get_dataset_config(ux_data,uy_data,p_data)
        xsize = dataset_config.xsize
        ysize = dataset_config.ysize
        ux_max = dataset_config.ux_max
        uy_max = dataset_config.uy_max
        p_max = dataset_config.p_max

        # shape 변환 및 스케일링
        boundary_data = boundary_data.reshape(-1,xsize,ysize)
        ux_data = ux_data.reshape(-1,xsize,ysize)
        ux_data /= ux_max
        uy_data = uy_data.reshape(-1,xsize,ysize)
        uy_data /= uy_max
        p_data = p_data.reshape(-1,xsize,ysize)
        p_data /= p_max
        x_pos_data = x_pos_data.reshape(-1,xsize,ysize)
        y_pos_data = y_pos_data.reshape(-1,xsize,ysize)

        # 운전 정보 데이터
        operating_data = np.load('dataset/operating_condition.npy')
        char2idx,idx2char = generate_operating_data()
        operating_data=operating_division(operating_data,idx2char)
        operating_config=operating_condition_max_value_config(operating_data)
        operating_data=operating_scaling(operating_data,operating_config)

        special_token=[]
        special_value=[]
        for i in range(len(operating_data)):
            special_token.append(operating_data[:,0][i])
            special_value.append(operating_data[:,1][i])
        special_token=np.array(special_token)
        special_value=np.array(special_value)
    
        
        self.boundary_data = boundary_data
        self.special_token = special_token
        self.special_value = special_value
        self.Y_data = [ux_data,uy_data,p_data]
        self.x_pos_data = x_pos_data
        self.y_pos_data = y_pos_data

        self.transform = transform
        self.target_transform = target_transform

    def __len__(self):
        return len(self.boundary_data)

    def __getitem__(self,idx):

        # 입/출력데이터 (운전정보제외) 지정
        boundary = self.boundary_data[idx]
        ux = self.Y_data[0][idx]
        uy = self.Y_data[1][idx]
        p = self.Y_data[2][idx]
        
        # 운전정보데이터 지정
        special_token = self.special_token[idx]
        special_value = self.special_value[idx]
        
        # PINN 위한 위치데이터
        x_pos_data = self.x_pos_data[idx]
        y_pos_data = self.y_pos_data[idx]

        # 데이터 전처리
        if self.transform:
            boundary = self.transform(boundary)
        if self.target_transform:
            ux = self.target_transform(ux)
            uy = self.target_transform(uy)
            p = self.target_transform(p)

        return boundary,special_token,special_value,ux,uy,p,x_pos_data,y_pos_data   
