import pandas as pd
import os
import matplotlib.pyplot as plt
from sklearn import tree
from dt_data_api.common.settings import DATA_PATH
from dt_data_api.util.utils import Utils
import joblib

class Manager:
    '''
    decisionTree
    ---
    결정트리 모델을 통해 결측값 채움
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

    
    def decisionTree(self, columns, column, model_path = ""):
        '''
        결정트리 보간(처리후 모델 저장)
        Args:
            model_path:저장할 모델 경로및 파일 이름 ex) 'D:\\model_directory\\model_name.pkl'
            columns:입력값으로 사용할 컬럼 리스트 ex) ['column1', 'column2', 'column3']
            column(str): 타겟컬럼
            isIndex(bool): index 컬럼 지정 여부
        Returns: 결정트리로 채운 데이터
            data
        '''
        utils = Utils()
        self.data = utils.replace_non_integer_numbers_with_nan(self.data, column)

        # 전체 컬럼에서 사용할 컬럼만 발췌
        apply_colums = columns.copy()
        apply_colums.append(column)

        data_ori = self.data.loc[:, apply_colums]


        try:        
            dTree = tree.DecisionTreeClassifier()

            #x_cols = []
            #y_cols = []
            
            #for c in self.data.columns:
            #for c in apply_colums:
            #    if c != column:
            #        x_cols.append(c)
            #    else:
            #        y_cols.append(c)

            #if isIndex == False:
            #    x_cols.pop(0)


            #print('원본', data)
            # 타겟컬럼이 비어있는 리스트와 비어있지 않은 리스트로 분리
            # 입력용
            data_train = data_ori[data_ori[column].notna() == True].dropna(axis=0) # 비어있지 않음
            # 추론용
            data_test = data_ori[data_ori[column].isna() == True] # 추론해야될 컬럼이 비어있어야됨
            data_test = data_test[data_test[columns].notna() == True] # 추론해야될 컬럼외에 다른 컬럼은 값이 있어야됨

            print('----------A')
            #x = self.data.dropna(axis=0)[['m00', 'm10', 'm20', 'm30', 'm40', 'm50']] 

            if len(data_train) == 0:
                return self.data, -1

            train_x = data_train[columns] 
            train_y = data_train[column] 

            test_x = data_test[columns] 
            test_y = data_test[column] 

            #print('데이터1', train_x)
            #print('데이터2', train_y)
            #print('데이터3', test_x)
            #print('데이터4', test_y)
                        
            #추론될 데이터 인덱스 보관
            y_index = test_y.index.to_list()
            #print(y_index)

            print('----------B')
            print(train_x, train_y)

            dTree.fit(train_x, train_y)
            #print(self.data['m60'][:20])

            #모델 저장
            if model_path != None and model_path != "":
                joblib.dump(dTree, model_path)

            print('----------C')

            if len(data_test) == 0:
                return self.data, 0

            y_pred = dTree.predict(test_x)

            print('----------D')
            #self.data[column].fillna(pd.Series(y_pred.flatten()), inplace=True)

            #합칠 준비
            df_pred = pd.DataFrame(y_pred, index=y_index) #추론값을 위쪽에 미리 보관했던 인덱스로(y_index) 데이터프레임 생성
            #fillna로 합치기위해서 index:값 형태의 딕셔너리 형태로 구성
            df_dic = {}
            for item in df_pred.itertuples():
                df_dic[item[0]] = item[1]

            self.data[column].fillna(df_dic, inplace=True)
            #print('결과', data)


            print('----------E')
        except Exception as e:
            raise e            
        return self.data, 1
    
    def decisionTree_useSavedModel(self, columns, column, model_path):
        '''
        결정트리 보간(저장된 모델을 로드해서 처리)
        Args:
            model_path:불러올 모델 경로및 파일 이름 ex) 'D:\\model_directory\\model_name.pkl'
            columns:입력값으로 사용할 컬럼 리스트 ex) ['column1', 'column2', 'column3']
            column(str): 타겟컬럼
            isIndex(bool): index 컬럼 지정 여부
        Returns: 결정트리로 채운 데이터
            data
        '''
        utils = Utils()
        self.data = utils.replace_non_integer_numbers_with_nan(self.data, column)

        # 전체 컬럼에서 사용할 컬럼만 발췌
        apply_colums = columns.copy()
        apply_colums.append(column)

        data_ori = self.data.loc[:, apply_colums]

        #print('원본', data)
        # 타겟컬럼이 비어있는 리스트와 비어있지 않은 리스트로 분리
        # 입력용
        data_train = data_ori[data_ori[column].notna() == True].dropna(axis=0) # 비어있지 않음
        # 추론용
        data_test = data_ori[data_ori[column].isna() == True] # 추론해야될 컬럼이 비어있어야됨
        data_test = data_test[data_test[columns].notna() == True] # 추론해야될 컬럼외에 다른 컬럼은 값이 있어야됨

        # 추론할 데이터가 없으면 리턴
        
        if len(data_test) == 0: 
            return self.data, 0

        train_x = data_train[columns] 
        train_y = data_train[column] 

        test_x = data_test[columns] 
        test_y = data_test[column] 

        #test_x = self.data.loc[:, columns]

        #print('원본', data)
        try:        
            print('----------A')
            dTree = joblib.load(model_path)
                        
            #추론될 데이터 인덱스 보관
            y_index = test_x.index.to_list()
            #print(y_index)

            print('----------B')

            y_pred = dTree.predict(test_x)

            print('----------C')
            
            #합칠 준비
            df_pred = pd.DataFrame(y_pred, index=y_index) #추론값을 위쪽에 미리 보관했던 인덱스로(y_index) 데이터프레임 생성
            #fillna로 합치기위해서 index:값 형태의 딕셔너리 형태로 구성
            df_dic = {}
            for item in df_pred.itertuples():
                df_dic[item[0]] = item[1]
            print('----------D')
            self.data[column].fillna(df_dic, inplace=True)
            print('----------E')
            #print('결과', data)
        except Exception as e:
            raise e            
        return self.data, 1

   