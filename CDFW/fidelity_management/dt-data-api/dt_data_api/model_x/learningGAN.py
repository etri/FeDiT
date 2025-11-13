import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from os import path
import os
import tensorflow as tf

from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_log_error
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split
import matplotlib.gridspec as gridspec

from ydata_synthetic.synthesizers import ModelParameters
from ydata_synthetic.preprocessing.timeseries import processed_stock
from ydata_synthetic.preprocessing.timeseries.utils import real_data_loading
#from ydata_synthetic.synthesizers.timeseries import TimeGAN

from tensorflow import keras
from tensorflow.keras import Input, Sequential
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Lambda, GRU, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.losses import MeanAbsoluteError, Huber

from dt_data_api.model_x import fidscore
#from dt_data_api.common.lib import MODEL_PATH
from dt_data_api.common.settings import MODEL_PATH

class manager:
    WINDOW_SIZE = 10 #과거 데이터 수 (값을 기준으로 예측)
    BATCH_SIZE = 32  #학습 분할 수 
    MODEL_FILE_PATH = MODEL_PATH #모델 기본 저장 경로
    data = pd.DataFrame

    seq_len=24
    n_seq = 14 #6 #14
    hidden_dim=24
    gamma=1

    noise_dim = 32
    dim = 128
    batch_size = 128

    log_step = 100
    learning_rate = 5e-4

    gan_args = ModelParameters(batch_size=batch_size, lr=learning_rate, noise_dim=noise_dim, layers_dim=dim)
   
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

    def modelTrainninSynthetic(self, fileName, item):         
        stock_data = real_data_loading(self.data.values, seq_len=self.seq_len)
        print(len(stock_data), stock_data[0].shape)
        #print(stock_data[:2])

        if path.exists(self.MODEL_FILE_PATH + fileName):
            synth = TimeGAN.load(self.MODEL_FILE_PATH + fileName)
        else:
            synth = TimeGAN(model_parameters=self.gan_args, hidden_dim=self.hidden_dim, seq_len=self.seq_len, n_seq=self.n_seq, gamma=self.gamma)
            synth.train(stock_data, train_steps=1000)
            synth.save(self.MODEL_FILE_PATH + fileName)

        synth_data = synth.sample(n_samples=len(stock_data))
        #synth_data = synth.sample(n_samples=48)
        print(synth_data.shape)        
        print(len(synth_data), synth_data[0].shape)
        #print(synth_data[:2])
        
        #GAN 데이터 평가
        self.evaluationSyntheticData(stock_data, synth_data)

        #GAN 평가
        self.evaluationSynthetic(stock_data, synth_data)

        #예측모델
        self.modelTrainning(stock_data, synth_data, fileName)

        '''
        #예측모델 테스트   
        scale_cols = []
        for c in self.data.columns:
            scale_cols.append(c)
        print(scale_cols)
        #print(stock_data[:2])

        sd=np.asarray(synth_data)
        y_synth_train = sd[np.arange(len(sd)), -1, :]
        synth_data1 = pd.DataFrame(y_synth_train, columns=scale_cols)
        #print(synth_data1[:20])
        
        self.modelTrainning_2(stock_data=synth_data1, column=item, fileName=fileName.replace('.pkl','_ln_real.h5'))
        '''


        '''
        sd=np.asarray(synth_data)
        y_synth_train = sd[np.arange(len(sd)), -1, :]
        synth_data1 = pd.DataFrame(y_synth_train)
        #print(synth_data1[:20][0])
        
        sd1=np.asarray(stock_data)
        y_stock_train = sd1[np.arange(len(sd1)), -1, :]
        stock_data1 = pd.DataFrame(y_stock_train)
        #stock_data1 = stock_data1[24:]
        
        #print(self.data['w10'][:100])

        
        #self.modelTrainning_2(stock_data=df, column=item, fileName=fileName.replace('.pkl','_ln_real.h5'))

        plt.figure(figsize=(6, 3))
        #plt.plot(self.data['w10'][:100], label='stock_data')
        #plt.plot(stock_data1[:100][1], label='stock_data')
        plt.plot(stock_data1[:100][0], label='synth_data1')
        plt.plot(synth_data1[:100][1], label='synth_data2')
        plt.legend()
        plt.show()
        #plt.savefig('dt_data_api/data/real_fake.png', dpi=300)

        #sd1=np.asarray(stock_data)
        #y_stock_train = sd1[np.arange(len(sd1)), -1, :]
        #stock_data1 = pd.DataFrame(y_stock_train)
        
        #print(stock_data1[10])
        #print(synth_data1[10])
        #f = fidscore.fid(stock_data1[0], synth_data1[0], windowSize=0)
        #result = f.createRecurrenceTimeGAN(count=1000)
        '''

    
    def evaluationSyntheticData(self, stock_data, synth_data):
        cols = []
        for c in self.data.columns:
            cols.append(c)

        print(cols)  
        #cols = ['Open','High','Low','Close','Adj Close','Volume']

        fig, axes = plt.subplots(nrows=int(round(len(cols)/2, 0)), ncols=2, figsize=(15, 10))
        #fig, axes = plt.subplots(nrows=7, ncols=2, figsize=(15, 10))
        axes=axes.flatten()

        time = list(range(1,25))
        obs = np.random.randint(len(stock_data))

        for j, col in enumerate(cols):
            df = pd.DataFrame({'Real': stock_data[obs][:, j], 'Synthetic': synth_data[obs][:, j]})
            df.plot(ax=axes[j], title = col, secondary_y='Synthetic data', style=['-', '--'])
        fig.tight_layout()        
        fig.savefig('dt_data_api/data/gan_data.png')

    def evaluationSynthetic(self, stock_data, synth_data):
        sample_size = 250
        idx = np.random.permutation(len(stock_data))[:sample_size]

        real_sample = np.asarray(stock_data)[idx]
        synthetic_sample = np.asarray(synth_data)[idx]

        synth_data_reduced = real_sample.reshape(-1, self.seq_len)
        stock_data_reduced = np.asarray(synthetic_sample).reshape(-1, self.seq_len)

        n_components = 2
        pca = PCA(n_components=n_components)
        tsne = TSNE(n_components=n_components, n_iter=300)

        pca.fit(stock_data_reduced)

        pca_real = pd.DataFrame(pca.transform(stock_data_reduced))
        pca_synth = pd.DataFrame(pca.transform(synth_data_reduced))

        data_reduced = np.concatenate((stock_data_reduced, synth_data_reduced), axis=0)
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
    
    def modelTrainning(self, stock_data, synth_data, fileName):        
        stock_data=np.asarray(stock_data)
        synth_data = synth_data[:len(stock_data)]
        n_events = len(stock_data)

        idx = np.arange(n_events)
        n_train = int(.75*n_events)
        print(n_train)
        train_idx = idx[:n_train]
        test_idx = idx[n_train:]

        X_stock_train = stock_data[train_idx, :self.seq_len-1, :]
        X_synth_train = synth_data[train_idx, :self.seq_len-1, :]

        X_stock_test = stock_data[test_idx, :self.seq_len-1, :]
        y_stock_test = stock_data[test_idx, -1, :]

        y_stock_train = stock_data[train_idx, -1, :]
        y_synth_train = synth_data[train_idx, -1, :]

        print('Synthetic X train: {}'.format(X_synth_train.shape))
        print('Real X train: {}'.format(X_stock_train.shape))

        print('Synthetic y train: {}'.format(y_synth_train.shape))
        print('Real y train: {}'.format(y_stock_train.shape))

        print('Real X test: {}'.format(X_stock_test.shape))
        print('Real y test: {}'.format(y_stock_test.shape))

        early_stopping = EarlyStopping(monitor='val_loss')
        
        ts_real = self.setModel(12)        
        real_train = ts_real.fit(x=X_stock_train, y=y_stock_train, validation_data=(X_stock_test, y_stock_test), epochs=200, batch_size=128, callbacks=[early_stopping])
        self.fitHistory(real_train, fileName='real_train.png')
        ts_real.save(self.MODEL_FILE_PATH + fileName.replace('.pkl','_ln_real.h5'))
        real_predictions = ts_real.predict(X_stock_test)
        
        print(len(real_predictions))
        print(len(X_stock_test))

        #xt = X_stock_test[np.arange(len(X_stock_test)), -1, :]
        #f = fidscore.fid(xt[:, 0], real_predictions[:, 0], windowSize=12)
        #result = f.createRecurrenceTimeGAN(count=100)

        ts_synth = self.setModel(12)
        synth_train = ts_synth.fit(x=X_synth_train, y=y_synth_train, validation_data=(X_stock_test, y_stock_test), epochs=200, batch_size=128, callbacks=[early_stopping])
        self.fitHistory(synth_train, fileName='synth_train.png')
        ts_synth.save(self.MODEL_FILE_PATH + fileName.replace('.pkl','_ln_synth.h5'))
        synth_predictions = ts_synth.predict(X_stock_test)

        xt = X_stock_test[np.arange(len(X_stock_test)), -1, :]
        f = fidscore.fid(xt[:, 0], synth_predictions[:, 0], windowSize=12)
        result = f.createRecurrenceTimeGAN(count=100)

        metrics_dict = {'r2': [r2_score(y_stock_test, real_predictions), r2_score(y_stock_test, synth_predictions)],
                        'MAE': [mean_absolute_error(y_stock_test, real_predictions), mean_absolute_error(y_stock_test, synth_predictions)],
                        'MRLE': [mean_squared_log_error(y_stock_test, real_predictions), mean_squared_log_error(y_stock_test, synth_predictions)]}

        results = pd.DataFrame(metrics_dict, index=['Real', 'Synthetic'])
        print(results)        
    
    def setModel(self, units):
        opt = Adam(name='AdamOpt')
        loss = MeanAbsoluteError(name='MAE')
        model = Sequential()
        model.add(GRU(units=units, name=f'RNN_1'))
        model.add(Dense(units=14, #6, #14, 
                        activation='sigmoid', name='OUT'))
        model.compile(optimizer=opt, loss=loss)
        return model

    '''
    모델설정
    '''
    def setModel2(self):
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

    def modelTrainning_2(self, stock_data, column, fileName):
        print('------------------A')
        '''
        scale_cols = []
        for c in stock_data.columns:
            scale_cols.append(c)
        print(scale_cols)
        '''

        print('------------------B')            
        #학습/검증 데이터 추출
        x_train, x_test, y_train, y_test = train_test_split(stock_data.drop(column, 1), stock_data[column], test_size=0.2, random_state=0, shuffle=False)
        #x_train, x_test, y_train, y_test = train_test_split(df[column], df[column], test_size=0.2, random_state=0, shuffle=False)
        #print(x_test)
        #print(y_test)
        
        print('------------------C')        
        #모델적용 데이터셋 생성
        train_data = self.windowed_dataset(y_train, self.WINDOW_SIZE, self.BATCH_SIZE, True)
        test_data = self.windowed_dataset(y_test, self.WINDOW_SIZE, self.BATCH_SIZE, False)
        print(train_data)

        print('------------------D')        
        #모델설정
        model = self.setModel2()
        print(model)
        
        print('------------------E')        
        #성능옵션
        model.compile(optimizer=Adam(0.0005), loss=Huber(), metrics=['mse'])
        #model.compile(loss=Huber(), optimizer=Adam(0.0005), metrics=['accuracy'])
        print(model)

        #earlystopping은 10번 epoch 동안 val_loss 개선이 없다면 학습을 멈춤
        earlystopping = EarlyStopping(monitor='val_loss', patience=10)
        #val_loss 기준 체크포인터 생성
        filename = os.path.join(self.MODEL_FILE_PATH + 'tmp\\', fileName + '_ckeckpointer.ckpt.weights.h5')
        checkpoint = ModelCheckpoint(filename, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)
        
        print('------------------F')        
        #모델학습
        hist = model.fit(train_data, validation_data=(test_data), epochs=50, callbacks=[checkpoint, earlystopping])
        
        print('------------------G')
        #모델검증
        mse = model.evaluate(test_data)
        print("mse : ", mse)
        #print('\nAccuracy: {:.4f}'.format(model.evaluate(test_data)[1]))
        self.fitHistory(hist, fileName)

        print('------------------H')
        model.save(self.MODEL_FILE_PATH + fileName)
        pred = model.predict(test_data)
        print(test_data)        
        print(pred)

        f = fidscore.fid(stock_data[column], pred, windowSize=self.WINDOW_SIZE)
        result = f.createRecurrence(count=100)
    
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
            f = fidscore.fid(df[column], pred)
            result = f.createRecurrence(count=100)
            
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
    