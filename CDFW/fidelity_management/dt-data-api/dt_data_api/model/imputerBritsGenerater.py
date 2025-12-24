import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split
import os
import copy
import pickle
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout, Flatten, Reshape, BatchNormalization, RepeatVector, TimeDistributed
from tensorflow.keras.losses import Huber, MeanSquaredError, MeanAbsoluteError, MeanAbsolutePercentageError
from tensorflow.keras.optimizers import Adam, SGD, Adagrad, RMSprop
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.sequence import TimeseriesGenerator



from dt_data_api.model import fidMeta
from dt_data_api.common.settings_meta import MODEL_PATH_META
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS
from dt_data_api.util.utils import Utils
from .utils import ModelParameters, InputParameters

from .brits.model import BRITS
from .brits.plots import plot
from .brits.utils import get_inputs
from .brits.modules import RITS


from copy import deepcopy

class Manager:
    '''
    Brits (Bidirectional Recurrent Imputation for Time Series)
    ---
    Brits 통해 결측값 채움
    '''

    #원본데이터
    data = pd.DataFrame

    model_type:None     #모델유형
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
    timesteps:None

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
    
    
    def __init__(self, data=None, modelArgs=None, inputArgs=None, timesteps=200) -> None:
        self.data = data        
        if modelArgs != None:
            self.model_type = modelArgs.model_type
            self.batch_size = modelArgs.batch_size
            self.units = modelArgs.units
            self.epochs = modelArgs.epochs
            self.test_size = modelArgs.test_size
            self.patience = modelArgs.patience
            self.loss = modelArgs.loss
            self.meterics = modelArgs.meterics
            self.optimizer = modelArgs.optimizer
            self.optimizer_lr = modelArgs.optimizer_lr
            self.data_size = modelArgs.data_size

        self.timesteps = timesteps

        if inputArgs != None:
            self.filepath = inputArgs.filepath
            self.filename = inputArgs.filename
            self.output_cols = inputArgs.output_cols
            #self.feature_cols = inputArgs.feature_cols
            #self.is_indpds = inputArgs.is_indpds        
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

    def modelTrainning(self):
        '''
        brits 데이터 학습 및 모델 생성
        Returns: 학습결과 데이터
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
        '''
        
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        
        #GPU 설정
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
            '''
            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                apply_colums = self.output_cols + self.feature_cols
            '''
            apply_colums = self.output_cols

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
            scaled = self.data[scale_cols] #테스트
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])


            
            # Generate some time series
            '''
            #테스트용 데이터 생성
            N = 2000
            t = np.linspace(0, 1, N)
            e = np.random.multivariate_normal(mean=np.zeros(2), cov=np.eye(2), size=N)
            a = 40 + 20 * np.cos(2 * np.pi * (10 * t - 0.5)) + e[:, 0]
            b = 60 + 30 * np.cos(2 * np.pi * (20 * t - 0.5)) + e[:, 1]
            x = np.hstack([a.reshape(- 1, 1), b.reshape(- 1, 1)])
            df = pd.DataFrame(x, columns=["w40","w50"])
            
            '''
            utils = Utils()

            df = utils.add_columns_BtoA(df, self.data)

            outputs_df = df[self.output_cols]
            #features_df = df[self.feature_cols]
            
 
            for col in self.output_cols:
                outputs_df.drop(col, 1)
            print('outputs_df', outputs_df)
            #print('features_df', features_df)

            print('------------------D')
            #학습/검증 데이터 추출
            y_train, y_test = train_test_split(outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(y_train)
            print(y_test)
            
            train_data = np.array(y_train)
            test_data = np.array(y_test)

            #test_data = np.array(outputs_df)
            #test_data = test_data.astype(np.float64)
            '''
            #테스트용 결측 생성
            for i in range(10):
                a = np.random.randint(low=50, high=len(test_data) - 100, size=len(self.output_cols))
                b = np.random.randint(low=5, high=50, size=len(self.output_cols))
                for j in range(len(self.output_cols)):
                    test_data[a[j]: a[j] + b[j], j] = np.nan
            '''
            #test_data = test_data[:, 0].reshape(-1, 1)

            #print('train_data', train_data)

            with strategy.scope():
                print('------------------E', test_data)

                #model = BRITS(x=train_data, units=self.units, timesteps=self.timesteps)
                #model.fit(learning_rate=self.optimizer_lr, batch_size=self.batch_size, epochs=self.epochs, verbose=True)
                #pred = model.impute(x=test_data)

                
                model = BRITS_Model(units=self.units, timesteps=self.timesteps, features=len(self.output_cols), optimizer=self.optimizer, loss=self.loss, metrics=self.meterics, optimizer_lr=self.optimizer_lr)
              
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
                ##model.compile(optimizer=optimizer, loss=loss, metrics=[metrics]) #사용
          
                model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='mae')

                print('------------------F')

                ##cb_earlystopping = EarlyStopping(monitor='loss', patience=self.patience) # 사용

                #val_loss 기준 bast 체크포인터 생성
                #cp_filename = os.path.join(self.filepath, 'tmp', self.filename + '_ckeckpointer.ckpt.weights.h5')

                ##cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='loss', verbose=1) #사용

                #checkpoint_model = ModelCheckpoint(filepath=self.MODEL_FILE_PATH + 'tmp\\model\\' + 'model_{epoch:02d}.h5')
                #중간값 추론
                ##cb_fid = fidMeta.BritsFIDCallback(generator=model, epochs_to_fid=1, window_size=0, real_data=y_test, test_data=y_test, output_cols=self.output_cols, filepath=fidHistoryPath, data_size=self.data_size) #사용

                #rlr = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=self.patience, verbose=1)
                
                #모델학습
                #hist = model.fit(y_train, validation_data=(y_test), epochs=self.epochs, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])

                #hist = model.fit(train_data, validation_data=(test_data), batch_size=self.batch_size, epochs=self.epochs, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])

                #hist = model.fit(train_data, epochs=self.epochs, batch_size=self.batch_size, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
                hist = model.fit(train_data, epochs=self.epochs, batch_size=self.batch_size)#, callbacks=[cb_checkpoint, cb_fid, cb_earlystopping])
                
                #model.fit(learning_rate=self.learning_rate, batch_size=self.batch_size, epochs=self.epochs, verbose=True)
            print('------------------G')
            #모델저장
            self.save_brits_model(model, modelFile)

            print('------------------H')
            # 스케일러를 로컬에 임시 저장

            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            with open(scalerFile, 'wb') as f:
                pickle.dump(scaler, f)      

            print('------------------I')

            #model_load = self.load_brits_model(modelFile)

            print('------------------J')

            pred = model.impute(x=test_data)
            
            #print(test_data)
            print('pred : ', pred)

            result = {'fid': None, 'fit':None}      

            '''
            matplotlib.use('TkAgg')

            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(pred[:,index], label=f'prediction')
                plt.plot(test_data[:,index], label=f'actual')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + '_real_fake.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()
            '''             

            '''
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            mape = self.mean_absolute_percentage_error(y_test, y_pred)
            print(7)
            '''

            # 테스트 데이터 복원
            new_index = range(len(y_test))
            y_test.index = new_index
            extend_x_df = utils.add_dataframe_columns(y_test, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)
            #if len(self.feature_cols) > len(scale_cols) - len(self.output_cols):
            #    unscaled_x_df = utils.add_columns_BtoA(unscaled_x_df, y_test)

            new_index = range(len(y_test))
            y_test.index = new_index
            extend_y_df = utils.add_dataframe_columns(y_test, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)
            #if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
            #    unscaled_y_df = utils.add_columns_BtoA(unscaled_y_df, y_test)

            #예측 데이터 복원
            pred_df = pd.DataFrame(pred, columns=self.output_cols)
            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)
            #if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
            #    unscaled_pred_df = utils.add_columns_BtoA(unscaled_pred_df, pred_df)
            print('예측 결과 복원', unscaled_pred_df, y_test, pred)
            result = {'fid': None, 'fit':None}            
            result['x_test'] = y_test
            result['y_test'] = y_test
            result['y_pred'] = pred
            result['x_test_unscaled'] = unscaled_x_df[self.output_cols]
            result['y_test_unscaled'] = unscaled_y_df[self.output_cols]
            result['y_pred_unscaled'] = unscaled_pred_df[self.output_cols]
            #result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
            print('히스토리', hist.history)
            result['evaluate_loss'] = 0 #mse[0]
            result['evaluate_acc'] = 0 #mse[1]
     

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
            #model = joblib.load(self.filename)
            model = self.load_brits_model(self.filename)
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
                scaled = scaler.transform(self.data[scale_cols])
            else:
                scaler = MinMaxScaler()
                scaled = scaler.fit_transform(self.data[scale_cols])            
            
            #scaled = self.data[scale_cols]# 테스트
            df = pd.DataFrame(scaled, columns=scale_cols)
            

            # Generate some time series
            '''
            #테스트 데이터 생성
            N = 2000
            t = np.linspace(0, 1, N)
            e = np.random.multivariate_normal(mean=np.zeros(2), cov=np.eye(2), size=N)
            a = 40 + 20 * np.cos(2 * np.pi * (10 * t - 0.5)) + e[:, 0]
            b = 60 + 30 * np.cos(2 * np.pi * (20 * t - 0.5)) + e[:, 1]
            x = np.hstack([a.reshape(- 1, 1), b.reshape(- 1, 1)])
            df = pd.DataFrame(x, columns=scale_cols)
            '''

            print("--------D")

            #print(test_dt)

            print("--------E", df)
            test_dt = df[self.output_cols]
            test_data = np.array(test_dt)
            #test_data = test_data.astype(np.float64)

            '''
            #테스트할때 임의로 결측 생성
            for i in range(10):
                a = np.random.randint(low=50, high=len(test_data) - 100, size=len(self.output_cols))
                b = np.random.randint(low=5, high=50, size=len(self.output_cols))
                for j in range(len(self.output_cols)):
                    test_data[a[j]: a[j] + b[j], j] = np.nan

            test_data = test_data[:, 0].reshape(-1, 1)  #컬럼 1개만 쓰려고...
            '''

            print("--------F", test_data)

            #예측 데이터 추출
            #y_pred = model.predict(test_dt)
            y_pred = model.impute(x=test_data)
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
            print('pred_df', pred_df)
            extend_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('extend_df', extend_df)
            y_pred_unscaled = scaler.inverse_transform(extend_df)
            unscaled_df = pd.DataFrame(y_pred_unscaled, columns=scale_cols)

            print('y_pred_unscaled', self.output_cols, unscaled_df)

            #y_pred_unscaled = scaler.inverse_transform(y_pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
     
            result = unscaled_df[self.output_cols]            

        except Exception as e:
            raise e            
        return result


    def modelTrainning_ori(self):
        '''
        brits 데이터 학습 및 모델 생성
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
            '''
            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                apply_colums = self.output_cols + self.feature_cols
            '''
            apply_colums = self.output_cols

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
            #scaled = self.data[scale_cols] #테스트
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            # Generate some time series
            '''
            #테스트용 데이터 생성
            N = 2000
            t = np.linspace(0, 1, N)
            e = np.random.multivariate_normal(mean=np.zeros(2), cov=np.eye(2), size=N)
            a = 40 + 20 * np.cos(2 * np.pi * (10 * t - 0.5)) + e[:, 0]
            b = 60 + 30 * np.cos(2 * np.pi * (20 * t - 0.5)) + e[:, 1]
            x = np.hstack([a.reshape(- 1, 1), b.reshape(- 1, 1)])
            df = pd.DataFrame(x, columns=["w40","w50"])
            '''

            utils = Utils()

            df = utils.add_columns_BtoA(df, self.data)

            outputs_df = df[self.output_cols]
            #features_df = df[self.feature_cols]
            
 
            for col in self.output_cols:
                outputs_df.drop(col, 1)
            print('outputs_df', outputs_df)
            #print('features_df', features_df)

            print('------------------D')
            #학습/검증 데이터 추출
            y_train, y_test = train_test_split(outputs_df, test_size=self.test_size, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(y_train)
            print(y_test)
            
            train_data = np.array(y_train)
            test_data = np.array(y_test)
            
            #test_data = np.array(outputs_df)
            #test_data = test_data.astype(np.float64)
            '''
            #테스트할때 임시로 결측값을 만드는 부분
            for i in range(10):
                a = np.random.randint(low=50, high=len(test_data) - 100, size=len(self.output_cols))
                b = np.random.randint(low=5, high=50, size=len(self.output_cols))
                for j in range(len(self.output_cols)):
                    test_data[a[j]: a[j] + b[j], j] = np.nan
            '''
            #test_data = test_data[:, 0].reshape(-1, 1)

            #print('train_data', train_data)

            with strategy.scope():
                print('------------------E', test_data)

                model = BRITS(x=train_data, units=self.units, timesteps=self.timesteps,strategy=strategy)
                model.fit(learning_rate=self.optimizer_lr, batch_size=self.batch_size, epochs=self.epochs, verbose=True)
                
                
            print('------------------G')
            #모델저장
            model.save_model(modelFile)
            print('------------------H')
            # 스케일러를 로컬에 임시 저장

            scalerFile = os.path.join(self.filepath, self.filename.split('.')[0] + '_scaler.pkl')
            with open(scalerFile, 'wb') as f:
                pickle.dump(scaler, f)      

            print('------------------I')

            #model_load = self.load_brits_model(modelFile)

            print('------------------J')

            pred = model.impute(x=test_data)
            
            #print(test_data)
            print('pred : ', pred)

            result = {'fid': None, 'fit':None}      

            '''
            matplotlib.use('TkAgg')

            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(pred[:,index], label=f'prediction')
                plt.plot(test_data[:,index], label=f'actual')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + '_real_fake.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()
            '''


            '''
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            mape = self.mean_absolute_percentage_error(y_test, y_pred)
            print(7)
            '''

            # 테스트 데이터 복원
            new_index = range(len(y_test))
            y_test.index = new_index
            extend_x_df = utils.add_dataframe_columns(y_test, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)
            #if len(self.feature_cols) > len(scale_cols) - len(self.output_cols):
            #    unscaled_x_df = utils.add_columns_BtoA(unscaled_x_df, y_test)

            new_index = range(len(y_test))
            y_test.index = new_index
            extend_y_df = utils.add_dataframe_columns(y_test, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)
            #if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
            #    unscaled_y_df = utils.add_columns_BtoA(unscaled_y_df, y_test)

            #예측 데이터 복원
            pred_df = pd.DataFrame(pred, columns=self.output_cols)
            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)
            #if len(self.output_cols) > len(scale_cols) - len(self.feature_cols):
            #    unscaled_pred_df = utils.add_columns_BtoA(unscaled_pred_df, pred_df)
            print('예측 결과 복원', unscaled_pred_df, y_test, pred)
            result = {'fid': None, 'fit':None}            
            result['x_test'] = y_test
            result['y_test'] = y_test
            result['y_pred'] = pred
            result['x_test_unscaled'] = unscaled_x_df[self.output_cols]
            result['y_test_unscaled'] = unscaled_y_df[self.output_cols]
            result['y_pred_unscaled'] = unscaled_pred_df[self.output_cols]
            result['evaluate_loss'] = 0 #mse[0]
            result['evaluate_acc'] = 0 #mse[1]
     

        except Exception as e:
            raise e
        
        return result
    
    def dataGenerater_ori(self):
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
            #model = joblib.load(self.filename)
            #model = self.load_brits_model(self.filename)
            
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
                scaled = scaler.transform(self.data[scale_cols])
            else:
                scaler = MinMaxScaler()
                scaled = scaler.fit_transform(self.data[scale_cols])            

            #scaled = self.data[scale_cols] #테스트
            df = pd.DataFrame(scaled, columns=scale_cols)
            

            # Generate some time series
            '''
            #테스트용 데이터 생성
            N = 2000
            t = np.linspace(0, 1, N)
            e = np.random.multivariate_normal(mean=np.zeros(2), cov=np.eye(2), size=N)
            a = 40 + 20 * np.cos(2 * np.pi * (10 * t - 0.5)) + e[:, 0]
            b = 60 + 30 * np.cos(2 * np.pi * (20 * t - 0.5)) + e[:, 1]
            x = np.hstack([a.reshape(- 1, 1), b.reshape(- 1, 1)])
            df = pd.DataFrame(x, columns=scale_cols)
            '''

            print("--------D")

            #print(test_dt)

            print("--------E", df)
            test_dt = df[self.output_cols]
            test_data = np.array(test_dt)
            #test_data = test_data.astype(np.float64)
            '''
            #테스트할때 임시로 결측값을 만드는 부분
            for i in range(10):
                a = np.random.randint(low=50, high=len(test_data) - 100, size=len(self.output_cols))
                b = np.random.randint(low=5, high=50, size=len(self.output_cols))
                for j in range(len(self.output_cols)):
                    test_data[a[j]: a[j] + b[j], j] = np.nan
            '''
            #test_data = test_data[:, 0].reshape(-1, 1)

            print("--------F", test_data)

            #예측 데이터 추출
            #y_pred = model.predict(test_dt)
            model = BRITS.load_model(self.filename, x=test_data)
            y_pred = model.impute(x=test_data)
            print("--------G", y_pred)
            #print(pred[:,0].reshape(-1,1))


            df_pred = pd.DataFrame(y_pred, columns=self.output_cols)
           

            print("--------H", df_pred)

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
            print('pred_df', pred_df)
            extend_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('extend_df', extend_df)
            y_pred_unscaled = scaler.inverse_transform(extend_df)
            unscaled_df = pd.DataFrame(y_pred_unscaled, columns=scale_cols)

            print('y_pred_unscaled', self.output_cols, unscaled_df)

            #y_pred_unscaled = scaler.inverse_transform(y_pred.reshape(-1, 1))
            #output_df = pd.DataFrame(y_pred_unscaled, columns=self.output_cols)            
     
            result = unscaled_df[self.output_cols]            

        except Exception as e:
            raise e            
        return result


    
    def save_brits_model(self, model, filepath):
        """
        Save the BRITS model to a file.
        
        Args:
        model (BRITS): The BRITS model to save.
        filepath (str): Path where the model will be saved.
        """
        # Save the model architecture and weights
        #tf.keras.models.save_model(model, filepath, save_format='tf')
        model.save_weights(filepath)
        #model.save(filepath, save_format='tf')
        
        # Save custom parameters
        custom_objects = {
            'units': model.units,
            'timesteps': model.timesteps,
            'features': model.features,
            'optimizer': str(model.optimizer),
            'loss': str(model.loss),
            'metrics': str(model.metrics),
            'optimizer_lr': model.optimizer_lr,
            'x_min': model.x_min.tolist() if hasattr(model, 'x_min') else None,
            'x_max': model.x_max.tolist() if hasattr(model, 'x_max') else None
        }

        import json
        with open(filepath + '_brits_data.json', 'w') as f:
            json.dump(custom_objects, f)

    def load_brits_model(self, filepath):
        """
        Load a BRITS model from a file.
        
        Args:
        filepath (str): Path where the model is saved.
        
        Returns:
        BRITS: The loaded BRITS model.
        """
        # Load custom parameters
        import json
        with open(filepath + '_brits_data.json', 'r') as f:
            custom_objects = json.load(f)
        
        # Create a new instance of the BRITS model
        model = BRITS_Model(units=custom_objects['units'],
                    timesteps=custom_objects['timesteps'],
                    features=custom_objects['features'],
                    optimizer=custom_objects['optimizer'],
                    loss = custom_objects['loss'],
                    metrics = custom_objects['metrics'],
                    optimizer_lr=custom_objects['optimizer_lr'])
        
        if model.optimizer == MD_OTMZ.ADAM:
            optimizer = Adam(model.optimizer_lr)
        elif model.optimizer == MD_OTMZ.SGD:
            optimizer = SGD(model.optimizer_lr)
        elif model.optimizer == MD_OTMZ.AGD:
            optimizer = Adagrad(model.optimizer_lr)
        elif model.optimizer == MD_OTMZ.RMS:
            optimizer = RMSprop(model.optimizer_lr)
        else:
            optimizer = Adam(model.optimizer_lr)
        
        #손실옵션            
        if model.loss == MD_LOSS.HUB:
            loss = Huber()
        elif model.loss == MD_LOSS.MSE:
            loss = MeanSquaredError()
        elif model.loss == MD_LOSS.MAE:
            loss = MeanAbsoluteError()
        elif model.loss == MD_LOSS.MAPE:
            loss = MeanAbsolutePercentageError()
        else:
            loss = Huber()
        
        #결과표시
        metrics = model.meterics

        model(tf.random.normal([1, model.timesteps, model.features, 6])) 

        model.compile(optimizer=optimizer)#, loss=loss, metrics=[metrics])

        model.load_weights(filepath=filepath)

       #성능옵션

        # Load the model architecture and weights
        #loaded_model = tf.keras.models.load_model(filepath, custom_objects={'BRITS_Model': BRITS_Model})
        #model.set_weights(loaded_model.get_weights())

        # Restore custom attributes
        if custom_objects['x_min'] is not None:
            model.x_min = np.array(custom_objects['x_min'])
        if custom_objects['x_max'] is not None:
            model.x_max = np.array(custom_objects['x_max'])
        
        return model
    

    

    def britsImputer(self):
        '''
        britsImputer 결측값 보간
        Returns: 결측값을 값을 채운 데이터
            data
        '''
        try:



            # Generate some time series
            N = 2000
            t = np.linspace(0, 1, N)
            e = np.random.multivariate_normal(mean=np.zeros(2), cov=np.eye(2), size=N)
            a = 40 + 20 * np.cos(2 * np.pi * (10 * t - 0.5)) + e[:, 0]
            b = 60 + 30 * np.cos(2 * np.pi * (20 * t - 0.5)) + e[:, 1]
            x = np.hstack([a.reshape(- 1, 1), b.reshape(- 1, 1)])

            print('shape1', x.shape, x[:,0])

            
            outputs_cols = self.data.columns
            data_size = len(self.data)
            #columns = ['speed']
            columns = ['w50', 'w60']
            
            '''
            df = self.data[columns]
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(df)
            x = pd.DataFrame(scaled, columns=columns)
            N = len(x)
            x = np.array(x)
            '''

            x_ori = deepcopy(x)

            # Add some missing values
            
            for i in range(10):
                a = np.random.randint(low=200, high=N - 200, size=len(columns))
                b = np.random.randint(low=5, high=50, size=len(columns))
                for j in range(len(columns)):
                    x[a[j]: a[j] + b[j], j] = np.nan
            
            '''
            for i in range(10):
                a = np.random.randint(low=50, high=N - 100, size=len(columns))
                b = np.random.randint(low=5, high=50, size=len(columns))
                for j in range(len(columns)):
                    x[a[j]: a[j] + b[j], j] = np.nan                    
            '''

            #df_missing = pd.DataFrame(x, columns=outputs_cols)
            #df_missing.to_csv(f'dt_data_api/data/real_fake.csv', index=False)

            print('shape2', x.shape, x)
            #return None

            # Fit the model
            model = BRITS(
                x=x,
                units=100,
                #units=14,
                timesteps=200
                #timesteps=12
            )

            model.fit(
                learning_rate=0.001,
                batch_size=16,
                epochs=200,
                verbose=True
            )


            model.save_model("brits_model.pkl")


            model = BRITS.load_model("brits_model.pkl", x=x)
            # Impute the missing values
            x_hat = model.impute(x=x)
            
            print('x',x)
            #print('x_hat',x_hat)

            df_hat = pd.DataFrame(x_hat, columns=columns)
            matplotlib.use('TkAgg')
            plt.figure(figsize=(12, 9))
            plt.plot(x_hat[:,0], label='prediction1')
            plt.plot(x[:,0], label='actual1')
            #for col in outputs_cols:
            #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
            #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
            plt.legend()
            plt.savefig(f'dt_data_api/data/real_fake1.png', dpi=300)
            plt.show()

            plt.figure(figsize=(12, 9))
            plt.plot(x_hat[:,1], label='prediction2')
            plt.plot(x[:,1], label='actual2')
            #for col in outputs_cols:
            #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
            #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
            plt.legend()
            plt.savefig(f'dt_data_api/data/real_fake2.png', dpi=300)
            plt.show()


            plt.figure(figsize=(12, 9))
            plt.plot(x_ori[:,0], label='ori1')
            plt.plot(x_ori[:,1], label='ori2')
            #for col in outputs_cols:
            #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
            #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
            plt.legend()
            plt.savefig(f'dt_data_api/data/ori_data.png', dpi=300)
            plt.show()

            # Plot the imputations
            #fig = plot(actual=x, imputed=x_hat)
            print('------------------A')
            #fig.write_image('birts_results.png', scale=4, height=900, width=700)
            #fig.write_image('dt_data_api/data/birts_results.png', scale=4, height=900, width=700)
            print('------------------B')
            
            self.data = x_hat

        except Exception as e:
            raise e
        return self.data   
    


class BRITS_Model(tf.keras.Model):
    def __init__(self, units, timesteps, features, optimizer, loss, metrics, optimizer_lr):
        super(BRITS_Model, self).__init__()
        self.units = units
        self.timesteps = timesteps
        self.features = features
        self.optimizer = optimizer
        self.meterics = metrics
        self.optimizer_lr=optimizer_lr
        self.loss = loss
        self.rits_forward = RITS(units=self.units)
        self.rits_backward = RITS(units=self.units)

    def call(self, inputs):
        forward_inputs = inputs[:, :, :, :3]
        backward_inputs = inputs[:, :, :, 3:]
        
        forward_imputations, _ = self.rits_forward(forward_inputs)
        backward_imputations, _ = self.rits_backward(backward_inputs)
        
        outputs = (forward_imputations + backward_imputations) / 2
        return outputs

    def train_step(self, data):
        with tf.GradientTape() as tape:
            forward_inputs = data[:, :, :, :3]
            backward_inputs = data[:, :, :, 3:]
            
            forward_imputations, forward_loss = self.rits_forward(forward_inputs)
            backward_imputations, backward_loss = self.rits_backward(backward_inputs)
            
            outputs = (forward_imputations + backward_imputations) / 2
            consistency_loss = tf.reduce_mean(tf.abs(forward_imputations - backward_imputations))
            
            total_loss = forward_loss + backward_loss + consistency_loss

        gradients = tape.gradient(total_loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(gradients, self.trainable_variables))

        return {"loss": total_loss}

    def prepare_data(self, x):
        self.x_min = np.nanmin(x, axis=0)
        self.x_max = np.nanmax(x, axis=0)
        x_scaled = (x - self.x_min) / (self.x_max - self.x_min)

        forward = get_inputs(x_scaled)
        backward = get_inputs(np.flip(x_scaled, axis=0))

        combined = np.concatenate([forward, backward], axis=-1)
        
        # Reshape the data to match the expected input shape
        num_samples = combined.shape[0]
        num_full_sequences = num_samples // self.timesteps
        
        reshaped_data = combined[:num_full_sequences*self.timesteps].reshape(
            (num_full_sequences, self.timesteps, self.features, 6)
        )
        
        return reshaped_data
    #def fit(self, x, y=None, batch_size=32, epochs=100, verbose=1, callbacks=None, validation_split=0., validation_data=None, shuffle=True, class_weight=None, sample_weight=None, initial_epoch=0, steps_per_epoch=None, validation_steps=None, validation_batch_size=None, validation_freq=1, max_queue_size=10, workers=1, use_multiprocessing=False):
    def fit(self, x, y=None, batch_size=32, epochs=100, callbacks=None, validation_data=None):
        data = self.prepare_data(x)
        dataset = tf.data.Dataset.from_tensor_slices(data)
        dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)
        '''
        if validation_split > 0:
            val_samples = int(validation_split * len(data))
            train_dataset = dataset.skip(val_samples)
            val_dataset = dataset.take(val_samples)
        el
        '''
        if validation_data is not None:
            val_data = self.prepare_data(validation_data[0])
            val_dataset = tf.data.Dataset.from_tensor_slices(val_data).batch(batch_size).prefetch(tf.data.AUTOTUNE)
            train_dataset = dataset
        else:
            train_dataset = dataset
            val_dataset = None

        return super().fit(
            train_dataset, 
            epochs=epochs, 
            callbacks=callbacks,
            validation_data=val_dataset,
        )
        '''
        return super().fit(
            train_dataset, 
            epochs=epochs, 
            verbose=verbose, 
            callbacks=callbacks,
            validation_data=val_dataset,
            shuffle=shuffle,
            class_weight=class_weight,
            sample_weight=sample_weight,
            initial_epoch=initial_epoch,
            steps_per_epoch=steps_per_epoch,
            validation_steps=validation_steps,
            validation_freq=validation_freq,
            max_queue_size=max_queue_size,
            workers=workers,
            use_multiprocessing=use_multiprocessing
        )
        '''

    def impute(self, x):
        data = self.prepare_data(x)
        dataset = tf.data.Dataset.from_tensor_slices(data).batch(1)

        imputed = tf.concat([self.predict(batch) for batch in dataset], axis=0).numpy()
        imputed = imputed.reshape(-1, self.features)  # Flatten the imputed data
        imputed = self.x_min + (self.x_max - self.x_min) * imputed

        return imputed[:x.shape[0]]  # Return only the required number of samples
    
   