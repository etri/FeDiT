import json
import pytz
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from scipy.interpolate import griddata
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime
from tqdm import tqdm

url="http://dev.jinwoosi.co.kr:8083/v1/{target}?start_date_time={start_time}&end_date_time={end_time}&page_number=1&number_of_rows=20&lang=ko"

def fetch_data_from_url(target, start_time,end_time, output_filename):
    global url
    try:
        url = url.replace("{target}",target)
        url = url.replace("{start_time}",start_time)
        url = url.replace("{end_time}",end_time)
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            with open(output_filename, "w") as json_file:
                json.dump(data, json_file, indent=4)
            print("HTTP 요청 성공")
        else:
            print(f"HTTP 요청이 실패했습니다. 상태 코드: {response.status_code}")
    except Exception as e:
        print(f"오류 발생: {str(e)}")
    return data
    
def fetch_data_from_url_for_timedelta(target,date_range):
    global url
    
    # yyyy-MM-dd HH:mm:ss
    observed_lst = []
    for date in tqdm(date_range):
        for hour in range(24):
            hour = str(hour)
            if len(hour)==1:
                hour = "0"+hour
            time = date+f"%20{hour}%3A00%3A00"
            url = url.replace("{target}",target)
            url = url.replace("{start_time}",time)
            url = url.replace("{end_time}",time)
            try:
                response = requests.get(url)
                if response.status_code==200:
                    data = response.json()
                    for idx in range(len(data['list'])):                
                        observed_lst.append(data['list'][idx])
                else:
                    print(f"HTTP 요청이 실패했습니다. 상태 코드 :{response.status_code}")
            except Exception as e:
                print(f"오류 발생 :{str(e)}")
    return observed_lst



def get_dates(start_date_str, end_date_str):
    """날짜 지정 함수"""
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    current_date = start_date
    date_list = []
    while current_date <= end_date:
        date_list.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)
    return date_list

def load_xy():
    temp = json.load(open("src/utils/config.json"))
    use_x = []
    use_y = []
    for i in temp.items():
        use_x.append(i[1]['new_longitude'])
        use_y.append(i[1]['new_latitude'])
    return use_x, use_y

def get_gps(x_values,y_values):
    
    # gps 값
    df = pd.read_csv('dataset/merged_df.csv')
    scaler_X = MinMaxScaler() 
    temp = df["longitude"].values.reshape(-1,1)
    temp = scaler_X.fit(temp)
    scaler_Y = MinMaxScaler() 
    temp = df["latitude"].values.reshape(-1,1)
    temp = scaler_Y.fit(temp)
    
    gps_x_values = scaler_X.inverse_transform(x_values.reshape(-1,1))
    gps_y_values = scaler_Y.inverse_transform(y_values.reshape(-1,1))

    gps_x_pos = []
    gps_y_pos = []
    for yy in gps_y_values:
        for xx in gps_x_values:
            gps_x_pos.append(xx)
            gps_y_pos.append(yy)
    gps_x_pos = np.array(gps_x_pos)
    gps_y_pos = np.array(gps_y_pos)
    gps_x_pos_save = gps_x_pos.flatten().tolist()
    gps_y_pos_save = gps_y_pos.flatten().tolist()

    # return 할 dict
    save_dict = {"location":{"gps_x":gps_x_pos_save,
                             "gps_y":gps_y_pos_save}}
    return save_dict

def make_return_dataset(pm10_pred_lst=None,pm25_pred_lst=None):
    
    use_x,use_y = load_xy()

    # x와 y를 스케일링하여 2차원 배열 생성
    x_values = np.linspace(0, 1, 80)
    y_values = np.linspace(0, 1, 40)

    # dict 얻음
    save_dict = get_gps(x_values,y_values)
    
    for time,(use_pm10,use_pm25) in enumerate(zip(pm10_pred_lst,pm25_pred_lst)):
        pm10 = make_pm10(x_values,y_values,use_x,use_y,use_pm10)
        pm25 = make_pm25(x_values,y_values,use_x,use_y,use_pm25)    
        if not save_dict.get(f'{time+1}_hour'):
            save_dict[f'{time+1}_hour']={}
        if not save_dict[f'{time+1}_hour'].get('pm10'):
            save_dict[f'{time+1}_hour']['pm10']=pm10
        if not save_dict[f'{time+1}_hour'].get('pm25'):
            save_dict[f'{time+1}_hour']['pm25']=pm25            

    # JSON 파일로 저장
    korea_timezone = pytz.timezone('Asia/Seoul')
    time = datetime.now().astimezone(korea_timezone)
    time = time.strftime("%Y%m%d_%H:%M:%S")
    with open(f"result/prediction/{time}_sample.json", "w") as json_file:
        json.dump(save_dict, json_file, indent=4)

    return save_dict

def make_pm10(x_values,y_values,use_x,use_y,use_pm10):
    '''보간된 pm10 데이터 생성'''
    # print("make_pm10 진입")
    if use_pm10==None:
        return 
    ust_point_lst = []
    pm10_lst = []
    for x,y,pm10 in zip(use_x,use_y,use_pm10):
        temp_x = np.abs(x_values-x)
        temp_y = np.abs(y_values-y)
        point_x = np.where(temp_x==np.min(temp_x))[0][0] # 오차가 제일 작은 위치
        point_y = np.where(temp_y==np.min(temp_y))[0][0] # 오차가 제일 작은 위치
        ust_point_lst.append([point_x,point_y]) # 오차가 제일 작은 위치(x,y) 저장 
        pm10_lst.append(pm10)
    ust_point_lst = np.array(ust_point_lst) # 길이 12
    pm10_lst = np.array(pm10_lst) # 길이 12

    # 보간수행
    x, y = np.meshgrid(np.arange(80), np.arange(40))
    interpolated_values_pm10 = griddata(ust_point_lst, pm10_lst, (x, y), method='linear', fill_value=0)
    return interpolated_values_pm10.flatten().tolist()

def make_pm25(x_values,y_values,use_x,use_y,use_pm25):
    '''보간된 pm25 데이터 생성''' 
    # print("make_pm25 진입")
    if use_pm25==None:
        return 
    
    ust_point_lst = []
    pm25_lst = []
    for x,y,pm25 in zip(use_x,use_y,use_pm25):
        temp_x = np.abs(x_values-x)
        temp_y = np.abs(y_values-y)
        point_x = np.where(temp_x==np.min(temp_x))[0][0] # 오차가 제일 작은 위치
        point_y = np.where(temp_y==np.min(temp_y))[0][0] # 오차가 제일 작은 위치
        ust_point_lst.append([point_x,point_y]) # 오차가 제일 작은 위치(x,y) 저장 
        pm25_lst.append(pm25)
    ust_point_lst = np.array(ust_point_lst) # 길이 12
    pm25_lst = np.array(pm25_lst) # 길이 12

    # 보간수행
    x, y = np.meshgrid(np.arange(80), np.arange(40))
    interpolated_values_pm25 = griddata(ust_point_lst, pm25_lst, (x, y), method='linear', fill_value=0)
    return interpolated_values_pm25.flatten().tolist()