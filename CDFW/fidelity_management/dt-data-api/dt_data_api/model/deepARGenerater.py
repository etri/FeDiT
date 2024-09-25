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
import math
from statsmodels.tsa.arima.model import ARIMA

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
    deepAR 모델학습
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
        '''
        # 단계 1: tensor로 변환 (tf.expand_dims)
        series_expanded = tf.expand_dims(series, axis=-1)
        print("\ntf.expand_dims() 결과:")
        print(series_expanded)

        # 단계 2: from_tensor_slices()
        ds_from_slices = tf.data.Dataset.from_tensor_slices(series_expanded)
        print("\nfrom_tensor_slices() 결과:")
        for tensor in ds_from_slices:
            print(tensor)

        # 단계 3: window()
        ds_windowed = ds_from_slices.window(window_size + 1, shift=1, drop_remainder=True)
        print("\nwindow() 결과:")
        for w in ds_windowed:
            print(w)

        # 단계 4: flat_map(lambda w: w.batch(window_size + 1))
        ds_flattened = ds_windowed.flat_map(lambda w: w.batch(window_size + 1))
        print("\nflat_map() 결과:")
        for batch in ds_flattened:
            print(batch)

        # 단계 5: map(lambda w: (w[:-1], w[-1]))
        if shuffle:
            ds_mapped = ds_flattened.map(lambda w: (w[:-1], w[-1]))
        else:
            ds_mapped = ds_flattened
        print("\nmap() 결과:")
        for batch in ds_mapped:
            print(batch)

        # 단계 6: batch() 및 prefetch()
        ds_batched = ds_mapped.batch(batch_size).prefetch(1)
        print("\nbatch() 및 prefetch() 결과:")
        for batch in ds_batched:
            print(batch)

        return ds_batched
        '''

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
    
    #데이터를 압축한 후 다시 복원하는 구조로, 주요 패턴을 학습하고 잡음을 제거하는 역할
    def setAutoEncoder(self,  input_shape):
        # Encoder
        x = Input(shape=input_shape)
        encoder = Conv1D(128, kernel_size=5, activation='relu', padding='same')(x)
        encoder = MaxPooling1D(pool_size=2)(encoder)

        # Decoder
        decoder = UpSampling1D(size=2)(encoder)
        decoder = Conv1D(64, kernel_size=5, activation='relu', padding='same')(decoder)
        decoder = Conv1D(input_shape[-1], kernel_size=5, activation='sigmoid', padding='same')(decoder)

        autoencoder_model = tf.keras.Model(inputs=x, outputs=decoder)
        return autoencoder_model        

    def setTCNN(self, input_shape, output_shape):
        x = Input(shape=input_shape)
        # TCNN Layers
        tcnn = Conv1D(64, kernel_size=3, activation='relu', padding='same')(x)
        skip_connection = tcnn
        tcnn = MaxPooling1D(pool_size=2)(tcnn)
        tcnn = UpSampling1D(size=2)(tcnn)
        tcnn = Concatenate()([tcnn, skip_connection])
        tcnn = Conv1D(32, kernel_size=3, activation='relu', padding='same')(tcnn)

        # Dense layers
        tcnn = Flatten()(tcnn)
        dense = Dense(128, activation='relu')(tcnn)
        output = Dense(output_shape[-1], activation='sigmoid')(dense)

        tcnn_model = tf.keras.Model(inputs=x, outputs=output)
        return tcnn_model        

    def setDeepARModel(self, features, outputs, window_size, units):

        # Input shape
        input_shape = (window_size, features)
        output_shape = (window_size, outputs)

        # Input layer
        x = Input(shape=(window_size, features))#, batch_size=self.batch_size)

        # Autoencoder
        autoencoder_model = self.setAutoEncoder(input_shape)
        auto_encoded = autoencoder_model(x)

        # TCNN
        tcnn_model = self.setTCNN(input_shape, output_shape)
        tcnn_output = tcnn_model(auto_encoded)

        # Final model
        model = tf.keras.Model(inputs=x, outputs=tcnn_output)


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

        return model
    

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

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                data_cols = self.output_cols + list(set(self.feature_cols) - set(self.output_cols))
                apply_colums = data_cols #self.output_cols + self.feature_cols

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
            x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(x_test)
            print(y_test)

            with strategy.scope():
                print('------------------E')
                #모델적용 데이터셋 생성
                if self.is_indpds:
                    #독립변수 데이터 생성
                    print('****', self.is_indpds)
                    train_data = self.windowed_dataset2((x_train, y_train), self.window_size, self.batch_size, True)
                    test_data = self.windowed_dataset2((x_test, y_test), self.window_size, self.batch_size, False)
                else:
                    #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
                    print('********', self.is_indpds)
                    train_data = self.windowed_dataset(y_train, self.window_size, self.batch_size, True)
                    test_data = self.windowed_dataset(y_test, self.window_size, self.batch_size, False)
                
                '''
                for x, y in train_data.take(1):
                    print("Features (x):", x.numpy())  # Features (입력 데이터)
                    print("Labels (y):", y.numpy())    # Labels (예측 대상)
                '''                 

                print(train_data)
                print(test_data)

                print('------------------F')            
                #모델설정
                if self.is_indpds:
                    #독립변수 모델생성
                    model = self.setDeepARModel(len(self.feature_cols), len(self.output_cols), self.window_size, self.units)
                    #model = self.setModel2(len(self.feature_cols), len(self.output_cols), self.window_size, self.units, output_size=self.output_size)
                else:
                    #종속변수로 모델생성 (입출력값은 동일해야함)
                    model = self.setDeepARModel(len(self.output_cols), len(self.output_cols), self.window_size, self.units)
                    #model = self.setModel2(len(self.output_cols), len(self.output_cols), self.window_size, self.units, output_size=self.output_size)
                
                print(len(self.feature_cols), len(self.output_cols))
                
                # print('------------------G')
                # #성능옵션
                # model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
                # #model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['accuracy'])
                print(model.summary())

                print('------------------G')
                #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
                cb_earlystopping = EarlyStopping(monitor='val_loss', patience=self.patience)
                #val_loss 기준 bast 체크포인터 생성
                #cp_filename = os.path.join(self.filepath, 'tmp', self.filename + '_ckeckpointer.ckpt')
                cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
                #checkpoint_model = ModelCheckpoint(filepath=self.MODEL_FILE_PATH + 'tmp\\model\\' + 'model_{epoch:02d}.h5')
                #중간값 추론
                cb_fid = fidMeta.FIDCallback(generator=model, epochs_to_fid=1, window_size=self.window_size, real_data=y_test, test_data=test_data, output_cols=self.output_cols, filepath=fidHistoryPath, data_size=self.data_size)
                #rlr = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=self.patience, verbose=1)
                
                #모델학습
                #hist = model.fit(train_data, validation_data=(test_data), epochs=self.epochs, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
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

            pred = model.predict(test_data)
            #print(test_data)
            print('pred : ', pred)

            # 테스트 데이터 복원
            new_index = range(len(x_test))
            x_test.index = new_index
            extend_x_df = utils.add_dataframe_columns(x_test, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)
            if len(self.feature_cols) > len(scale_cols) - len(self.output_cols):
                unscaled_x_df = utils.add_columns_BtoA(unscaled_x_df, x_test)

            new_index = range(len(y_test))
            y_test.index = new_index
            extend_y_df = utils.add_dataframe_columns(y_test, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)
            if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
                unscaled_y_df = utils.add_columns_BtoA(unscaled_y_df, y_test)

            #예측 데이터 복원
            pred_df = pd.DataFrame(pred, columns=self.output_cols)
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
            result['x_test'] = x_test
            result['y_test'] = y_test
            result['y_pred'] = pred
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
            model = keras.models.load_model(self.filename, compile=False)
            
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


            #print(df[self.output_cols])
            
            print("--------D")
            #모델적용 데이터셋 생성
            if self.is_indpds:
                #독립변수 데이터 생성
                test_dt = self.windowed_dataset2((df[self.feature_cols], df[self.output_cols]), self.window_size, self.batch_size, False)
            else:
                #종속변수 데이터 생성
                test_dt = self.windowed_dataset(df[self.output_cols], self.window_size, self.batch_size, False)
            
            #print(test_dt)

            print("--------E")
            
            #예측 데이터 추출
            pred = model.predict(test_dt)
            #print(pred)
            #print(pred[:,0].reshape(-1,1))
            
            #예측값 월래 값 변환 (테스트 필요)
            #y_pred_unscaled = scaler_y.inverse_transform(pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
            
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
            model = keras.models.load_model(self.filename, compile=False)

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                apply_colums = self.output_cols + self.feature_cols

            #print(self.data)
            print(self.trgt_col_list)
            print("--------B", self.feature_cols, self.output_cols)
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
                    test_dt = self.windowed_dataset2((data_x, data), self.window_size, self.batch_size, False)

                    next_prediction = model.predict(test_dt)
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
                    test_dt = self.windowed_dataset(data, self.window_size, self.batch_size, False)

                    next_prediction = model.predict(test_dt)
                    #print('추론', next_prediction)
                    predict_array.append(next_prediction[0])
    
                    data.loc[len(data)] = list(next_prediction[0]) # 

                    data = data.iloc[1:] # 맨 앞쪽 데이터 제거
                    #인덱스 재정렬
                    new_index = range(len(data))
                    data.index = new_index
                    #print(data)
   
            # predict_array는 그냥 리스트 이므로 predict의 결과와 같은 형태가 되도록 numpy 형태로 변경
            pred = np.array(predict_array)
            #print('***', pred)
            # 2024.08.20 predict 결과를 다시 predict 하도록(반복) 수정 끝
            #========================================================================================================================================================


            #예측 데이터 추출
            #pred = model.predict(test_dt)
            #print(pred)
            #print(pred[:,1].reshape(-1,1))
            
            #예측값 월래 값 변환. 스케일링 할때의 컬럼 구조와 똑같이 만들어서 복구
            utils = Utils()
            pred_df = pd.DataFrame(pred, columns=self.output_cols)
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
    


    def modelTrainning_ARIMA(self):

                # ARIMA 모델 학습
        order = (5, 1, 0)  # (p, d, q) 값 설정
        model = ARIMA(data, order=order)
        model_fit = model.fit()

        print(model_fit.summary())

        # 예측
        forecast = model_fit.forecast(steps=10)
        print("Forecast:", forecast)

        result = {'result': False, 'resultMessage':None}

        return result