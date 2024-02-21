import pandas as pd
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
from statsmodels.stats.weightstats import ztest 
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, DBSCAN
from dt_data_api.common.settings import DATA_PATH

class Manager:
    '''
    outlier
    ---
    데이터 이상치 확인
    '''
    #원본데이터
    data = pd.DataFrame
    DATA_FILE_PATH = DATA_PATH #모델 기본 저장 경로

    def __init__(self, data=None) -> None:
        '''
        초기화
        Args:
            data(pandas.DataFrame): 원본 데이터
        '''        
        self.data = data
    
    def setData(self, data=None):
        '''
        원본 데이터 설정
        Args:
            data(pandas.DataFrame): 원본 데이터
        '''
        self.data = data
    
    # def zTest(self):
    #     '''
    #     정규분포 이상치 탐지
    #     '''        
    #     _, result = ztest(self.data)
    #     return result

    def zTest(self, df):
        '''
        정규분포 이상치 탐지
        '''        
        _, result = ztest(df)
        return result
    
    def tsDecompose(self, feature, freq=50):
        '''
        시계열 데이터 분해 (단일)
        Args:
            feature(string): 적용항목
            freq(int): 샘플링 길이
        '''
        trend = pd.DataFrame()
        seasonal = pd.DataFrame()
        resid = pd.DataFrame()
        
        #이상치 찾는 부분임으로 NaN은 미리 삭제하고 처리
        df = pd.DataFrame(self.data)
        df.replace("", np.nan, inplace=True)
        df2 = df.dropna(axis='rows')

        r = seasonal_decompose(df2[feature], model='additive', period=freq, extrapolate_trend=freq)
        trend[feature] = r.trend
        seasonal[feature] = r.seasonal
        resid[feature] = r.resid
        
        print(trend.describe())
        print(seasonal.describe())
        print(resid.describe())
        
        return trend, seasonal, resid
    
    def tsDecomposeMulti(self, features, freq=50):
        '''
        시계열 데이터 분해 (멀티)
        Args:
            features(array): 적용항목
            freq(int): 샘플링 길이
        '''
        trend = pd.DataFrame()
        seasonal = pd.DataFrame()
        resid = pd.DataFrame()
        
        #이상치 찾는 부분임으로 NaN은 미리 삭제하고 처리
        df = pd.DataFrame(self.data)
        df.replace("", np.nan, inplace=True)
        df2 = df.dropna(axis='rows')

        for f in features:
            #r = seasonal_decompose(self.data[f], model='additive', period=freq, extrapolate_trend=freq)
            r = seasonal_decompose(df2[f], model='additive', period=freq, extrapolate_trend=freq)
            trend[f] = r.trend
            seasonal[f] = r.seasonal
            resid[f] = r.resid
        
        print(trend.describe())
        print(seasonal.describe())
        print(resid.describe())
        
        return trend, seasonal, resid
    
    def standardDeviation(self, resid, is_create):
        '''
        표준편차 기준 이상치 탐지
        Args:
            resid(dataframe): 잔차
        '''
        #matplotlib.use('TkAgg')
        #plt.subplots(figsize=(9,6))
        #plt.hist(resid, 100, density=True, alpha=0.75)
        #plt.show()
        range = []
        tmp = resid.round(0)
        for column in resid.columns:
            #데이터값 그룹
            range.append(pd.DataFrame(tmp.groupby(column).size(), columns=[column]).to_json())
            #range[column] = pd.DataFrame(df.groupby(column).size(), columns=[column]).to_json()


        mu, std = resid.mean(), resid.std()
        print("평균:", mu)
        print("표준편차:", std)
        print("이상치 갯수:", len(resid[(resid>mu+3*std)|(resid<mu-3*std)].dropna()))

        index = resid[(resid>mu+3*std)|(resid<mu-3*std)].dropna().index
        #result = self.data.loc[index]

        if is_create=='N':
            result = {'hist': None, 'info': None}
            info_df = self.data.loc[index]
            info_df = info_df.reset_index(drop=False)

            result['hist'] = range
            result['info'] = info_df

        else:
            result = self.data.loc[index]

        return result
    
    def kMeans(self, features, freq=50, n_clusters=20, n_clusters_lable=4, is_create='Y'):
        '''
        k-means 기준 이상치 탐지
        Args:
            features(array): 적용항목
            freq(int): 샘플링 길이
        '''
        t, s, r = self.tsDecomposeMulti(features=features, freq=freq)

        #r에서 추출한 공통인덱스만 적용하기
        common_index = self.data.index.intersection(r.index) 
        
        # self.data에서 공통 인덱스에 해당하는 행만 선택
        self_data_filtered = self.data.loc[common_index]

        # self.data를 r의 인덱스에 맞게 처리
        self_data_processed = self_data_filtered.reindex(r.index)

        scaler = StandardScaler()
        scaler.fit(r)
        print(scaler.mean_)
        
        norm_rdf = scaler.transform(r)
        print(norm_rdf)

        kmeans = KMeans(n_clusters=n_clusters, random_state=0).fit(norm_rdf)
        print(kmeans)
        print(kmeans.labels_) 
        
        lbl, cnt = np.unique(kmeans.labels_,return_counts=True) 
        print(lbl)
        print(cnt)
        print(['group:{}-count:{}'.format(group, count) for group, count in zip(lbl, cnt)])

        #df = self.data[(kmeans.labels_==n_clusters_lable)]
        df = self_data_processed[(kmeans.labels_==n_clusters_lable)]

        if is_create=='N':
            df = df.reset_index(drop=False)
            result = {'hist': None, 'info': None}
            result['info'] = df
        else:
            result = df

        return result
 
    def dbScan(self, features, freq=50, eps=0.1, min_samples=2, is_create='Y'):
        '''
        dbScan 기준 이상치 탐지
        Args:
            features(array): 적용항목
            freq(int): 샘플링 길이
        '''
        t, s, r = self.tsDecomposeMulti(features=features, freq=freq)

        #r에서 추출한 공통인덱스만 적용하기
        common_index = self.data.index.intersection(r.index) 
        
        # self.data에서 공통 인덱스에 해당하는 행만 선택
        self_data_filtered = self.data.loc[common_index]

        # self.data를 r의 인덱스에 맞게 처리
        self_data_processed = self_data_filtered.reindex(r.index)
        
        scaler = StandardScaler()
        scaler.fit(r)
        print(scaler.mean_)
        
        norm_rdf = scaler.transform(r)
        print(norm_rdf)

        clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(norm_rdf)
        print(clustering)
        print(clustering.labels_)

        lbl, cnt = np.unique(clustering.labels_,return_counts=True)
        print(['group:{}-count:{}'.format(group, count) for group, count in zip(lbl, cnt)])

        #df = self.data[(clustering.labels_==-1)]
        df = self_data_processed[(clustering.labels_==-1)]
        #print(df.describe())
        #result = df

        if is_create=='N':
            df = df.reset_index(drop=False)
            result = {'hist': None, 'info': None}
            result['info'] = df
        else:
            result = df

        return result

    def autoEncoder(self):
        '''
        '''
        import os
        import tensorflow as tf
        from tensorflow.keras.preprocessing.sequence import TimeseriesGenerator
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import Dense, Dropout, LSTM, RepeatVector, TimeDistributed
        from tensorflow.keras.losses import Huber
        from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
        from sklearn.preprocessing import StandardScaler


        #GPU 설정
        """
        physical_devices = tf.config.list_physical_devices('GPU')
        try:
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



        # 모델 재현성을 위해 난수 시드설정
        tf.random.set_seed(777)
        np.random.seed(777)

        # 데이터 전처리 - 하이퍼 파라미터
        window_size = 10
        batch_size = 32
        features = ['ondo']
        n_features = len(features)
        TRAIN_SIZE = int(len(self.data)*0.7)
        temp = os.path.join('dt_data_api/data/', 'temp')
                        
        # 데이터 전처리 - 표준정규분포화
        scaler = StandardScaler()
        scaler = scaler.fit(self.data.loc[:TRAIN_SIZE,features])
        scaled = scaler.transform(self.data[features])

        print(scaled)
        print(len(scaled))

        # keras TimeseriesGenerator를 이용해 데이터셋 만들기
        train_gen = TimeseriesGenerator(
            data = scaled,
            targets = scaled,
            length = window_size,
            stride=1,
            sampling_rate=1,
            batch_size= batch_size,
            shuffle=False,
            start_index=0,
            end_index=None,
        )

        valid_gen = TimeseriesGenerator(
            data = scaled,
            targets = scaled,
            length = window_size,
            stride=1,
            sampling_rate=1,
            batch_size=batch_size,
            shuffle=False,
            start_index=TRAIN_SIZE,
            end_index=None,
        )

        print(train_gen)
        print(valid_gen)

        print(len(train_gen))
        print(len(valid_gen))

        print(train_gen[0][0].shape)  # (32, 10, 5)
        print(train_gen[0][1].shape)  # (32, 5)


        # 모델만들기
        # 2개 층의 LSTM으로 인코더 만듬
        # RepeatVector는 input을 window_size만큼 복사해줌
        with strategy.scope():
            model = Sequential([
                # >> 인코더 시작
                LSTM(64, activation='relu', return_sequences=True, input_shape=(window_size, n_features)),
                LSTM(16, activation='relu', return_sequences=False),
                ## << 인코더 끝
                ## >> Bottleneck
                RepeatVector(window_size),
                ## << Bottleneck
                ## >> 디코더 시작
                LSTM(16, activation='relu', return_sequences=True),
                LSTM(64, activation='relu', return_sequences=False),
                Dense(n_features)
                ## << 디코더 끝
            ])

            # 체크포인트
            # 학습을 진행하며 validation 결과가 가장 좋은 모델을 저장해둠       
            modelCKFile = os.path.join('dt_data_api/data/temp/', 'mymodel.ckpt')
            cb_checkpoint = ModelCheckpoint(modelCKFile, save_weights_only=True, save_best_only=True, monitor='val_loss', verbose=1)

            # 얼리스탑
            # 학습을 진행하며 validation 결과가 나빠지면 스톱. patience 횟수만큼은 참고 지켜본다
            early_stop = EarlyStopping(monitor='val_loss', patience=5)

            model.compile(loss='mae', optimizer='adam',metrics=["mae"])

            hist = model.fit(train_gen, 
                validation_data=valid_gen,
                steps_per_epoch=len(train_gen),
                validation_steps=len(valid_gen),
                epochs=50, 
                callbacks=[cb_checkpoint, early_stop])

        model.load_weights(modelCKFile)

        matplotlib.use('TkAgg')
        plt.figure(figsize=(12,8))
        plt.plot(hist.history['loss'], label='Training')
        plt.plot(hist.history['val_loss'], label='Validation')
        plt.legend()
        plt.show()

        # 예측 결과를 pred 로, 실적 데이터를 real로 받습니다
        pred = model.predict(train_gen)
        real = scaled[window_size:]

        mae_loss = np.mean(np.abs(pred-real), axis=1)

        # 샘플 개수가 많기 때문에 y축을 로그 스케일로 그립니다
        plt.subplots(figsize=(9,6))
        plt.hist(mae_loss, 100, density=True, alpha=0.75, log=True)
        plt.show()

        import copy

        test_df = copy.deepcopy(self.data.loc[window_size:]).reset_index(drop=True)
        test_df['Loss'] = mae_loss

        threshold = 3
        test_df.loc[test_df['Loss']>threshold]
        print(test_df.loc[test_df['Loss']>threshold])
        
        
        fig = plt.figure(figsize=(12,15))

        plt.figure(figsize=(12,15))
        ax = fig.add_subplot(311)
        ax.set_title('ondo')
        plt.plot(test_df['date'], test_df['ondo'], linewidth=0.5, alpha=0.75, label='ondo')        
        plt.plot(test_df['date'], test_df['ondo'], 'or', markevery=[mae_loss>threshold])
        plt.show()

        # 오차율 그래프입니다
        ax = fig.add_subplot(313)
        ax.set_title('Loss')
        plt.plot(test_df['date'], test_df['Loss'], linewidth=0.5, alpha=0.75, label='Loss')
        plt.plot(test_df['date'], test_df['Loss'], 'or', markevery=[mae_loss>threshold])
        plt.show()

        pass