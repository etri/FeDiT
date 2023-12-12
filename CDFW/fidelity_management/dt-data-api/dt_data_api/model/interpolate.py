import pandas as pd
from dt_data_api.common.enum import MD_FILL_METHOD, MD_IP_METHOD

class Manager:
    '''
    interpolation
    ---
    결측값을 보간법으로 채움
    '''
    
    #원본데이터
    data = pd.DataFrame
    
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

    def defaultInterpolate(self):
        '''
        결측값 기본 보간
        Returns: 기본 보간법으로 채운 데이터
            data
        '''
        try:
            print(self.data.isnull().sum().sum())
            self.data = self.data.interpolate()
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data

    def methodFillInterpolate(self, method=MD_FILL_METHOD.FFILL, isRound=True):
        '''
        결측값을 앞/뒤 보간법으로 채움
        Args:
            method(MD_FILL_METHOD): 앞/뒤 방향 설정
            isRound(bool): 소수점 반올림 여부 (1자리)
        Returns: 결측값을 앞/뒤 보간법으로 채운 데이터
            data
        '''
        try:
            print(self.data.isnull().sum().sum())
            if isRound:
                self.data = self.data.interpolate(method=method.value).round(1)        
            else:
                self.data = self.data.interpolate(method=method.value)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    
    def methodInterpolate(self, method=MD_IP_METHOD.LINEAR, order=None, isRound=True):
        '''
        결측값을 선형 보간법으로 채움
        Args:
            method(MD_IP_METHOD): 선형 보간법 유형 설정
            order(any): 다항식 차수 설정
            isRound(bool): 소수점 반올림 여부 (1자리)
        Returns: 결측값을 앞/뒤 보간법으로 채운 데이터
            data
        '''
        try:
            print(self.data.isnull().sum().sum())
            if order:
                if isRound:
                    self.data = self.data.interpolate(method=method.value, order=order).round(1)        
                else:
                    self.data = self.data.interpolate(method=method.value, order=order)
            else:
                if isRound:
                    self.data = self.data.interpolate(method=method.value).round(1)        
                else:
                    self.data = self.data.interpolate(method=method.value)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data

    def setData():
        try:
            file='dt_data_api/data/test_data_201901_201902.csv'
            df=pd.read_csv(file)

            #빈값확인
            print(df.isnull().sum().sum())
            print(df.head(20))

            #보간로직
            df = df.dropna()

            #보간후
            print(df.isnull().sum().sum())
            print(df.head(20))

            df.interpolate()
        except Exception as e:
            raise e
        return df        