import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib
import matplotlib.pyplot as plt
import os
import copy
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

from dt_data_api.model import fid
from dt_data_api.common.settings import MODEL_PATH
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS
from .utils import ModelParameters, InputParameters

class Manager:
    '''
    RNN 모델학습
    ---
    학습모델 생성
    '''    
    #모델 기본 저장 경로
    MODEL_FILE_PATH = MODEL_PATH
    
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
    
    def windowed_dataset(self, series, window_size, batch_size, shuffle):
        '''
        학습데이터 분할 설정 (종속변수)
        Args:
            series(any): 학습/검증 데이터 (y데이터)
            window_size(int): 데이터 분할 수
            batch_size(int): 배치수
            shuffle(bool): 무작위 섞기 여부
        Returns: 분할하여 배치한 데이터
            ds.batch(batch_size).prefetch(1)
        '''
        try:
            series = tf.expand_dims(series, axis=-1)
            ds = tf.data.Dataset.from_tensor_slices(series)
            ds = ds.window(window_size + 1, shift=1, drop_remainder=True)
            ds = ds.flat_map(lambda w: w.batch(window_size + 1))
            if shuffle:
                ds = ds.shuffle(1000)
            ds = ds.map(lambda w: (w[:-1], w[-1]))
        except Exception as e:
            raise e
        return ds.batch(batch_size).prefetch(1)
    
    def windowed_dataset2(self, xy, window_size, batch_size, shuffle):
        '''
        학습데이터 분할 설정 (독립변수변수)
        Args:
            xy(any): 학습/검증 데이터 (x,y데이터)
            window_size(int): 데이터 분할 수
            batch_size(int): 배치수
            shuffle(bool): 무작위 섞기 여부
        Returns: 분할하여 배치한 데이터
            ds.batch(batch_size).prefetch(1)
        '''
        try:
            x = xy[0]
            y = xy[1]
            ds_x = tf.data.Dataset.from_tensor_slices(x)
            ds_x = ds_x.window(window_size, shift=1, drop_remainder=True)
            ds_x = ds_x.flat_map(lambda x: x.batch(window_size))
            ds_x = ds_x.map(lambda x: tf.expand_dims(x, axis=-1)) #독립변수 추가시 shape 구조가 다름서 추가됨 (다대다)

            ds_y = tf.data.Dataset.from_tensor_slices(y[window_size:])
            ds_y = ds_y.map(lambda x: tf.expand_dims(x, axis=-1)) #독립변수 추가시 shape 구조가 다름서 추가됨 (다대다)
            ds = tf.data.Dataset.zip((ds_x, ds_y))
            if shuffle:
                ds = ds.shuffle(1000)            
        except Exception as e:
            raise e
        return ds.batch(batch_size).prefetch(1)           
    
    # def modelTrainning(self):
    #     '''
    #     데이터 학습 및 모델 생성
    #     '''
        
    #     os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    #     try:
    #         print('------------------A')
    #         #컬럼생성
    #         scale_cols = []
    #         for c in self.data.columns:
    #             scale_cols.append(c)
    #         print(scale_cols)

    #         print('------------------B')
    #         #정규화(0~1변환)
    #         scaler = MinMaxScaler()
    #         scaled = scaler.fit_transform(self.data[scale_cols])
    #         df = pd.DataFrame(scaled, columns=scale_cols)
    #         print(df[:20])

    #         print('------------------C')
    #         #종속/독립변수 지정
    #         outputs_df = df[self.output_cols]
    #         features_df = df[self.feature_cols]
    #         for col in self.output_cols:
    #             outputs_df.drop(col, 1)
    #         print(outputs_df)
    #         print(features_df)

    #         print('------------------D')
    #         #학습/검증 데이터 추출
    #         x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
    #         #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
    #         print(x_test)
    #         print(y_test)
            
    #         print('------------------E')
    #         #모델적용 데이터셋 생성
    #         if self.is_indpds:
    #             #독립변수 데이터 생성
    #             train_data = self.windowed_dataset2((x_train, y_train), self.window_size, self.batch_size, True)
    #             test_data = self.windowed_dataset2((x_test, y_test), self.window_size, self.batch_size, False)
    #         else:
    #             #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
    #             train_data = self.windowed_dataset(y_train, self.window_size, self.batch_size, True)
    #             test_data = self.windowed_dataset(y_test, self.window_size, self.batch_size, False)
            
    #         print(train_data)
    #         print(test_data)

    #         print('------------------F')            
    #         #모델설정
    #         if self.is_indpds:
    #             #독립변수 모델생성
    #             model = self.setModel(len(self.feature_cols), len(self.output_cols), self.window_size, self.units)
    #         else:
    #             #종속변수로 모델생성 (입출력값은 동일해야함)
    #             model = self.setModel(len(self.output_cols), len(self.output_cols), self.window_size, self.units)
            
    #         print(len(self.feature_cols), len(self.output_cols))
            
    #         print('------------------G')
    #         #성능옵션
    #         model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
    #         #model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['accuracy'])
    #         print(model.summary())

    #         print('------------------H')
    #         #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
    #         cb_earlystopping = EarlyStopping(monitor='val_loss', patience=self.patience)
    #         #val_loss 기준 bast 체크포인터 생성
    #         cp_filename = os.path.join(self.MODEL_FILE_PATH + 'tmp\\', self.filename + '_ckeckpointer.ckpt')
    #         cb_checkpoint = ModelCheckpoint(cp_filename, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
    #         #checkpoint_model = ModelCheckpoint(filepath=self.MODEL_FILE_PATH + 'tmp\\model\\' + 'model_{epoch:02d}.h5')
    #         #중간값 추론
    #         cb_fid = fid.FIDCallback(generator=model, epochs_to_fid=1, window_size=self.window_size, real_data=y_test, test_data=test_data, output_cols=self.output_cols)
    #         #rlr = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=self.patience, verbose=1)
            
    #         #모델학습
    #         hist = model.fit(train_data, validation_data=(test_data), epochs=self.epochs, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
            
    #         print('------------------I')  
    #         #모델검증
    #         mse = model.evaluate(test_data)
    #         print("mse : ", mse)
    #         #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))

    #         #학습 히스토리
    #         print('fit : ', hist)
    #         self.fitHistory(hist, self.filename)

    #         print('------------------J')
    #         #모델저장
    #         model.save(self.MODEL_FILE_PATH + self.filename)
    #         pred = model.predict(test_data)
    #         #print(test_data)
    #         print('pred : ', pred)

    #         #FID 히스토리
    #         print('fid : ', cb_fid.fid_scores)
    #         self.fidHistory(cb_fid.fid_scores, self.filename)

    #         '''
    #         print('------------------K')
    #         #중간값 추론
    #         for epoch in range(earlystopping.stopped_epoch):
    #             model.load_weights(filepath=self.MODEL_FILE_PATH + 'tmp\\model\\' + f'model_{epoch+1:02d}.h5')
    #             y_pred = model.predict(test_data)
    #             print(f'Epoch {epoch+1} - Predictions: {y_pred}')

    #             #결과데이터 변환
    #             output_df = pd.DataFrame(columns=self.output_cols)            
    #             for i in range(len(self.output_cols)):
    #                 output_df[self.output_cols[i]] = y_pred[:, i]

    #             #FID Score
    #             f = fid.Manager(realData=y_test[self.output_cols], fakeData=output_df[self.output_cols], windowSize=self.window_size)
    #             result = f.createRecurrence(self.output_cols, data_size=100, file_count=epoch)
    #             print(result)                
    #         '''
    #     except Exception as e:
    #         raise e
    
    def modelTrainning(self):
        '''
        데이터 학습 및 모델 생성
        Returns: 학습결과 데이터
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
        '''
        
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
        """
        physical_devices = tf.config.list_physical_devices('GPU')
        if physical_devices:
            try:
                tf.config.experimental.set_visible_devices(physical_devices[0], 'GPU')
                tf.config.experimental.set_memory_growth(physical_devices[0], True)
            except Exception as e:
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
        modelCKFile = os.path.join(temp, self.filename + '_ckeckpointer.ckpt')
        fitHistoryFile = os.path.join(self.filepath, self.filename + '_fit_history.png')
        fidHistoryFile = os.path.join(self.filepath, self.filename + '_fid_history.png')
        fidHistoryPath = history
        modelFile = os.path.join(self.filepath, self.filename)
        
        try:
            print('------------------A')
            #컬럼생성
            scale_cols = []
            
            if self.trgt_col_list == None:
                for c in self.data.columns:
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

            print('------------------C')
            #종속/독립변수 지정
            outputs_df = df[self.output_cols]
            features_df = df[self.feature_cols]
            for col in self.output_cols:
                outputs_df.drop(col, 1)
            print(outputs_df)
            print(features_df)

            print('------------------D')
            #학습/검증 데이터 추출
            x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(x_test)
            print(y_test)
            

            with strategy.scope():
                print('------------------E')
                #모델적용 데이터셋 생성
                if self.is_indpds:
                    #독립변수 데이터 생성
                    train_data = self.windowed_dataset2((x_train, y_train), self.window_size, self.batch_size, True)
                    test_data = self.windowed_dataset2((x_test, y_test), self.window_size, self.batch_size, False)
                else:
                    #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
                    train_data = self.windowed_dataset(y_train, self.window_size, self.batch_size, True)
                    test_data = self.windowed_dataset(y_test, self.window_size, self.batch_size, False)
                
                print(train_data)
                print(test_data)

                print('------------------F')            
                #모델설정
                if self.is_indpds:
                    #독립변수 모델생성
                    model = self.setModel(len(self.feature_cols), len(self.output_cols), self.window_size, self.units)
                    #model = self.setModel2(len(self.feature_cols), len(self.output_cols), self.window_size, self.units, output_size=self.output_size)
                else:
                    #종속변수로 모델생성 (입출력값은 동일해야함)
                    model = self.setModel(len(self.output_cols), len(self.output_cols), self.window_size, self.units)
                    #model = self.setModel2(len(self.output_cols), len(self.output_cols), self.window_size, self.units, output_size=self.output_size)
                
                print(len(self.feature_cols), len(self.output_cols))
                
                # print('------------------G')
                # #성능옵션
                # model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
                # #model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['accuracy'])
                # print(model.summary())

                print('------------------G')
                #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
                cb_earlystopping = EarlyStopping(monitor='val_loss', patience=self.patience)
                #val_loss 기준 bast 체크포인터 생성
                #cp_filename = os.path.join(self.filepath, 'tmp', self.filename + '_ckeckpointer.ckpt')
                cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
                #checkpoint_model = ModelCheckpoint(filepath=self.MODEL_FILE_PATH + 'tmp\\model\\' + 'model_{epoch:02d}.h5')
                #중간값 추론
                cb_fid = fid.FIDCallback(generator=model, epochs_to_fid=1, window_size=self.window_size, real_data=y_test, test_data=test_data, output_cols=self.output_cols, filepath=fidHistoryPath, data_size=self.data_size)
                #rlr = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=self.patience, verbose=1)
                
                #모델학습
                hist = model.fit(train_data, validation_data=(test_data), epochs=self.epochs, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
                
            print('------------------H')  
            #모델검증
            mse = model.evaluate(test_data)
            print("mse : ", mse)
            #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))

            #학습 히스토리
            print('fit : ', hist)
            self.fitHistory(hist, fitHistoryFile)

            #FID 히스토리
            print('fid : ', cb_fid.fid_scores)
            pd_fid = pd.DataFrame(cb_fid.fid_scores)
            self.fidHistory(pd_fid[1], fidHistoryFile)

            print('------------------I')
            #모델저장
            model.save(modelFile)
            pred = model.predict(test_data)
            #print(test_data)
            print('pred : ', pred)

            result = {'fid': None, 'fit':None}            
            result['x_test'] = x_test
            result['y_test'] = y_test
            result['y_pred'] = pred
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
            result['evaluate_loss'] = mse[0]
            result['evaluate_acc'] = mse[1]
            
        except Exception as e:
            raise e
        
        return result


    def setModel(self, features, outputs, window_size, units):
        '''
        모델설정
        Args:
            features(any): 독립변수 수
            outputs(any): 종속변수 수 
            window_size(int): 데이터 분할 수
            units(int): 뉴런 유닛 수
        Returns: Sequential 생성모델
            model
        '''
        try:
            #모델옵션
            if self.model_type == MD_TYPE.LSTM:
                #LSTM
                model = Sequential([
                    # 1차원 feature map 생성
                    Conv1D(filters=32, kernel_size=5, padding="causal", activation="relu", input_shape=[window_size, features]),                    
                    # LSTM
                    LSTM(units, activation='tanh'),
                    #Flatten(),
                    Dense(units, activation="relu"),
                    Dense(outputs)                    
                ])
            elif self.model_type == MD_TYPE.GRU:
                #GRU
                model = Sequential([
                    # 1차원 feature map 생성
                    Conv1D(filters=32, kernel_size=5, padding="causal", activation="relu", input_shape=[window_size, features]),                    
                    #GRU
                    GRU(units, activation='tanh'),
                    #Flatten(),
                    Dense(units, activation="relu"),
                    Dense(outputs)
                ])
            else:
                #LSTM
                model = Sequential([
                    # 1차원 feature map 생성
                    Conv1D(filters=32, kernel_size=5, padding="causal", activation="relu", input_shape=[window_size, features]),                    
                    # LSTM
                    LSTM(units, activation='tanh'),
                    #Flatten(),
                    Dense(units, activation="relu"),
                    Dense(outputs)
                ])
            
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
            
            #성능옵션
            #model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['accuracy'])
            print(model.summary())

        except Exception as e:
            raise e
        return model

    def setModel2(self, features, outputs, window_size, units, output_size):
        '''
        모델설정
        Args:
            features(any): 독립변수 수
            outputs(any): 종속변수 수 
            window_size(int): 데이터 분할 수
            units(int): 뉴런 유닛 수
        Returns: Sequential 생성모델
            model
        '''
        try:
            #모델옵션
            if self.model_type == MD_TYPE.LSTM:
                #LSTM
                model = Sequential([
                    # 1차원 feature map 생성
                    Conv1D(filters=32, kernel_size=5, padding="causal", activation="relu", input_shape=[window_size, features]),                    
                    # LSTM
                    LSTM(units, activation='tanh'),
                    Flatten(),
                    Dense(units, activation="relu"),
                    #Dense(outputs),                
                    
                    #다대다 구성시 수정
                    Dense(outputs*output_size),
                    Reshape((outputs, output_size))
                ])
            elif self.model_type == MD_TYPE.GRU:
                #GRU
                model = Sequential([
                    # 1차원 feature map 생성
                    Conv1D(filters=32, kernel_size=5, padding="causal", activation="relu", input_shape=[window_size, features]),                    
                    #GRU
                    GRU(units, activation='tanh'),
                    Flatten(),
                    Dense(units, activation="relu"),
                    #Dense(outputs),   

                    #다대다 구성시 수정
                    Dense(outputs*output_size),
                    Reshape((outputs, output_size))
                ])
            else:
                #LSTM
                model = Sequential([
                    # 1차원 feature map 생성
                    Conv1D(filters=32, kernel_size=5, padding="causal", activation="relu", input_shape=[window_size, features]),                    
                    # LSTM
                    LSTM(units, activation='tanh'),
                    Flatten(),
                    Dense(units, activation="relu"),
                    #Dense(outputs),          

                    #다대다 구성시 수정
                    Dense(outputs*output_size),
                    Reshape((outputs, output_size))
                ])
            
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
            
            #성능옵션
            #model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['accuracy'])
            print(model.summary())

        except Exception as e:
            raise e
        return model

    def fitHistory(self, hist, fileName):
        '''
        학습모델 결과 검증
        Args:
            hist(any): 학습 히스토리 정보
            fileName(any): 생성모델 히스토리 파일
        '''
        try:
            loss = hist.history['loss']
            val_loss = hist.history['val_loss']
            epochs = range(1, len(loss)+1)
            
            plt.figure(figsize=(6, 3)) 
            plt.plot(epochs, loss, label='Training loss')
            plt.plot(epochs, val_loss, label='Validation loss')
            plt.title('Training and Valdation loss')
            plt.legend()
            #plt.show()  
            plt.savefig(fileName, dpi=300)
        except Exception as e:
            raise e

    def fidHistory(self, hist, fileName):
        '''
        학습모델 FID 결과 
        Args:
            hist(any): FID 스코어 정보
            fileName(any): 생성모델 파일
        '''
        try:
            epochs = range(1, len(hist)+1)
            
            plt.figure(figsize=(6, 3)) 
            plt.plot(epochs, hist, label='secore')
            plt.title('FID Secore')
            plt.legend()
            #plt.show()  
            plt.savefig(fileName, dpi=300)
        except Exception as e:
            raise e

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
            #print(self.filename)
            model = keras.models.load_model(self.filename)
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
                for c in self.data.columns:
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
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[self.output_cols])
            
            print("--------D")
            #모델적용 데이터셋 생성
            if self.is_indpds:
                #독립변수 데이터 생성
                test_dt = self.windowed_dataset2((df[self.feature_cols], df[self.output_cols]), self.window_size, self.batch_size, False)
            else:
                #종속변수 데이터 생성
                test_dt = self.windowed_dataset(df[self.output_cols], self.window_size, self.batch_size, False)
            
            print(test_dt)

            print("--------E")
            #예측 데이터 추출
            pred = model.predict(test_dt)
            print(pred)
            #print(pred[:,1].reshape(-1,1))
            
            #예측값 월래 값 변환 (테스트 필요)
            output_df = pd.DataFrame(columns=self.output_cols)            
            for i in range(len(self.output_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[self.output_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))
            
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

    def dataGeneraterPredict(self):
        '''
        예측 데이터 추출
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        try:
            print("--------A")
            #모델로드
            model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(model.summary())
            print(self.data)
            #self.data = self.data[:13]
            
            print("--------B")
            #컬럼추출
            scale_cols = []
            cols_blank = []
            cols_nos = []
            fcols_nos = []
            no = 0
            for c in self.data.columns:
                cols_blank.append(0)
                scale_cols.append(c)
                for col in self.output_cols:
                    if c==col:
                        cols_nos.append(no)
                for fcol in self.feature_cols:
                    if c==fcol:
                        fcols_nos.append(no)
                no = no + 1

            print(scale_cols)
            print(cols_nos)

            print("--------C")
            #정규화(0~1변환)
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            print(scaled)

            print("--------D")
            #마지막 데이터에서 활용데이터 수 만큼 가져옴
            dy = np.copy(scaled[-self.window_size:, cols_nos])
            print(dy)

            print("--------E")
            #결과데이터 생성
            estimate = []            
            for i in range(self.output_size):
                py = dy[-self.window_size:].reshape(1, self.window_size, len(cols_nos))
                pred = model.predict(py)
                estimate.append(pred)
                dy = np.insert(dy, len(dy), pred, axis=0)

            print(estimate)
            
            print("--------F")
            #결과데이터 종속변수 만큼 차원변환
            pred_ar = np.array(estimate).reshape(-1,len(cols_nos))
            print(pred_ar)

            print("--------G")
            #예측값 월래 값 변환
            output_df = pd.DataFrame(columns=self.output_cols)            
            for i in range(len(self.output_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[self.output_cols[i]] = self.predictInverse(scr, cols_blank, pred_ar[:,i].reshape(-1,1))
            
            print(output_df)
            result = output_df
            
        except Exception as e:
            raise e            
        return result

    def predictInverse(self, scaler, cols, predict):
        '''
        역정규화 (예측값 월래 값 변환)
        Args:
            scaler(any): 정규화 모듈
            cols(any): 역정규화 항목
            predict(any): 예측 데이터
        Returns: 역정규화 데이터
            result
        '''
        result = []
        try:
            for y in predict:
                cols[-1] = y[0] #if y[0] < 1 else y[0]-1
                #inverse = scaler.inverse_transform([[0, 0, 0, 0, 0, y[0]]])
                #print(cols)
                inverse = scaler.inverse_transform([cols])
                #print(inverse)
                y_inverse = inverse.flatten()[-1]
                result.append(round(y_inverse, 1))                
            #print(result)
        except Exception as e:
            raise e
        return result

    def dataGeneraterFID(self):
        '''
        예측데이터 FID 스코어 산정
        Returns: 실제데이터와 예측데이터를 비교하여 산정한 FID 스코어
            result
        '''
        try:
            print("--------A")
            #모델로드
            model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(model.summary())
            print(self.data)

            print("--------B")
            #컬럼추출
            scale_cols = []
            cols_blank = []
            cols_nos = []
            no = 0
            for c in self.data.columns:
                cols_blank.append(0)
                scale_cols.append(c)
                for col in self.output_cols:
                    if c==col:
                        cols_nos.append(no)
                no += 1

            print(scale_cols)
            print(cols_nos)

            print("--------C")
            #정규화(0~1변환)
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[self.output_cols])
            
            print("--------D")
            #모델적용 데이터셋 생성
            if self.is_indpds:
                #독립변수 데이터 생성
                test_dt = self.windowed_dataset2((df[self.feature_cols], df[self.output_cols]), self.window_size, self.batch_size, False)
            else:
                #종속변수 데이터 생성
                test_dt = self.windowed_dataset(df[self.output_cols], self.window_size, self.batch_size, False)
            
            print(test_dt)
            
            print("--------E")
            #예측 데이터 추출
            pred = model.predict(test_dt)
            print(pred)
            
            #print(pred[:,1].reshape(-1,1))
            
            print("--------F")
            #결과데이터 변환
            output_df = pd.DataFrame(columns=self.output_cols)            
            for i in range(len(self.output_cols)):
                output_df[self.output_cols[i]] = pred[:, i]                
                
            print(df[self.output_cols])
            print(output_df[self.output_cols])
            
            print("--------G")
            #시계열 이미지 변환 및 FID score 산정
            f = fid.Manager(realData=df[self.output_cols], fakeData=output_df[self.output_cols], windowSize=self.window_size)
            result = f.createRecurrence(self.output_cols, data_size=100)
            
            #print("--------H")
            ##실제값 변환
            #output_df1 = pd.DataFrame(columns=outputs_cols)            
            #for i in range(len(outputs_cols)):
            #    scr = copy.deepcopy(scaler)
            #    scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
            #    output_df1[outputs_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))

            #f = fidscore.fid(realData=self.data[outputs_cols], fakeData=output_df1[outputs_cols], windowSize=self.WINDOW_SIZE)
            #result = f.createRecurrence2(outputs_cols, count=500, dt_2018=dt_2018, dt_2019=dt_2019, dt_2020=dt_2020, dt_2022=dt_2022)
            
            #print(result)
        except Exception as e:
            raise e
        return result
    
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
        output_file = 'Z:\\DT\\storage\\preprocess\\2023\\06\\9999\\augment_sample_test\\output_augment_result_merge.csv'
        result_df = pd.concat([df, new_df], ignore_index=True)
        result_df.to_csv(output_file, index=False)
        '''

        output_file2 = 'Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test\\output_augment_result.csv'
        result_df2 = new_df
        result_df2.to_csv(output_file2, index=False)
        
        return new_df
    
    def useModelTimeSeries(self, input_data, output_data, output_cols, window_size, resmpl_intvl_tp, resmpl_intvl_value, target_start_date, target_last_date, index_column):
        current_year = datetime.now().year

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

        print(start_time)
        print(end_time)

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
        df_new.to_csv(self.output_file, index=False)

        return self.output_file
        #return df_result
    
    def modelAETrainning(self):
        '''
        Auto Encoder 이상치 탐지 학습모델
        Returns: 이상치 학습모델 학습결과
            result
        '''
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
        physical_devices = tf.config.list_physical_devices('GPU')
        try:
            tf.config.experimental.set_memory_growth(physical_devices[0], True)
        except Exception as e:
            raise e
        
        #폴더확인        
        temp = os.path.join(self.filepath, 'temp')
        history = os.path.join(self.filepath, 'history')
        if not os.path.exists(temp):
            os.makedirs(temp)
        if not os.path.exists(history):
            os.makedirs(history)

        #생성파일 목록
        modelCKFile = os.path.join(temp, self.filename + '_ae_ckeckpointer.ckpt')
        fitHistoryFile = os.path.join(self.filepath, self.filename + '_ae_fit_history.png')
        modelFile = os.path.join(self.filepath, self.filename)
        
        #설정
        train_size = int(len(self.data) * (1-self.test_size))
        features = len(self.output_cols)
        
        try:
            print('------------------A')
            #정규화(0~1변환)
            scaler = StandardScaler()
            scaler = scaler.fit(self.data.loc[:train_size, self.output_cols])
            scaled = scaler.transform(self.data[self.output_cols])
            print(scaled)
            
            print('------------------B')
            #데이터셋 생성
            train_data = TimeseriesGenerator(
                data=scaled, targets=scaled, length=self.window_size, stride=1, sampling_rate=1, batch_size=self.batch_size, shuffle=False, start_index=0, end_index=None
            )
            test_data = TimeseriesGenerator(
                data=scaled, targets=scaled, length=self.window_size, stride=1, sampling_rate=1, batch_size=self.batch_size, shuffle=False, start_index=train_size, end_index=None
            )
            print(train_data)
            print(test_data)

            print('------------------C')            
            #모델 생성
            model = Sequential([
                # 인코더 시작
                LSTM(64, activation='tanh', return_sequences=True, input_shape=(self.window_size, features)),
                LSTM(16, activation='tanh', return_sequences=False),
                # 인코더 끝
                # 병목 구간 (Bottleneck)
                RepeatVector(self.window_size),
                # 병목 구간 (Bottleneck)
                # 디코더 시작
                LSTM(16, activation='tanh', return_sequences=True),
                LSTM(64, activation='tanh', return_sequences=False),
                Dense(features)
                # 디코더 끝
            ])
            
            #성능옵션
            model.compile(loss='mae', optimizer='adam', metrics=["mae"])
            print(model.summary())

            print('------------------D')
            #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
            cb_earlystopping = EarlyStopping(monitor='val_loss', patience=self.patience)
            #val_loss 기준 bast 체크포인터 생성
            cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
            
            #모델학습
            hist = model.fit(train_data, validation_data=test_data, steps_per_epoch=len(train_data), validation_steps=len(test_data), epochs=self.epochs, callbacks=[cb_checkpoint, cb_earlystopping])
            
            print('------------------E')  
            #모델검증
            mse = model.evaluate(test_data)
            print("mse : ", mse)
            
            #학습 히스토리
            print('fit : ', hist)
            self.fitHistory(hist, fitHistoryFile)

            print('------------------F')
            #모델저장
            model.save(modelFile)
            pred = model.predict(test_data)
            print('pred : ', pred)

            result = {'fit':None}            
            #result['train_data'] = train_data
            #result['test_data'] = test_data
            result['y_pred'] = pred
            result['fit'] = hist.history
            result['evaluate_loss'] = mse[0]
            result['evaluate_acc'] = mse[1]
        except Exception as e:
            raise e
        return result

    def dataAEGenerater(self, threshold=None):
        '''
        Auto Encoder 이상치 탐지
        Args:
            threshold(int): 이상치 탐지 경계 기준
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        #설정
        train_size = int(len(self.data) * (1-self.test_size))              
        try:
            print('------------------A')
            #모델로드
            print(self.filename)
            model = keras.models.load_model(self.filename)
            print(model.summary())
            print(self.data)

            print('------------------B')
            #정규화(0~1변환)
            scaler = StandardScaler()
            scaler = scaler.fit(self.data.loc[:train_size, self.output_cols])
            scaled = scaler.transform(self.data[self.output_cols])
            print(scaled)
            
            print('------------------C')
            #데이터셋 생성
            train_data = TimeseriesGenerator(
                data=scaled, targets=scaled, length=self.window_size, stride=1, sampling_rate=1, batch_size=self.batch_size, shuffle=False, start_index=0, end_index=None
            )
            test_data = TimeseriesGenerator(
                data=scaled, targets=scaled, length=self.window_size, stride=1, sampling_rate=1, batch_size=self.batch_size, shuffle=False, start_index=train_size, end_index=None
            )
            print(train_data)
            print(test_data)

            print('------------------D')
            # 실제 데이터와 예측 데이터 loss 계산
            pred = model.predict(train_data)
            real = scaled[self.window_size:]
            mae_loss = np.mean(np.abs(pred-real), axis=1)
            print(mae_loss)

            # loss 차트 확인
            matplotlib.use('TkAgg')
            plt.subplots(figsize=(9,6))
            plt.hist(mae_loss, 100, density=True, alpha=0.75, log=True)
            plt.show()

            print('------------------E')
            # 실제데이터에 loss 적용
            test_df = copy.deepcopy(self.data.loc[self.window_size:]).reset_index(drop=True)
            test_df['Loss'] = mae_loss
            print(test_df)

            print('------------------F')
            # 이상치 경계 기준보다 큰 값 추출
            test_df.loc[test_df['Loss']>threshold]
            output_df = test_df.loc[test_df['Loss']>threshold]
            print(output_df)
            
            result = output_df            
        except Exception as e:
            raise e            
        return result

    def arimaModelGenerater(self, threshold=None):
        '''
        ARIMA 모델 생성
        Args:
            threshold(int): 이상치 탐지 경계 기준
        Returns: 학습모델을 통해 생성한 데이터
            result
        '''
        #설정
        train_size = int(len(self.data) * (1-self.test_size))              
        try:
            print('------------------A')
            #모델로드
            print(self.filename)
            model = keras.models.load_model(self.filename)
            print(model.summary())
            print(self.data)

            print('------------------B')
            #정규화(0~1변환)
            scaler = StandardScaler()
            scaler = scaler.fit(self.data.loc[:train_size, self.output_cols])
            scaled = scaler.transform(self.data[self.output_cols])
            print(scaled)
            
            print('------------------C')
            #데이터셋 생성
            train_data = TimeseriesGenerator(
                data=scaled, targets=scaled, length=self.window_size, stride=1, sampling_rate=1, batch_size=self.batch_size, shuffle=False, start_index=0, end_index=None
            )
            test_data = TimeseriesGenerator(
                data=scaled, targets=scaled, length=self.window_size, stride=1, sampling_rate=1, batch_size=self.batch_size, shuffle=False, start_index=train_size, end_index=None
            )
            print(train_data)
            print(test_data)

            print('------------------D')
            # 실제 데이터와 예측 데이터 loss 계산
            pred = model.predict(train_data)
            real = scaled[self.window_size:]
            mae_loss = np.mean(np.abs(pred-real), axis=1)
            print(mae_loss)

            # loss 차트 확인
            matplotlib.use('TkAgg')
            plt.subplots(figsize=(9,6))
            plt.hist(mae_loss, 100, density=True, alpha=0.75, log=True)
            plt.show()

            print('------------------E')
            # 실제데이터에 loss 적용
            test_df = copy.deepcopy(self.data.loc[self.window_size:]).reset_index(drop=True)
            test_df['Loss'] = mae_loss
            print(test_df)

            print('------------------F')
            # 이상치 경계 기준보다 큰 값 추출
            test_df.loc[test_df['Loss']>threshold]
            output_df = test_df.loc[test_df['Loss']>threshold]
            print(output_df)
            
            result = output_df            
        except Exception as e:
            raise e            
        return result