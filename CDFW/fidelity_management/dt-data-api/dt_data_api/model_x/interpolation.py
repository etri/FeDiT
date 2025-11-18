import pandas as pd
from dt_data_api.common.enum import MD_FILL_METHOD, MD_IP_METHOD

'''
결측처리
'''
class Interpolation:
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
    기본 보간
    '''
    def defaultInterpolate(self):
        try:
            print(self.data.isnull().sum().sum())
            self.data = self.data.interpolate()
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data

    '''
    기존값 채우기
    '''
    def methodFillInterpolate(self, method=MD_FILL_METHOD.FFILL, round=True):
        try:
            print(self.data.isnull().sum().sum())
            if round:
                self.data = self.data.interpolate(method=method.value).round(1)        
            else:
                self.data = self.data.interpolate(method=method.value)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    
    '''
    선형보간 채우기
    '''
    def methodInterpolate(self, method=MD_IP_METHOD.LINEAR, order=None, round=True):
        try:
            print(self.data.isnull().sum().sum())
            if order:
                if round:
                    self.data = self.data.interpolate(method=method.value, order=order).round(1)        
                else:
                    self.data = self.data.interpolate(method=method.value, order=order)
            else:
                if round:
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