import os
import numpy as np
import pandas as pd
from tqdm import tqdm
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
from collections import Counter

def make_dataframe(data):

    x = []
    y = []
    z = []
    ux = []
    uy = []
    uz = []
    vel_mag = []
    density = []
    pressure = []
    for i in data[2:-1]:
        temp = list(map(float,i.split()))
        y.append(temp[0])
        z.append(temp[1])
        x.append(temp[2])
        uy.append(temp[3])
        uz.append(temp[4])
        ux.append(temp[5])
        vel_mag.append(np.sqrt(temp[3]**2+temp[4]**2+temp[5]**2))
        density.append(temp[6])
        pressure.append(temp[7])

    df = pd.DataFrame({"x":x,"y":y,"z":z,"ux":ux,"uy":uy,"uz":uz,"vel_mag":vel_mag,"density":density,"pressure":pressure})
    
    return df

def manipulate_dataframe(df,dimension_setting,option):
    '''입력된 데이터프레임을 정렬(정렬된 격자데이터를 기준으로 보간)'''
    # griddata 매개변수 3가지 지정
    # 1. CFDpoint = 좌표값
    CFDpoint = np.zeros((len(df),3))    
    CFDpoint[:,0] = df["x"]
    CFDpoint[:,1] = df["y"]
    CFDpoint[:,2] = df["z"]

    # 2. values 
    values = df[option]
    
    # 3. point 지정
    nx = dimension_setting[0]
    ny = dimension_setting[1]
    nz = dimension_setting[2]
    min_x = np.round(np.min(df["x"]),1)
    max_x = np.round(np.max(df["x"]),1)
    min_y = np.round(np.min(df["y"]),1)
    max_y = np.round(np.max(df["y"]),1)
    min_z = np.round(np.min(df["z"]),1)
    max_z = np.round(np.max(df["z"]),1)
    i = np.linspace(min_x,max_x,nx) 
    j = np.linspace(min_y,max_y,ny) 
    k = np.linspace(min_z,max_z,nz)
    point = [(x,y,z) for y in j for x in i for z in k ] # z => x => y 순
    point = np.array(point)

    # 4. 가공 및 리턴
    StructuredValue = griddata(points=CFDpoint,values=values,xi=point,method='nearest') 
    StructuredValue = StructuredValue.reshape(-1,1) 
    alined_df = np.hstack((point,StructuredValue))
    alined_df = pd.DataFrame(alined_df,columns=["x","y","z",option]) 
    
    # 향후 플로팅위해 정렬된 데이터프레임 저장
    # alined_df.to_csv(f"dataset/dataframe/no_obstacle/{num}.csv",index=False)

    return alined_df


def driving_division(driving_conditions,idx2char):    
    '''운전조건 데이터를 스페셜토큰과 값으로 분할'''
    cons = []
    for driving_condition in driving_conditions:
        condition_names = []
        values = []
        for i in range(len(driving_condition)):
            # 스페셜 토큰 
            if i%2 == 0:
                condition_names.append(driving_condition[i])            
            # 값  
            else:
                values.append(float(idx2char[driving_condition[i]]))
        cons.append([condition_names, values])
    cons = np.array(cons)
    
    return cons

def driving_scaling(operating_data,config):
    
    iv_max = config.iv_max

    # 운전조건 데이터 scaling 수행
    operating_data[:,0] = operating_data[:,0]
    operating_data[:,1,0] = operating_data[:,1,0]/iv_max
    
    return operating_data
