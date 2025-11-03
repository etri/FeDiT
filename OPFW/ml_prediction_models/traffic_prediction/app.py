import os
import time
import yaml
import torch
import torch.nn as nn
import joblib
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from multiprocessing import Process, Event, Manager
import concurrent.futures

# =========================
# 로그 함수
# =========================
def log(msg):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] {msg}")

# =========================
# 공통 모델 정의
# =========================
class MultiLinkLSTM(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers, output_dim=None):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim if output_dim else input_dim)
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

# =========================
# 데이터 핸들링 함수
# =========================
def get_source_data(fdo_id, count, config, table, data_url):
    connect_url = data_url + f'{fdo_id}/data?count={count}'
    try:
        raw_data = requests.get(connect_url).json()
    except Exception as e:
        log(f"Failed to get data: {e}")
        return pd.DataFrame()
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
    if 'date_time' in df.columns:
        df['date_time'] = pd.to_datetime(df['date_time'])
        df = df.sort_values('date_time')
        df = df.dropna(subset=['date_time'])
        df = df.drop_duplicates(subset=['date_time'], keep='first')
        df = df.reset_index(drop=True)
    return df.reset_index(drop=True)

def estimate_period(df):
    if 'date_time' not in df.columns or len(df) < 2:
        return pd.Timedelta(minutes=10)
    diffs = df['date_time'].sort_values().diff().dropna().dt.total_seconds() / 60
    if len(diffs) == 0:
        return pd.Timedelta(minutes=10)
    median_min = np.median(diffs)
    return pd.Timedelta(minutes=int(round(median_min)))

def reindex_df_to_uniform_period(df, period):
    if 'date_time' not in df.columns:
        return df
    df = df.sort_values('date_time')
    df = df.dropna(subset=['date_time'])
    df = df.drop_duplicates(subset=['date_time'], keep='first')
    df = df.set_index('date_time')
    full_range = pd.date_range(start=df.index.min(), end=df.index.max(), freq=period)
    df = df.reindex(full_range)
    try:
        df.interpolate(method='time', limit_direction='both', inplace=True)
    except Exception as e:
        log(f"Interpolate with time failed: {e}")
        df.interpolate(limit_direction='both', inplace=True)
    df.ffill(inplace=True)
    df.bfill(inplace=True)
    df = df.reset_index().rename(columns={'index':'date_time'})
    return df

def prepare_data(df, lookback, horizon):
    values = df.drop(columns=['date_time']).values
    X, y = [], []
    for i in range(lookback, len(values)-horizon):
        X.append(values[i-lookback:i, :])
        y.append(values[i:i+horizon, :])
    X = np.array(X)
    y = np.array(y)
    return X, y[:, 0, :]

def get_required_data_count(period, lookback=2016, horizon=288, safety_margin=200):
    return lookback + 2*horizon + safety_margin

def legacy_passthrough(fdo_id, config, sub_link_id=None):
    table = config['mapper']
    data_url = config['urls']['source']
    df_source = get_source_data(fdo_id, 288, config, table, data_url)
    if df_source.empty:
        return "[]"
    df_source["date_time"] = pd.to_datetime(df_source["date_time"])
    col_index = [col for col in df_source.columns if col != 'date_time']
    df_pred = df_source.copy()
    df_pred["date_time"] = df_pred["date_time"].dt.strftime('%Y-%m-%d %H:%M:%S')
    if sub_link_id is not None and sub_link_id in df_pred.columns:
        df_pred = df_pred[['date_time', sub_link_id]]
    else:
        df_pred = df_pred[['date_time'] + col_index]
    return df_pred.to_json(orient='records')

def predict_lstm_rolling(model, input_seq, forecast_steps, device='cpu'):
    seq = torch.tensor(input_seq, dtype=torch.float32, device=device).unsqueeze(0)
    preds = []
    for _ in range(forecast_steps):
        with torch.no_grad():
            out = model(seq)
            preds.append(out.cpu().numpy()[0])
            seq = torch.cat([seq[:,1:,:], out.unsqueeze(1)], dim=1)
    return np.array(preds)

def traffic_prediction(fdo_id, config, forecast_steps=288):
    params = config['params']
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    table = config['mapper']
    data_url = config['urls']['source']
    model_file = f'lstm_{fdo_id}.pt'
    info_file = f'lstm_{fdo_id}_linkids.pkl'
    lookback_file = f'lstm_{fdo_id}_lookback.pkl'
    if os.path.exists(model_file) and os.path.exists(info_file) and os.path.exists(lookback_file):
        link_ids = joblib.load(info_file)
        lookback = joblib.load(lookback_file)
        model = MultiLinkLSTM(
            input_dim=len(link_ids), 
            hidden_dim=params['hidden_dim'], 
            num_layers=params['num_layers'], 
            output_dim=len(link_ids)
        ).to(device)
        model.load_state_dict(torch.load(model_file, map_location=device))
        model.eval()
        df_source = get_source_data(fdo_id, lookback, config, table, data_url)
        df_source["date_time"] = pd.to_datetime(df_source["date_time"])
        period = estimate_period(df_source)
        df_source = reindex_df_to_uniform_period(df_source, period)
        if len(df_source) < lookback:
            log(f"[Infer] {fdo_id} 데이터 부족, Passthrough 사용")
            return legacy_passthrough(fdo_id, config)
        base_time = df_source['date_time'].iloc[-1]
        input_seq = df_source[link_ids].values[-lookback:]
        input_seq = torch.tensor(input_seq, dtype=torch.float32).to(device).cpu().numpy()
        log(f"[Infer] {fdo_id} - LSTM 예측 시작")
        pred = predict_lstm_rolling(model, input_seq, forecast_steps, device)
        pred_time = pd.date_range(start=base_time + period, periods=forecast_steps, freq=period)
        df_pred = pd.DataFrame(pred, columns=link_ids)
        df_pred['date_time'] = pred_time
        df_pred["date_time"] = df_pred["date_time"].dt.strftime('%Y-%m-%d %H:%M:%S')
        df_pred = df_pred[['date_time'] + link_ids]
        json_output = df_pred.to_json(orient='records')
        log(f"[Infer] {fdo_id} - LSTM 예측 종료")
        return json_output
    else:
        log(f"[Infer] {fdo_id} - 모델 없음, Passthrough 사용")
        return legacy_passthrough(fdo_id, config)

# =========================
# 단일 fdo_id 학습 함수 (멀티스레드용)
# =========================
def train_single_fdo(fdo_id, config, table, data_url):
    params = config['params']
    try:
        log(f"[Train] {fdo_id} - 데이터 수집 중")
        df_probe = get_source_data(fdo_id, 100, config, table, data_url)
        period = estimate_period(df_probe)
        log(f"[Train] {fdo_id} - 추정 주기: {period}")
        data_count = get_required_data_count(period)
        df = get_source_data(fdo_id, data_count, config, table, data_url)
        df = reindex_df_to_uniform_period(df, period)
        if len(df) < 2300 or (df.drop(columns=['date_time']).shape[1]==0):
            log(f"[Train] {fdo_id} - 데이터 부족, 건너뜀")
            return
        link_ids = [col for col in df.columns if col != 'date_time']
        X, y = prepare_data(df, lookback=2016, horizon=288)
        if len(X)==0:
            log(f"[Train] {fdo_id} - 유효 학습 데이터 없음, 건너뜀")
            return
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = MultiLinkLSTM(
            input_dim=len(link_ids), 
            hidden_dim=params['hidden_dim'], 
            num_layers=params['num_layers'], 
            output_dim=len(link_ids)
        ).to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=params['learning_rate'])
        criterion = nn.MSELoss()
        X_torch = torch.tensor(X, dtype=torch.float32).to(device)
        y_torch = torch.tensor(y, dtype=torch.float32).to(device)
        log(f"[Train] {fdo_id} - 학습 시작 (device: {device})")
        for epoch in range(params['epochs']):
            model.train()
            optimizer.zero_grad()
            # 배치 학습 적용
            total_loss = 0
            for i in range(0, len(X_torch), params['batch_size']):
                X_batch = X_torch[i:i+params['batch_size']]
                y_batch = y_torch[i:i+params['batch_size']]
                out = model(X_batch)
                loss = criterion(out, y_batch)
                loss.backward()
                optimizer.step()
                optimizer.zero_grad()
                total_loss += loss.item() * len(X_batch)
            avg_loss = total_loss / len(X_torch)
            log(f"[Train] {fdo_id} - Epoch {epoch+1}, Avg Loss: {avg_loss:.4f}")
        torch.save(model.state_dict(), f'lstm_{fdo_id}.pt')
        joblib.dump(link_ids, f'lstm_{fdo_id}_linkids.pkl')
        joblib.dump(2016, f'lstm_{fdo_id}_lookback.pkl')
        log(f"[Train] {fdo_id} - 모델 저장 완료")
    except Exception as e:
        log(f"[Train] {fdo_id} - 예외 발생: {e}")

# =========================
# 병렬 학습 프로세스 (ThreadPoolExecutor)
# =========================
def train_process(config, event_stop=None):
    params = config['params']
    table = config['mapper']
    data_url = config['urls']['source']
    fdo_id_list = list(table.keys())
    while True:
        log("[Train] 학습 주기 진입")
        with concurrent.futures.ThreadPoolExecutor(max_workers=params['parallel_train']) as executor:
            futures = []
            for fdo_id in fdo_id_list:
                futures.append(executor.submit(train_single_fdo, fdo_id, config, table, data_url))
            for future in concurrent.futures.as_completed(futures):
                pass
        if event_stop is not None and event_stop.is_set():
            break
        log(f"[Train] {params['train_interval_sec']//60}분 후 다음 학습 반복 대기")
        time.sleep(params['train_interval_sec'])

# =========================
# 주기적 추론 프로세스(메모리 저장, 전체 결과만 덮어씀)
# =========================
def infer_process(config, infer_dict, event_stop=None):
    params = config['params']
    table = config['mapper']
    while True:
        log("[Infer] 주기적 추론 주기 진입")
        temp_result = {}
        for fdo_id in table.keys():
            try:
                result = traffic_prediction(fdo_id, config)
                temp_result[fdo_id] = result
                log(f"[Infer] {fdo_id} 추론 임시저장")
            except Exception as e:
                log(f"[Infer] {fdo_id} 추론 실패: {e}")
        infer_dict.clear()
        infer_dict.update(temp_result)
        log("[Infer] 모든 fdo_id 추론결과 메모리에 반영 완료")
        if event_stop is not None and event_stop.is_set():
            break
        log(f"[Infer] {params['infer_interval_sec']//60}분 후 다음 추론 반복 대기")
        time.sleep(params['infer_interval_sec'])

# =========================
# REST 서버 프로세스(메모리 제공)
# =========================
def rest_server_process(config, infer_dict, event_stop=None):
    app = Flask(__name__)
    table = config['mapper']
    fdo_id_list = list(table.keys())

    @app.route('/api/tci/ai_engine/road_pred', methods=['GET', 'POST'])
    def handler():
        flag = True
        result = dict()
        if request.method == 'GET':
            for fdo_id in fdo_id_list:
                result[fdo_id] = infer_dict.get(fdo_id, "[]")
        elif request.method == 'POST':
            out = request.get_json()
            fdo_id = out.get('fdo_id')
            sub_link_id = out.get('link_id')
            if fdo_id in fdo_id_list:
                data = infer_dict.get(fdo_id, "[]")
                if sub_link_id:
                    try:
                        df = pd.read_json(data)
                        if sub_link_id in df.columns:
                            df = df[['date_time', sub_link_id]]
                            data = df.to_json(orient='records')
                    except Exception as e:
                        log(f"[REST] link_id 부분 반환 실패: {e}")
                result[fdo_id] = data
            else:
                flag = False
                for fdo_id in fdo_id_list:
                    result[fdo_id] = infer_dict.get(fdo_id, "[]")
        payload = {
            'predictions': result,
            'success': flag,
        }
        return jsonify(payload)

    app.run(host='0.0.0.0', port=26000, use_reloader=False)

# =========================
# 메인 프로세스
# =========================
if __name__ == '__main__':
    with open('configs.yaml', 'r') as file:
        config = yaml.safe_load(file)
    stop_event = Event()
    manager = Manager()
    infer_dict = manager.dict()
    train_proc = Process(target=train_process, args=(config, stop_event))
    infer_proc = Process(target=infer_process, args=(config, infer_dict, stop_event))
    rest_proc = Process(target=rest_server_process, args=(config, infer_dict, stop_event))
    train_proc.start()
    infer_proc.start()
    rest_proc.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log("Stopping all processes...")
        stop_event.set()
        train_proc.terminate()
        infer_proc.terminate()
        rest_proc.terminate()
        train_proc.join()
        infer_proc.join()
        rest_proc.join()
        log("All processes stopped.")
