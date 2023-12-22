import pandas as pd
from dt_data_api.common.enum import MD_FILL_METHOD, MD_FILL_TYPE
#from pynori.korean_analyzer import KoreanAnalyzer

class Manager:
    '''
    vector
    ---
    텍스트 벡터 생성
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

    def vectorText(self):
        '''
        문자열 벡트 텍스트 변환
        Returns: 결측값을 제거한 원본 데이터
            data           
        '''
        try:
            print(self.data)

            #print(self.data.isnull().sum().sum())
            #self.data = self.data.dropna()
            #print(self.data.isnull().sum().sum())
        except Exception as e:
            raise e
        return self.data
    