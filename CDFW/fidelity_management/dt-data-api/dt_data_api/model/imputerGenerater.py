import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import SimpleImputer, KNNImputer, IterativeImputer
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from dt_data_api.common.enum import MD_IP_SI

class Manager:
    '''
    SimpleImputer
    ---
    sklearn impute을 통해 결측값 채움
    '''
    #원본데이터
    data = pd.DataFrame
    
    def __init__(self, data=None) -> None:
        self.data = data
    
    def setData(self, data=None):
        '''
        원본 데이터 설정
        Args:
            data(pandas.DataFrame): 원본 데이터
        '''
        self.data = data
    
    def simpleImputer(self, type=MD_IP_SI.MEAN):
        '''
        SimpleImputer 결측값 보간
        Returns: 결측값을 값을 채운 데이터
            data
        '''
        try:
            imputer = SimpleImputer(strategy=type.value)
            self.data = pd.DataFrame(imputer.fit_transform(self.data))
        except Exception as e:
            raise e
        return self.data
    
    def knnImputer(self):
        '''
        KNNImputer 결측값 보간
        Returns: 결측값을 값을 채운 데이터
            data
        '''
        try:
            imputer = KNNImputer(n_neighbors=2)
            imputed = imputer.fit_transform(self.data)
            #aa = self.data.reset_index()
            self.data = pd.DataFrame(imputed, columns=self.data.columns)            
            #self.data['date'] = aa['date']
        except Exception as e:
            raise e
        return self.data
    
    def iterativeImputer(self):
        '''
        IterativeImputer 결측값 보간
        Returns: 결측값을 값을 채운 데이터
            data
        '''
        try:
            lr = LinearRegression()
            imputer = IterativeImputer(estimator=lr, verbose=2, tol=1e-10, max_iter=30, imputation_order='roman') 
            self.data = pd.DataFrame(imputer.fit_transform(self.data), columns=self.data.columns)            
        except Exception as e:
            raise e
        return self.data
