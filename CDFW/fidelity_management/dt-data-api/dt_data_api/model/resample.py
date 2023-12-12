import pandas as pd
from dt_data_api.common.enum import MD_FILL_TYPE, MD_IP_METHOD

class Manager:
    '''
    resample
    ---
    시간 설정에 따라 데이터를 늘림 또는 줄임
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

    def getResampling(self, timeRule='1T', type=MD_FILL_TYPE.MEAN, isRound=True):
        '''
        데이터 리샘플링 추출
        Args:
            timeRule(str): 시간 설정 (Y, M, D, H, T(min), S ...)
            type(MD_FILL_TYPE): 결측값 유형 설정
            isRound(bool): 소수점 반올림 여부 (1자리)
        Returns: 리샘플링한 데이터
            data
        '''
        try:
            print(self.data.isnull().sum().sum())
            if isRound:
                if type == MD_FILL_TYPE.MEAN:
                    self.data = self.data = self.data.resample(timeRule).mean().round(1) 
                elif type == MD_FILL_TYPE.STD:
                    self.data = self.data = self.data.resample(timeRule).std().round(1) 
                elif type == MD_FILL_TYPE.VAR:
                    self.data = self.data = self.data.resample(timeRule).var().round(1) 
                elif type == MD_FILL_TYPE.COUNT:
                    self.data = self.data = self.data.resample(timeRule).count().round(1) 
                elif type == MD_FILL_TYPE.MEDIAN:
                    self.data = self.data = self.data.resample(timeRule).median().round(1) 
                elif type == MD_FILL_TYPE.MIN:
                    self.data = self.data = self.data.resample(timeRule).min().round(1) 
                elif type == MD_FILL_TYPE.MAX:
                    self.data = self.data = self.data.resample(timeRule).max().round(1) 
                else:
                    self.data = self.data = self.data.resample(timeRule).mean().round(1)
            else:
                if type == MD_FILL_TYPE.MEAN:
                    self.data = self.data = self.data.resample(timeRule).mean()
                elif type == MD_FILL_TYPE.STD:
                    self.data = self.data = self.data.resample(timeRule).std()
                elif type == MD_FILL_TYPE.VAR:
                    self.data = self.data = self.data.resample(timeRule).var()
                elif type == MD_FILL_TYPE.COUNT:
                    self.data = self.data = self.data.resample(timeRule).count()
                elif type == MD_FILL_TYPE.MEDIAN:
                    self.data = self.data = self.data.resample(timeRule).median()
                elif type == MD_FILL_TYPE.MIN:
                    self.data = self.data = self.data.resample(timeRule).min()
                elif type == MD_FILL_TYPE.MAX:
                    self.data = self.data = self.data.resample(timeRule).max()
                else:
                    self.data = self.data = self.data.resample(timeRule).mean()
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    
    def getInterpolateResampling(self, timeRule='1T', method=MD_IP_METHOD.LINEAR, order=None, isRound=True):
        '''
        데이터 보간법을 활용한 리샘플리 추출
        Args:
            timeRule(str): 시간 설정 (Y, M, D, H, T(min), S ...)
            method(MD_IP_METHOD): 선형 보간법 유형 설정
            isRound(bool): 소수점 반올림 여부 (1자리)
        Returns: 리샘플링한 데이터
            data
        '''
        try:
            print(self.data.isnull().sum().sum())
            if order:
                if isRound:
                    self.data = self.data.resample(timeRule).interpolate(method=method.value, order=order).round(1)        
                else:
                    self.data = self.data.resample(timeRule).interpolate(method=method.value, order=order)
            else:
                if isRound:
                    self.data = self.data.resample(timeRule).interpolate(method=method.value).round(1)        
                else:
                    self.data = self.data.resample(timeRule).interpolate(method=method.value)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
