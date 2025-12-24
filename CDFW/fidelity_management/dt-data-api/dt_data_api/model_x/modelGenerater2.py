import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import os
import copy
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split

from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout, Flatten, Reshape
from tensorflow.keras.losses import Huber
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

from dt_data_api.model_x import fidscore, interpolation, fillna
from dt_data_api.common.settings import MODEL_PATH
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE

class manager:
    WINDOW_SIZE = 24 #과거 데이터 수 (값을 기준으로 예측)
    BATCH_SIZE = 32  #학습 분할 수 
    MODEL_FILE_PATH = MODEL_PATH #모델 기본 저장 경로
    data = pd.DataFrame

    '''
    초기화
    '''
    def __init__(self, data=None, window_size=24) -> None:
        self.data = data
        self.WINDOW_SIZE = window_size
    
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
    모델적용 데이터
    독립/종속 모두 적용
    '''
    def windowed_dataset2(self, xy, window_size, batch_size, shuffle):
        try:
            x = xy[0]
            y = xy[1]
            ds_x = tf.data.Dataset.from_tensor_slices(x)
            ds_x = ds_x.window(window_size, shift=1, drop_remainder=True)
            ds_x = ds_x.flat_map(lambda x: x.batch(window_size))
            #추가
            ds_x = ds_x.map(lambda x: tf.expand_dims(x, axis=-1))
            ###

            ds_y = tf.data.Dataset.from_tensor_slices(y[window_size:])
            #추가
            ds_y = ds_y.map(lambda x: tf.expand_dims(x, axis=-1))
            ####
            ds = tf.data.Dataset.zip((ds_x, ds_y))
            if shuffle:
                ds = ds.shuffle(1000)            
        except Exception as e:
            raise e
        return ds.batch(batch_size).prefetch(1)            

    '''
    모델학습
    fileName: 생성모델 파일명
    outputs_cols: 종속변수
    features_cols: 독립변수 (종속변수 데이터 생산에 영향)
    '''
    def modelTrainning(self, fileName, outputs_cols, features_cols, is_indpds, outputs_size):
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

        try:
            print('------------------A')
            #컬럼생성
            scale_cols = []
            for c in self.data.columns:
                scale_cols.append(c)
            print(scale_cols)

            print('------------------B')
            #정규화(0~1변환)
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            print('------------------C')
            #종속/독립변수 지정
            outputs_df = df[outputs_cols]
            features_df = df[features_cols]
            for col in outputs_cols:
                outputs_df.drop(col, 1)
            print(outputs_df)
            print(features_df)

            print('------------------D')
            #학습/검증 데이터 추출
            x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=0.2, random_state=0, shuffle=False)
            #x_train, x_test, y_train, y_test = train_test_split(df.drop(column, 1), df[column], test_size=0.2, random_state=0, shuffle=False)
            print(x_test)
            print(y_test)
            
            print('------------------E')
            #모델적용 데이터셋 생성
            if is_indpds:
                #독립변수 데이터 생성
                train_data = self.windowed_dataset2((x_train, y_train), self.WINDOW_SIZE, self.BATCH_SIZE, True)
                test_data = self.windowed_dataset2((x_test, y_test), self.WINDOW_SIZE, self.BATCH_SIZE, False)
            else:
                #종속변수로 데이터 생성 (setModel-input_shape = 1 고정)
                train_data = self.windowed_dataset(y_train, self.WINDOW_SIZE, self.BATCH_SIZE, True)
                test_data = self.windowed_dataset(y_test, self.WINDOW_SIZE, self.BATCH_SIZE, False)
            
            print(train_data)
            print(test_data)

            print('------------------F')            
            #모델설정
            if is_indpds:
                #독립변수 모델생성
                model = self.setModel(len(features_cols), len(outputs_cols), outputs_size)
            else:
                #종속변수로 모델생성 (입출력값은 동일해야함)
                model = self.setModel(len(outputs_cols), len(outputs_cols), outputs_size)
            
            print(len(features_cols), len(outputs_cols))
            
            print('------------------G')
            #성능옵션
            model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
            #model.compile(loss=Huber(), optimizer=Adam(0.0005), metrics=['accuracy'])
            print(model.summary())

            print('------------------H')
            #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
            earlystopping = EarlyStopping(monitor='val_loss', patience=10)
            #val_loss 기준 체크포인터 생성
            filename = os.path.join(self.MODEL_FILE_PATH + 'tmp\\', fileName + '_ckeckpointer.ckpt.weights.h5')
            checkpoint = ModelCheckpoint(filename, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
            
            #모델학습
            hist = model.fit(train_data, validation_data=(test_data), epochs=100, callbacks=[checkpoint, earlystopping])
            
            print('------------------I')
            #모델검증
            mse = model.evaluate(test_data)
            print("mse : ", mse)
            #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))
            self.fitHistory(hist, fileName)

            print('------------------J')
            #모델저장
            model.save(self.MODEL_FILE_PATH + fileName)
            pred = model.predict(test_data)
            print(test_data)
            print(pred)        

        except Exception as e:
            raise e

    '''
    모델설정
    '''
    def setModel(self, features, outputs, outputs_num):
        try:
            #LSTM
            model = Sequential([
                # 1차원 feature map 생성
                Conv1D(filters=32, 
                    kernel_size=5,
                    padding="causal",
                    activation="relu",
                    input_shape=[self.WINDOW_SIZE, features]),
                # LSTM
                LSTM(16, activation='tanh', return_sequences=True),
                #LSTM(16, activation='tanh', return_sequences=True, return_state=True),
                #GRU(16, activation='tanh'),
                Flatten(),
                Dense(16, activation="relu"),
                #Dense(outputs*outputs_num),
                #Dense(3),
                #Dense([2,2]),
                #Reshape((3, 1))
                #Dense(2),
                #Dense((2,2)), 
                Dense(outputs*outputs_num),
                Reshape((outputs, outputs_num))
                #Reshape((outputs, outputs_num, 1))                            
            ])

            #LSTM(16, activation='tanh', return_sequences=True),
            #Flatten(),
            #Dense(16, activation="relu"),
            #Dense(outputs*outputs_num),
            #Reshape((outputs, outputs_num))
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
    outputs_cols: 종속변수
    windowSize: 예측적용 데이터 수
    '''
    def dataGenerater(self, fileName, outputs_cols, features_cols, is_indpds):
        try:
            print("--------A")
            #모델로드
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
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
                for col in outputs_cols:
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
            print(df[outputs_cols])
            
            print("--------D")
            #모델적용 데이터셋 생성
            if is_indpds:
                #독립변수 데이터 생성
                test_dt = self.windowed_dataset2((df[features_cols], df[outputs_cols]), self.WINDOW_SIZE, self.BATCH_SIZE, False)
            else:
                #종속변수 데이터 생성
                test_dt = self.windowed_dataset(df[outputs_cols], self.WINDOW_SIZE, self.BATCH_SIZE, False)
            
            print(test_dt)

            print("--------E")
            #예측 데이터 추출
            pred = model.predict(test_dt)
            print(pred)
            #print(pred[:,1].reshape(-1,1))
            
            #예측값 월래 값 변환 (테스트 필요)
            output_df = pd.DataFrame(columns=outputs_cols)            
            for i in range(len(outputs_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[outputs_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))
            
            print(output_df)
            result = output_df

        except Exception as e:
            raise e            
        return result
    
    '''
    예측 데이터 추출
    '''
    def dataGeneraterPredict(self, fileName, outputs_cols, features_cols, outputs_size):
        try:
            print("--------A")
            #모델로드
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
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
                for col in outputs_cols:
                    if c==col:
                        cols_nos.append(no)
                for fcol in features_cols:
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
            dy = np.copy(scaled[-self.WINDOW_SIZE:, cols_nos])
            print(dy)

            print("--------E")
            #결과데이터 생성
            estimate = []            
            for i in range(outputs_size):
                py = dy[-self.WINDOW_SIZE:].reshape(1, self.WINDOW_SIZE, len(cols_nos))
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
            output_df = pd.DataFrame(columns=outputs_cols)            
            for i in range(len(outputs_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
                output_df[outputs_cols[i]] = self.predictInverse(scr, cols_blank, pred_ar[:,i].reshape(-1,1))
            
            print(output_df)
            result = output_df
            
        except Exception as e:
            raise e            
        return result

    '''
    예측 데이터 추출
    '''
    def dataGeneraterPredict2(self, fileName, outputs_cols, features_cols, outputs_size, is_indpds):
        try:
            print("--------A")
            #모델로드
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
            print(model.summary())
            print(self.data)
            #self.data = self.data[:13]
            
            print("--------B")
            #컬럼추출
            scale_cols = []
            cols_blank = []
            cols_nos = []
            no = 0
            for c in self.data.columns:
                cols_blank.append(0)
                scale_cols.append(c)
                for col in outputs_cols:
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
            #print(df[outputs_cols])
            #print(len(scaled[-self.WINDOW_SIZE:]))
            
            #df = df.tail(self.WINDOW_SIZE+1)
            #print(len(df))
            if is_indpds:
                test_dt = self.windowed_dataset2((df[features_cols], df[outputs_cols]), self.WINDOW_SIZE, self.BATCH_SIZE, False)
            else:
                test_dt = self.windowed_dataset(df[outputs_cols], self.WINDOW_SIZE, self.BATCH_SIZE, False)
            print(test_dt)
            pred = model.predict(test_dt)
            print(pred)
            #print(pred[:,].reshape(-1))

            print("--------F")
            #결과데이터 변환
            
            #추론값 컬럼 생성
            #pred_cols = copy.deepcopy(outputs_cols)     
            pred_cols = []
            for i in range(len(outputs_cols)):
                pred_cols.append(outputs_cols[i])   
                for j in range(outputs_size-1):
                    pred_cols.append(outputs_cols[i] + '_' + str(j))   

            print(pred_cols)
            print(outputs_cols)
            #print(pred[:, 0][0])                        
            pred = np.reshape(pred, (-1, len(outputs_cols)*outputs_size))
            #print(pred[:, 0].reshape(-1))
            #####

            output_df = pd.DataFrame(columns=pred_cols)             
            for i in range(len(pred_cols)):
                output_df[pred_cols[i]] = pred[:, i].reshape(-1)
                #output_df[outputs_cols[i]] = pred[i]               
                #output_df[outputs_cols[i]] = pred[:, i].reshape(-1)
            
            print(df[outputs_cols])
            print(output_df[outputs_cols])
            
            #추론값 컬럼 확인
            print(output_df[pred_cols])
            #####

            print("--------G")
            #시계열 이미지 변환 및 FID score 산정
            f = fidscore.fid(realData=df[outputs_cols], fakeData=output_df[outputs_cols], windowSize=self.WINDOW_SIZE)
            result = f.createRecurrence2(outputs_cols, count=50)
            
            print("--------H")
            #실제값 변환
            '''
            output_df1 = pd.DataFrame(columns=pred_cols)
            for i in range(len(outputs_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]
                for j in range(outputs_size):
                    if j==0:
                        output_df1[outputs_cols[i]] = self.predictInverse(scr, cols_blank, np.reshape(np.array(output_df[outputs_cols[i]]), (-1,1)))
                    else:
                        output_df1[outputs_cols[i] + '_' + str(j-1)] = self.predictInverse(scr, cols_blank, np.reshape(np.array(output_df[outputs_cols[i] + '_' + str(j-1)]), (-1,1)))
            '''
            
            output_df1 = pd.DataFrame(columns=pred_cols)
            cols_nos = [num for num in cols_nos for _ in range(outputs_size)]
            for i in range(len(pred_cols)):
                scr = copy.deepcopy(scaler)
                scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]              
                output_df1[pred_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))

            #print(output_df1)
            result = output_df1

            #실제값 변환
            #output_df1 = pd.DataFrame(columns=outputs_cols)            
            #for i in range(len(outputs_cols)):
            #    scr = copy.deepcopy(scaler)
            #    scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
            #    output_df1[outputs_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))

            #f = fidscore.fid(realData=self.data[outputs_cols], fakeData=output_df1[outputs_cols], windowSize=self.WINDOW_SIZE)
            #result = f.createRecurrence2(outputs_cols, count=100)
            
            #print(result)
            
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
            #print(result)
        except Exception as e:
            raise e
        return result

    '''
    예측 데이터 월래 값 변환
    scaler: 정규화 모듈
    cols: 변환컬럼
    predict: 예측 데이터
    '''
    def predictInverse2(self, scaler, cols, predict):
        result = []
        try:
            for y in predict:
                print(y[0])
                
                #cols[8] = y[0] #if y[0] < 1 else y[0]-1
                #print(cols)
                #inverse = scaler.inverse_transform([cols])
                #y_inverse = inverse.flatten()[-1]
                #result.append(round(y_inverse, 1))                
            #print(result)
        except Exception as e:
            raise e
        return result


    '''
    예측데이터 FID 스코어 산정
    fileName: 모델파일
    outputs_cols: 종속변수
    windowSize: 예측적용 데이터 수
    '''
    def dataGeneraterFID(self, fileName, outputs_cols, features_cols, is_indpds):
        try:
            print("--------A")
            #모델로드
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
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
                for col in outputs_cols:
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
            print(df[outputs_cols][:745])
            
            print("--------D")
            #모델적용 데이터셋 생성
            if is_indpds:
                #독립변수 데이터 생성
                test_dt = self.windowed_dataset2((df[features_cols], df[outputs_cols]), self.WINDOW_SIZE, self.BATCH_SIZE, False)
            else:
                #종속변수 데이터 생성
                test_dt = self.windowed_dataset(df[outputs_cols][:745], self.WINDOW_SIZE, self.BATCH_SIZE, False)
            
            print(test_dt)
            
            print("--------E")
            #예측 데이터 추출
            pred = model.predict(test_dt)
            print(pred)
            
            #print(pred[:,0].reshape(-1))
            #print(pred[:,0])
            #return None

            print("--------F")
            #결과데이터 변환
            output_df = pd.DataFrame(columns=outputs_cols) 
            for i in range(len(outputs_cols)):
                #output_df[outputs_cols[i]] = pred[:, i].reshape(-1)
                output_df[outputs_cols[i]] = pred[i]               
            
            print(df[outputs_cols])
            print(output_df[outputs_cols])
            
            print("--------G")
            #시계열 이미지 변환 및 FID score 산정
            #f = fidscore.fid(realData=df[outputs_cols], fakeData=output_df[outputs_cols], windowSize=self.WINDOW_SIZE)
            f = fidscore.fid(realData=df[outputs_cols][:755], fakeData=output_df[outputs_cols], windowSize=self.WINDOW_SIZE)
            result = f.createRecurrence2(outputs_cols, count=744)
            
            print("--------H")
            #실제값 변환
            #output_df1 = pd.DataFrame(columns=outputs_cols)            
            #for i in range(len(outputs_cols)):
            #    scr = copy.deepcopy(scaler)
            #    scr.min_, scr.scale_ = scr.min_[cols_nos[i]], scr.scale_[cols_nos[i]]                
            #    output_df1[outputs_cols[i]] = self.predictInverse(scr, cols_blank, pred[:,i].reshape(-1,1))

            #f = fidscore.fid(realData=self.data[outputs_cols], fakeData=output_df1[outputs_cols], windowSize=self.WINDOW_SIZE)
            #result = f.createRecurrence2(outputs_cols, count=100)
            
            #print(result)
        except Exception as e:
            raise e
        return result