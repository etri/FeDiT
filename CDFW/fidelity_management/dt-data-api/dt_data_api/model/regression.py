import pandas as pd
import os
import matplotlib.pyplot as plt
from sklearn import linear_model
from dt_data_api.common.settings import DATA_PATH

class Manager:
    '''
    regression
    ---
    선형회귀 모델을 통해 결측값 채움
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
    
    def linearRegression(self, column, isIndex):
        '''
        선형회귀 보간
        Args:
            column(str): 컬럼
            isIndex(bool): index 컬럼 지정 여부
        Returns: 선형회귀 채운 데이터
            data
        '''
        try:        
            lin_reg = linear_model.LinearRegression()

            x_cols = []
            y_cols = []
            
            for c in self.data.columns:
                if c != column:
                    x_cols.append(c)
                else:
                    y_cols.append(c)

            if isIndex == False:
                x_cols.pop(0)

            print('----------A')
            #x = self.data.dropna(axis=0)[['m00', 'm10', 'm20', 'm30', 'm40', 'm50']] 
            x = self.data.dropna(axis=0)[x_cols] 
            y = self.data.dropna(axis=0)[column] 

            df_origin = self.data.loc[:,['date', column]]

            #빈값확인
            print(self.data[column].isnull().sum().sum())

            print('----------B')
            lin_reg_model = lin_reg.fit(x, y)
            #print(self.data['m60'][:20])

            print('----------C')
            #결측컬럼을 제외한 데이터 컬럼에 빈값이 있을 경우 오류 발생
            #y_pred = lin_reg_model.predict(self.data.loc[:, ['m00', 'm10', 'm20', 'm30', 'm40', 'm50']])
            y_pred = lin_reg_model.predict(self.data.loc[:, x_cols])
            
            #print(y_pred)
            #print(self.data['m60'][:20])
        
            print('----------D')
            self.data[column].fillna(pd.Series(y_pred.flatten()), inplace=True)

            df_after = self.data.loc[:,['date', column]]
            
            #컬럼 합침 sample
            df_total = pd.concat([df_origin,df_after],axis=1)

            # 차트 윈도우 타이틀
            #BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            plt.figure(num='View matplot Chart')

            # 차트 글꼴
            plt.rcParams.update({'font.size': 5})
            plt.rcParams.update({'font.family': 'batang'})
            #plt.xticks(fontsize=5)
            
            # 차트 제목
            plt.title("Data Analysis Chart")
            
            # x, y 축 제목
            #plt.xlabel("Count")

            df_origin = df_origin.set_index(keys='date')
            df_after = df_after.set_index(keys='date')
            
            fig, axs = plt.subplots(3,1)
            fig.subplots_adjust(hspace=1)

            axs[0].plot(df_origin[column])
            axs[0].set_title('origin')
            
            axs[1].plot(df_after[column])
            axs[1].set_title('regression')
            #df_sample = self.data.loc[:,['date', 'm40']]
            #df_sample = df_sample.set_index(keys='date')
            axs[2].plot(df_origin[column])
            axs[2].plot(df_after[column])
            axs[2].set_title('all')

            #plt.xticks(rotation=50, fontsize=4)
            plt.savefig(self.DATA_FILE_PATH + 'regression_fig.png', dpi=300)
            
            print('----------E')
        except Exception as e:
            raise e            
        return self.data[column]