import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib
import matplotlib.pyplot as plt
import os
import copy
import joblib
import pickle
from datetime import datetime, date, timedelta
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler, MaxAbsScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.model_selection import cross_val_score, GridSearchCV

from dt_data_api.model import fidMeta
from dt_data_api.common.settings_meta import MODEL_PATH_META
from dt_data_api.common.enum import MD_IP_METHOD, MD_FILL_TYPE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS
from dt_data_api.util.utils import Utils
from .utils import ModelParameters, InputParameters

class Manager:

    #모델 기본 저장 경로
    MODEL_FILE_PATH = MODEL_PATH_META

        #원본데이터
    data = pd.DataFrame

    #모델파라메터
    window_size:None        #데이터 분할 수
    test_size:None          #학습 비율
    n_estimator:None            #생성할 트리의 개수(int, default=100)
    min_samples_leaf:None       #노드를 분할하기 위해 리프 노드가 가져야 할 최소한의 샘플 개수(int or float, default=1)
    min_samples_split:None      #노드를 분할하기 위해 필요한 최소한의 샘플 개수 (int or float, default=2)
    max_features:None           #노드를 분할할 때 고려할 특성의 수(int) 또는 비율(float) (int or float or default=sqrt(1.0))
                                #값을 작게 설정하면 분산 감소, 편향 증가, 복잡도 감소, 모델의 성능 감소. 값을 크게 설정하면 분산 증가, 편향 감소, 복잡도 증가, 모델의 성능 증가, 과적합 위험
    max_depth:None              #트리의 최대 깊이(int, default=None)

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
        self.window_size = modelArgs.window_size 
        self.test_size = modelArgs.test_size
        self.n_estimator = modelArgs.n_estimator
        self.min_samples_leaf = modelArgs.min_samples_leaf 
        self.min_samples_split = modelArgs.min_samples_split
        self.max_features = modelArgs.max_features
        self.max_depth = modelArgs.max_depth

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

    def setModel(self, n_estimator, min_samples_leaf, min_samples_split, max_features, max_depth):
        '''
        모델설정
        Args:
            n_estimator(int):
            min_samples_leaf(int):
            min_samples_split(int):
            max_features:(float)
            max_depth(int):
        Returns: RandomForestRegressor 생성모델
            model
        '''
        try:
            print(n_estimator, min_samples_leaf, min_samples_split, max_features, max_depth)
            #모델옵션
            model = RandomForestRegressor(random_state = 42, 
                    n_estimators = n_estimator, 
                    min_samples_leaf = min_samples_leaf,
                    min_samples_split = min_samples_split,
                    max_features = max_features,
                    max_depth = max_depth)
        except Exception as e:
            raise e
        return model
    
    # MAPE 계산 함수 정의
    def mean_absolute_percentage_error(self, y_true, y_pred):
        y_true, y_pred = np.array(y_true), np.array(y_pred)
        return np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    

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
    

    def modelTrainning(self):
        '''
        데이터 학습 및 모델 생성
        Returns: 학습결과 데이터
            result['fid'] = cb_fid.fid_scores
            result['fit'] = hist.history
        '''

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

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                apply_colums = self.output_cols + self.feature_cols

            print('------------------A')
            #컬럼생성
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


            print('------------------B', scale_cols, self.data[scale_cols])
            #정규화(0~1변환)
            '''
            scaler_x = MinMaxScaler()
            scaled_x = scaler_x.fit_transform(self.data[scale_x_cols])
            df_x = pd.DataFrame(scaled_x, columns=scale_x_cols)

            scaler_y = MinMaxScaler()
            scaled_y = scaler_y.fit_transform(self.data[scale_y_cols])
            df_y = pd.DataFrame(scaled_y, columns=scale_y_cols)
            print(df_x[:20], df_y[:20])

            #종속/독립변수 지정
            features_df = df_x[self.feature_cols]
            outputs_df = df_y[self.output_cols]
            '''
            scaler = MinMaxScaler()
            scaled = scaler.fit_transform(self.data[scale_cols])
            df = pd.DataFrame(scaled, columns=scale_cols)
            print(df[:20])

            outputs_df = df[self.output_cols]
            features_df = df[self.feature_cols]

            print('------------------C')

            for col in self.output_cols:
                outputs_df.drop(col, 1)
            print(features_df)                
            print(outputs_df)

            print('------------------D')
            #학습/검증 데이터 추출
            x_train, x_test, y_train, y_test = train_test_split(features_df, outputs_df, test_size=self.test_size, random_state=42, shuffle=False)
            print(x_test)
            print(y_test)

            print('------------------E')

            # Random Forest 모델 초기화
            model = self.setModel(self.n_estimator, self.min_samples_leaf, self.min_samples_split, self.max_features, self.max_depth)

            print('*', x_train, y_train)
            '''
            # 모델 학습
            params={'n_estimators':[200,300,500],
                    'max_features':[5,6,8],
                    'min_samples_leaf':[1,3,5]}

            # GridSearchCV 모델을 설정해준 후 랜덤포레스트 모델과 랜덤포레스트의 하이퍼 파라미터인 params를 넣어준 다음
            # GridSearchCV의 모델 인자들을 넣어준다.
            greed_CV=GridSearchCV(model, param_grid=params, cv=3, n_jobs=-1)

            #모델을 학습시킨다.
            greed_CV.fit(x_train, y_train.values.ravel())


            print(greed_CV.best_estimator_)
            print(greed_CV.best_index_)
            print(greed_CV.best_params_)
            print(greed_CV.best_score_)
            '''
            model.fit(x_train, y_train.values.ravel())
            print('------------------F')
            #모델 저장
            joblib.dump(model, modelFile)
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
            print('------------------G')
            # 테스트 데이터로 예측
            y_pred = model.predict(x_test)


            #y_pred_unscaled = scaler.inverse_transform(y_pred.reshape(-1, 1))  # reshape 필요

            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            mape = self.mean_absolute_percentage_error(y_test, y_pred)
            print(7)
            #feature_names_in_ = scaler.feature_names_in_
            #unscaled_data = scaler.inverse_transform(df_pred)
            #print('unscaled_data', y_pred_unscaled[self.output_cols])

            utils = Utils()
            # 테스트 데이터 복원
            extend_x_df = utils.add_dataframe_columns(x_test, scale_cols)
            x_unscaled = scaler.inverse_transform(extend_x_df)
            unscaled_x_df = pd.DataFrame(x_unscaled, columns=scale_cols)
            new_index = range(len(unscaled_x_df))
            unscaled_x_df.index = new_index
            print(y_test)
            extend_y_df = utils.add_dataframe_columns(y_test, scale_cols)
            y_unscaled = scaler.inverse_transform(extend_y_df)
            unscaled_y_df = pd.DataFrame(y_unscaled, columns=scale_cols)
            new_index = range(len(unscaled_y_df))
            unscaled_y_df.index = new_index
            print(unscaled_y_df)
            #예측 데이터 복원
            pred_df = pd.DataFrame(y_pred, columns=self.output_cols)
            print('예측 결과', pred_df)
            extend_pred_df = utils.add_dataframe_columns(pred_df, scale_cols)
            print('예측 결과 확장', extend_pred_df)
            pred_unscaled = scaler.inverse_transform(extend_pred_df)
            unscaled_pred_df = pd.DataFrame(pred_unscaled, columns=scale_cols)
            print('예측 결과 복원', unscaled_pred_df)

            result = {'x_test': None}            
            
            result['x_test'] = x_test
            result['y_test'] = y_test
            result['y_pred'] = y_pred

            result['x_test_unscaled'] = unscaled_x_df[self.feature_cols]
            result['y_test_unscaled'] = unscaled_y_df[self.output_cols]
            result['y_pred_unscaled'] = unscaled_pred_df[self.output_cols]

            result['mse'] = mse
            result['mae'] = mae
            result['rmse'] = rmse
            result['r2'] = r2
            result['mape'] = mape

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
            print(self.data)
            #모델로드
            #model = keras.models.load_model(self.MODEL_FILE_PATH + self.filename)        
            print(self.filename)
            model = joblib.load(self.filename)

            if self.feature_cols == None or self.feature_cols == "" or self.feature_cols == "[]" or len(self.feature_cols) == 0:
                self.feature_cols = self.output_cols
                apply_colums = self.output_cols
            else:
                apply_colums = self.output_cols + self.feature_cols

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
            
            print("--------D")

            #print(test_dt)

            print("--------E")
            test_dt = df[self.feature_cols]
            
            #예측 데이터 추출
            y_pred = model.predict(test_dt)
            print(y_pred)
            #print(pred[:,0].reshape(-1,1))
            
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