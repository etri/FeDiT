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
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.model_selection import train_test_split
import math
from statsmodels.tsa.api import VARMAX
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX

from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout, Flatten, Reshape, BatchNormalization, RepeatVector, Input, MaxPooling1D, UpSampling1D, Concatenate
from tensorflow.keras.losses import Huber, MeanSquaredError, MeanAbsoluteError, MeanAbsolutePercentageError
from tensorflow.keras.optimizers import Adam, SGD, Adagrad, RMSprop
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.sequence import TimeseriesGenerator


from dt_data_api.model import fidMeta
from dt_data_api.common.settings_meta import MODEL_PATH_META
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS
from dt_data_api.util.utils import Utils
from .utils import ModelParameters, InputParameters

class Manager:
    '''
    ARIMA
    ---
    학습모델 생성
    '''
    #모델 기본 저장 경로
    MODEL_FILE_PATH = MODEL_PATH_META

        #원본데이터
    data = pd.DataFrame

    #모델파라메터
    window_size:None        #데이터 분할 수
    test_size:None          #학습 비율
    p:None                  #자기회귀 차수, Autoregressive term
                            #이전 시점의 값이 현재 시점의 값에 영향을 미치는 정도를 나타냅니다.
                            #p는 모델이 몇 개의 이전 시점의 데이터를 기반으로 현재 값을 예측할지 결정합니다.
                            #예를 들어, p=2라면, 이전 두 시점의 데이터를 이용해 현재 값을 예측합니다.
                            #수식적으로는 AR(p) 부분을 나타내며, 자기회귀는 이전 시점의 종속 변수를 기반으로 값을 예측하는 방식입니다.

    d:None                  #차분 차수, Differencing term
                            #시계열 데이터를 안정화하기 위해 몇 번 차분(differencing)을 할지 결정합니다.
                            #d=1은 첫 번째 차분(1차 차분)을 적용한다는 의미로, 데이터를 차분하여 평균이 일정해지도록 만들고, **정상성(stationarity)**을 확보하기 위해 사용됩니다.
                            #d=0이면 차분을 하지 않고, 원래 데이터로 작업을 진행합니다.
                            #보통 데이터의 트렌드나 비정상성을 제거하기 위해 차분을 사용합니다.

    q:None                  #이동평균 차수, Moving Average term
                            #모델의 예측 오차가 이전 오차의 영향을 받는 정도를 나타냅니다.
                            #q는 이전의 예측 오차들이 현재 값에 미치는 영향을 모델에 포함하는 정도를 나타냅니다.
                            #예를 들어, q=2라면, 모델이 이전 두 시점의 예측 오차를 기반으로 현재 값을 예측합니다.
                            #수식적으로는 MA(q) 부분을 나타내며, 오차 항(예측과 실제 값의 차이)이 현재 예측에 영향을 미치는 방식입니다.

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
        self.window_size = modelArgs.window_size 
        self.test_size = modelArgs.test_size


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

    def addTimeSeries(self, input_data, output_data, output_cols):
        '''
        예측 데이터 시계열 날짜 병합
        Returns: 학습모델을 통해 생성한 데이터와 원 데이터 마지막 날짜 이후 시계열 날짜를 추출하여 병합
            result
        '''
        output_row_cnt = len(output_data)
        
        index_col = input_data.index.name
        target_cols = output_cols
        
        df = input_data.loc[:, target_cols]
        df = df.reset_index(drop=False)

        # 마지막 날짜
        last_date = df.iloc[-1][index_col]
        print(df.iloc[-2][index_col])
        #last_date = df.index[-1]

        # 비교 시작 날짜(마지막에서 2번째)와 종료 날짜
        #start_date = pd.to_datetime('2019-01-31 00:00:00')
        #end_date = pd.to_datetime('2019-02-01 01:00:00')
        start_date = pd.to_datetime(str(df.iloc[-2][index_col]))
        end_date = pd.to_datetime(str(df.iloc[-1][index_col]))

        # 날짜 간격 계산
        date_diff = end_date - start_date

        #모든 속성을 초단위로 모아서 변환
        total_seconds = date_diff.total_seconds()

        seconds = int(total_seconds) % 60
        minutes = int(total_seconds) // 60 % 60
        hours = int(total_seconds) // 3600 % 24
        days = int(total_seconds) // (3600 * 24)
        months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
        years = end_date.year - start_date.year

        # 결과 출력
        '''
        print(f"전체 초: {total_seconds}초")
        print(f"초 증가량: {seconds}초")
        print(f"분 증가량: {minutes}분")
        print(f"시간 증가량: {hours}시간")
        print(f"일 증가량: {days}일")
        print(f"월 증가량: {months}개월")
        print(f"년 증가량: {years}년")

        print(start_date)
        print(end_date)
        '''

        #date 포맷 일치
        datetime_format = '%Y-%m-%d %H:%M:%S'

        new_rows = []
        for i in range(output_row_cnt):
            #새로운 날짜 및 시간 값을 생성
            #Dataframe에 날짜 더하기 : DateOffset
            if seconds > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(seconds=i+1)
            elif minutes > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(minutes=i+1)
            elif hours > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(hours=i+1)
            elif days > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(days=i+1)
            elif months > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(months=i+1)
            elif years > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(years=i+1)
            else:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(hours=i+1)


            # +: 문자열 합치기 , *:문자열반복합치기
            # df.shape : 행,열, df.shape[0]:행, df.shape[1] :열
            # [''] * (df.shape[1]-1) 공백을 추가하고 열의 갯수 -1 만큼 반복해서 [''] 공백을 추가
            #print(['2019-01-01 23:00:02'] + [''] * (df.shape[1]-1))
            #new_rows.append([new_date] + [''] * (df.shape[1]-1))

            #다른 df 의 row 리스트를 가져와서 붙히기
            #print(output_data.values.tolist()[i])
            new_rows.append([new_date] + output_data.values.tolist()[i])
        
        # 새로운 DataFrame 생성
        new_df = pd.DataFrame(new_rows, columns=df.columns)

        # 기존 df, new_df 행 병합, 참고: 열병합 pd.concat([df, new_df], axis=1)
        '''
        output_file = '~PATH\\DT\\storage\\preprocess\\2023\\06\\9999\\augment_sample_test\\output_augment_result_merge.csv'
        result_df = pd.concat([df, new_df], ignore_index=True)
        result_df.to_csv(output_file, index=False)
        '''

        #output_file2 = '~PATH\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test\\output_augment_result.csv'
        #result_df2 = new_df
        #result_df2.to_csv(self.output_file, index=False)
        
        return new_df
    
    def useModelTimeSeries(self, input_data, output_data, output_cols, window_size, resmpl_intvl_tp, resmpl_intvl_value, target_start_date, target_last_date, index_column):
        print("==간격 파라미터 유지 체크=파일로 저장")
        df_new = self.useModelTimeSeries_dataframe(input_data, output_data, output_cols, window_size, resmpl_intvl_tp, resmpl_intvl_value, target_start_date, target_last_date, index_column)
        df_new.to_csv(self.output_file, index=False)
        return self.output_file
        #return df_result

    
    def useModelTimeSeries_dataframe(self, input_data, output_data, output_cols, window_size, resmpl_intvl_tp, resmpl_intvl_value, target_start_date, target_last_date, index_column):

        print("==간격 파라미터 유지 체크=")
        print(resmpl_intvl_tp)
        print(resmpl_intvl_value)
        current_year = datetime.now().year
        print('시작시간', target_start_date)
        set_start_date = datetime.strptime(target_start_date, '%Y-%m-%d %H:%M:%S')
        set_last_date = datetime.strptime(target_last_date, '%Y-%m-%d %H:%M:%S')

        if resmpl_intvl_tp == 'days':
            target_start_date = set_start_date.strftime('%m-%d 00:00:00')
            target_last_date = set_last_date.strftime('%m-%d 00:00:00')
        elif resmpl_intvl_tp == 'hours':
            target_start_date = set_start_date.strftime('%m-%d %H:00:00')
            target_last_date = set_last_date.strftime('%m-%d %H:00:00')
        elif resmpl_intvl_tp == 'minutes':
            target_start_date = set_start_date.strftime('%m-%d %H:%M:00')
            target_last_date = set_last_date.strftime('%m-%d %H:%M:00')
        elif resmpl_intvl_tp == 'seconds':
            target_start_date = set_start_date.strftime('%m-%d %H:%M:%S')
            target_last_date = set_last_date.strftime('%m-%d %H:%M:%S')
        else:
            target_start_date = None
            target_last_date = None

        start_time = datetime.strptime(str(current_year) + '-' + target_start_date, '%Y-%m-%d %H:%M:%S')
        end_time = datetime.strptime(str(current_year) + '-' + target_last_date, '%Y-%m-%d %H:%M:%S')

        print('start_time', start_time, resmpl_intvl_value)
        print('end_time', end_time)

        current_time = start_time
        #days_difference = -window_size+1
        days_difference = 1

        # 시작 시간 계산
        start_time = None
        
        if resmpl_intvl_tp == 'days':
            time_interval = timedelta(days=resmpl_intvl_value)
            start_time = current_time + (time_interval * days_difference)        
        elif resmpl_intvl_tp == 'hours':
            time_interval = timedelta(hours=resmpl_intvl_value)
            start_time = current_time + (time_interval * days_difference)      
        elif resmpl_intvl_tp == 'minutes':
            time_interval = timedelta(minutes=resmpl_intvl_value)
            start_time = current_time + (time_interval * days_difference)   
        elif resmpl_intvl_tp == 'seconds':
            time_interval = timedelta(seconds=resmpl_intvl_value)
            print(time_interval)
            start_time = current_time + (time_interval * days_difference)      
        else:
            start_time = None

        # 인덱스용 데이터프레임 생성
        index_df = pd.DataFrame()
        current_time = None

        for i in range(len(output_data)):
            if resmpl_intvl_tp == 'days':
                current_time = start_time + timedelta(days=resmpl_intvl_value * i)
            elif resmpl_intvl_tp == 'hours':
                current_time = start_time + timedelta(hours=resmpl_intvl_value * i)
            elif resmpl_intvl_tp == 'minutes':
                current_time = start_time + timedelta(minutes=resmpl_intvl_value * i)
            elif resmpl_intvl_tp == 'seconds':
                current_time = start_time + timedelta(seconds=resmpl_intvl_value * i)
            else:
                current_time = None

            # 데이터프레임에 row 추가
            row = pd.DataFrame({index_column: [current_time]})
            index_df = pd.concat([index_df, row], ignore_index=True)
            index_df = index_df.reset_index(drop=True)

        df_new = pd.concat([index_df[index_column], output_data], axis=1)

        print("========result=========")
        print(df_new)
        return df_new



    # MAPE 계산 함수 정의
    def mean_absolute_percentage_error(self, y_true, y_pred):
        y_true, y_pred = np.array(y_true), np.array(y_pred)
        return np.mean(np.abs((y_true - y_pred) / y_true)) * 100        


    '''
    # 아래 코드는 전부 흔적을 남겨 놓는 용도
    # 임시로 작동은 하지만 실제 적용하려면 약간의 수정은 필요함
    # ARIMA 모델은 데이터의 순차성이 중요한데 인덱스값도 일종의 순차키로서 내부에서 사용함. 
    # forecast 전에 append를 할때의 입력 데이터가 모델 훈련때 바로 이후에 이어지는 시간 데이터와 간격이 아니라면 에러가 발생함.
    # 그걸 해결 하기 위해서 인덱스를 시간대신 0 ~ 으로 모델을 훈련한 후 
    # 훈련에 사용된 데이터의 마지막 인덱스를 저장해서 추후 append 할 데이터의 인덱스를 그 다음부터 적용하도록 하려고 했던 작업의 흔적
    '''

    #인덱스를 숫자 0 ~ 로 사용하는 방식. 인덱스를 숫자로 하고 결과에 시간을 붙임
    def modelTrainning_index(self, p, d, q, index_column=''):
        '''
        데이터 학습 및 모델 생성
        Returns: 학습결과 데이터
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
        '''
        
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
        """
        try:
            gpus = tf.config.list_physical_devices('gpu')
            for i in range(len(gpus)):
                tf.config.experimental.set_memory_growth(gpus[i], True)
        except Exception as e :
            raise e

        """

        # gpu 이름
        gpus = tf.config.experimental.list_logical_devices('GPU')

        # gpu가 2개 이상이면, MirroredStrategy 인스턴스 생성
        if len(gpus) > 1: 
            strategy = tf.distribute.MirroredStrategy([gpu.name for gpu in gpus])

        # gpu가 1개 이하면, 디폴트 전략 설정
        else:
            strategy = tf.distribute.get_strategy() # default strategy that works on CPU and single GPU

        #폴더확인        
        temp = os.path.join(self.filepath, 'temp')
        history = os.path.join(self.filepath, 'history')
        if not os.path.exists(temp):
            os.makedirs(temp)
        if not os.path.exists(history):
            os.makedirs(history)

        #생성파일 목록
        modelCKFile = os.path.join(temp, self.filename + '_ckeckpointer.ckpt.weights.h5')
        fitHistoryFile = os.path.join(self.filepath, self.filename + '_fit_history.png')
        fidHistoryFile = os.path.join(self.filepath, self.filename + '_fid_history.png')
        fidHistoryPath = history

        modelFile = os.path.join(self.filepath, self.filename)

        try:
            print('------------------A')

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
                output_cols = [index_column] + self.output_cols
                feature_cols = [index_column] + self.feature_cols
            else:
                apply_colums = self.output_cols + self.feature_cols
                output_cols = self.output_cols
                feature_cols = [index_column] + self.feature_cols

            #컬럼생성
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
            
            print('------------------B', self.data)
            #정규화(0~1변환)
            
            scaler = MinMaxScaler()
            
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            df.insert(0, index_column, self.data[index_column])
            #df = pd.concat([self.data[index_column], df], axis=0)

            print('------------------C', df)

            utils = Utils()

            df = utils.add_columns_BtoA(df, self.data)

            outputs_df = df[output_cols]
            features_df = df[feature_cols]

            '''
            scaler_x = MinMaxScaler()
            scaled_x = scaler_x.fit_transform(self.data[scale_x_cols])
            df_x = pd.DataFrame(scaled_x, columns=scale_x_cols)

            scaler_y = MinMaxScaler()
            scaled_y = scaler_y.fit_transform(self.data[scale_y_cols])
            df_y = pd.DataFrame(scaled_y, columns=scale_y_cols)
            
            #df = self.data[scale_cols]
            print(df_x[:20], df_y[:20])

            print('------------------C')
            #종속/독립변수 지정
            features_df = df_x[self.feature_cols]
            outputs_df = df_y[self.output_cols]
            '''
            for col in output_cols:
                outputs_df.drop(col, 1)
            print('outputs_df', outputs_df)
            print('features_df', features_df)



            print('------------------D')
            #학습/검증 데이터 추출
            x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(y_train)
            print(y_test)

            with strategy.scope():
                print('------------------E')
                #모델적용 데이터셋 생성
                if self.is_indpds:
                    #x_train_indexed = x_train.set_index(index_column)
                    #y_train_indexed = y_train.set_index(index_column)
                    #x_test_indexed = x_test.set_index(index_column)
                    #y_test_indexed = y_test.set_index(index_column)
                    #독립변수 데이터 생성
                    #train_data = self.windowed_dataset2((x_train, y_train), self.window_size, self.batch_size, True)
                    #test_data = self.windowed_dataset2((x_test, y_test), self.window_size, self.batch_size, False)

                    #독립변수가 있을땐 ARIMAX 모델
                    model = VARMAX(y_train, order=(0, 1), exog=x_train, trends='ct')
                    fit_model = model.fit()

                    fit_model.forecast(steps=self.window_size)

                else:
                    #y_train_indexed = y_train.set_index(index_column)
                    #y_test_indexed = y_test.set_index(index_column)
                    #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
                    #train_data = self.windowed_dataset(y_train, self.window_size, self.batch_size, True)
                    #test_data = self.windowed_dataset(y_test, self.window_size, self.batch_size, False)

                    print('훈련 입력', y_train[self.output_cols])

                    #y_train_indexed.index = pd.date_range(start=y_train_indexed.index[0], periods=len(y_train_indexed), freq='H')
                    #y_train_indexed.index.name = index_column

                    model = SARIMAX(y_train[self.output_cols], order=(p, d, q))
                    fit_model = model.fit()
                    #fit_model.forecase(steps=self.window_size)

            print('------------------H', len(y_train))  
            #모델검증
            #mse = model.evaluate(test_data)
            #print("mse : ", mse)
            #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))

            #학습 히스토리
            #print('fit : ', hist)
            #self.fitHistory(hist, fitHistoryFile)

            #FID 히스토리
            #print('fid : ', cb_fid.fid_scores)
            #pd_fid = pd.DataFrame(cb_fid.fid_scores)
            #self.fidHistory(pd_fid[1], fidHistoryFile)

            print('------------------I')
            #모델저장
            # 모델 저장
            with open(modelFile, 'wb') as pkl_file:
                pickle.dump(fit_model, pkl_file)

            # 스케일러를 로컬에 임시 저장

            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            with open(scalerFile, 'wb') as f:
                pickle.dump(scaler, f)      
            '''
            scalerFile_x = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_x.pkl')
            scalerFile_y = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_y.pkl')
            with open(scalerFile_x, 'wb') as f:
                pickle.dump(scaler_x, f)      
            with open(scalerFile_y, 'wb') as f:
                pickle.dump(scaler_y, f)
            '''

            #update_model = fit_model.append(y_test, refit=False)


            print('테스트 입력', y_test[self.output_cols])
            #csvFile = os.path.join(self.filepath, self.filename + '.csv')
            #y_test_indexed.to_csv(csvFile)

            #update_model = fit_model.append(y_test[self.output_cols], refit=False)
            y_pred = fit_model.forecast(steps=len(y_test))
            #red = model.predict(test_data)
            #print(test_data)




            # 테스트 데이터 복원
            new_index = range(len(x_test))
            x_test.index = new_index
            extend_x_df = utils.add_dataframe_columns(x_test, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)

            unscaled_x_df.insert(0, index_column, x_test[index_column])
            print('unscaled_x_df', unscaled_x_df, x_test)   

            unscaled_x_df[index_column] = x_test[index_column]
            unscaled_x_df = unscaled_x_df.set_index(index_column)
            
      
            new_index = range(len(y_test))
            y_test.index = new_index
            extend_y_df = utils.add_dataframe_columns(y_test, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)

            unscaled_y_df.insert(0, index_column, y_test[index_column])
            unscaled_y_df[index_column] = y_test[index_column]
            unscaled_y_df = unscaled_y_df.set_index(index_column)
            print('unscaled_y_df', unscaled_y_df, y_test)



            y_test[self.output_cols]



            #예측 데이터 복원
            print('pred : ', output_cols, type(y_pred), y_pred)
            pred_df = y_pred.to_frame()#.rename_axis(index_column)
            #pred_df = pd.DataFrame(y_pred.values, columns=output_cols) #pred가 pandas.core.series.Series 형태
            #new_index = range(len(pred_df))
            #pred_df.index = new_index
            pred_df = pred_df.reset_index().reset_index(drop=True)
            pred_df.rename(columns={'predicted_mean':self.output_cols[0]}, inplace=True)
            #print(y_test_indexed.columns, y_test.columns)
            #pred_df.columns = y_test_indexed.columns 

            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            print('예측 결과 언스케일링', pred_unscaled)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)

            y_test_scaled = copy.deepcopy(y_test)
            y_test_unscaled = copy.deepcopy(y_test)
            #y_test_scaled = y_test.deepcopy()  # copy 메서드를 사용하여 복사
            #y_test_unscaled = y_test.deepcopy()  # copy 메서드를 사용하여 복사
            y_test_scaled[self.output_cols] = extend_pred_df[self.output_cols]
            y_test_unscaled[self.output_cols] = unscaled_pred_df[self.output_cols]

            print('예측 결과 복원', y_test_scaled, y_test_unscaled)

            
            #unscaled_pred_df.insert(0, index_column, pred_df[index_column])
            #unscaled_pred_df[index_column] = pred_df[index_column]
            #unscaled_pred_df = unscaled_pred_df.set_index(index_column)
     
            '''
            y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            '''
            mse = mean_squared_error(y_test[self.output_cols], pred_df[self.output_cols])
            mae = mean_absolute_error(y_test[self.output_cols], pred_df[self.output_cols])
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test[self.output_cols], pred_df[self.output_cols])
            mape = self.mean_absolute_percentage_error(y_test[self.output_cols], pred_df[self.output_cols])

            result = {'fid': None, 'fit':None}            
            result['x_test'] = x_test
            result['y_test'] = y_test
            result['y_pred'] = y_test_scaled
            result['x_test_unscaled'] = unscaled_x_df[self.feature_cols]
            result['y_test_unscaled'] = unscaled_y_df[self.output_cols]
            result['y_pred_unscaled'] = unscaled_pred_df[self.output_cols]
            result['mse'] = mse
            result['mae'] = mae
            result['rmse'] = rmse
            result['r2'] = r2
            result['mape'] = mape            
            #result['fid'] = cb_fid.fid_scores
            #result['fit'] = hist.history
            #result['evaluate_loss'] = mse[0]
            #result['evaluate_acc'] = mse[1]
        except Exception as e:
            raise e
        
        return result
    

    #인덱스를 숫자 0 ~ 로 사용하는 방식. 인덱스를 숫자로 하고 결과에 시간을 붙임(작업 중-인덱스로 처리하고 시간을 붙이는 루틴 필요)
    def dataGenerater_index(self, lastIndex, refit=False, loopCount=1, auto_save_file = True, index_column=''):
        '''
        예측 데이터 추출
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        try:
            print("--------A")
            #모델로드
            #model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(self.filename)

            # 모델 로드
            with open(self.filename, 'rb') as pkl_file:
                model = pickle.load(pkl_file)
            
            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                data_cols = self.output_cols + list(set(self.feature_cols) - set(self.output_cols))
                apply_colums = data_cols #self.output_cols + self.feature_cols

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

            print("--------C", self.data)
            #정규화(0~1변환)
            '''
            scalerFile_x = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_x.pkl')
            if os.path.exists(scalerFile_x):
                with open(scalerFile_x, 'rb') as f:
                    scaler_x: MinMaxScaler = pickle.load(f)            
                scaled_x = scaler_x.transform(self.data[scale_x_cols])
            else:
                scaler_x = MinMaxScaler()
                scaled_x = scaler_x.fit_transform(self.data[scale_x_cols])

            scalerFile_y = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_y.pkl')
            if os.path.exists(scalerFile_x):
                with open(scalerFile_y, 'rb') as f:
                    scaler_y: MinMaxScaler = pickle.load(f)
                    scaled_y = scaler_y.transform(self.data[scale_y_cols])
            else:
                scaler_y = MinMaxScaler()
                scaled_y = scaler_y.fit_transform(self.data[scale_y_cols])

            df_x = pd.DataFrame(scaled_x, columns=scale_x_cols)
            df_y = pd.DataFrame(scaled_y, columns=scale_y_cols)        
            '''
            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            if os.path.exists(scalerFile):
                with open(scalerFile, 'rb') as f:
                    scaler: MinMaxScaler = pickle.load(f)            
                scaled = scaler.transform(self.data[scale_cols])
            else:
                scaler = MinMaxScaler()
                scaled = scaler.fit_transform(self.data[scale_cols])            
            #scaler = MinMaxScaler()
            #scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)

            df.insert(0, index_column, self.data[index_column])
            df_indexed = df.set_index(index_column)
            #print(df[self.output_cols])
            
            print("--------D", df_indexed, df)
            #모델적용 데이터셋 생성
            #if self.is_indpds:
                #독립변수 데이터 생성
            #    test_dt = self.windowed_dataset2((df[self.feature_cols], df[self.output_cols]), self.window_size, self.batch_size, False)
            #else:
                #종속변수 데이터 생성
            #    test_dt = self.windowed_dataset(df[self.output_cols], self.window_size, self.batch_size, False)
            
            process_col = [index_column] + self.output_cols


            test_dt = df_indexed

            #print(test_dt)
            test_dt.index = pd.date_range(start=test_dt.index[0], periods=len(test_dt), freq='H')
            test_dt.index.name = index_column
            print("--------E", test_dt)
            
            #예측 데이터 추출


            update_model = model.append(test_dt, refit=refit)
            pred = update_model.forecast(self.window_size*loopCount)
            #print(pred)
            #print(pred[:,0].reshape(-1,1))
            
            #예측값 월래 값 변환 (테스트 필요)
            #y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
            
            utils = Utils()
            pred_df = pd.DataFrame(pred.values, columns=self.output_cols) #pred가 pandas.core.series.Series 형태
            new_index = range(len(pred_df))
            pred_df.index = new_index
            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)

            '''
            output_df = pd.DataFrame(columns=self.output_cols)   
            for i in range(len(self.output_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[self.output_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))
            '''
            output_df = unscaled_pred_df
            #결과값 갯수만큼 마지막 날짜 이후 데이터 생성
            print("--------F")
            if self.use_model_yn == 'Y':
                if self.real_time_yn == 'N':
                    if auto_save_file == True:
                        output_df = self.useModelTimeSeries(self.data, output_df, self.output_cols, self.window_size, self.resmpl_intvl_tp, self.resmpl_intvl_value, self.target_start_date, self.target_last_date, self.index_column)
                    else:
                        output_df = self.useModelTimeSeries_dataframe(self.data, output_df, self.output_cols, self.window_size, self.resmpl_intvl_tp, self.resmpl_intvl_value, self.target_start_date, self.target_last_date, self.index_column)
                else:
                    output_df = self.addTimeSeries(self.data, output_df, self.output_cols)
            else:
                output_df = self.addTimeSeries(self.data, output_df, self.output_cols)


            result = output_df            

        except Exception as e:
            raise e            
        return result

    #인덱스를 날짜로 사용하는 방식
    def modelTrainning(self, p, d, q, index_column=''):
        '''
        데이터 학습 및 모델 생성
        Returns: 학습결과 데이터
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
        '''
        
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
        """
        try:
            gpus = tf.config.list_physical_devices('gpu')
            for i in range(len(gpus)):
                tf.config.experimental.set_memory_growth(gpus[i], True)
        except Exception as e :
            raise e

        """

        # gpu 이름
        gpus = tf.config.experimental.list_logical_devices('GPU')

        # gpu가 2개 이상이면, MirroredStrategy 인스턴스 생성
        if len(gpus) > 1: 
            strategy = tf.distribute.MirroredStrategy([gpu.name for gpu in gpus])

        # gpu가 1개 이하면, 디폴트 전략 설정
        else:
            strategy = tf.distribute.get_strategy() # default strategy that works on CPU and single GPU

        #폴더확인        
        temp = os.path.join(self.filepath, 'temp')
        history = os.path.join(self.filepath, 'history')
        if not os.path.exists(temp):
            os.makedirs(temp)
        if not os.path.exists(history):
            os.makedirs(history)

        #생성파일 목록
        modelCKFile = os.path.join(temp, self.filename + '_ckeckpointer.ckpt.weights.h5')
        fitHistoryFile = os.path.join(self.filepath, self.filename + '_fit_history.png')
        fidHistoryFile = os.path.join(self.filepath, self.filename + '_fid_history.png')
        fidHistoryPath = history

        modelFile = os.path.join(self.filepath, self.filename)

        try:
            print('------------------A')

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
                output_cols = [index_column] + self.output_cols
                feature_cols = [index_column] + self.feature_cols
            else:
                apply_colums = self.output_cols + self.feature_cols
                output_cols = self.output_cols
                feature_cols = [index_column] + self.feature_cols

            #컬럼생성
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
            
            print('------------------B', self.data)
            #정규화(0~1변환)
            
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            df.insert(0, index_column, self.data[index_column])
            #df = pd.concat([self.data[index_column], df], axis=0)

            print('------------------C', df)

            utils = Utils()

            df = utils.add_columns_BtoA(df, self.data)

            outputs_df = df[output_cols]
            features_df = df[feature_cols]

            '''
            scaler_x = MinMaxScaler()
            scaled_x = scaler_x.fit_transform(self.data[scale_x_cols])
            df_x = pd.DataFrame(scaled_x, columns=scale_x_cols)

            scaler_y = MinMaxScaler()
            scaled_y = scaler_y.fit_transform(self.data[scale_y_cols])
            df_y = pd.DataFrame(scaled_y, columns=scale_y_cols)
            
            #df = self.data[scale_cols]
            print(df_x[:20], df_y[:20])

            print('------------------C')
            #종속/독립변수 지정
            features_df = df_x[self.feature_cols]
            outputs_df = df_y[self.output_cols]
            '''
            for col in output_cols:
                outputs_df.drop(col, 1)
            print('outputs_df', outputs_df)
            print('features_df', features_df)



            print('------------------D')
            #학습/검증 데이터 추출
            x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(y_train)
            print(y_test)

            with strategy.scope():
                print('------------------E')
                #모델적용 데이터셋 생성
                if self.is_indpds:
                    x_train_indexed = x_train.set_index(index_column)
                    y_train_indexed = y_train.set_index(index_column)
                    x_test_indexed = x_test.set_index(index_column)
                    y_test_indexed = y_test.set_index(index_column)
                    #독립변수 데이터 생성
                    #train_data = self.windowed_dataset2((x_train, y_train), self.window_size, self.batch_size, True)
                    #test_data = self.windowed_dataset2((x_test, y_test), self.window_size, self.batch_size, False)

                    #독립변수가 있을땐 ARIMAX 모델
                    model = VARMAX(y_train_indexed, order=(0, 1), exog=x_train_indexed, trends='ct')
                    fit_model = model.fit()

                    fit_model.forecast(steps=self.window_size)

                else:
                    y_train_indexed = y_train.set_index(index_column)
                    y_test_indexed = y_test.set_index(index_column)
                    #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
                    #train_data = self.windowed_dataset(y_train, self.window_size, self.batch_size, True)
                    #test_data = self.windowed_dataset(y_test, self.window_size, self.batch_size, False)

                    print('훈련 입력', y_train_indexed)

                    y_train_indexed.index = pd.date_range(start=y_train_indexed.index[0], periods=len(y_train_indexed), freq='H')
                    y_train_indexed.index.name = index_column

                    model = SARIMAX(y_train_indexed, order=(p, d, q))
                    fit_model = model.fit()
                    #fit_model.forecase(steps=self.window_size)

            print('------------------H')  
            #모델검증
            #mse = model.evaluate(test_data)
            #print("mse : ", mse)
            #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))

            #학습 히스토리
            #print('fit : ', hist)
            #self.fitHistory(hist, fitHistoryFile)

            #FID 히스토리
            #print('fid : ', cb_fid.fid_scores)
            #pd_fid = pd.DataFrame(cb_fid.fid_scores)
            #self.fidHistory(pd_fid[1], fidHistoryFile)

            print('------------------I')
            #모델저장
            # 모델 저장
            with open(modelFile, 'wb') as pkl_file:
                pickle.dump(fit_model, pkl_file)

            # 스케일러를 로컬에 임시 저장

            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            with open(scalerFile, 'wb') as f:
                pickle.dump(scaler, f)      
            '''
            scalerFile_x = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_x.pkl')
            scalerFile_y = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_y.pkl')
            with open(scalerFile_x, 'wb') as f:
                pickle.dump(scaler_x, f)      
            with open(scalerFile_y, 'wb') as f:
                pickle.dump(scaler_y, f)
            '''

            #update_model = fit_model.append(y_test, refit=False)

            y_test_indexed.index = pd.date_range(start=y_test_indexed.index[0], periods=len(y_test_indexed), freq='H')
            y_test_indexed.index.name = index_column

            print('테스트 입력', y_test_indexed)
            #csvFile = os.path.join(self.filepath, self.filename + '.csv')
            #y_test_indexed.to_csv(csvFile)

            update_model = fit_model.append(y_test_indexed, refit=False)
            y_pred = update_model.forecast(steps=len(y_test_indexed))
            #red = model.predict(test_data)
            #print(test_data)


            # 테스트 데이터 복원
            new_index = range(len(x_test))
            x_test.index = new_index
            extend_x_df = utils.add_dataframe_columns(x_test, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)

            unscaled_x_df.insert(0, index_column, x_test[index_column])
            print('unscaled_x_df', unscaled_x_df, x_test)   

            unscaled_x_df[index_column] = x_test[index_column]
            unscaled_x_df = unscaled_x_df.set_index(index_column)
            
      
            new_index = range(len(y_test))
            y_test.index = new_index
            extend_y_df = utils.add_dataframe_columns(y_test, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)

            unscaled_y_df.insert(0, index_column, y_test[index_column])
            unscaled_y_df[index_column] = y_test[index_column]
            unscaled_y_df = unscaled_y_df.set_index(index_column)
            print('unscaled_y_df', unscaled_y_df, y_test)



            #예측 데이터 복원
            print('pred : ', output_cols, type(y_pred), y_pred)
            pred_df = y_pred.to_frame().rename_axis(index_column)
            #pred_df = pd.DataFrame(y_pred.values, columns=output_cols) #pred가 pandas.core.series.Series 형태
            #new_index = range(len(pred_df))
            #pred_df.index = new_index
            pred_df = pred_df.reset_index().reset_index(drop=True)
            pred_df.rename(columns={'predicted_mean':self.output_cols[0]}, inplace=True)
            #print(y_test_indexed.columns, y_test.columns)
            #pred_df.columns = y_test_indexed.columns 

            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            print('예측 결과 언스케일링', pred_unscaled)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)

            print('예측 결과 복원', unscaled_pred_df)

            unscaled_pred_df.insert(0, index_column, pred_df[index_column])
            unscaled_pred_df[index_column] = pred_df[index_column]
            unscaled_pred_df = unscaled_pred_df.set_index(index_column)

     
            '''
            y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            '''
            mse = mean_squared_error(y_test[self.output_cols], pred_df[self.output_cols])
            mae = mean_absolute_error(y_test[self.output_cols], pred_df[self.output_cols])
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test[self.output_cols], pred_df[self.output_cols])
            mape = self.mean_absolute_percentage_error(y_test[self.output_cols], pred_df[self.output_cols])

            result = {'fid': None, 'fit':None}            
            result['x_test'] = x_test
            result['y_test'] = y_test
            result['y_pred'] = y_pred
            result['x_test_unscaled'] = unscaled_x_df[self.feature_cols]
            result['y_test_unscaled'] = unscaled_y_df[self.output_cols]
            result['y_pred_unscaled'] = unscaled_pred_df[self.output_cols]
            result['mse'] = mse
            result['mae'] = mae
            result['rmse'] = rmse
            result['r2'] = r2
            result['mape'] = mape            
            #result['fid'] = cb_fid.fid_scores
            #result['fit'] = hist.history
            #result['evaluate_loss'] = mse[0]
            #result['evaluate_acc'] = mse[1]
        except Exception as e:
            raise e
        
        return result
    

    def dataGenerater(self, refit=False, loopCount=1, auto_save_file = True, index_column=''):
        '''
        예측 데이터 추출
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        try:
            print("--------A")
            #모델로드
            #model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(self.filename)

            # 모델 로드
            with open(self.filename, 'rb') as pkl_file:
                model = pickle.load(pkl_file)
            
            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                data_cols = self.output_cols + list(set(self.feature_cols) - set(self.output_cols))
                apply_colums = data_cols #self.output_cols + self.feature_cols

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

            print("--------C", self.data)
            #정규화(0~1변환)
            '''
            scalerFile_x = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_x.pkl')
            if os.path.exists(scalerFile_x):
                with open(scalerFile_x, 'rb') as f:
                    scaler_x: MinMaxScaler = pickle.load(f)            
                scaled_x = scaler_x.transform(self.data[scale_x_cols])
            else:
                scaler_x = MinMaxScaler()
                scaled_x = scaler_x.fit_transform(self.data[scale_x_cols])

            scalerFile_y = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler_y.pkl')
            if os.path.exists(scalerFile_x):
                with open(scalerFile_y, 'rb') as f:
                    scaler_y: MinMaxScaler = pickle.load(f)
                    scaled_y = scaler_y.transform(self.data[scale_y_cols])
            else:
                scaler_y = MinMaxScaler()
                scaled_y = scaler_y.fit_transform(self.data[scale_y_cols])

            df_x = pd.DataFrame(scaled_x, columns=scale_x_cols)
            df_y = pd.DataFrame(scaled_y, columns=scale_y_cols)        
            '''
            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            if os.path.exists(scalerFile):
                with open(scalerFile, 'rb') as f:
                    scaler: MinMaxScaler = pickle.load(f)            
                scaled = scaler.transform(self.data[scale_cols])
            else:
                scaler = MinMaxScaler()
                scaled = scaler.fit_transform(self.data[scale_cols])            
            #scaler = MinMaxScaler()
            #scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)

            df.insert(0, index_column, self.data[index_column])
            df_indexed = df.set_index(index_column)
            #print(df[self.output_cols])
            
            print("--------D", df_indexed, df)
            #모델적용 데이터셋 생성
            #if self.is_indpds:
                #독립변수 데이터 생성
            #    test_dt = self.windowed_dataset2((df[self.feature_cols], df[self.output_cols]), self.window_size, self.batch_size, False)
            #else:
                #종속변수 데이터 생성
            #    test_dt = self.windowed_dataset(df[self.output_cols], self.window_size, self.batch_size, False)
            
            process_col = [index_column] + self.output_cols


            test_dt = df_indexed

            #print(test_dt)
            test_dt.index = pd.date_range(start=test_dt.index[0], periods=len(test_dt), freq='H')
            test_dt.index.name = index_column
            print("--------E", test_dt)
            
            #예측 데이터 추출


            update_model = model.append(test_dt, refit=refit)
            pred = update_model.forecast(self.window_size*loopCount)
            #print(pred)
            #print(pred[:,0].reshape(-1,1))
            
            #예측값 월래 값 변환 (테스트 필요)
            #y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
            
            utils = Utils()
            pred_df = pd.DataFrame(pred.values, columns=self.output_cols) #pred가 pandas.core.series.Series 형태
            new_index = range(len(pred_df))
            pred_df.index = new_index
            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)

            '''
            output_df = pd.DataFrame(columns=self.output_cols)   
            for i in range(len(self.output_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[self.output_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))
            '''
            output_df = unscaled_pred_df
            #결과값 갯수만큼 마지막 날짜 이후 데이터 생성
            print("--------F")
            if self.use_model_yn == 'Y':
                if self.real_time_yn == 'N':
                    if auto_save_file == True:
                        output_df = self.useModelTimeSeries(self.data, output_df, self.output_cols, self.window_size, self.resmpl_intvl_tp, self.resmpl_intvl_value, self.target_start_date, self.target_last_date, self.index_column)
                    else:
                        output_df = self.useModelTimeSeries_dataframe(self.data, output_df, self.output_cols, self.window_size, self.resmpl_intvl_tp, self.resmpl_intvl_value, self.target_start_date, self.target_last_date, self.index_column)
                else:
                    output_df = self.addTimeSeries(self.data, output_df, self.output_cols)
            else:
                output_df = self.addTimeSeries(self.data, output_df, self.output_cols)


            result = output_df            

        except Exception as e:
            raise e            
        return result
