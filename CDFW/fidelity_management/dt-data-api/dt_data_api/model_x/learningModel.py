import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import os
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split

from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout
from tensorflow.keras.losses import Huber
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

from dt_data_api.model_x import fidscore
#from dt_data_api.common.lib import (MODEL_PATH)
from dt_data_api.common.settings import MODEL_PATH

class manager:
    WINDOW_SIZE = 10 #과거 데이터 수 (값을 기준으로 예측)
    BATCH_SIZE = 32  #학습 분할 수 
    MODEL_FILE_PATH = MODEL_PATH #모델 기본 저장 경로
    data = pd.DataFrame

    '''
    초기화
    '''
    def __init__(self, data=None) -> None:
        self.data = data
    
    '''
    데이터 설정
    '''
    def setData(self, data=None):
        self.data = data
    
    '''
    모델적용 데이터
    '''
    def windowed_dataset(self, series, window_size, batch_size, shuffle):
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
    모델학습
    fileName: 생성모델 파일명
    column: 학습항목
    '''
    def modelTrainning(self, fileName, column):
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

        try:
            #정규화(0~1변환)
            scaler = MinMaxScaler()
            print(self.data[:20])
            
            scale_cols = []
            for c in self.data.columns:
                scale_cols.append(c)
            print(scale_cols)
            
            #scale_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50','w60']
            scaled = scaler.fit_transform(self.data[scale_cols])
            #print(scaled[:20])
            
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            print('------------------A')
            
            #학습/검증 데이터 추출
            x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df[column], df[column], test_size=0.2, random_state=0, shuffle=False)
            #print(x_test)
            #print(y_test)
            print('------------------B')

            #모델적용 데이터셋 생성
            train_data = self.windowed_dataset(y_train, self.WINDOW_SIZE, self.BATCH_SIZE, True)
            test_data = self.windowed_dataset(y_test, self.WINDOW_SIZE, self.BATCH_SIZE, False)

            print('------------------C')
            
            #모델설정
            model = self.setModel()

            print('------------------D')
            print(model)
            
            #성능옵션
            model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
            #model.compile(loss=Huber(), optimizer=Adam(0.0005), metrics=['accuracy'])

            print('------------------E')
            print(model)

            #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
            earlystopping = EarlyStopping(monitor='val_loss', patience=10)
            #val_loss 기준 체크포인터 생성
            filename = os.path.join(self.MODEL_FILE_PATH + 'tmp\\', fileName + '_ckeckpointer.ckpt.weights.h5')
            checkpoint = ModelCheckpoint(filename, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
            
            #모델학습
            hist = model.fit(train_data, validation_data=(test_data), epochs=50, callbacks=[checkpoint, earlystopping])
            
            #모델검증
            mse = model.evaluate(test_data)
            print("mse : ", mse)
            #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))
            self.fitHistory(hist, fileName)

            model.save(self.MODEL_FILE_PATH + fileName)
            pred = model.predict(test_data)
            print(test_data)
            print('------------------F')
            #print(pred)        
        except Exception as e:
            raise e

    '''
    모델설정
    '''
    def setModel(self):
        try:
            #LSTM
            model = Sequential([
                # 1차원 feature map 생성
                Conv1D(filters=32, 
                    kernel_size=5,
                    padding="causal",
                    activation="relu",
                    input_shape=[self.WINDOW_SIZE, 1]),
                # LSTM
                LSTM(16, activation='tanh'),
                #GRU(16, activation='tanh'),
                Dense(16, activation="relu"),
                Dense(1),
            ])
        except Exception as e:
            raise e
        return model

    '''
    학습결과
    '''
    def fitHistory(self, hist, fileName):
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
            plt.savefig(self.MODEL_FILE_PATH + fileName + '_history.png', dpi=300)
        except Exception as e:
            raise e

    '''
    예측데이터 추출
    fileName: 모델파일
    data: 기준데이터
    column: 예측항목
    windowSize: 예측적용 데이터 수
    '''
    def dataGenerater(self, fileName, data, column, windowSize=10):
        try:
            print("--------A")
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
            print(model.summary())
            print(data)

            print("--------B")
            #컬럼추출
            scale_cols = []
            cols_blank = []
            for c in data.columns:
                cols_blank.append(0)
                scale_cols.append(c)
            print(scale_cols)

            print("--------C")
            #정규화(0~1변환)
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[column])
            
            print("--------D")
            #모델적용 데이터셋 생성
            test_dt = self.windowed_dataset(df[column], windowSize, self.BATCH_SIZE, False)
            print(test_dt)

            print("--------E")
            #예측 데이터 추출
            pred = model.predict(test_dt)
            print(pred)

            #fid score
            #f = fidscore.fid(None,None)
            #f.createRecurrence(df[column], pred)
            #score = f.exportScore()
            #print('----score')
            #print(score)

            print("--------F")
            #예측값 월래 값 변환
            result = self.predictInverse(scaler, cols_blank, pred)
            print(result)
        

            '''
            y_predict_inverse = []
            for y in pred:
                cols_blank[-1] = y[0]
                #inverse = scaler.inverse_transform([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, y[0]]])
                inverse = scaler.inverse_transform([cols_blank])
                y_inverse = inverse.flatten()[-1]
                y_predict_inverse.append(y_inverse)
            print(y_predict_inverse)
            '''
            #print("--------C")
        except Exception as e:
            raise e            
        return result
    
    '''
    예측 데이터 월래 값 변환
    scaler: 정규화 모듈
    cols: 변환컬럼
    predict: 예측 데이터
    '''
    def predictInverse(self, scaler, cols, predict):
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
            print(result)
        except Exception as e:
            raise e
        return result

    '''
    예측데이터 FID 스코어 산정
    '''
    def dataGeneraterFID(self, fileName, data, column, windowSize=10):
        try:
            print("--------A")
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
            print(model.summary())
            print(data)

            print("--------B")
            #컬럼추출
            scale_cols = []
            cols_blank = []
            cols_no = 0
            no = 0
            for c in data.columns:
                cols_blank.append(0)
                scale_cols.append(c)
                if c==column:
                     cols_no = no
                no = no + 1

            print(scale_cols)

            print("--------C")
            #정규화(0~1변환)
            print(data[scale_cols][:20])
            scaler = MinMaxScaler()
            #scaler = RobustScaler()
            #scaler = StandardScaler()
            scaled = scaler.fit_transform(data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            #print(df[column])
            
            print("--------D")
            #모델적용 데이터셋 생성
            test_dt = self.windowed_dataset(df[column], windowSize, self.BATCH_SIZE, False)
            print(test_dt)

            print("--------E")
            #예측 데이터 추출
            pred = model.predict(test_dt)
            print(pred)
            
            #시계열 이미지 변환 및 FID score 산정
            f = fidscore.fid(df[column], pred)
            result = f.createRecurrence(count=1000)
            
            #실제값 변환
            print("--------G")
            #scaler.min_, scaler.scale_ = scaler.min_[cols_no], scaler.scale_[cols_no]
            #scaler.center_, scaler.scale_ = scaler.center_[0], scaler.scale_[0]
            #scaler.mean_, scaler.scale_ = scaler.mean_[0], scaler.scale_[0]
            #result = self.predictInverse(scaler, cols_blank, pred)
            #f = fidscore.fid(data[column], result)
            #result1 = f.createRecurrence(count=100)
            #print(result1)
            

            #score = f.exportScore()
            #print('----score')
            #print(score)
        except Exception as e:
            raise e
        return result