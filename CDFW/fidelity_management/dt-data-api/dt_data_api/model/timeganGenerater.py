import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import os
from os import path
import copy
import math
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_log_error

from tensorflow import keras
from tensorflow.keras import Input, Sequential
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.losses import MeanAbsoluteError, Huber

from dt_data_api.model import fid
from dt_data_api.common.settings import MODEL_PATH

from .timeGAN.utils import real_data_loading
from .timeGAN.model import TimeGAN
from .timeGAN.gan import ModelParameters

class Manager:
    '''
    Time GAN
    ---
    Time GAN 모델을 활용하여 학습
    '''
    WINDOW_SIZE = 24 #과거 데이터 수 (값을 기준으로 예측)
    BATCH_SIZE = 32  #학습 분할 수 
    MODEL_FILE_PATH = MODEL_PATH #모델 기본 저장 경로
    data = pd.DataFrame
    
    seq_len=24
    n_seq=4 #6 #14
    hidden_dim=24
    gamma=1
    units=12

    noise_dim=32
    dim=128
    batch_size=128

    train_steps=5000
    log_step=100
    learning_rate=5e-4

    gan_args = ModelParameters(batch_size=batch_size, lr=learning_rate, noise_dim=noise_dim, layers_dim=dim)

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
    
    def modelTrainninSynthetic(self, fileName, item):
        #gpus = tf.config.experimental.list_physical_devices('GPU')
        #tf.config.experimental.set_memory_growth(gpus, True)

        # gpu 이름
        gpus = tf.config.experimental.list_logical_devices('GPU')

        # gpu가 2개 이상이면, MirroredStrategy 인스턴스 생성
        if len(gpus) > 1: 
            strategy = tf.distribute.MirroredStrategy([gpu.name for gpu in gpus])

        # gpu가 1개 이하면, 디폴트 전략 설정
        else:
            strategy = tf.distribute.get_strategy() # default strategy that works on CPU and single GPU

        self.data = self.data[item]
        real_data = real_data_loading(self.data.values, seq_len=self.seq_len)
        print(len(real_data), real_data[0].shape)
        #print(stock_data[:2])

        with strategy.scope():
            if path.exists(self.MODEL_FILE_PATH + fileName):
                synth = TimeGAN.load(self.MODEL_FILE_PATH + fileName)
            else:
                synth = TimeGAN(model_parameters=self.gan_args, hidden_dim=self.hidden_dim, seq_len=self.seq_len, n_seq=self.n_seq, gamma=self.gamma)
                synth.train(real_data, train_steps=self.train_steps)
                synth.save(self.MODEL_FILE_PATH + fileName)

            synth_data = synth.sample(n_samples=len(real_data))
            print(synth_data.shape)        
            print(len(synth_data), synth_data[0].shape)
            
            #GAN 데이터 평가
            self.evaluationSyntheticData(real_data, synth_data)

            #GAN 평가
            self.evaluationSynthetic(real_data, synth_data)

            #예측모델
            self.modelTrainning(real_data, synth_data, fileName)
        
    
    def evaluationSyntheticData(self, real_data, synth_data):
        cols = []
        for c in self.data.columns:
            cols.append(c)

        print(cols) 
        #cols = ['Open','High','Low','Close','Adj Close','Volume']

        fig, axes = plt.subplots(nrows=int(math.ceil(len(cols)/2)), ncols=2, figsize=(15, 10))        
        #fig, axes = plt.subplots(nrows=7, ncols=2, figsize=(15, 10))
        axes=axes.flatten()

        #time = list(range(1,25))
        obs = np.random.randint(len(real_data))

        for j, col in enumerate(cols):
            df = pd.DataFrame({'Real': real_data[obs][:, j], 'Synthetic': synth_data[obs][:, j]})
            df.plot(ax=axes[j], title = col, secondary_y='Synthetic data', style=['-', '--'])            
        fig.tight_layout()        
        fig.savefig('dt_data_api/data/gan_data.png')

    def evaluationSynthetic(self, real_data, synth_data):
        sample_size = 250
        idx = np.random.permutation(len(real_data))[:sample_size]

        real_sample = np.asarray(real_data)[idx]
        synthetic_sample = np.asarray(synth_data)[idx]

        synth_data_reduced = real_sample.reshape(-1, self.seq_len)
        real_data_reduced = np.asarray(synthetic_sample).reshape(-1, self.seq_len)

        n_components = 2
        pca = PCA(n_components=n_components)
        tsne = TSNE(n_components=n_components, n_iter=300)

        pca.fit(real_data_reduced)

        pca_real = pd.DataFrame(pca.transform(real_data_reduced))
        pca_synth = pd.DataFrame(pca.transform(synth_data_reduced))

        data_reduced = np.concatenate((real_data_reduced, synth_data_reduced), axis=0)
        tsne_results = pd.DataFrame(tsne.fit_transform(data_reduced))

        #PCA/TSNE 평가 그래프
        self.evaluationSyntheticPlot(pca_real, pca_synth, tsne_results, sample_size)
    
    def evaluationSyntheticPlot(self, pca_real, pca_synth, tsne_results, sample_size):
        fig = plt.figure(constrained_layout=True, figsize=(20,10))
        spec = gridspec.GridSpec(ncols=2, nrows=1, figure=fig)

        #TSNE scatter plot
        ax = fig.add_subplot(spec[0,0])
        ax.set_title('PCA results', fontsize=20, color='red', pad=10)

        #PCA scatter plot
        plt.scatter(pca_real.iloc[:, 0].values, pca_real.iloc[:,1].values, c='black', alpha=0.2, label='Original')
        plt.scatter(pca_synth.iloc[:,0], pca_synth.iloc[:,1], c='red', alpha=0.2, label='Synthetic')
        ax.legend()
        
        ax2 = fig.add_subplot(spec[0,1])
        ax2.set_title('TSNE results', fontsize=20, color='red', pad=10)

        plt.scatter(tsne_results.iloc[:sample_size, 0].values, tsne_results.iloc[:sample_size,1].values, c='black', alpha=0.2, label='Original')
        plt.scatter(tsne_results.iloc[sample_size:,0], tsne_results.iloc[sample_size:,1], c='red', alpha=0.2, label='Synthetic')
        ax2.legend()

        fig.suptitle('Validating synthetic vs real data diversity and distributions', fontsize=16, color='grey')
        fig.savefig('dt_data_api/data/gan_pca_tsne.png')
    
    def modelTrainning(self, real_data, synth_data, fileName):        
        real_data=np.asarray(real_data)
        synth_data = synth_data[:len(real_data)]
        n_events = len(real_data)

        idx = np.arange(n_events)
        n_train = int(.75*n_events)
        print(n_train)
        train_idx = idx[:n_train]
        test_idx = idx[n_train:]

        X_real_train = real_data[train_idx, :self.seq_len-1, :]
        X_synth_train = synth_data[train_idx, :self.seq_len-1, :]

        X_real_test = real_data[test_idx, :self.seq_len-1, :]
        y_real_test = real_data[test_idx, -1, :]

        y_real_train = real_data[train_idx, -1, :]
        y_synth_train = synth_data[train_idx, -1, :]

        print('Synthetic X train: {}'.format(X_synth_train.shape))
        print('Real X train: {}'.format(X_real_train.shape))

        print('Synthetic y train: {}'.format(y_synth_train.shape))
        print('Real y train: {}'.format(y_real_train.shape))

        print('Real X test: {}'.format(X_real_test.shape))
        print('Real y test: {}'.format(y_real_test.shape))

        #early_stopping = EarlyStopping(monitor='val_loss')

        #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
        early_stopping = EarlyStopping(monitor='val_loss', patience=10)
        #val_loss 기준 체크포인터 생성
        #filename = os.path.join(self.MODEL_FILE_PATH + 'tmp\\', fileName + '_ckeckpointer.ckpt.weights.h5')
        #checkpoint = ModelCheckpoint(filename, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
        
        ts_real = self.setModel(self.units, self.n_seq)        
        real_train = ts_real.fit(x=X_real_train, y=y_real_train, validation_data=(X_real_test, y_real_test), epochs=100, batch_size=128, callbacks=[early_stopping])
        self.fitHistory(real_train, fileName='real_train.png')
        ts_real.save(self.MODEL_FILE_PATH + fileName.replace('.pkl','_ln_real.h5'))
        real_predictions = ts_real.predict(X_real_test)
        
        print(len(real_predictions))
        print(len(X_real_test))

        #xt = X_stock_test[np.arange(len(X_stock_test)), -1, :]
        #f = fidscore.fid(xt[:, 0], real_predictions[:, 0], windowSize=12)
        #result = f.createRecurrenceTimeGAN(count=100)

        ts_synth = self.setModel(self.units, self.n_seq)
        synth_train = ts_synth.fit(x=X_synth_train, y=y_synth_train, validation_data=(X_real_test, y_real_test), epochs=100, batch_size=128, callbacks=[early_stopping])
        self.fitHistory(synth_train, fileName='synth_train.png')
        ts_synth.save(self.MODEL_FILE_PATH + fileName.replace('.pkl','_ln_synth.h5'))
        synth_predictions = ts_synth.predict(X_real_test)

        xt = X_real_test[np.arange(len(X_real_test)), -1, :]
        f = fid.Manager(xt[:, 0], synth_predictions[:, 0], windowSize=12)
        result = f.createRecurrenceTimeGAN(count=100)

        metrics_dict = {'r2': [r2_score(y_real_test, real_predictions), r2_score(y_real_test, synth_predictions)],
                        'MAE': [mean_absolute_error(y_real_test, real_predictions), mean_absolute_error(y_real_test, synth_predictions)],
                        'MRLE': [mean_squared_log_error(y_real_test, real_predictions), mean_squared_log_error(y_real_test, synth_predictions)]}

        results = pd.DataFrame(metrics_dict, index=['Real', 'Synthetic'])
        print(results)  
    
    def setModel(self, units, output):
        opt = Adam(name='AdamOpt')
        loss = MeanAbsoluteError(name='MAE')
        model = Sequential()
        model.add(GRU(units=units, name=f'RNN_1'))
        model.add(Dense(units=output, #6, #14, 
                        activation='sigmoid', name='OUT'))
        model.compile(optimizer=opt, loss=loss)
        return model
    
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
    예측데이터 FID 스코어 산정
    '''
    def dataGeneraterFID(self, fileName, data, column, windowSize=10):
        try:
            print("--------A")
            model = keras.models.load_model(self.MODEL_FILE_PATH + fileName)        
            print(model.summary())
            #print(data)

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
            print(df[column])
            
            print("--------D")
            #모델적용 데이터셋 생성
            test_dt = self.windowed_dataset(df[column], windowSize, self.BATCH_SIZE, False)
            print(test_dt)

            print("--------E")
            #예측 데이터 추출
            #stock_data=real_data_loading(data.values, seq_len=self.seq_len)
            #stock_data=np.asarray(stock_data)
            #X_stock_test = stock_data[np.arange(len(stock_data)), :self.seq_len-1, :]
            #y_stock_test = stock_data[np.arange(len(stock_data)), -1, :]

            #pred = model.predict(X_stock_test)
            pred = model.predict(test_dt)
            print(len(pred))
            
            #시계열 이미지 변환 및 FID score 산정
            #sd = stock_data[np.arange(len(stock_data)), -1, :]

            #print(stock_data.shape)
            
            #print(y_stock_test[:3, 0])
            #print(sd[:3, 0])
            #print(pred[:3, 0])
            
            #f = fidscore.fid(y_stock_test[:, 0], pred[:, 0])
            f = fid.Manager(df[column], pred, self.WINDOW_SIZE)
            result = f.createRecurrence([column], count=100)
            
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