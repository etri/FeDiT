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

    def modelTrainning(self):
        '''
        NAOMI 결측 보간
        '''

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
            scaled = scaler.fit_transform(self.data[scale_cols])
            #scaled = self.data[scale_cols] #테스트
            df = pd.DataFrame(scaled, columns=scale_cols)

            print('------------------B', scaled.shape)


            

            df1 = pd.read_csv("D:\\DT_FILE_TMP\\Test\\서인천IC-부평IC_평균속도.csv", encoding='CP949')
            df2 = pd.DataFrame()
            df2["date"] = pd.to_datetime(df1["date"], format="%Y%m%d%H%M")
            df2["value"] = df1["value"]
            
            scaled_ori = scaler.transform(df2[scale_cols])

            #데이터셋 생성
            # train_test_split을 사용하여 데이터 분할
            #np_mask = np.random.choice([0, 1], size=(len(scaled), len(scale_cols)), p=[0.2, 0.8])            



            np_scaled_ori = np.array(scaled_ori)
            np_scaled_zero = np.array(scaled)
            np_scaled_nan = np.array(scaled)
            np_scaled_nan[np_scaled_nan == ''] = np.nan
            np_scaled_zero[np_scaled_zero == ''] = 0

            # 데이터가 있는 곳은 1, 없는 곳은 0으로 변환
            np_mask = np.where(np.isnan(np_scaled_nan.astype(float)), 0, 1)

            np_scaled_zero = np.where(np_mask == 0, 0, np_scaled_zero)
            np_scaled_nan = np.where(np_mask == 0, np.nan, np_scaled_nan)
            np_scaled_mask = np_scaled_ori * np_mask


            #print('샘플데이터 X', np_scaled_nan)
            #print('샘플데이터 X_masked', np_scaled_mask)
            #print('샘플데이터 mask', np_mask)

 
            X_train, X_test, mask_train, mask_test, X_masked_train, X_masked_test, nan_train, nan_test, = train_test_split(
                np_scaled_ori, np_mask, np_scaled_mask, np_scaled_nan, test_size=self.test_size, random_state=42, shuffle=False
            )


            print(np_scaled_ori[:50])
            print(np_mask[:50])

            print('------------------C')            



            # 모델 생성 및 컴파일
            model = NAOMI(num_features=len(self.output_cols), hidden_units=self.units)

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


            model.compile(optimizer='adam', loss=naomi_loss, metrics=[rmse_metric])

            # 모델 학습
            #history = model.fit([X_masked_train, mask_train], epochs=self.epochs, batch_size=self.batch_size)
            #history = model.fit([X_masked_train, mask_train], [X_train, mask_train], epochs=self.epochs, batch_size=self.batch_size, validation_split=0.2)
            history = model.fit([np_scaled_mask, np_mask], [np_scaled_ori, np_mask], epochs=self.epochs, batch_size=self.batch_size, validation_split=0.2)

            # 모델 저장
            model.save(modelFile)

            # 모델 평가
            #evaluation = model.evaluate([X_masked_test, mask_test], [X_test, mask_test])
            evaluation = model.evaluate([np_scaled_mask, np_mask], [np_scaled_ori, np_mask])
            print(f"Test Loss: {evaluation[0]:.4f}")
            print(f"Test RMSE: {evaluation[1]:.4f}")

            # 테스트 데이터에 대한 예측
            #imputed_X, predicted_mask = model.predict([X_masked_test, mask_test])

            # 모델 불러오기
            loaded_model = tf.keras.models.load_model(modelFile, 
                                                    custom_objects={'NAOMI': NAOMI, 
                                                                    'naomi_loss': naomi_loss, 
                                                                    'rmse_metric': rmse_metric})

            # 불러온 모델로 평가
            #imputed_X, predicted_mask = loaded_model.predict([X_masked_test, mask_test])
            imputed_X, predicted_mask = loaded_model.predict([np_scaled_mask, np_mask])
            

            print('결과', imputed_X)

            print("\n원본 테스트 데이터 (일부):")
            print(X_test[:5])
            print("\n마스크 (일부):")
            print(mask_test[:5])
            print("\n결측치가 있는 테스트 데이터 (일부):")
            print(X_masked_test[:5])
            print("\n결측치 추정 결과 (일부):")
            print(imputed_X[:5])
            
            matplotlib.use('TkAgg')

            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(imputed_X[:,index], label=f'prediction')
                #plt.plot(np_scaled_nan[:,index], label=f'actual')
                plt.plot(np_scaled_ori[:,index], label=f'original')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + 'real_fake' + str(index) + '.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()

            


            '''
            #모델 생성
            model = NAOMI(num_inputs=len(self.feature_cols), num_units=self.units, num_outputs=len(self.output_cols))

            #성능옵션
            model.compile(loss='mse', optimizer='adam', metrics=["mse"])
            #input_shape = (None, self.window_size, features)
            #model.build(input_shape)

            #print(model.summary())

            print('------------------D')
            #earlystopping은 self.patience번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
            cb_earlystopping = EarlyStopping(monitor='val_loss', patience=self.patience)
            #val_loss 기준 bast 체크포인터 생성
            cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
            
            print('------------------D1')
            #self.estimater = Estimater()
            #batch_size = self.estimater.get_batch_size(model, train_data, self.batch_size)

            print('------------------D2')
            #모델학습
            hist = model.fit(train_data, train_data, epochs=self.epochs, batch_size=self.batch_size, validation_split=0.1, callbacks=[cb_checkpoint, cb_earlystopping])
            #hist = model.fit(train_data, validation_data=test_data, steps_per_epoch=len(train_data), validation_steps=len(test_data), epochs=self.epochs, callbacks=[cb_checkpoint, cb_earlystopping])

            print('------------------E')  
            #모델검증
            mse = model.evaluate(test_data)
            print("mse : ", mse)
            
            #학습 히스토리
            print('fit : ', hist)
            self.fitHistory(hist, fitHistoryFile)

            print('------------------F')
            #모델저
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
            print('hist', hist.history["loss"], hist.history["val_loss"])
            '''

    

            '''

            # 모델 생성 및 컴파일
            model = NAOMI(num_features=len(self.outputs_cols), hidden_units=self.units)

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

            model.compile(optimizer=optimizer, loss=naomi_loss, metrics=metrics)

            # 모델 학습
            history = model.fit([X_masked, mask], epochs=self.epochs, batch_size=self.batch_size, validation_split=0.2)

            # 모델 평가
            test_loss = model.evaluate(X, y)
            print(f"Test Loss: {test_loss}")


            loaded_model = tf.keras.models.load_model('naomi_model', custom_objects={'NAOMI': NAOMI, 'naomi_loss': naomi_loss, 'rmse_metric': rmse_metric})

            # 새로운 데이터에 대한 예측 (불러온 모델 사용)
            X_new = np.random.rand(10, 10)
            mask_new = np.random.choice([0, 1], size=(10, 10), p=[0.2, 0.8])
            X_new_masked = X_new * mask_new

            imputed_X, predicted_mask = loaded_model.predict([X_new_masked, mask_new])

            '''

            
            '''
            # 가상의 데이터 생성 (실제 사용시 실제 데이터로 대체)
            np.random.seed(0)
            X = np.random.rand(1000, 10)
            mask = np.random.choice([0, 1], size=(1000, 10), p=[0.2, 0.8])
            X_masked = X * mask

            np_X_nan = np.where(mask == 0, np.nan, X)

            # train_test_split을 사용하여 데이터 분할
            X_train, X_test, mask_train, mask_test, X_masked_train, X_masked_test, nan_train, nan_test = train_test_split(
                X, mask, X_masked, np_X_nan, test_size=0.2, random_state=42
            )

            print('샘플데이터 X', X)
            print('샘플데이터 X_masked', X_masked)
            print('샘플데이터 mask', mask)

            # 모델 생성 및 컴파일
            model = NAOMI(num_features=10, hidden_units=64)
            model.compile(optimizer='adam', loss=naomi_loss, metrics=[rmse_metric])

            # 모델 학습
            history = model.fit([X_masked_train, mask_train], [X_train, mask_train], 
                                epochs=100, batch_size=32)#, validation_split=0.2)

            # 모델 평가
            evaluation = model.evaluate([X_masked_test, mask_test], [X_test, mask_test])
            print(f"Test Loss: {evaluation[0]:.4f}")
            print(f"Test RMSE: {evaluation[1]:.4f}")

            # 테스트 데이터에 대한 예측
            imputed_X, predicted_mask = model.predict([X_masked_test, mask_test])

            print("\n원본 테스트 데이터 (일부):")
            print(X_test[:5])
            print("\n마스크 (일부):")
            print(mask_test[:5])
            print("\n결측치가 있는 테스트 데이터 (일부):")
            print(X_masked_test[:5])
            print("\n결측치 추정 결과 (일부):")
            print(imputed_X[:5])

            # 모델 저장
            model.save('naomi_model')

            # 모델 불러오기
            loaded_model = tf.keras.models.load_model('naomi_model', 
                                                    custom_objects={'NAOMI': NAOMI, 
                                                                    'naomi_loss': naomi_loss, 
                                                                    'rmse_metric': rmse_metric})

            # 불러온 모델로 평가
            #loaded_evaluation = loaded_model.evaluate([X_masked_test, mask_test], [X_test, mask_test])
            #print(f"\nLoaded Model - Test Loss: {loaded_evaluation[0]:.4f}")
            #print(f"Loaded Model - Test RMSE: {loaded_evaluation[1]:.4f}")
            X_new = np.random.rand(100, 10)
            mask_new = np.random.choice([0, 1], size=(100, 10), p=[0.2, 0.8])
            X_new_masked = X_new * mask_new

            np_new_nan = np.where(mask_new == 0, np.nan, X_new)

            imputed_X, predicted_mask = loaded_model.predict([X_new_masked, mask_new])
            
            print('결과', imputed_X)


            matplotlib.use('TkAgg')

            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(imputed_X[:,index], label=f'prediction')
                #plt.plot(np_scaled_nan[:,index], label=f'actual')
                plt.plot(X_new[:,index], label=f'original')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + 'real_fake' + str(index) + '.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()
            '''
            




            '''
            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                plt.plot(imputed_X[:,index], label=f'prediction')
                #plt.plot(X_test[:,index], label=f'actual')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + '_fake' + str(index) + '.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()

            for index in range(len(self.output_cols)):
                plt.figure(figsize=(12, 9))
                #plt.plot(imputed_X[:,index], label=f'prediction')
                plt.plot(nan_test[:,index], label=f'actual')
                #for col in outputs_cols:
                #    plt.plot(np.asarray(df_hat[col])[0:data_size], label='prediction' + col)                
                #    plt.plot(np.asarray(self.data[col])[0:data_size], label='actual' + col)                
                plt.legend()
                savePltFile = os.path.join(self.filepath, self.filename + '_real' + str(index) + '.png')
                plt.savefig(savePltFile, dpi=300)
                plt.show()                

            '''

            result = {'fit':None}            
            #result['y_pred'] = pred
            #result['fit'] = hist.history
            #result['evaluate_loss'] = mse[0]
            #result['evaluate_acc'] = mse[1]
            #print('hist', hist.history["loss"], hist.history["val_loss"])

        except Exception as e:
            raise e
        return result


import tensorflow as tf
import numpy as np
from sklearn.model_selection import train_test_split

class NAOMI(tf.keras.Model):
    def __init__(self, num_features, hidden_units):
        super(NAOMI, self).__init__()
        self.num_features = num_features
        self.hidden_units = hidden_units
        
        self.pattern_network = tf.keras.Sequential([
            tf.keras.layers.Dense(hidden_units, activation='relu'),
            tf.keras.layers.Dense(hidden_units, activation='relu'),
            tf.keras.layers.Dense(num_features, activation='sigmoid')
        ])
        
        self.imputation_network = tf.keras.Sequential([
            tf.keras.layers.Dense(hidden_units, activation='relu'),
            tf.keras.layers.Dense(hidden_units, activation='relu'),
            tf.keras.layers.Dense(num_features, activation='sigmoid')
        ])

    def call(self, inputs):
        x, mask = inputs
        
        mask = tf.cast(mask, tf.float32)

        predicted_mask = self.pattern_network(x * mask)
        imputed_values = self.imputation_network(x * mask)
        
        output = x * mask + imputed_values * (1 - mask)
        
        return output, predicted_mask

    def get_config(self):
        config = super().get_config()
        config.update({
            "num_features": self.num_features,
            "hidden_units": self.hidden_units
        })
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

def naomi_loss(y_true, y_pred):
    # y_true를 float32로 변환
    x = tf.cast(y_true[0], tf.float32)
    mask = tf.cast(y_true[1], tf.float32)

    # y_pred는 이미 float32로 되어 있으므로 변환 불필요
    imputed_x = y_pred[0]
    predicted_mask = y_pred[1]
    
    # 결측치에 대한 재구성 손실 계산
    reconstruction_loss = tf.reduce_mean(tf.square(x - imputed_x) * (1 - mask))
    
    # 패턴 손실 (mask와 예측된 mask 간의 차이)
    pattern_loss = tf.reduce_mean(tf.square(mask - predicted_mask))
    
    return reconstruction_loss + pattern_loss

def rmse_metric(y_true, y_pred):
    # y_true를 float32로 변환
    x = tf.cast(y_true[0], tf.float32)
    mask = tf.cast(y_true[1], tf.float32)

    # y_pred는 이미 float32로 되어 있으므로 변환 불필요
    imputed_x = y_pred[0]
    predicted_mask = y_pred[1]
    # 결측치에 대해서만 RMSE 계산
    return tf.sqrt(tf.reduce_mean(tf.square((x - imputed_x) * (1 - mask))))

'''
class NAOMI(tf.keras.Model):
    def __init__(self, num_inputs, num_units, num_outputs):
        super(NAOMI, self).__init__()
        self.num_inputs = num_inputs
        self.num_units = num_units
        self.num_outputs = num_outputs
        
        # 각 입력 특성에 대한 신경망 생성
        self.feature_nets = [
            tf.keras.Sequential([
                tf.keras.layers.Dense(num_units, activation='relu'),
                tf.keras.layers.Dense(num_units, activation='relu'),
                tf.keras.layers.Dense(num_outputs)
            ]) for _ in range(num_inputs)
        ]
        
        # 최종 출력을 위한 가중치
        self.output_weights = self.add_weight(
            shape=(num_inputs, num_outputs),
            initializer='random_normal',
            trainable=True
        )

    def call(self, inputs):
        # 각 특성에 대해 신경망 적용
        feature_outputs = [net(inputs[:, i:i+1]) for i, net in enumerate(self.feature_nets)]
        
        # 특성 출력 결합
        combined_output = tf.stack(feature_outputs, axis=1)
        
        # 가중치를 적용하여 최종 출력 계산
        weighted_output = combined_output * self.output_weights
        final_output = tf.reduce_sum(weighted_output, axis=1)
        
        return final_output

# Encoder-Decoder 구조를 활용한 NAOMI 모델 구성
class NaomiImputer(tf.keras.Model):
    def __init__(self, hidden_units):
        super(NaomiImputer, self).__init__()
        
        # LSTM Encoder
        self.encoder_lstm = LSTM(hidden_units, return_sequences=True, return_state=True)
        
        # LSTM Decoder
        self.decoder_lstm = LSTM(hidden_units, return_sequences=True, return_state=True)
        
        # Dense Layer for final prediction
        self.dense = Dense(1)  # Output for imputed values (1 value per timestep)

    def call(self, input_sequence, missing_mask):
        # Encoder step: Get hidden states from LSTM
        encoder_outputs, state_h, state_c = self.encoder_lstm(input_sequence)
        
        # Apply missing mask to decoder input (mask out missing parts in the sequence)
        masked_input = input_sequence * missing_mask
        
        # Decoder step: Use masked inputs to predict missing values
        decoder_outputs, _, _ = self.decoder_lstm(masked_input, initial_state=[state_h, state_c])
        
        # Dense layer to output the imputed sequence
        imputed_values = self.dense(decoder_outputs)
        
        return imputed_values
    

class NAOMILayer(tf.keras.layers.Layer):
    def __init__(self, num_features, num_units):
        super(NAOMILayer, self).__init__()
        self.num_features = num_features
        self.num_units = num_units
        self.feature_nets = [tf.keras.Sequential([
            tf.keras.layers.Dense(num_units, activation='relu'),
            tf.keras.layers.Dense(1)
        ]) for _ in range(num_features)]

    def call(self, inputs):
        outputs = []
        for i, net in enumerate(self.feature_nets):
            outputs.append(net(inputs[:, i:i+1]))
        return tf.concat(outputs, axis=-1)

class NAOMIModel(tf.keras.Model):
    def __init__(self, num_features, num_units):
        super(NAOMIModel, self).__init__()
        self.naomi_layer = NAOMILayer(num_features, num_units)
        self.output_layer = tf.keras.layers.Dense(1)

    def call(self, inputs):
        x = self.naomi_layer(inputs)
        return self.output_layer(x)
'''

