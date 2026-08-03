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
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout, Flatten, Reshape, BatchNormalization, RepeatVector
from tensorflow.keras.losses import Huber, MeanSquaredError, MeanAbsoluteError, MeanAbsolutePercentageError
from tensorflow.keras.optimizers import Adam, SGD, Adagrad, RMSprop
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.sequence import TimeseriesGenerator

from dt_data_api.model import fidMeta
from dt_data_api.common.settings_meta import MODEL_PATH_META
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS
from dt_data_api.util.utils import Utils

from dt_data_api.model.nbeatskeras.model import NBeatsNet as NBeatsKeras

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
       
    

    # 함수: 데이터프레임을 x, y 형태로 변환
    def create_sequences(self, df, time_steps, input_columns, target_column):
        num_samples = df.shape[0] - time_steps + 1  # 전체 샘플 수 계산
        
        x = []
        y = []
        print(input_columns, target_column)
        # 입력 컬럼과 타겟 컬럼에서 데이터 추출
        input_data = df[input_columns].values  # 선택된 입력 컬럼 데이터
        target_data = df[target_column].values  # 타겟 컬럼 데이터
        
        for i in range(num_samples):
            # x는 time_steps 길이의 데이터 구간을 사용한 입력값
            x_sequence = input_data[i:i + time_steps]
            x.append(x_sequence)
            
            # y는 해당 time_steps 이후 타겟 컬럼의 값
            y_value = target_data[i + time_steps - 1]  # y는 마지막 시점의 타겟 값으로 설정
            y.append(y_value)
        
        # numpy 배열로 변환
        x = np.array(x)  # (num_samples, time_steps, num_features)
        y = np.array(y).reshape(-1, 1)  # (num_samples, 1)
        
        return x, y

    def create_sequences_ex(self, df, time_steps, input_columns, target_column=None):
        num_samples = df.shape[0] - time_steps  # 전체 샘플 수 계산
        
        x = []
        y = []
        print(input_columns, target_column)
        
        # 입력 컬럼 데이터
        input_data = df[input_columns].values  # 선택된 입력 컬럼 데이터
        
        # target_column이 None인 경우에는 종속변수를 생성
        if target_column is None:
            target_data = input_data  # 타겟을 입력 데이터와 동일하게 설정
        else:
            target_data = df[target_column].values  # 타겟 컬럼 데이터
        
        for i in range(num_samples):
            # x는 time_steps 길이의 데이터 구간을 사용한 입력값
            x_sequence = input_data[i:i + time_steps]
            x.append(x_sequence)
            
            if target_column is None:
                # y는 해당 시퀀스의 다음 시점 값 (입력의 바로 다음 값)
                y_value = input_data[i + time_steps]  # y는 다음 시점의 입력 값
            else:
                # y는 타겟 컬럼의 해당 시퀀스 이후 값
                y_value = target_data[i + time_steps]
            
            y.append(y_value)
        
        # numpy 배열로 변환
        x = np.array(x)  # (num_samples, time_steps, num_features)
        if target_column is None:
            y = np.array(y).reshape(-1, len(input_columns))  # (num_samples, num_features) - target_column이 없을 때는 입력 컬럼에 맞춰 조정
        else:
            y = np.array(y).reshape(-1, len(target_column))  # (num_samples, 1)
        return x, y


    def modelTrainning(self):
        '''
        데이터 학습 및 모델 생성
        Returns: 학습결과 데이터
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
        '''
        
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
        try:
            gpus = tf.config.list_physical_devices('gpu')
            for i in range(len(gpus)):
                tf.config.experimental.set_memory_growth(gpus[i], True)
        except Exception as e :
            raise e

        """



        #physical_devices = tf.config.list_physical_devices('GPU')
        #if physical_devices:
        #    try:
        #        tf.config.experimental.set_visible_devices(physical_devices[0], 'GPU')
        #        tf.config.experimental.set_memory_growth(physical_devices[0], True)
        #    except Exception as e:
        #        raise e
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
            else:
                apply_colums = self.output_cols + self.feature_cols

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
            
            print('------------------B')
            #정규화(0~1변환)
            
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            utils = Utils()

            df = utils.add_columns_BtoA(df, self.data)

            outputs_df = df[self.output_cols]
            features_df = df[self.feature_cols]
            
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
            for col in self.output_cols:
                outputs_df.drop(col, 1)
            print('outputs_df', outputs_df)
            print('features_df', features_df)

            print('------------------D')
            #학습/검증 데이터 추출

            #np_feature = np.array(features_df)
            #np_output = np.array(outputs_df)

            x, y = self.create_sequences_ex(df, self.window_size, input_columns=self.feature_cols, target_column=self.output_cols)

            #num_samples, time_steps, input_dim, output_steps = 50_000, 10, 1, 1

            #x = np.random.uniform(size=(num_samples, time_steps, input_dim))
            #y = np.mean(x, axis=1, keepdims=True)


            #y = np.mean(x, axis=1, keepdims=True)
            print('X', x)
            print('Y', y)

            x_train, x_test, y_train, y_test, x_train_df, x_test_df, y_train_df, y_test_df = train_test_split(x, y, features_df[self.window_size:], outputs_df[self.window_size:], test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            print('x_train', x_train)
            print('y_train', y_train)
            print('x_test', x_test)
            print('y_test', y_test)
            

            

            with strategy.scope():
                print('------------------E')
                #모델적용 데이터셋 생성
                '''
                if self.is_indpds:
                    #독립변수 데이터 생성
                    train_data = self.windowed_dataset2((x_train, y_train), self.window_size, self.batch_size, True)
                    test_data = self.windowed_dataset2((x_test, y_test), self.window_size, self.batch_size, False)
                else:
                    #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
                    train_data = self.windowed_dataset(y_train, self.window_size, self.batch_size, True)
                    test_data = self.windowed_dataset(y_test, self.window_size, self.batch_size, False)
                '''

                '''
                for x, y in train_data.take(1):
                    print("Features (x):", x.numpy())  # Features (입력 데이터)
                    print("Labels (y):", y.numpy())    # Labels (예측 대상)                    
                '''
                

                print('------------------F')            



                #c = num_samples // 10
                #x_train, y_train, x_test, y_test = x[c:], y[c:], x[:c], y[:c]
                #test_size = len(x_test)

                model = NBeatsKeras(backcast_length=self.window_size, forecast_length=len(self.output_cols),
                                    stack_types=(NBeatsKeras.GENERIC_BLOCK, NBeatsKeras.GENERIC_BLOCK),
                                    nb_blocks_per_stack=2, thetas_dim=(4, 4), share_weights_in_stack=False,
                                    hidden_layer_units=self.units)

                print(len(self.feature_cols), len(self.output_cols))
                


                #성능옵션
                if self.optimizer == MD_OTMZ.ADAM:
                    optimizer = Adam(self.optimizer_lr)
                elif self.optimizer == MD_OTMZ.SGD:
                    optimizer = SGD(self.optimizer_lr)
                elif self.optimizer == MD_OTMZ.AGD:
                    optimizer = Adagrad(self.optimizer_lr)
                elif self.optimizer == MD_OTMZ.RMS:
                    optimizer = RMSprop(self.optimizer_lr)
                else:
                    optimizer = Adam(self.optimizer_lr)
                
                #손실옵션            
                if self.loss == MD_LOSS.HUB:
                    loss = Huber()
                elif self.loss == MD_LOSS.MSE:
                    loss = MeanSquaredError()
                elif self.loss == MD_LOSS.MAE:
                    loss = MeanAbsoluteError()
                elif self.loss == MD_LOSS.MAPE:
                    loss = MeanAbsolutePercentageError()
                else:
                    loss = Huber()
                
                #결과표시
                metrics = self.meterics

                #옵션설정
                model.compile(optimizer=optimizer, loss=loss, metrics=[metrics])


                #model.compile(loss='mae', optimizer='adam', metrics=['mse'])

                # print('------------------G')
                # #성능옵션
                # model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
                # #model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['accuracy'])
                # print(model.summary())

                print('------------------G')
                #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
                cb_earlystopping = EarlyStopping(monitor='val_loss', patience=self.patience)
                #val_loss 기준 bast 체크포인터 생성
                #cp_filename = os.path.join(self.filepath, 'tmp', self.filename + '_ckeckpointer.ckpt.weights.h5')
                cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
                #checkpoint_model = ModelCheckpoint(filepath=self.MODEL_FILE_PATH + 'tmp\\model\\' + 'model_{epoch:02d}.h5')
                #중간값 추론
                cb_fid = fidMeta.NBeatsFIDCallback(generator=model, epochs_to_fid=1, window_size=self.window_size, real_data=y_test_df, test_data=x_test, output_cols=self.output_cols, filepath=fidHistoryPath, data_size=self.data_size)
                #rlr = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=self.patience, verbose=1)
                
                #모델학습
                #hist = model.fit(train_data, validation_data=(test_data), epochs=self.epochs, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
                hist = model.fit(x_train, y_train, validation_data=(x_test, y_test), epochs=self.epochs, batch_size=self.batch_size, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
            print('------------------H')  
            #모델검증
            mse = model.evaluate(x_test, y_test)
            print("mse : ", mse)
            #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))

            #학습 히스토리
            print('fit : ', hist)
            #self.fitHistory(hist, fitHistoryFile)

            #FID 히스토리
            #print('fid : ', cb_fid.fid_scores)
            #pd_fid = pd.DataFrame(cb_fid.fid_scores)
            #self.fidHistory(pd_fid[1], fidHistoryFile)

            print('------------------I')
            #모델저장
            model.save(modelFile)
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

            pred = model.predict(x_test)
            #print(test_data)
            print('pred : ', pred)

            '''
            matplotlib.use('TkAgg')
            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(y_test[:,index], label='actual_' + str(index))
                plt.plot(pred[:,index], label='predict_' + str(index))
                #plt.plot(x_train[:,0], label=f'x_train')
                #plt.plot(y_train[:,0], label=f'y_train')
                #plt.plot(pred_back[:,0], label=f'predict_back')
                #plt.plot(np_scaled_nan[:,index], label=f'actual')
                #plt.plot(X_new[:,index], label=f'original')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + 'NBeats_real_fake_' + str(index) + '.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()
            '''

            # 테스트 데이터 복원
   
            new_index = range(len(x_test_df))
            x_test_df.index = new_index
            extend_x_df = utils.add_dataframe_columns(x_test_df, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)
            if len(self.feature_cols) > len(scale_cols) - len(self.output_cols):
                unscaled_x_df = utils.add_columns_BtoA(unscaled_x_df, x_test_df)


            new_index = range(len(y_test_df))
            y_test_df.index = new_index
            extend_y_df = utils.add_dataframe_columns(y_test_df, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)
            if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
                unscaled_y_df = utils.add_columns_BtoA(unscaled_y_df, y_test_df)

            #예측 데이터 복원
            squeezed_data = np.squeeze(pred, axis=-1) # 맨뒤에 한차원 삭제
            pred_df = pd.DataFrame(squeezed_data, columns=self.output_cols)
            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)
            if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
                unscaled_pred_df = utils.add_columns_BtoA(unscaled_pred_df, pred_df)
            print('예측 결과 복원', unscaled_pred_df, y_test, pred)
            '''
            y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            '''
            result = {'fid': None, 'fit':None}            
            result['x_test'] = x_test_df
            result['y_test'] = y_test_df
            result['y_pred'] = pred_df
            result['x_test_unscaled'] = unscaled_x_df[self.feature_cols]
            result['y_test_unscaled'] = unscaled_y_df[self.output_cols]
            result['y_pred_unscaled'] = unscaled_pred_df[self.output_cols]
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
            result['evaluate_loss'] = mse[0]
            result['evaluate_acc'] = mse[1]
        except Exception as e:
            raise e
        
        return result
    
    def dataGenerater(self):
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
            #model = keras.models.load_model(self.filename, compile=False)
            model = NBeatsKeras.load(self.filename)
            
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

            print("--------C")
            #정규화(0~1변환)
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

            outputs_df = df[self.output_cols]
            features_df = df[self.feature_cols]
            #print(df[self.output_cols])
            
            print("--------D")
            #모델적용 데이터셋 생성
           
            x, y = self.create_sequences_ex(df, self.window_size, input_columns=self.feature_cols)#, target_column=self.output_cols)

            #num_samples, time_steps, input_dim, output_steps = 50_000, 10, 1, 1

            #x = np.random.uniform(size=(num_samples, time_steps, input_dim))
            #y = np.mean(x, axis=1, keepdims=True)


            #y = np.mean(x, axis=1, keepdims=True)
            print('X', x)
            print('Y', y)

            #x_train, x_test, y_train, y_test, x_train_df, x_test_df, y_train_df, y_test_df = train_test_split(x, y, features_df[10:], outputs_df[10:], test_size=self.test_size, random_state=0, shuffle=False)

            #print(test_dt)

            print("--------E")
            
            #예측 데이터 추출
            pred = model.predict(x)
            #print(pred)
            #print(pred[:,0].reshape(-1,1))
            
            #예측값 월래 값 변환 (테스트 필요)
            #y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
            utils = Utils()
            squeezed_data = np.squeeze(pred, axis=-1) # 맨뒤에 한차원 삭제
            pred_df = pd.DataFrame(squeezed_data, columns=self.output_cols)
            extend_df = utils.add_dataframe_columns(pred_df, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_df)
            unscaled_df = pd.DataFrame(y_unscaled, columns=scale_cols)

            output_df = unscaled_df[self.output_cols]  
            '''
            output_df = pd.DataFrame(columns=self.output_cols)            
            for i in range(len(self.output_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[self.output_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))
            '''
            #결과값 갯수만큼 마지막 날짜 이후 데이터 생성
            print("--------F")
            if self.use_model_yn == 'Y':
                if self.real_time_yn == 'N':
                    output_df = self.useModelTimeSeries(self.data, output_df, self.output_cols, self.window_size, self.resmpl_intvl_tp, self.resmpl_intvl_value, self.target_start_date, self.target_last_date, self.index_column)
                else:
                    output_df = self.addTimeSeries(self.data, output_df, self.output_cols)
            else:
                output_df = self.addTimeSeries(self.data, output_df, self.output_cols)


            result = output_df            

        except Exception as e:
            raise e            
        return result



    '''
    @ auto_save_file = True(기본값)
      self.use_model_yn == 'Y', self.real_time_yn == 'N' 와 같은 상태일때 useModelTimeSeries메소드에서 파일을 저장 할지 말지 유무(기존 루틴을 유지하려고 만듬)
      False일 경우는 파일을 저장하지 않고 DataFrame으로 리턴 받음
    '''                
    def dataGenerater_repeat(self, loop_count, auto_save_file = True):
        '''
        예측 데이터 추출
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        try:
            print("--------A")
            #모델로드
            #model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(self.filename, self.data)
            #model = keras.models.load_model(self.filename, compile=False)
            model = NBeatsKeras.load(self.filename)

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                data_cols = self.output_cols + list(set(self.feature_cols) - set(self.output_cols))
                apply_colums = data_cols #self.output_cols + self.feature_cols

            #print(self.data)
            print(self.trgt_col_list)
            print("--------B", self.feature_cols, self.output_cols, apply_colums)
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
                scaled = scaler.transform(self.data[scale_cols])
            else:
                scaler = MinMaxScaler()
                scaled = scaler.fit_transform(self.data[scale_cols])            
            #scaler = MinMaxScaler()
            #scaled = scaler.fit_transform(self.data[scale_cols])

            df = pd.DataFrame(scaled, columns=scale_cols)

            print("--------D")
            print('self.window_size', self.window_size)
            print('self.batch_size', self.batch_size)

            #========================================================================================================================================================
            # 2024.08.20 predict 결과를 다시 predict 하도록(반복) 수정 시작

            # 여기서 데이터셋을 만들지 않고 아래쪽 for문 내에서 반복하면서 만듬
            # 대신 여기서는 데이터셋으로 쓸 데이터만 data 변수로 추려냄


            if self.is_indpds:
                #독립변수 데이터 생성
                data_feature = df[self.feature_cols] # 재사용하게 될 독립변수 전체
                data_x = data_feature.iloc[-(self.window_size+1):] # 한번 입력에 사용될 독립변수
                data = df[self.output_cols]
            else:
                #종속변수 데이터 생성
                data = df[self.output_cols]
                
            #print(test_dt)

            print("--------E", data)
            # 예측을 반복할 횟수
            n_future_predictions = loop_count#self.window_size
            #n_future_predictions = 100
            predict_array = []  # 매 반복마다 추론 결과를 저장할 리스트
            data = data.iloc[-(self.window_size+1):] # 데이터를 가장 마지막 데이터에서 window_size만큼만 가지도록 추림.(한개의 데이터셋 윈도우만 만들정도로)
            #새로 추린 데이터에 인덱스를 순차로 다시 적용
            new_index = range(len(data))
            data.index = new_index
            #print('데이터', data)

            for _ in range(n_future_predictions):
                if self.is_indpds:
                    #독립변수 데이터 생성
                    #test_dt = self.windowed_dataset2((data_x, data), self.window_size, self.batch_size, False)

                    test_x, test_y = self.create_sequences_ex(data_x, self.window_size, input_columns=self.feature_cols)#, target_column=self.output_cols)
                    print('입력', test_x)
                    next_prediction = model.predict(test_x)
                    #print('추론', next_prediction)
                    predict_array.append(next_prediction[0])
    
                    data.loc[len(data)] = list(next_prediction[0]) # 

                    data = data.iloc[1:] # 맨 앞쪽 데이터 제거
                    #인덱스 재정렬
                    new_index = range(len(data))
                    data.index = new_index

                    # 다음 예측값으로 입력할 독립변수가 없으므로 독립변수를 재사용 하는 처리는 진행
                    # 첫번째 데이터를 마지막으로 이동
                    first_row = data_feature.iloc[0]
                    remaining_df = data_feature.iloc[1:]
                    data_feature = remaining_df.append(first_row, ignore_index=True)
                    new_index = range(len(data_feature))
                    data_feature.index = new_index
                    #맨 위 데이터가 맨 아래로 갔으므로 뒤에서 부터 window_size만큼 다음 입력 독립변수로 추림
                    data_x = data_feature.iloc[-(self.window_size+1):] 
                    #print(data_feature)

                else:
                    #종속변수 데이터 생성
                    #test_dt = self.windowed_dataset(data, self.window_size, self.batch_size, False)
                    print('원본', data)
                    test_x, test_y = self.create_sequences_ex(data, self.window_size, input_columns=self.feature_cols)#, target_column=self.output_cols)
                    print('입력', test_x, type(test_x), test_x.dtype)
                    
                    next_prediction = model.predict(test_x)
                    next_prediction = np.squeeze(next_prediction, axis=-1) # 맨뒤에 한차원 삭제
                    print('추론', next_prediction)
                    predict_array.append(next_prediction[0])
    
                    data.loc[len(data)] = list(next_prediction[0]) # 

                    data = data.iloc[1:] # 맨 앞쪽 데이터 제거
                    #인덱스 재정렬
                    new_index = range(len(data))
                    data.index = new_index
                    #print(data)
   
            # predict_array는 그냥 리스트 이므로 predict의 결과와 같은 형태가 되도록 numpy 형태로 변경
            print('predict_array', predict_array)
            pred = np.array(predict_array)
            #print('***', pred)
            # 2024.08.20 predict 결과를 다시 predict 하도록(반복) 수정 끝
            #========================================================================================================================================================


            #예측 데이터 추출
            #pred = model.predict(test_dt)
            print('예측', pred)
            #print(pred[:,1].reshape(-1,1))
            
            #예측값 월래 값 변환. 스케일링 할때의 컬럼 구조와 똑같이 만들어서 복구

            utils = Utils()
            squeezed_data = np.squeeze(pred, axis=-1) # 맨뒤에 한차원 삭제
            print('예측차원축소', squeezed_data)

            pred_df = pd.DataFrame(squeezed_data, columns=self.output_cols)
            extend_df = utils.add_dataframe_columns(pred_df, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_df)
            unscaled_df = pd.DataFrame(y_unscaled, columns=scale_cols)

            output_df = unscaled_df[self.output_cols]  

            '''
            #예측값 월래 값 변환 (테스트 필요)
            output_df = pd.DataFrame(columns=self.output_cols)            
            for i in range(len(self.output_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[self.output_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))
            '''
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


