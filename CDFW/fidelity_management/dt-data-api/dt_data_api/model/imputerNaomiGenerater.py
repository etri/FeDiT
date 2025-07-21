import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib
import matplotlib.pyplot as plt
import os
import copy
import pickle
from datetime import datetime, date, timedelta
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split


from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout, Flatten, Reshape, BatchNormalization, RepeatVector, MultiHeadAttention, LayerNormalization
from tensorflow.keras.losses import Huber, MeanSquaredError, MeanAbsoluteError, MeanAbsolutePercentageError
from tensorflow.keras.optimizers import Adam, SGD, Adagrad, RMSprop
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.sequence import TimeseriesGenerator

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from torch.autograd import Variable
import torch
import torch.utils
import torch.utils.data
from torch import nn
import logging
from tqdm import trange
import sys



from dt_data_api.model import fidMeta
from dt_data_api.common.settings_meta import MODEL_PATH_META
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS
from dt_data_api.util.utils import Utils

class Manager:
    '''
    RNN 모델학습
    ---
    학습모델 생성
    '''    
    #모델 기본 저장 경로
    MODEL_FILE_PATH = MODEL_PATH_META
    
    #원본데이터
    data = pd.DataFrame
    
    #모델파라메터
    model_type:None     #모델유형
    window_size:None    #데이터 분할 수
    batch_size:None     #배치 수
    units:None          #뉴런 수
    test_size:None      #학습 비율
    epochs:None         #반복 학습 수
    patience:None       #epochs 동안 개선 가능한 수 (epochs 동안 개선이 없을시 학습 중단)
    loss:None           #손실유형
    meterics:None       #결과분석 유형
    optimizer:None      #성능옵션 
    optimizer_lr:None   #성능옵션 lr
    data_size:None      #fid 평가 데이터 수

    #입력파라메터
    filepath:None       #생성모델 경로
    filename:None       #생성모델 파일명
    output_cols:None    #종속변수
    feature_cols:None   #독립변수 (종속변수 데이터 생산에 영향)
    is_indpds:None      #독립변수 여부
    output_size:None    #예측+예측... 수
    use_model_yn:None  #모델데이터 사용여부
    real_time_yn:None   #실시간 사용 여부    
    output_file:None   #최종 저장파일 
    trgt_col_list:None #알고리즘 선택 리스트

    def __init__(self, data=None, modelArgs=None, inputArgs=None) -> None:
        self.data = data
        
        self.model_type = modelArgs.model_type
        self.window_size = modelArgs.window_size 
        self.batch_size = modelArgs.batch_size
        self.units = modelArgs.units
        self.test_size = modelArgs.test_size
        self.epochs = modelArgs.epochs
        self.patience = modelArgs.patience
        self.loss = modelArgs.loss
        self.meterics = modelArgs.meterics
        self.optimizer = modelArgs.optimizer
        self.optimizer_lr = modelArgs.optimizer_lr
        self.data_size = modelArgs.data_size

        self.filepath = inputArgs.filepath
        self.filename = inputArgs.filename
        self.output_cols = inputArgs.output_cols
        self.feature_cols = inputArgs.feature_cols
        self.is_indpds = inputArgs.is_indpds        
        self.output_size = inputArgs.output_size
        self.use_model_yn = inputArgs.use_model_yn
        self.real_time_yn = inputArgs.real_time_yn
        self.output_file = inputArgs.output_file
        self.target_start_date = inputArgs.target_start_date
        self.target_last_date = inputArgs.target_last_date
        self.resmpl_intvl_tp = inputArgs.resmpl_intvl_tp
        self.resmpl_intvl_value = inputArgs.resmpl_intvl_value
        self.index_column = inputArgs.index_column
        self.trgt_col_list = inputArgs.trgt_col_list
        


    def setData(self, data=None):
        '''
        원본 데이터 설정
        Args:
            data(pandas.DataFrame): 원본 데이터
        '''
        self.data = data


    def make_rolling_windows(self, window_size, data):
        result = []
        for i in range(window_size, len(data)):# + 1):
            # 현재 위치에서 window_size 만큼 앞으로 가서 데이터를 가져옴
            window = data[i-window_size:i]  
            #print('index', i, window)
            result.append(window)
        return np.array(result)        

    def generate_missing_ranges_auto_ex(self, dataLen, testSizePerDataLength, testSize, window_size):
        np.random.seed(123)  # 재현성을 위해 시드 설정
        
        if testSize <= 0 or testSize >= 1:
            return [(0, 0)]
        
        # 총 결측값 개수 계산 (전체 데이터의 testSize 비율)
        total_missing = int(dataLen * testSize)
        
        # 결측 구간 수 자동 계산 (전체 데이터 길이에 비례하게)
        missingGroup = max(1, int(1 / testSizePerDataLength))
        
        # 구간당 평균 길이 계산
        avg_range = total_missing // missingGroup
        
        # 각 구간의 최대 길이 및 최소 길이 설정
        segment_length = dataLen // missingGroup
        min_range = max(1, int(avg_range * 0.5))
        max_range = min(segment_length, int(avg_range * 1.2))
        
        missing_ranges = []
        remaining_length = total_missing
        last_end = -window_size  # 초기값으로 설정해 첫 구간에서도 간격이 유지되도록 함

        for i in range(missingGroup):
            # 남은 길이를 확인하고, 필요한 경우 구간 수를 줄임
            if remaining_length < window_size * (missingGroup - i):
                missingGroup -= 1
                continue
            
            # 마지막 구간에서는 남은 길이를 모두 사용
            if i == missingGroup - 1:
                range_size = remaining_length
            else:
                max_possible = min(max_range, remaining_length - (missingGroup - i - 1))
                range_size = np.random.randint(min_range, max_possible + 1)
            
            # 구간이 너무 길어서 간격을 유지하기 어려운 경우 길이를 줄임
            while remaining_length - range_size < window_size * (missingGroup - i - 1) and range_size > min_range:
                range_size -= 1
            
            if range_size <= 0:
                break
            
            # 시작점 설정: 이전 구간의 끝에서 window_size 이상의 간격 유지
            start_min = max(last_end + window_size, i * segment_length)
            max_start = min((i + 1) * segment_length - range_size, (i + 1) * segment_length - 1)
            start = np.random.randint(start_min, max_start + 1)
            
            end = start + range_size
            missing_ranges.append((start, end))
            remaining_length -= range_size
            last_end = end  # 마지막 끝 지점을 업데이트하여 다음 구간과 간격 유지
        
        return missing_ranges


    def generate_missing_ranges_auto(self, dataLen, testSizePerDataLength, testSize):
        np.random.seed(123)  # 재현성을 위해 시드 설정
        
        if testSize <= 0 or testSize >= 1:
            return [(0, 0)]
        
        # 총 결측값 개수 계산 (전체 데이터의 testSize 비율)
        total_missing = int(dataLen * testSize)
        
        # 결측 구간 수 자동 계산 (전체 데이터 길이에 비례하게)
        missingGroup = max(1, int(1 / testSizePerDataLength))  # testSizePerDataLength 비율마다 구간 생성
        
        # 구간당 평균 길이 계산
        avg_range = total_missing // missingGroup
        
        # 각 구간의 최대 길이 및 최소 길이 설정
        segment_length = dataLen // missingGroup  # 각 구간의 데이터 길이
        min_range = max(1, int(avg_range * 0.5))  # 최소 길이 설정
        max_range = min(segment_length, int(avg_range * 1.2))  # 1.2배로 제한한 최대 길이 설정
        
        missing_ranges = []
        remaining_length = total_missing
        
        for i in range(missingGroup):
            # 마지막 구간에서는 남은 길이를 모두 사용
            if i == missingGroup - 1:
                range_size = remaining_length
            else:
                # 남은 길이와 구간 수에 맞춰 범위 조정
                max_possible = min(max_range, remaining_length - (missingGroup - i - 1))
                range_size = np.random.randint(min_range, max_possible + 1)
            
            # 할당 가능한 길이가 없을 경우 중단
            if range_size <= 0:
                break
            
            # 시작점은 segment를 넘지 않도록 제한
            max_start = min((i + 1) * segment_length - range_size, (i + 1) * segment_length - 1)
            start = np.random.randint(i * segment_length, max_start + 1)
            end = start + range_size
            
            missing_ranges.append((start, end))
            remaining_length -= range_size
        
        return missing_ranges

     
    def generate_missing_ranges(self, dataLen, missingGroup, missingRange):
        np.random.seed(123)  # 재현성을 위해 시드 설정
        # 유효성 검사: missingGroup이 0이거나 missingRange가 [0, 0]인 경우
        if missingGroup == 0 or missingRange == [0,0]:
            return [(0,0)]
        
        # 데이터 길이가 결측 구간 수와 크기를 만족하지 못할 경우 조정
        while missingGroup * missingRange[0] > dataLen or missingRange[1] > dataLen:
            print("전체 데이터가 missingGroup 및 missingRange의 범주 보다 작습니다. 데이터 길이에 맞게 missingGroup 및 missingRange를 조정합니다.")
            # missingGroup을 줄이고, 범위도 줄여서 데이터 길이에 맞춤
            missingGroup = max(0, missingGroup - 1)  # 0개의 그룹도 가능
            missingRange = [max(0, missingRange[0] // 2), max(0, min(missingRange[1] // 2, dataLen // max(0, missingGroup)))]
        
        # missingGroup이 0이 되었거나 missingRange가 [0,0]이 된 경우
        if missingGroup == 0 or missingRange == [0,0]:
            return [(0,0)]
        
        # 각 파트를 포함하는 구간의 길이를 계산
        segment_length = dataLen // missingGroup
        
        missing_ranges = []
        for i in range(missingGroup):
            # 각 파트 구간 내에서 시작점을 무작위로 선택
            start = np.random.randint(i * segment_length, (i + 1) * segment_length)
            range_size = np.random.randint(missingRange[0], missingRange[1] + 1)  # 구간 크기 랜덤 선택
            end = min(start + range_size, dataLen)  # 데이터 길이를 넘지 않도록 조정
            missing_ranges.append((start, end))
            
        return missing_ranges
    
    def apply_missing_data(self, df, columns, missingGroup, missingRange):
        for column in columns:
            dataLen = len(df[column])
            missing_ranges = self.generate_missing_ranges(dataLen=dataLen, missingGroup=missingGroup, missingRange=missingRange)
            for start, end in missing_ranges:
                df.loc[start:end, column] = np.nan  # .loc를 사용해 각 컬럼의 결측 구간에 NaN 할당
        
        return df



    def modelTrainning(self, gradientClipping=None, missingGroup=None, missingRange=None, testSizePerDataLength=100):

        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
        try:
            gpus = tf.config.list_physical_devices('gpu')
            for i in range(len(gpus)):
                tf.config.experimental.set_memory_growth(gpus[i], True)
        except Exception as e :
            raise e

        #폴더확인        
        temp = os.path.join(self.filepath, 'temp')
        history = os.path.join(self.filepath, 'history')
        if not os.path.exists(temp):
            os.makedirs(temp)
        if not os.path.exists(history):
            os.makedirs(history)

        #생성파일 목록
        modelCKFile = os.path.join(temp, self.filename + '_ae_ckeckpointer.ckpt.weights.h5')
        fitHistoryFile = os.path.join(self.filepath, self.filename + '_ae_fit_history.png')
        modelFile = os.path.join(self.filepath, self.filename)


        #설정
        train_size = int(len(self.data) * (1-self.test_size))
        features = len(self.output_cols)
        
        print(self.data, self.test_size)

        try:
            apply_colums = self.output_cols

            scale_cols = []
            
            if self.trgt_col_list == None:
                for c in apply_colums:
                #for c in self.trgt_col_list:
                    scale_cols.append(c)
            else:
                #for c in self.data.columns:
                for c in self.trgt_col_list:
                    scale_cols.append(c)            
  
            print(scale_cols)
            print(self.trgt_col_list)


            print('------------------A', self.data)
            #정규화(0~1변환)
            scaler = MinMaxScaler()
            #scaled = scaler.fit_transform(self.data[scale_cols])
            #df = pd.DataFrame(scaled, columns=scale_cols)

            #print('------------------B', scaled.shape)

            df_output = self.data[scale_cols]

            #결측구간 생성
            #missing_range = self.generate_missing_ranges(dataLen=len(df_output), missingGroup=missingGroup, missingRange=missingRange)
            #missing_range = self.generate_missing_ranges_auto(dataLen=len(df_output), testSizePerDataLength=testSizePerDataLength, testSize=self.test_size)
            missing_range = self.generate_missing_ranges_auto_ex(dataLen=len(df_output), testSizePerDataLength=testSizePerDataLength, testSize=self.test_size, window_size=self.window_size)


            # 결측 구간이 [(0, 0)]인지 확인하여, 유효한 경우에만 NaN 할당
            if missing_range == [(0, 0)]:
                print("Warning: 유효한 결측 구간이 생성되지 않았습니다. missingGroup 및 missingRange 값을 확인하세요.")
            else:
                for start, end in missing_range:
                    if start < end:  # 유효한 범위만 처리
                        df_output.iloc[start:end] = np.nan
  
            df, data, scaler, data_batch = makeBatch_ex(df_output, scaler, self.window_size)
            #df, data, scaler, data_batch = makeBatch_ex2(df_output, scaler, self.window_size, columns=self.output_cols)

            model = None
            use_gpu = torch.cuda.is_available()
            print('use_gpu', use_gpu)

            device = torch.device("cuda") if use_gpu else torch.device("cpu")

            pretrain_epochs = self.epochs
            clip = gradientClipping
            start_lr = self.optimizer_lr
            batch_size = self.batch_size

            np.random.seed(123)
            torch.manual_seed(123)
            if use_gpu:
                torch.cuda.manual_seed_all(123)

            params = {
                'task' : "--",
                'batch' : self.batch_size,
                'y_dim' : 1,
                'rnn_dim' : 50,
                'dec1_dim' : 50,
                'dec2_dim' : 50,
                'dec4_dim' : 50,
                'dec8_dim' : 50,
                'dec16_dim' : 50,
                'n_layers' : 2,
                'discrim_rnn_dim' : 128,
                'discrim_num_layers' : 2,
                'cuda' : use_gpu,
                'highest' : 8,
            }

            model = NAOMI(params).to(device)
            params['total_params'] = num_trainable_params(model)
            train_data = torch.Tensor(data_batch)

            lr = start_lr
            teacher_forcing = True

            with trange(pretrain_epochs, file=sys.stdout) as tr:
                for e in tr:
                    epoch = e+1
                    if epoch == pretrain_epochs // 2:
                        lr = lr / 2

                    optimizer = torch.optim.Adam(
                        filter(lambda p: p.requires_grad, model.parameters()),
                        lr=lr)
                    train_loss = run_epoch(device, True, model, train_data, clip, optimizer, batch_size = batch_size, teacher_forcing=teacher_forcing)
                    tr.set_postfix(loss="{0:.3f}".format(train_loss))

            # 모델 전체 저장
            torch.save(model, modelFile)

            
            pred, pred_unscaled = predict_result(device, model, data, scaler)

            print('결과', type(pred), type(pred_unscaled))

            pred_df = pd.DataFrame(pred, columns=self.output_cols)
            pred_unscaled_df = pd.DataFrame(pred_unscaled, columns=self.output_cols)

            print('결과', pred_df, pred_unscaled_df)

            #df["value"] = pred
            data_test = scaler.inverse_transform(data.reshape(-1,1))

            #print('data_test', data_test)
            '''
            matplotlib.use('TkAgg')

            plt.figure(figsize=(20,5))
            plt.plot(data_test, label="real", zorder=10)
            plt.plot(pred, label="predict")
            plt.legend()
            savePltFile = os.path.join(self.filepath, self.filename + '_pytorch_naomi_2.png')
            plt.savefig(savePltFile, dpi=300)            
            plt.show()

            #real = pd.read_csv(rootPath + "서인천IC-부평IC_평균속도.csv",encoding='CP949')
            plt.figure(figsize=(20,5))
            plt.plot(self.data[self.output_cols], label="real")

            print('predict', self.data[self.output_cols])

            lb = "predict"
            for start, end in missing_range:
                plt.plot(range(start-1,end+1), pred[start-1:end+1], label=lb, color="orange")
                lb=None
            plt.legend()
            savePltFile = os.path.join(self.filepath, self.filename + '_pytorch_naomi_3.png')
            plt.savefig(savePltFile, dpi=300)
            plt.show()
            '''

            realval = self.data[self.output_cols[0]].values

            mape_results = []  # 결과값을 저장할 리스트 초기화
            for start,end in missing_range:
                mape_value = MAPEval(pred[start:end, 0], realval[start:end])  # MAPE 계산
                mape_results.append(mape_value)  # 리스트에 결과 추가
                print("길이 {}인 구간의 MAPE: {:.3f}".format(end - start, mape_value))

            result = {'fit':None}            
            result['x_test'] = data
            result['y_test'] = data
            result['y_pred'] = pred_unscaled_df[self.output_cols]
            result['x_test_unscaled'] = data_test
            result['y_test_unscaled'] = data_test
            result['y_pred_unscaled'] = pred_df[self.output_cols]
            result['mape'] = mape_results
            #result['evaluate_loss'] = 0 #mse[0]
            #result['evaluate_acc'] = 0 #mse[1]
            #print('hist', hist.history["loss"], hist.history["val_loss"])
        except Exception as e:
            raise e
        return result
    

    def dataGenerater(self):
        '''
        brits 예측 데이터 추출
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        try:
            print("--------A")
            print(self.data)
            #모델로드
            #model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(self.filename)
            model = torch.load(self.filename)

            '''
            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                apply_colums = self.output_cols + self.feature_cols
            '''
            apply_colums = self.output_cols
            #print(model.summary())
            #print(self.data)
            print(self.trgt_col_list)
            print("--------B")
            #컬럼추출
            scale_cols = []
            cols_blank = []
            cols_nos = []
            no = 0

            if (self.trgt_col_list == ''):
                for c in apply_colums:
                    cols_blank.append(0)
                    scale_cols.append(c)
                    for col in self.output_cols:
                        if c==col:
                            cols_nos.append(no)
                    no = no + 1
            else:
                for c in self.trgt_col_list:
                    cols_blank.append(0)
                    scale_cols.append(c)
                    for col in self.output_cols:
                        if c==col:
                            cols_nos.append(no)
                    no = no + 1         

            print(scale_cols)
            print(cols_nos)

            print("--------C")
            #정규화(0~1변환)

            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            if os.path.exists(scalerFile):
                with open(scalerFile, 'rb') as f:
                    scaler: MinMaxScaler = pickle.load(f)            
                #scaled = scaler.transform(self.data[scale_cols])
            else:
                scaler = MinMaxScaler()
                #scaled = scaler.fit_transform(self.data[scale_cols])            
            
            #scaled = self.data[scale_cols]# 테스트
            #df = pd.DataFrame(scaled, columns=scale_cols)

            print("--------D")
            
            use_gpu = torch.cuda.is_available()
            print('use_gpu', use_gpu)

            device = torch.device("cuda") if use_gpu else torch.device("cpu")

            print("--------E", self.data[scale_cols], self.window_size)

            df, data, scaler = makeBatch_predict(self.data[scale_cols], scaler)

 
            print("--------F", data)

            #예측 데이터 추출
            #y_pred = model.predict(test_dt)
            y_pred, y_pred_unscaled = predict_result(device, model, data, scaler)
            print("--------G", y_pred)
            #print(pred[:,0].reshape(-1,1))

            print("--------H")
            '''
            matplotlib.use('TkAgg')
            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(y_pred[:, index], label=f'prediction')
                plt.plot(test_data[:, index], label=f'actual')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + '_real_fake.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()
            '''

            #예측값 월래 값 변환 (테스트 필요)

            utils = Utils()
            pred_df = pd.DataFrame(y_pred, columns=self.output_cols)
            #print('pred_df', pred_df)
            #extend_df = utils.add_dataframe_columns(pred_df, scale_cols)
            #print('extend_df', extend_df)
            #y_pred_unscaled = scaler.inverse_transform(extend_df)
            #unscaled_df = pd.DataFrame(y_pred_unscaled, columns=scale_cols)

            #print('y_pred_unscaled', self.output_cols, unscaled_df)

            #y_pred_unscaled = scaler.inverse_transform(y_pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
     
            #y_pred 자체가 스케일러에서 복원 되서 나오므로 그대로 리턴
            result = pred_df#unscaled_df[self.output_cols]            

        except Exception as e:
            raise e            
        return result


def MAPEval(y_pred, y_true):
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100    

'''
def makeBatch_ex2(df, scaler, window_size, columns):
    
    # 지정된 여러 컬럼에 대해 스케일링 수행
    df[columns] = scaler.fit_transform(df[columns])

    data_batch = []
    all_data = {}  # 각 컬럼별 데이터를 저장할 딕셔너리
    
    # 각 컬럼별로 결측치를 확인하고 윈도우 생성
    for column_name in columns:
        missing_list = df[column_name].isnull()
        data = df[column_name].to_numpy()
        all_data[column_name] = data  # 컬럼별 원본 데이터 저장

        datas = []
        for index, val in enumerate(data):
            if missing_list[index]:
                datas = []
                continue
            datas.append(val)
            
            if len(datas) == window_size:
                data_batch.append(datas.copy())
                datas.pop(0)
    
    # 결과 배열 생성
    data_batch = np.array(data_batch)
    data_batch = data_batch.reshape(data_batch.shape[0], data_batch.shape[1], len(columns))

    print("Scaled Data:\n", df)
    print("Data Batches:\n", data_batch)

    return df, all_data, scaler, data_batch

'''

def makeBatch_predict(df, scaler):
    
    #df = df[[indexColumn, valueColumn]]
    column_name = df.columns[0]  # 첫 번째 컬럼 이름을 가져옴
    df[column_name] = scaler.fit_transform(df[column_name].values.reshape(-1,1))

    print('1', df[column_name])    

    missing_list = df.isnull()[column_name]

    print('2', missing_list)    

    data = df[column_name].to_numpy()

    return df, data, scaler

def makeBatch_ex(df, scaler, window_size):
    
    #df = df[[indexColumn, valueColumn]]
    column_name = df.columns[0]  # 첫 번째 컬럼 이름을 가져옴
    df[column_name] = scaler.fit_transform(df[column_name].values.reshape(-1,1))

    missing_list = df.isnull()[column_name]

    data = df[column_name].to_numpy()

    data_batch = []
    datas = []
    for index,val in enumerate(data):
        if missing_list[index]:
            print('missing', index, val)
            datas=[]
            continue
        datas.append(val)         
        print('loop', index, val, datas)
        if len(datas)==window_size:
            data_batch.append(datas.copy())
            datas.pop(0)
   
    data_batch = np.array(data_batch)

    data_batch = data_batch.reshape(data_batch.shape[0], data_batch.shape[1], 1)

    return df,data,scaler,data_batch

    
def makeBatch(path, window_size):
    df = pd.read_csv(path)

    min_max_scaler = MinMaxScaler()

    df = df[["time", "value"]]
    
    df["value"] = min_max_scaler.fit_transform(df["value"].values.reshape(-1,1))
    
    missing_list = df.isnull()["value"]

    data = df["value"].to_numpy()

    data_batch = []
    datas = []

    #print('로딩데이터2',data)

    for index,val in enumerate(data):
        if missing_list[index]:
            datas=[]
            continue
        datas.append(val)         
        if len(datas)==window_size:
            data_batch.append(datas.copy())
            datas.pop(0)
    data_batch = np.array(data_batch)
    data_batch = data_batch.reshape(data_batch.shape[0], data_batch.shape[1], 1)

    return df,data, min_max_scaler, data_batch

def predict_result(device, model, data, scaler):
    test = data.copy()
    missing_list = np.where(pd.isnull(test))

    test[np.isnan(test)] = 0
    
    test = test.reshape(len(data),1,1)
    test = Variable(torch.Tensor(test).to(device))

    has_value = Variable(torch.ones(test.shape[0], test.shape[1], 1))
    has_value[missing_list] = 0.0
    has_value = has_value.to(device)
    data_test = torch.cat([has_value, test], 2)

    data_list = []
    for j in range(len(data)):
        data_list.append(data_test[j:j+1])
    samples = model.sample(data_list,1)
    result = samples[:,0,0].cpu().detach().numpy()

    result_unscaled = result.reshape(-1,1)
    result = scaler.inverse_transform(result.reshape(-1,1))
    return result, result_unscaled


def run_epoch(device, train, model, exp_data, clip, optimizer=None, batch_size=64, num_missing=None, teacher_forcing=True):
    losses = []
    inds = np.random.permutation(exp_data.shape[0])
    
    i = 0
    while i + batch_size <= exp_data.shape[0]:
        ind = torch.from_numpy(inds[i:i+batch_size]).long()
        i += batch_size
        data = exp_data[ind]
    
        
        data = data.to(device)

        # change (batch, time, x) to (time, batch, x)
        data = Variable(data.transpose(0, 1))
        ground_truth = data.clone()
        if num_missing is None:
            #num_missing = np.random.randint(data.shape[0] * 18 // 20, data.shape[0])
            num_missing = np.random.randint(data.shape[0] * 4 // 5, data.shape[0])
            #num_missing = 40
        missing_list = torch.from_numpy(np.random.choice(np.arange(1, data.shape[0]), num_missing, replace=False)).long()
        data[missing_list] = 0.0
        has_value = Variable(torch.ones(data.shape[0], data.shape[1], 1))
        has_value = has_value.to(device)
        has_value[missing_list] = 0.0

        data = torch.cat([has_value, data], 2)
        seq_len = data.shape[0]


        if teacher_forcing:
            batch_loss = model(data, ground_truth)
        else:
            data_list = []
            for j in range(seq_len):
                data_list.append(data[j:j+1])
            samples = model.sample(data_list)
            batch_loss = torch.mean((ground_truth - samples).pow(2))

        if train:
            optimizer.zero_grad()
            total_loss = batch_loss
            total_loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), clip)
            optimizer.step()
        
        losses.append(batch_loss.data.cpu().numpy())

    return np.mean(losses)





class NAOMI(nn.Module):
    def __init__(self, params):
        super(NAOMI, self).__init__()

        self.params = params
        self.task = params['task']
        self.stochastic = (self.task == 'basketball')
        self.y_dim = params['y_dim']
        self.rnn_dim = params['rnn_dim']
        self.dims = {}
        self.n_layers = params['n_layers']
        self.networks = {}
        self.highest = params['highest']
        self.batch_size = params['batch']

        self.gru = nn.GRU(self.y_dim, self.rnn_dim, self.n_layers)
        self.back_gru = nn.GRU(self.y_dim + 1, self.rnn_dim, self.n_layers)
        
        step = 1
        while step <= self.highest:
            l = str(step)
            self.dims[l] = params['dec' + l + '_dim']
            dim = self.dims[l]
            
            curr_level = {}
            curr_level['dec'] = nn.Sequential(
                nn.Linear(2 * self.rnn_dim, dim),
                nn.ReLU())
            curr_level['mean'] = nn.Linear(dim, self.y_dim)
            if self.stochastic:
                curr_level['std'] = nn.Sequential(
                    nn.Linear(dim, self.y_dim),
                    nn.Softplus())
            curr_level = nn.ModuleDict(curr_level)

            self.networks[l] = curr_level
            
            step = step * 2

        self.networks = nn.ModuleDict(self.networks)

    def forward(self, data, ground_truth):
        # data: seq_length * batch * 11
        # ground_truth: seq_length * batch * 10
        h = Variable(torch.zeros(self.n_layers, self.batch_size, self.rnn_dim))
        h_back = Variable(torch.zeros(self.n_layers, self.batch_size, self.rnn_dim))
        if self.params['cuda']:
            h, h_back = h.cuda(), h_back.cuda()
        
        loss = 0.0
        h_back_dict = {}
        count = 0
        
        for t in range(data.shape[0] - 1, 0, -1):
            h_back_dict[t+1] = h_back
            state_t = data[t]
            _, h_back = self.back_gru(state_t.unsqueeze(0), h_back)
            
        for t in range(data.shape[0]):
            state_t = ground_truth[t]
            _, h = self.gru(state_t.unsqueeze(0), h)
            count += 1
            for l, dim in self.dims.items():
                step_size = int(l)
                curr_level = self.networks[str(step_size)] 
                if t + 2 * step_size <= data.shape[0]:
                    next_t = ground_truth[t+step_size]
                    h_back = h_back_dict[t+2*step_size]
                    
                    dec_t = curr_level['dec'](torch.cat([h[-1], h_back[-1]], 1))
                    dec_mean_t = curr_level['mean'](dec_t)
                    
                    if self.stochastic:
                        dec_std_t = curr_level['std'](dec_t)
                        loss += nll_gauss(dec_mean_t, dec_std_t, next_t)
                    else:
                        loss += torch.sum((dec_mean_t - next_t).pow(2))

        return loss / count / data.shape[1]

    def sample(self, data_list, batch_size = None):
        if not batch_size:
            batch_size = self.batch_size
        # data_list: seq_length * (1 * batch * 11)
        ret = []
        seq_len = len(data_list)
        h = Variable(torch.zeros(self.params['n_layers'], batch_size, self.rnn_dim))
        if self.params['cuda']:
            h = h.cuda()
        
        h_back_dict = {}
        h_back = Variable(torch.zeros(self.params['n_layers'], batch_size, self.rnn_dim))
        if self.params['cuda']:
            h_back = h_back.cuda()  
        for t in range(seq_len - 1, 0, -1):
            h_back_dict[t+1] = h_back
            state_t = data_list[t]
            _, h_back = self.back_gru(state_t, h_back)
        
        curr_p = 0
        _, h = self.gru(data_list[curr_p][:, :, 1:], h)
        while curr_p < seq_len - 1:
            if data_list[curr_p + 1][0, 0, 0] == 1:
                curr_p += 1
                _, h = self.gru(data_list[curr_p][:, :, 1:], h)
            else:
                next_p = curr_p + 1
                while next_p < seq_len and data_list[next_p][0, 0, 0] == 0:
                    next_p += 1
                
                step_size = 1
                while curr_p + 2 * step_size <= next_p and step_size <= self.highest:
                    step_size *= 2
                step_size = step_size // 2
                
                self.interpolate(data_list, curr_p, h, h_back_dict, step_size)
        
        return torch.cat(data_list, dim=0)[:, :, 1:]

    def interpolate(self, data_list, curr_p, h, h_back_dict, step_size):
        #print("interpolating:", len(ret), step_size)
        h_back = h_back_dict[curr_p + 2 * step_size]
        curr_level = self.networks[str(step_size)]
        
        dec_t = curr_level['dec'](torch.cat([h[-1], h_back[-1]], 1))
        dec_mean_t = curr_level['mean'](dec_t)
        if self.stochastic:
            dec_std_t = curr_level['std'](dec_t)
            state_t = reparam_sample_gauss(dec_mean_t, dec_std_t)
        else:
            state_t = dec_mean_t
        
        added_state = state_t.unsqueeze(0)
        has_value = Variable(torch.ones(added_state.shape[0], added_state.shape[1], 1))
        if self.params['cuda']:
            has_value = has_value.cuda()
        added_state = torch.cat([has_value, added_state], 2)
        
        if step_size > 1:
            right = curr_p + step_size
            left = curr_p + step_size // 2
            h_back = h_back_dict[right+1]
            _, h_back = self.back_gru(added_state, h_back)
            h_back_dict[right] = h_back
            
            zeros = Variable(torch.zeros(added_state.shape[0], added_state.shape[1], self.y_dim + 1))
            if self.params['cuda']:
                zeros = zeros.cuda()
            for i in range(right-1, left-1, -1):
                _, h_back = self.back_gru(zeros, h_back)
                h_back_dict[i] = h_back
        
        data_list[curr_p + step_size] = added_state


def num_trainable_params(model):
    total = 0
    for p in model.parameters():
        count = 1
        for s in p.size():
            count *= s
        total += count
    return total


def nll_gauss(mean, std, x):
    pi = Variable(torch.DoubleTensor([np.pi]))
    if mean.is_cuda:
        pi = pi.cuda()
    nll_element = (x - mean).pow(2) / std.pow(2) + 2*torch.log(std) + torch.log(2*pi)
    
    return 0.5 * torch.sum(nll_element)

def reparam_sample_gauss(mean, std):
    eps = torch.DoubleTensor(std.size()).normal_()
    eps = Variable(eps)
    if mean.is_cuda:
        eps = eps.cuda()
    return eps.mul(std).add_(mean)

