import pandas as pd
from dt_data_api.common.enum import MD_FILL_TYPE, MD_IP_METHOD

class Resample:
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
    기준단위(timeRule) : Y, M, D, H, T(min), S ...
    '''
    def exportSampling(self, timeRule='1T', type=MD_FILL_TYPE.MEAN, round=True):
        try:
            print(self.data.isnull().sum().sum())
            if round:
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
    
    '''
    보간기준(method) : linear, time, index, values, pad, krogh ...
    linear : 선형보간법, spline : 다항식
    '''
    def interpolateResampling(self, timeRule='1T', method=MD_IP_METHOD.LINEAR, round=True):
        try:
            print(self.data.isnull().sum().sum())
            if round:
                self.data = self.data.resample(timeRule).interpolate(method=method.value).round(1)             
            else:
                self.data = self.data.resample(timeRule).interpolate(method=method.value)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
