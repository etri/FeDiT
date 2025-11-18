import pandas as pd
from dt_data_api.common.enum import MD_FILL_METHOD, MD_FILL_TYPE

class Manager:
    '''
    fillna
    ---
    결측값을 정해진 값으로 채움
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

    def drop(self):
        '''
        결측값 제거
        Returns: 결측값을 제거한 원본 데이터
            data           
        '''
        try:
            print(self.data.isnull().sum().sum())
            self.data = self.data.dropna()
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    
    def blankFill(self, val):
        '''
        결측값을 파라메터(va) 설정값으로 채움
        Args:
            val(any): 지정 값
        Returns: 결측값을 지정 값으로 채운 데이터
            data
        '''
        try:
            print(self.data.isnull().sum().sum())
            self.data = self.data.fillna(value=val)
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data

    def methodFill(self, method=MD_FILL_METHOD.FFILL, limit=0):
        '''
        결측값을 앞/뒤 값으로 채움
        Args:
            method(MD_FILL_METHOD): 앞/뒤 방향 설정
            limit(int): 결측값 채울 앞/뒤 수
        Returns: 결측값을 앞/뒤 값으로 채운 데이터
            data
        '''
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
    
    def typeFill(self, type=MD_FILL_TYPE.MEAN, isInplace=True, column='', isRound=True):
        '''
        결측값을 파라메터(type) 설정값에 맞게 채움
        (평균,표준편차,분산,빈도수,중위수(중앙값),최소,최대)
        Args:
            type(MD_FILL_TYPE): 결측값 유형 설정
            isInplace(bool): dataframe 자리에서 수정여부
            column(str): 결측 컬럼 지정
            round(bool): 소수점 반올림 여부 (1자리)
        Returns: 결측값을 채운 데이터
            data
        '''
        if not column:
            return
        
        try:
            print(self.data.isnull().sum().sum())
            if isRound:                    
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
    
    def typeFillAll(self, type=MD_FILL_TYPE.MEAN):
        '''
        결측값을 파라메터(type) 설정값에 맞게 채움
        (평균,표준편차,분산,빈도수,중위수(중앙값),최소,최대)
        Args:
            type(MD_FILL_TYPE): 결측값 유형 설정
            isInplace(bool): dataframe 자리에서 수정여부
            round(bool): 소수점 반올림 여부 (1자리)
        Returns: 결측값을 채운 데이터
            data
        '''        
        try:
            print(self.data.isnull().sum().sum())
            if type == MD_FILL_TYPE.MEAN:
                self.data = self.data.fillna(self.data.mean())                    
            elif type == MD_FILL_TYPE.STD:
                self.data = self.data.fillna(self.data.std())
            elif type == MD_FILL_TYPE.VAR:
                self.data = self.data.fillna(self.data.var())
            elif type == MD_FILL_TYPE.COUNT:
                self.data = self.data.fillna(self.data.count())
            elif type == MD_FILL_TYPE.MEDIAN:
                self.data = self.data.fillna(self.data.median())
            elif type == MD_FILL_TYPE.MIN:
                self.data = self.data.fillna(self.data.min())
            elif type == MD_FILL_TYPE.MAX:
                self.data = self.data.fillna(self.data.max())
            else:
                self.data = self.data.fillna(self.data.mean())
            print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data