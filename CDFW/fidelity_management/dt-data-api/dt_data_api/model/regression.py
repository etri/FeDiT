import pandas as pd
import os
import matplotlib.pyplot as plt
from sklearn import linear_model, ensemble
from sklearn.model_selection import train_test_split
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
    
    def linearRegressionEx(self, columns, column, isIndex):
        '''
        선형회귀 보간
        Args:
            columns:입력값으로 사용할 컬럼 리스트 ex) ['column1', 'column2', 'column3']
            column(str): 추론할 타겟컬럼
            isIndex(bool): index 컬럼 지정 여부
        Returns: 선형회귀 채운 데이터
            data
        '''

        # 전체 컬럼에서 사용할 컬럼만 발췌
        apply_colums = columns.copy()
        apply_colums.append(column)
        data_ori = self.data.loc[:, apply_colums]

        print('데이터', data_ori)

        # 타겟컬럼이 비어있는 리스트와 비어있지 않은 리스트로 분리
        # 입력용
        data_train = data_ori[data_ori[column].notna() == True].dropna(axis=0) # 비어있지 않음
        # 추론용
        data_test = data_ori[data_ori[column].isna() == True] # 추론해야될 컬럼이 비어있어야됨
        data_test = data_test[data_test[columns].notna() == True] # 추론해야될 컬럼외에 다른 컬럼은 값이 있어야됨

        try:        
            lin_reg = linear_model.LinearRegression()

            x_cols = []
            y_cols = []
            
            #for c in self.data.columns:
            for c in apply_colums:
                if c != column:
                    x_cols.append(c)
                else:
                    y_cols.append(c)

            if isIndex == False:
                x_cols.pop(0)

            print('----------A')
            #x = self.data.dropna(axis=0)[['m00', 'm10', 'm20', 'm30', 'm40', 'm50']] 
            #훈련 데이터
            train_x = data_train[x_cols] 
            train_y = data_train[column] 

            #추론 데이터
            test_x = data_test[x_cols] 
            test_y = data_test[column]

            print('데이터1', train_x)
            print('데이터2', train_y)
            print('데이터3', test_x)
            print('데이터4', test_y)

            #추론될 데이터 인덱스 보관
            y_index = test_y.index.to_list()
            print(y_index)

            df_origin = self.data.loc[:,[column]]

            #빈값확인
            print(self.data[column].isnull().sum().sum())

            print('----------B')
            lin_reg.fit(train_x, train_y)
            #print(self.data['m60'][:20])

            print('----------C')
            y_pred = lin_reg.predict(test_x)
            
            print('결과', y_pred, y_pred.shape)
            #print(self.data['m60'][:20])

            print('----------D')
            #self.data[column].fillna(pd.Series(y_pred.flatten()), inplace=True)

            #합칠 준비
            df_pred = pd.DataFrame(y_pred, index=y_index) #추론값을 위쪽에 미리 보관했던 인덱스로(y_index) 데이터프레임 생성
            #fillna로 합치기위해서 index:값 형태의 딕셔너리 형태로 구성
            df_dic = {}
            for item in df_pred.itertuples():
                df_dic[item[0]] = item[1]

            self.data[column].fillna(df_dic, inplace=True)
            print('결과 합치기', self.data[column].head(40))

            
            df_after = self.data.loc[:,[column]]
            
            #컬럼 합침 sample
            df_total = pd.concat([df_origin,df_after],axis=1)

            '''
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

            #df_origin = df_origin.set_index(keys='date')
            #df_after = df_after.set_index(keys='date')
            
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
            plt.savefig(self.DATA_FILE_PATH + 'regression_Test.png', dpi=300)
            '''
            print('----------E')
        except Exception as e:
            raise e            
        return self.data[column], self.data

    def randomForestRegression(self, columns, column, isIndex, n_estimators=100):
        '''
        랜덤포레스트 회귀
        Args:
            columns:입력값으로 사용할 컬럼 리스트 ex) ['column1', 'column2', 'column3']
            column(str): 타겟컬럼
            isIndex(bool): index 컬럼 지정 여부
        Returns: 결정트리로 채운 데이터
            data
        '''

        # 전체 컬럼에서 사용할 컬럼만 발췌
        apply_colums = columns.copy()
        apply_colums.append(column)
        data_ori = self.data.loc[:, apply_colums]

        print('데이터', data_ori)

        # 타겟컬럼이 비어있는 리스트와 비어있지 않은 리스트로 분리
        # 입력용
        data_train = data_ori[data_ori[column].notna() == True].dropna(axis=0) # 비어있지 않음
        # 추론용
        data_test = data_ori[data_ori[column].isna() == True] # 추론해야될 컬럼이 비어있어야됨
        data_test = data_test[data_test[columns].notna() == True] # 추론해야될 컬럼외에 다른 컬럼은 값이 있어야됨

        try:        
            rf_reg = ensemble.RandomForestRegressor(n_estimators=n_estimators, random_state=42)

            x_cols = []
            y_cols = []
            
            #for c in self.data.columns:
            for c in apply_colums:
                if c != column:
                    x_cols.append(c)
                else:
                    y_cols.append(c)

            if isIndex == False:
                x_cols.pop(0)

            print('----------A')
            #x = self.data.dropna(axis=0)[['m00', 'm10', 'm20', 'm30', 'm40', 'm50']] 
            #훈련 데이터
            train_x = data_train[x_cols] 
            train_y = data_train[column] 

            #추론 데이터
            test_x = data_test[x_cols] 
            test_y = data_test[column]

            if len(test_x) == 0:
                train_x, test_x, train_y, test_y = train_test_split(train_x, train_y, test_size=0.2, random_state=42)

            print('데이터1', train_x)
            print('데이터2', train_y)
            print('데이터3', test_x)
            print('데이터4', test_y)

            #추론될 데이터 인덱스 보관
            y_index = test_y.index.to_list()
            print(y_index)

            df_origin = self.data.loc[:,[column]]

            #빈값확인
            print(self.data[column].isnull().sum().sum())

            print('----------B')
            rf_reg.fit(train_x, train_y)
            #print(self.data['m60'][:20])

            print('----------C')
            y_pred = rf_reg.predict(test_x)
            
            print('결과', y_pred, y_pred.shape)
            #print(self.data['m60'][:20])

            print('----------D')
            #self.data[column].fillna(pd.Series(y_pred.flatten()), inplace=True)

            #합칠 준비
            df_pred = pd.DataFrame(y_pred, index=y_index) #추론값을 위쪽에 미리 보관했던 인덱스로(y_index) 데이터프레임 생성
            #fillna로 합치기위해서 index:값 형태의 딕셔너리 형태로 구성
            df_dic = {}
            for item in df_pred.itertuples():
                df_dic[item[0]] = item[1]

            self.data[column].fillna(df_dic, inplace=True)
            print('결과 합치기', self.data[column].head(40))

            
            df_after = self.data.loc[:,[column]]
            
            #컬럼 합침 sample
            df_total = pd.concat([df_origin,df_after],axis=1)

            
            print('----------E')
        except Exception as e:
            raise e            
        return self.data[column], self.data