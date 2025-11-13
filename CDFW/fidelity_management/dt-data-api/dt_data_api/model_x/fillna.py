import pandas as pd
from dt_data_api.common.enum import MD_FILL_METHOD, MD_FILL_TYPE

'''
빈값처리
'''
class fill():
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
    빈값 제거
    '''
    def drop(self):
        try:
            print(self.data.isnull().sum().sum())
            self.data = self.data.dropna()
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    
    '''
    빈값 채우기
    '''
    def blankFill(self, val=0):
        try:
            print(self.data.isnull().sum().sum())
            self.data = self.data.fillna(value=val)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data

    '''
    앞,뒤 값 채우기
    '''
    def methodFill(self, method=MD_FILL_METHOD.FFILL, limit=0):
        try:
            print(self.data.isnull().sum().sum())
            if limit==0:
                self.data = self.data.fillna(method=method.value)
            else:
                self.data = self.data.fillna(method=method.value, limit=limit)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    
    '''
    평균,표준편차,분산,빈도수,중위수(중앙값),최소,최대 값 채우기
    mean, std, var, count, median, min, max : 
    '''
    def typeFill(self, type=MD_FILL_TYPE.MEAN, isInplace=True, column='', round=True):
        if not column:
            return
        
        try:
            print(self.data.isnull().sum().sum())
            if round:                    
                if type == MD_FILL_TYPE.MEAN:
                    self.data = self.data.fillna({column:round(self.data[column].mean(), 1)}, inplace=isInplace)
                elif type == MD_FILL_TYPE.STD:
                    self.data = self.data.fillna({column:round(self.data[column].std(), 1)}, inplace=isInplace)
                elif type == MD_FILL_TYPE.VAR:
                    self.data = self.data.fillna({column:round(self.data[column].var(), 1)}, inplace=isInplace)
                elif type == MD_FILL_TYPE.COUNT:
                    self.data = self.data.fillna({column:round(self.data[column].count(), 1)}, inplace=isInplace)
                elif type == MD_FILL_TYPE.MEDIAN:
                    self.data = self.data.fillna({column:round(self.data[column].median(), 1)}, inplace=isInplace)
                elif type == MD_FILL_TYPE.MIN:
                    self.data = self.data.fillna({column:round(self.data[column].min(), 1)}, inplace=isInplace)
                elif type == MD_FILL_TYPE.MAX:
                    self.data = self.data.fillna({column:round(self.data[column].max(), 1)}, inplace=isInplace)
                else:
                    self.data = self.data.fillna({column:round(self.data[column].mean(), 1)}, inplace=isInplace)
            else:
                if type == MD_FILL_TYPE.MEAN:
                    self.data = self.data.fillna({column:self.data[column].mean()}, inplace=isInplace)
                elif type == MD_FILL_TYPE.STD:
                    self.data = self.data.fillna({column:self.data[column].std()}, inplace=isInplace)
                elif type == MD_FILL_TYPE.VAR:
                    self.data = self.data.fillna({column:self.data[column].var()}, inplace=isInplace)
                elif type == MD_FILL_TYPE.COUNT:
                    self.data = self.data.fillna({column:self.data[column].count()}, inplace=isInplace)
                elif type == MD_FILL_TYPE.MEDIAN:
                    self.data = self.data.fillna({column:self.data[column].median()}, inplace=isInplace)
                elif type == MD_FILL_TYPE.MIN:
                    self.data = self.data.fillna({column:self.data[column].min()}, inplace=isInplace)
                elif type == MD_FILL_TYPE.MAX:
                    self.data = self.data.fillna({column:self.data[column].max()}, inplace=isInplace)
                else:
                    self.data = self.data.fillna({column:self.data[column].mean()}, inplace=isInplace)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data