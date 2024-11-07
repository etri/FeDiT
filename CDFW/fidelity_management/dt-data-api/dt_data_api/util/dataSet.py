import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import re

from dt_data_api.common.enum import MD_VFY_TYPE

class DataInfo:
    '''
    Dataframe 정보
    ---
    데이터셋에 대한 정보를 가져옴
    '''
    def describe(self, df):
        '''
        요약정보
        Args:
            df(any): 데이터 정보
        Returns: 데이터 요약 정보
            result
        '''
        print(df.describe())
        result = df.describe().to_json()

        return result

    def typeInfo(self, df):
        '''
        데이터정보
        Args:
            df(any): 데이터 정보
        Returns: 데이터 타입 정보
            result
        '''
        print(df.info())
        result = df.info()

        return result

    def datasetInfo(self, df, type):
        '''
        데이터셋 정보
        Args:
            df(any): 데이터 정보
            type(any): 데이터 추출 유형
        Returns: 데이터 유형 정보
            result
        '''
        if type=='min':
            result = df.min().to_json()
        elif type=='max':
            result = df.max().to_json()
        elif type=='mean':
            result = df.mean().to_json()
        elif type=='std':
            result = df.std().to_json()
        elif type=='std':
            result = df.median().to_json()
        
        return result
    
    def hist(self, df, histFile=None):
        '''
        히스토그램
        Args:
            df(any): 데이터 정보  
            histFile(any): 저장파일          
        '''
        result = {'histFile': None}

        try:
            plt.hist(df, stacked=True)
            if histFile:
                plt.savefig(histFile, dpi=300)
            else:
                plt.show()
        except Exception as e:
            raise e

    def info(self, df):
        '''
        데이터셋 정보
        Args:
            df(any): 데이터 정보 
        Returns: 컬럼, 데이터셋, 범위 정보
            result 
        '''
        result = {'columns': None, 'info': None, 'range': None}
        
        try:
            desc = df.describe()
            result_df = pd.DataFrame(desc)
            result_df = result_df.reset_index()
            #da = da.append(
            #    {'index':'a', 'm00':0, 'm10':0, 'm20':0, 'm30':0, 'm40':0, 'm50':0, 'm60':0, 'w00':0, 'w10':0, 'w20':0, 'w30':0, 'w40':0, 'w50':0, 'w60':0}, 
            #    ignore_index=True
            #)

            #print(result_df)
            
            #데이터처리
            unique = {'index':'unique'}
            nan = {'index':'nan'}
            duplicate = {'index':'duplicate'}
            dtype = {'index':'dtype'}
            columns = []
            range = []
            col_values = []

            for column in df.columns:
                unique[column] = len(df[column].unique())
                nan[column] = df[column].isnull().sum()
                duplicate[column] = df[column].duplicated().sum()
                dtype[column] = str(df[column].dtype)
                
                columns.append(column)
                #데이터값 그룹
                range.append(pd.DataFrame(df.groupby(column).size(), columns=[column]).to_json())
                #range[column] = pd.DataFrame(df.groupby(column).size(), columns=[column]).to_json()



            '''
            print('---')
            group = df.groupby('w60')
            g = pd.DataFrame(group.size(), columns=['count'])
            print(g.to_json())
            print('---')
            '''

            result_df = result_df.append(unique, ignore_index=True)
            result_df = result_df.append(nan, ignore_index=True)
            result_df = result_df.append(duplicate, ignore_index=True)
            result_df = result_df.append(dtype, ignore_index=True)
            result_df = result_df.set_index('index')
            
            #print(result_df)

            info = []
            for column in result_df.columns:
                info.append(pd.DataFrame(result_df[column], columns=[column]).to_json())

            #print(info)
            
            result['columns'] = columns
            result['info'] = info #result_df.to_json()
            result['range'] = range
            #print(result)

        except Exception as e:
            raise e

        return result

    def correlation(self, df, corrFile=None):
        '''
        상관관계
        Args:
            df(any): 데이터 정보  
            corrFile(any): 저장파일
        Returns: 상관관계 데이터
            {'xdata': None, 'ydata': None, 'data': None}           
        '''
        result = {'xdata': None, 'ydata': None, 'data': None}

        try:
            corr = df.corr()
            
            '''이미지저장 (임시)
            plt.figure(figsize=(11,8))
            sns.heatmap(corr, cmap="RdBu", annot=True) #cmap="RdBu" Greens,
            #sns.clustermap(corr, method = 'complete', cmap='RdBu', annot=True, annot_kws={'size': 8})
            
            if corrFile:
                plt.savefig(corrFile, dpi=300)
            else:
                plt.show()
            '''
            
            xdata = []
            for column in corr.columns:
                c = {'name':column, 'value': column}
                xdata.append(c)
            
            ydata = []
            for row in reversed(corr.index):
                r = {'name':row, 'value': row}
                ydata.append(r)

            data = []
            for row in corr.index:
                for column in corr.columns:
                    if "nan" not in str(corr.loc[row][column]):
                        d = {
                            'name':row, 
                            #'value':[row, column, round((-1 if str(corr.loc[row][column])=="nan" else corr.loc[row][column]), 2)]
                            'value':[row, column, round(corr.loc[row][column], 2)]                        
                        }
                        data.append(d)
                        
            #print(data)

            result['xdata'] = xdata
            result['ydata'] = ydata
            result['data'] = data
        except Exception as e:
            raise e
        
        return result

    def unitConverter(self, df=None, df_unit=None, unitColumn=None, unitFormula=None):
        '''
        단위변환
        Args:
            df(any): 데이터 정보  
            df_unit(any): 단위저장 데이터
            unitColumn(any): 단위변환 항목
            unitFormula(any): 단위변환 공식
        Returns: 단위변환 데이터
            unit_df
        '''
        try:
            #aaa = eval(unitFormula.format(50))
            #print(aaa)

            df_column = df[unitColumn]

            for row in range(df_column.count()):
                df_column.iloc[row] = eval(unitFormula.format(df_column.iloc[row]))

            df_unit[unitColumn] = df_column
        except Exception as e:
            raise e        
        
        return df_unit
    
    def dataVerifyInfo(self, df=None, verifyType=None, verifyColumn=None, rule1=None, rule2=None, rule3=None, rule4=None):
        '''
        데이터검증
        Args:
            df(any): 데이터 정보  
            verifyType(any): 검증 유형
            verifyColumn(any): 검증 항목
            rule1(any): 규칙1
            rule2(any): 규칙2
            rule3(any): 규칙3
            rule4(any): 규칙4
        Returns: 검증 데이터 정보
            message
        '''
        
        message = ''

        try:
            #aaa = eval(unitFormula.format(50))
            #print(aaa)

            df_column = df[verifyColumn]
            if verifyType == MD_VFY_TYPE.DT:
                message = '전체 {0}건의 데이터 중에 {1}형 데이터 타입이 {2}건 있습니다'
                data_count = df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x)).sum()
                message = message.format(df_column.size, rule1, data_count)

                # if str(rule1).lower() == "int":
                #     data_count = df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x)).sum()
                #     message = message.format(df_column.size, rule1, data_count)
                # if str(rule1).lower() == "float":
                #     data_count = df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x)).sum()                    
                #     message = message.format(df_column.size, rule1, data_count)
                # elif str(rule1).lower() == "string":
                #     #print(df_column.astype(str).apply(lambda x: x.isalpha()).sum())
                #     #data_count = df_column.astype(str).apply(lambda x: x.isalpha()).sum()                                                            
                #     data_count = df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x)).sum()
                #     message = message.format(df_column.size, rule1, data_count)
                # if str(rule1).lower() == "date":
                #     data_count = df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x)).sum()
                #     message = message.format(df_column.size, rule1, data_count)                    
                # else:
                #     print(rule1)
            elif verifyType == MD_VFY_TYPE.DF:
                message = '전체 {0}건의 데이터 중에 {1}형 형식이 {2}건 있습니다'
                data_count = df_column.astype(str).apply(lambda x: self.get_data_format(rule1, rule2, x)).sum()                
                message = message.format(df_column.size, rule1, data_count)                
            elif verifyType == MD_VFY_TYPE.RG:
                message = '전체 {0}건의 데이터 중에 {1}형 범위 값이 {2}건 있습니다'
                data_count = df_column.astype(str).apply(lambda x: self.get_data_range(rule1, rule2, rule3, x)).sum()
                message = message.format(df_column.size, rule1, data_count)                                
            else:
                print(verifyType)
        except Exception as e:
            raise e        
        
        return message

    def dataVerify(self, df=None, df_verify=None, verifyType=None, verifyColumn=None, clearType=None, rule1=None, rule2=None, rule3=None, rule4=None):
        '''
        데이터검증
        Args:
            df(any): 데이터 정보  
            df_verify(any): 검증 데이터
            verifyType(any): 검증 유형
            verifyColumn(any): 검증 항목
            clearType(any): 지우기 유형
            rule1(any): 규칙1
            rule2(any): 규칙2
            rule3(any): 규칙3
            rule4(any): 규칙4
        Returns: 검증 데이터 정보
            message
        '''
        try:
            df_column = df[verifyColumn]
            if verifyType == MD_VFY_TYPE.DT:
                df_temp = df_column.astype(str).apply(lambda x: self.set_data_type(clearType, rule1, x))                
            elif verifyType == MD_VFY_TYPE.DF:
                df_temp = df_column.astype(str).apply(lambda x: self.set_data_format(clearType, rule1, rule2, x))
            elif verifyType == MD_VFY_TYPE.RG:
                df_temp = df_column.astype(str).apply(lambda x: self.set_data_range(clearType, rule1, rule2, rule3, x))
            else:
                print(verifyType)

            df_verify[verifyColumn] = df_temp
        except Exception as e:
            raise e        
        
        return df_verify
    

    def dataVerifyInfo2(self, df=None, verifyType=None, verifyColumn=None, rule1=None, rule2=None, rule3=None, rule4=None):
        try:
            #aaa = eval(unitFormula.format(50))
            #print(aaa)
            
            df_column = df[verifyColumn]
            if verifyType == MD_VFY_TYPE.DT.value:
                data_count = df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x)).sum()
            elif verifyType == MD_VFY_TYPE.DF.value:
                data_count = df_column.astype(str).apply(lambda x: self.get_data_format(rule1, rule2, x)).sum()
            elif verifyType == MD_VFY_TYPE.RG.value:
                data_count = df_column.astype(str).apply(lambda x: self.get_data_range(rule1, rule2, rule3, x)).sum()
            else:
                print(verifyType)
        except Exception as e:
            raise e        
        
        return data_count

    def dataVerify2(self, df=None, df_verify=None, verifyType=None, verifyColumn=None, clearType=None, rule1=None, rule2=None, rule3=None, rule4=None):
        '''
        MD_VFY_TYPE.DT.value로 해줘야 비교가 됨. 파이썬 새로 세팅 후 문제가 생겼는데 우선진행
        데이터검증
        Args:
            df(any): 데이터 정보  
            df_verify(any): 검증 데이터
            verifyType(any): 검증 유형
            verifyColumn(any): 검증 항목
            clearType(any): 지우기 유형
            rule1(any): 규칙1
            rule2(any): 규칙2
            rule3(any): 규칙3
            rule4(any): 규칙4
        Returns: 검증 데이터 정보
            message
        '''
        try:
            print(f'verifyType={verifyType} verifyColumn={verifyColumn} clearType={clearType} rule1={rule1} rule2={rule2} rule3={rule3}')
            
            df_column = df[verifyColumn]
            print(df_column.isnull().sum())            
            if verifyType == MD_VFY_TYPE.DT.value:
                df_temp = df_column.astype(str).apply(lambda x: self.set_data_type(clearType, rule1, x))                  
                validate_df = df[df_column.astype(str).apply(lambda x: self.get_data_type(rule1, x))]
            elif verifyType == MD_VFY_TYPE.DF.value:
                df_temp = df_column.astype(str).apply(lambda x: self.set_data_format(clearType, rule1, rule2, x))                
                validate_df = df[df_column.astype(str).apply(lambda x: self.get_data_format(rule1, rule2, x))]                
            elif verifyType == MD_VFY_TYPE.RG.value:
                df_temp = df_column.astype(str).apply(lambda x: self.set_data_range(clearType, rule1, rule2, rule3, x))                
                validate_df = df[df_column.astype(str).apply(lambda x: self.get_data_range(rule1, rule2, rule3, x))]                
            else:
                print(verifyType)

            print(validate_df)
            df_verify[verifyColumn] = df_temp
        except Exception as e:
            raise e        
        
        return df_verify, validate_df


    def get_data_type(self, rule, value):
        '''
        데이터 유형 체크
        Args:
            rule(any): 데이터 타입  
            value(any): 데이터 값
        Returns: 데이터 타입 유/무
            Bool
        '''
        #print(rule)
        if pd.isna(value) or value == '' or str.lower(value) == 'nan':
            return False
        
        if str(rule).lower() == "int":
            if re.match(r'^-?\d+\.?\d*$', value):
                return False if "." in value else True
        elif str(rule).lower() == "float":
            if re.match(r'^-?\d+\.?\d*$', value):
                return True if "." in value else False
        elif str(rule).lower() == "string":
            if re.match(r'^-?\d+\.?\d*$', value):
                return False
            else:
                return True
        elif str(rule).lower() == "date":
            if re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                return True
        else:
            return False
    
    def set_data_type(self, clearType, rule, value):
        '''
        데이터 검증 변환
        Args:
            rule(any): 데이터 타입  
            value(any): 데이터 값
        Returns: 데이터 값 변경
            value
        '''
        #print(rule)
        if pd.isna(value) or value == '' or str.lower(value) == 'nan':
            return ''
        
        if str(rule).lower() == "int":            
            if clearType == "I":
                if re.match(r'^-?\d+\.?\d*$', value):
                    return value if "." in value else ''
                else: return ''
            elif clearType == "O":
                if re.match(r'^-?\d+\.?\d*$', value):
                    return '' if "." in value else value                
                else: return value
        elif str(rule).lower() == "float":
            if clearType == "I":
                if re.match(r'^-?\d+\.?\d*$', value):
                    return '' if "." in value else value
                else: return value
            elif clearType == "O":
                if re.match(r'^-?\d+\.?\d*$', value):
                    return value if "." in value else ''
                else: return ''                    
        elif str(rule).lower() == "string":
            if clearType == "I":
                if re.match(r'^-?\d+\.?\d*$', value):
                    return value
                else: return ''
            elif clearType == "O":
                if re.match(r'^-?\d+\.?\d*$', value):
                    return ''
                else: return value                
        elif str(rule).lower() == "date":
            if clearType == "I":
                if re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                    return ''
                else: return value
            elif clearType == "O":
                if re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                    return value
                else: return ''
        else:
            return value

    def get_data_format(self, rule, rule1, value):
        '''
        데이터 포멧 체크
        Args:
            rule(any): 데이터 형식
            value(any): 포멧 값 (정규식)
        Returns: 데이터 형식 유/무
            Bool
        '''
        if str(rule).lower() == "date":
            if re.match(rule1, value):
                return True
            else:
                return False
        else:
            return False
    
    def set_data_format(self, clearType, rule, rule1, value):
        '''
        데이터 포멧 체크
        Args:
            rule(any): 데이터 형식
            value(any): 포멧 값 (정규식)
        Returns: 데이터 값 변경
            value
        '''
        if pd.isna(value) or value == '' or str.lower(value) == 'nan':
            return ''
        
        if str(rule).lower() == "date":
            if clearType=="I":
                if re.match(rule1, value):
                    return ''
                else: return value
            elif clearType == "O":
                if re.match(rule1, value):
                    return value
                else: return ''
        else:
            return ''
    
    def get_data_range(self, rule, rule1, rule2, value):
        '''
        데이터 범위 체크
        Args:
            rule(any): 데이터 타입
            rule1(any): 범위 값1
            rule2(any): 범위 값2
            value(any): 데이터 값
        Returns: 데이터 범위 유/무
            Bool
        '''
        if str(rule).lower() == "int":
            if re.match(r'^-?\d+\.?\d*$', value):
                if "." not in value:
                    if int(rule1) <= int(value) and int(rule2) >= int(value):
                        return True
                    else:
                        return False
                else:
                    return False
            else:
                return False
        elif str(rule).lower() == "float":
            if re.match(r'^-?\d+\.?\d*$', value):
                if "." in value:
                    if float(rule1) <= float(value) and float(rule2) >= float(value):
                        return True
                    else:
                        return False
                else:
                    return False
            else:
                return False
        else:
            return False      
          
    def set_data_range(self, clearType, rule, rule1, rule2, value):
        '''
        데이터 범위 체크
        Args:
            rule(any): 데이터 타입
            rule1(any): 범위 값1
            rule2(any): 범위 값2
            value(any): 데이터 값
        Returns: 데이터 값 변경
            value
        '''
        if pd.isna(value) or value == '' or str.lower(value) == 'nan':
            return ''
        
        if str(rule).lower() == "int":
            if clearType=="I":
                if re.match(r'^-?\d+\.?\d*$', value):
                    if "." not in value:
                        if int(rule1) <= int(value) and int(rule2) >= int(value):
                            return ''
                        else: return value
                    else: return value
                else: return value
            elif clearType == "O":
                if re.match(r'^-?\d+\.?\d*$', value):
                    if "." not in value:
                        if int(rule1) <= int(value) and int(rule2) >= int(value):
                            return value
                        else: return ''
                    else: return ''
                else: return ''
        elif str(rule).lower() == "float":
            if clearType=="I":
                if re.match(r'^-?\d+\.?\d*$', value):
                    if "." in value:
                        if float(rule1) <= float(value) and float(rule2) >= float(value):
                            return ''
                        else: return value
                    else: return value
                else: return value
            elif clearType == "O":
                if re.match(r'^-?\d+\.?\d*$', value):
                    if "." in value:
                        if float(rule1) <= float(value) and float(rule2) >= float(value):
                            return value
                        else: return ''
                    else: return ''
                else: return ''
        else:
            return ''
        
    
    def dateTimeCheck2(self, df=None, index_col=None):
        '''
        날씨 시간 체크
        Args:
            df(any): 데이터 정보              
        Returns: 검증 데이터 정보
            message
        '''
        result = {'delta':[], 'count':[]}

        try:
            #dtemp = df.copy()
            #dtemp['delta'] = (dtemp['date'] - dtemp['date'].shift()).fillna(pd.Timedelta(0))
            #dtemp['delta'] = dtemp.date.diff().fillna(pd.Timedelta(0))
            
            df['delta'] = df[index_col].diff().fillna(pd.Timedelta(0))
            r = df.groupby('delta').size()
            r = r.reset_index()            
            
            result['delta'] = r['delta']
            result['count'] = r[0]

        except Exception as e:
            raise e        
        
        return result