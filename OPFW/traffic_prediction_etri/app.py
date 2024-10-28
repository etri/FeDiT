'''

'''
import os
import yaml
import shutil

import datetime
import requests

import pandas as pd

#from utils import *
from urllib.parse import quote, unquote
from flask import Flask, request, jsonify

'''
  Initialization
'''

pd.set_option('display.width', 10000)

N = 48*6

with open('configs.yaml', 'r') as file:
    config = yaml.safe_load(file)

table = config['mapper']
fdo_id_list = table.keys()

data_url = config['urls']['source']


'''
  Utility Functions
'''
def get_source_data(fdo_id, count):
    connect_url = data_url + f'{fdo_id}/data?count={count}'
    raw_data = requests.get(connect_url).json()

    road_array = list()
    for data in raw_data:
        value_list = data['data'][table[fdo_id][0]]['trafficMeasurement']['value']
        speed_dict = dict()

        for index, value in enumerate(value_list):
            if index == 0:
                speed_dict['date_time'] = value['date_time']
            speed_dict[value['link_id']] = value['speed']
        road_array.append(speed_dict)
        
    df = pd.DataFrame(road_array)[::-1]
    
    nan_ratio = df.isna().mean()
    df = df.drop(columns=nan_ratio[nan_ratio > 0.5].index)
    df.ffill(inplace=True)
    df.bfill(inplace=True)
    
    return df.reset_index(drop=True)

def traffic_prediction(fdo_id, count):
    df_source = get_source_data(fdo_id, count)
    df_source["date_time"] = pd.to_datetime(df_source["date_time"])
    
    print(fdo_id)
    print(df_source)
    
    base_time = df_source['date_time'].iloc[-1]
    pred_time = pd.date_range(start=base_time + pd.Timedelta(minutes=10), periods=48*6, freq='10T')
    
    df_source = df_source.drop(columns=['date_time'])
    col_index = df_source.columns.tolist()
    
    df_pred = df_source
    
    df_pred['date_time'] = pred_time
    df_pred = df_pred[ ['date_time'] + col_index ]
    
    df_pred['date_time'] = pd.to_datetime(df_pred['date_time'])
    df_pred = df_pred.set_index('date_time')
    df_pred = df_pred.resample('60min').asfreq().reset_index().drop(index=0).reset_index(drop=True)
    #df_pred = df_pred.resample('60min').asfreq().drop(index=0).reset_index(drop=True)
    df_pred["date_time"] = pd.to_datetime(df_pred["date_time"], unit='ms').dt.strftime('%Y-%m-%d %H:%M:%S')
    
    print(df_pred)
    
    json_output = df_pred.to_json(orient='records')
    
    return json_output


'''
  Server Runner
'''

app = Flask(__name__)

@app.route('/api/tci/ai_engine/road_pred', methods=['GET', 'POST'])
def handler():
    flag = True
    result = dict()
    if request.method == 'GET':
        for fdo_id in fdo_id_list:
            result[fdo_id] = traffic_prediction(fdo_id, N)
            
    elif request.method == 'POST':
        out = request.get_json()
        fdo_id = out.get('fdo_id')
        if fdo_id in fdo_id_list:
            result[fdo_id] = traffic_prediction(fdo_id, N)
        else:
            #return jsonify({"error": f"Incorrect FDO ID: '{fdo_id}'", "success": False,}), 404
            flag = False
            for fdo_id in fdo_id_list:
                result[fdo_id] = traffic_prediction(fdo_id, N)
        

    payload = {
        'predictions': result, 
        'success'    : flag,
    }

    return jsonify(payload)


'''
  Main Function
'''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=26000)
