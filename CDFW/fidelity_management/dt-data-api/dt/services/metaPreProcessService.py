import pandas as pd
import logging
import os
from datetime import date
from dt.sql.metaPreProcessSql import metaPreProcessQuery
import json
from datetime import datetime, timedelta
import numpy as np
import csv
import logging
from dateutil.parser import parse
logging = logging.getLogger('dt')


from dt_data_api.common.lib import (
    MD_IP_METHOD, DB_NAME, MD_VFY_TYPE, ERROR_CODE, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS,
    DATA_PATH_META, MODEL_PATH_META, MODEL_AE_PATH_META,
    interpolate, resample, outlier,
    DataInfo, rnnGeneraterMeta,
    ModelParameters, InputParameters,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class metaPreProcessService(object):
    '''
    preprocess Service
    ---
    전처리 서비스 클래스
    '''

    #데이터베이스 객체
    sql = metaPreProcessQuery(database=DB_NAME.DT_DATA_PLATFORM)

    #데이터셋 객체
    dataInfo = DataInfo()
    

    def processorMakeUserUploadBaseDataSet(self, paramData=None, pageParam=None):
        '''
        데이터셋 데이터정보
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search = None
        sort = None

        try:            
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                #outlierFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                #rangeFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            if not os.path.exists(paramData['file_path']):
                os.makedirs(paramData['file_path'])
            
            #df = pd.DataFrame(dataFile)
            df = pd.read_csv(dataFile)
    
            #날짜부분은 좀 더 고민
            #지정 갯수 가져오기

            header = df.head(0)  # 헤더 가져오기
            last_rows = df

            new_df = pd.concat([header, last_rows])
            output_path = os.path.join(paramData['file_path'], paramData['file_name'])
            new_df.to_csv(output_path, index=False, quoting=csv.QUOTE_ALL)


            paramData['base_dir'] = os.path.basename(paramData['file_path'])
            #paramData['base_file_nm_set_range_row'] = paramData['target_file_name']

            result['result'] = True
            result['resultMessage'] = paramData

            #return False
            #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #info = self.dataInfo.info(df)

            #result['result'] = True
            #result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result    

    def processorMakeBaseDataSet(self, paramData=None, pageParam=None):
        '''
        데이터셋 데이터정보
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search = None
        sort = None

        try:            
            #if paramData['field']:
                #search = str.format("AND {0} LIKE '%{1}%'", paramData['field'], paramData['keyword'])
            #search = str.format("AND DATE_FORMAT(yyyymmdd, '%Y%m%d') BETWEEN {0} AND {1}", paramData['target_start_date'], paramData['target_end_date'])

            #if paramData['sort_field']:
            #sort = str.format('ORDER BY {0} {1}', 'yyyymmdd', 'asc')

            #data = self.sql.metaTestListQuery(pageParam=pageParam)
            data = paramData['data']
            
            if not os.path.exists(paramData['file_path']):
                os.makedirs(paramData['file_path'])
           
            df = pd.DataFrame(data)
            
            '''
            print(df.tail)
            # 이동시킬 열 추출
            index_trgt_col = paramData['index_trgt_col']
            index_col = df.pop(index_trgt_col)

            # 이동시킬 열을 DataFrame의 맨 앞으로 삽입
            df.insert(0, index_trgt_col, index_col)
            '''
            
            # 파일 경로 생성
            file_path = os.path.join(paramData['file_path'], paramData['file_name'])
            
            
            df.to_csv(file_path, index=False, quoting=csv.QUOTE_ALL)
            paramData['base_dir'] = os.path.basename(paramData['file_path'])

            #if 'index_trgt_col' not in paramData:
            if paramData.get('index_trgt_col') is not None:
                last_value = df[paramData['index_trgt_col']].iloc[-1]
                paramData['data_crt_last_hr'] = last_value

            result['result'] = True
            result['resultMessage'] = paramData

            #return False
            #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #info = self.dataInfo.info(df)

            #result['result'] = True
            #result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result    



    
    def is_date(self, value, fuzzy=False):
        """
        값이 날짜 문자열인지 확인합니다.

        :param value: 날짜로 확인할 값
        :param fuzzy: 모호한 날짜 형식을 허용할지 여부
        :return: 값이 유효한 날짜 형식이면 True, 아니면 False
        """
        if isinstance(value, (int, float)):
            return False
        
        # 추가적인 체크: 숫자로 변환될 수 있는 문자열인 경우 False 반환
        if isinstance(value, str) and value.isdigit():
            return False
                
        try:
            parse(value, fuzzy=fuzzy)
            return True
        except (ValueError, TypeError):
            return False


    def processorCheckIndexTimeColumn(self, paramData=None, pageParam=None):
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:            
            dataFile = os.path.join(paramData['file_path'], paramData['base_file_name'])
            #df = pd.DataFrame(dataFile)
            df = pd.read_csv(dataFile)
            column_name = paramData['index_trgt_col']

            if column_name not in df.columns:
                raise ValueError(f"컬럼 '{column_name}'이(가) CSV 파일에 존재하지 않습니다.")
            
            if df[column_name].apply(lambda x: self.is_date(x)).all():
                result['result'] = True
                result['resultMessage'] = True
            else:
                result['result'] = True
                result['resultMessage'] = False
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result  


    def processorMakeBaseDataSetRangeRow(self, paramData=None, pageParam=None):
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:            
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['base_file_name'])
                rangeFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            if not os.path.exists(paramData['file_path']):
                os.makedirs(paramData['file_path'])
            
            #df = pd.DataFrame(dataFile)
            df = pd.read_csv(dataFile)
    
            
            #print(df.tail)
            # 이동시킬 열 추출
            index_trgt_col = paramData['index_trgt_col']
            index_col = df.pop(index_trgt_col)

            # 이동시킬 열을 DataFrame의 맨 앞으로 삽입
            df.insert(0, index_trgt_col, index_col)
            


            #날짜부분은 좀 더 고민
            #지정 갯수 가져오기

            header = df.head(0)  # 헤더 가져오기
            
            if int(paramData['target_row_count']) > 0:
                last_rows = df.tail(int(paramData['target_row_count']))
            else:
                last_rows = df

            new_df = pd.concat([header, last_rows])
            output_path = os.path.join(paramData['file_path'], paramData['target_file_name'])
            new_df.to_csv(output_path, index=False, quoting=csv.QUOTE_ALL)

            paramData['base_file_nm_set_range_row'] = paramData['target_file_name']

            result['result'] = True
            result['resultMessage'] = paramData

            #return False
            #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #info = self.dataInfo.info(df)

            #result['result'] = True
            #result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result  


    def processorMakeBaseDataSetRangeCol(self, paramData=None, pageParam=None):
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:            
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['base_file_name'])
                rangeFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            if not os.path.exists(paramData['file_path']):
                os.makedirs(paramData['file_path'])

            
            #df = pd.DataFrame(dataFile)
            df = pd.read_csv(dataFile)

            # 추출할 인덱스 컬럼과 대상 컬럼을 지정합니다.
            index_trgt_col = paramData['index_trgt_col']
            target_col = paramData['preproc_trgt_col']


            # 인덱스 컬럼과 대상 컬럼을 포함한 DataFrame을 생성합니다.
            new_df = df[[index_trgt_col] + target_col]
            output_path = os.path.join(paramData['file_path'], paramData['target_file_name'])
            new_df.to_csv(output_path, index=False, quoting=csv.QUOTE_ALL)

            paramData['base_file_nm_set_range_col'] = paramData['target_file_name']

            result['result'] = True
            result['resultMessage'] = paramData
        except Exception as e:

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result  

    def processorDatasetInfo(self, paramData=None):
        '''
        데이터셋 데이터정보
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:            
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            info = self.dataInfo.info(df)

            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetInfo')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorDatasetVerify(self, paramData=None):
          
        '''
        데이터셋 단위변환
        Args:
            paramData(any): 전처리데이터 검증 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        #frontName = 'valid_' + str(paramData['set_order']) + '_'
        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                verifyFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                verifyFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
                #verifyFile = os.path.join(paramData['file_path'], paramData['file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True, dtype=object)

            if paramData['is_create']=="Y":
                frontName = 'valid_' + str(paramData['set_order']) + '_'
                verifyFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])

                if str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.DT.value:
                    paramData['vrfc_tp'] = MD_VFY_TYPE.DT.value
                elif str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.DF.value:
                    paramData['vrfc_tp'] = MD_VFY_TYPE.DF.value
                elif str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.RG.value:
                    paramData['vrfc_tp'] = MD_VFY_TYPE.RG.value
                else:
                    paramData['vrfc_tp'] =  MD_VFY_TYPE.DT.value

                df_cnt = len(df[paramData['vrfc_trgt_col']])
                #변환 전 대상 데이터 수
                data_cnt = self.dataInfo.dataVerifyInfo2(df=df, verifyType=paramData['vrfc_tp'], verifyColumn=paramData['vrfc_trgt_col'], rule1=paramData['rule1'], rule2=paramData['rule2'], rule3=paramData['rule3'], rule4=paramData['rule4'])

                if data_cnt == 0:
                    paramData['target_file_name'] = paramData['file_name']
                    paramData['data_all_yn'] = 'Y'                
                elif df_cnt > data_cnt:
                    if not os.path.exists(verifyFile):
                        df.to_csv(verifyFile, index=True)    

                    df_verify = pd.read_csv(verifyFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True, dtype=object)
                    data, validate_data = self.dataInfo.dataVerify2(df=df, df_verify=df_verify, verifyType=paramData['vrfc_tp'], verifyColumn=paramData['vrfc_trgt_col'], clearType=paramData['vrfc_clear_type'], rule1=paramData['rule1'], rule2=paramData['rule2'], rule3=paramData['rule3'], rule4=paramData['rule4'])

                    data.reset_index(inplace=True)
                    data.to_csv(verifyFile, index=False, quoting=csv.QUOTE_ALL)

                    validate_data.reset_index(inplace=True)
                    validate_data.to_csv(verifyFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    paramData['data_all_yn'] = 'N'
                else:
                    paramData['target_file_name'] = paramData['file_name']
                    #전체데이터를 대상으로 하면 전처리 불가 알림처리용
                    paramData['data_all_yn'] = 'Y'

                result['resultMessage'] = paramData
            else:
        
                if str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.DT.value:
                    paramData['vrfc_tp'] = MD_VFY_TYPE.DT
                elif str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.DF.value:
                    paramData['vrfc_tp'] = MD_VFY_TYPE.DF
                elif str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.RG.value:
                    paramData['vrfc_tp'] = MD_VFY_TYPE.RG
                else:
                    paramData['vrfc_tp'] =  MD_VFY_TYPE.DT

                if os.path.isfile(verifyFile):
                    df = pd.read_csv(verifyFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True, dtype=object)

                data = self.dataInfo.dataVerifyInfo(df=df, verifyType=paramData['vrfc_tp'], verifyColumn=paramData['vrfc_trgt_col'], rule1=paramData['rule1'], rule2=paramData['rule2'], rule3=paramData['rule3'], rule4=paramData['rule4'])
                result['resultMessage'] = data

            result['result'] = True            
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetVerify')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def standardDeviation(self, paramData=None):
        '''
        표준편차 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''    
        result = {'result': False, 'resultMessage':None}   
        errorMsg = ''     

        name, ext = os.path.splitext(paramData['file_name'])
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
        
        try:
            df=pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)

            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # feature = 'ondo' #항목
            # freq = 50
            # p_value = 0.05 #정규분포 경계
            
            feature = paramData['feature']
            freq = paramData['freq']
            p_value = paramData['p_value']
            is_create =  paramData['isCreate']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)
            t, s, r = oul.tsDecompose(feature=feature, freq=freq)


            p = oul.zTest(r)
            if p[0] < paramData['p_value']:
                raise Exception(str.format('p-value {0} 이하로 정규분포를 적용할 수 없습니다.', p_value))
                
            df_outlier = oul.standardDeviation(r, is_create)
            #df = df.reset_index()
            #print(df)
            result['result'] = True
            #result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            if is_create=='N':
                result['resultMessage'] = df_outlier
            else:
                frontName = 'outlier_' + str(paramData['set_order']) + '_'
                outlierFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])                
                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, feature] = np.nan
                    #df.to_csv(outlierFile, index=True)
                    #result['resultMessage'] = outlierFile
                    #df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)
                    #result['resultMessage'] = paramData
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)                    

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    result['resultMessage'] = paramData                      
                else:
                    #result['resultMessage'] = outlierFile   

                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    result['resultMessage'] = paramData                    


        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'standardDeviation')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def kMeans(self, paramData=None):
        '''
        k-means 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}        
        errorMsg = ''

        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])   

            df=pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)
            
            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # features = ['ondo']
            # freq = 50

            features = [paramData['feature']]
            freq = paramData['freq']
            n_clusters = paramData['n_clusters']
            n_clusters_lable = paramData['n_clusters_lable']
            is_create =  paramData['isCreate']
            n_count =  paramData['n_count']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)
            
            df_outlier = oul.kMeans(features=features, freq=freq, n_clusters=n_clusters, n_clusters_lable=n_clusters_lable,is_create=is_create,n_count=n_count)
            #df = df.reset_index()
            #print(df)
            
            result['result'] = True
            if is_create=='N':
                result['resultMessage'] = df_outlier
            else:
                frontName = 'outlier_' + str(paramData['set_order']) + '_'
                outlierFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])                
                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, features] = np.nan
                    #df.to_csv(outlierFile, index=True)
                    #result['resultMessage'] = outlierFile
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)      

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)                    

                    result['resultMessage'] = paramData                      
                else:
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    result['resultMessage'] = paramData                    


        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'kMeans')
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result

    def dbScan(self, paramData=None):
        '''
        dbScan 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}        
        errorMsg = ''

        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
        
            df=pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)
            
            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # features = ['ondo']
            # freq = 50
            
            features = [paramData['feature']]
            freq = paramData['freq']
            eps = paramData['eps']
            min_samples = paramData['min_samples']
            is_create =  paramData['isCreate']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)

            df_outlier = oul.dbScan(features=features, freq=freq, eps=eps, min_samples=min_samples, is_create=is_create)
            #df = df.reset_index()
            #print(df)
            result['result'] = True
            #result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            if is_create=='N':
                result['resultMessage'] = df_outlier
            else:
                frontName = 'outlier_' + str(paramData['set_order']) + '_'
                outlierFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])

                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, features] = np.nan
                    #df.to_csv(outlierFile, index=True)
                    #result['resultMessage'] = outlierFile
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)            

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)                    
                            
                    result['resultMessage'] = paramData  
                else:
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    result['resultMessage'] = paramData                    
        

        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'dbScan')
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
   
    def dbScanExecute(self, paramData=None):
        '''
        dbScan 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}        
        errorMsg = ''
        name, ext = os.path.splitext(paramData['file_name'])

        frontName = 'outlier_' + str(paramData['set_order']) + '_'

        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
            outlierFilterFile = os.path.join(paramData['file_path'],  frontName +  paramData['target_file_name'])

        try:
            df=pd.read_csv(dataFile, header=0, index_col=0, parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)
            
            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # features = ['ondo']
            # freq = 50
            
            features = [paramData['feature']]
            freq = paramData['freq']
            eps = paramData['eps']
            min_samples = paramData['min_samples']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)

            df_outlier = oul.dbScanExecute(features=features, freq=freq, eps=eps, min_samples=min_samples)
            if len(df_outlier.index) > 0:
                common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                df.loc[common_index, features] = np.nan            
                df.to_csv(outlierFile, index=True)

                df_outlier.reset_index(inplace=True)
                df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

            
            result['result'] = True
            #result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            result['resultMessage'] = outlierFile
        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'dbScan')
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
    

    def processorDatasetInterpolate(self, paramData=None):
        '''
        데이터셋 결측 보완
        Args:
            paramData(any): 전처리데이터 결측 처리 데이터 
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        
        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                imputerFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                imputerFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
            
            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #imputerFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_imputer' + ext

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)        
            for column in df.columns:
                if pd.isna(df.at[df.index[0], column]):
                    row_index = 1
                    while pd.isna(df.at[df.index[row_index], column]):
                        row_index += 1
                    next_value = df.at[df.index[row_index], column]
                    df.at[df.index[0], column] = next_value
                    #df[column] = df[column].fillna(next_value)

            ipt = interpolate.Manager(df)
            
            #print(df[:20])
            
            if paramData['interpl_tp']=='linear':
                data = ipt.methodInterpolate(MD_IP_METHOD.LINEAR)
            elif paramData['interpl_tp']=='slinear':
                data = ipt.methodInterpolate(MD_IP_METHOD.SLINEAR)
            elif paramData['interpl_tp']=='time':
                data = ipt.methodInterpolate(MD_IP_METHOD.TIME)
            elif paramData['interpl_tp']=='spline':
                data = ipt.methodInterpolate(MD_IP_METHOD.SPLINE, order=2)
            else:
                data = ipt.methodInterpolate(MD_IP_METHOD.LINEAR)

            data.reset_index(inplace=True)
            data.to_csv(imputerFile, index=False, quoting=csv.QUOTE_ALL)

            result['result'] = True
            result['resultMessage'] = paramData     

            #data.to_csv(imputerFile, index=True)
            #print(data[:20])
            #result['resultMessage'] = imputerFile
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetInterpolate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    #def processorDatasetResample(self, filePath=None, fileName=None, targetFileName=None, method=None, timeRule=None, indexColumn=None):
    def processorDatasetResample(self, paramData=None):
        '''
        데이터셋 샘플링
        Args:
            paramData(any): 전처리 샘플링 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                resampleFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                resampleFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #resampleFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name.replace('_imputer','_resample') + ext

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)        


            rs = resample.Manager(df)
            
            if paramData['resmpl_tp']=='linear':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.LINEAR)
            elif paramData['resmpl_tp']=='slinear':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.SPLINE)
            elif paramData['resmpl_tp']=='time':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.TIME)
            elif paramData['resmpl_tp']=='spline':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.SPLINE, order=2)
            else:
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.LINEAR)
            
            for column in data.columns:
                first_value = df[column].iloc[0]
                data[column].fillna(first_value, inplace=True)

            #data.to_csv(resampleFile, index=True)
            #print(data[:20])
            data.reset_index(inplace=True)
            data.to_csv(resampleFile, index=False, quoting=csv.QUOTE_ALL)
            result['result'] = True
            result['resultMessage'] = paramData  
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetResample')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result




    def dataDateTimeCheck(self, paramData=None):
        '''
        데이터셋 날짜시간 체크
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])

            index_col = paramData['index_trgt_col']
            #df = pd.read_csv(dataFile, header=0, index_col=index_col, parse_dates=True)        
            df = pd.read_csv(dataFile, header=0, parse_dates=True)        
            df[index_col] = pd.to_datetime(df[index_col], format='%Y-%m-%d %H:%M:%S')            
            
            df = self.dataInfo.dateTimeCheck2(df, index_col)
            #count = sum(1 for delta in df['delta'] if delta != '0.0')
            count = sum(1 for delta in df['delta'] if delta != pd.Timedelta('0 days 00:00:00'))
            df['validation_count'] = count

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            # errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'dataDateTimeCheck')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorDatasetUnitConverter(self, paramData=None):
        '''
        데이터셋 단위변환
        Args:
            paramData(any): 전처리 단위변환 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
             
        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                unitFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                unitFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)   
            
            if not os.path.exists(unitFile):
                df.to_csv(unitFile, index=True)    

            df_unit = pd.read_csv(unitFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)

            #print(df)
            data = self.dataInfo.unitConverter(df=df, df_unit=df_unit, unitColumn=paramData['unit_trgt_col'], unitFormula=paramData['unit_formula'])
            data.reset_index(inplace=True)
            data.to_csv(unitFile, index=False, quoting=csv.QUOTE_ALL)
            result['result'] = True
            result['resultMessage'] = paramData              
            #data.to_csv(unitFile, index=True)
            #print(data[:20])
            #result['result'] = True
            #result['resultMessage'] = unitFile
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetUnitConverter')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result




    #def processorDatasetCorrelation(self, filePath=None, fileName=None, columns=None, indexColumn=None):
    def processorDatasetCorrelation(self, paramData=None):
        '''
        데이터셋 상관관계
        Args:
            paramData(any): 전처리 상관관계 그래프 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                corrFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', name + '_corr.png')
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                corrFile = os.path.join(paramData['file_path'], name + '_corr.png')

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)     
            data = self.dataInfo.correlation(df[paramData['columns']], corrFile=corrFile)

            #print(data)
            result['result'] = True
            result['resultMessage'] = data
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetCorrelation')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def createAELearningModel(self, paramData=None):
        '''
        Auto Encoder 기준 이상치 탐지 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            modelFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            modelFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        #file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, parse_dates=True)
        df=pd.read_csv(dataFile, header=0, parse_dates=True)
        today = date.today()
        filepath = os.path.join(MODEL_AE_PATH_META, f'{today.year}', f'{today.month:02d}', '9999')
        #fileName = 'ID_LM_AE_TEST.h5'
        fileName = paramData['target_file_name']
        output_cols = paramData['output_cols']  #종속변수
        #output_cols = ['ondo', 'sbdo']    #종속변수

        modelArgs = ModelParameters(window_size=paramData['window_size'], batch_size=paramData['batch_size'], units=paramData['units'], test_size=paramData['test_size'], epochs=paramData['epochs'], patience=paramData['patience'])
        inputArgs = InputParameters(filepath=paramData['model_file_path'], filename=paramData['model_file_name'], output_cols=output_cols)
  
        try:
            #df.info()
            #ol = outlier.Manager(df)
            #df = ol.autoEncoder()
            #print(df)
            m = rnnGeneraterMeta.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df = m.modelAETrainning()
           
            #손실 결과
            df_loss = pd.DataFrame(df['fit'])
            self.sql.fitSave(paramData['modelID'], df_loss)


            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'createAEModelGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-' + ' '
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg          
        return result
    
    def dataAEGenerater(self, paramData=None):
        '''
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        

        if paramData['model_file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            modelFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            modelFile = os.path.join(paramData['model_file_path'], paramData['model_file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
            

        df=pd.read_csv(dataFile, header=0, parse_dates=True)
        #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True) 
        #today = date.today()
        #modelFile = os.path.join(MODEL_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', 'ID_LM_AE_TEST.h5')            
        #modelPath = os.path.join(MODEL_PATH_META, f'{today.year}', f'{today.month:02d}', '9999')
        
        #output_cols = ['ondo']    #종속변수
        output_cols = paramData['output_cols']     #종속변수
        threshold = paramData['threshold']    #이상치 경계

        modelArgs = ModelParameters(window_size=paramData['window_size'])
        inputArgs = InputParameters(filepath=paramData['model_file_path'], filename=modelFile, output_cols=output_cols)

        is_create =  paramData['isCreate']
        #feature = paramData['feature']
        index_trgt_col = paramData['index_trgt_col']

        try:
            m = rnnGeneraterMeta.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df_outlier = m.dataAEGeneraterOutlier(threshold, is_create, index_trgt_col)
            #print(df_outlier)
            #m = rnnGenerater.Manager(data=df, window_size=12)
            #dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)
            #df_outlier.set_index(index_trgt_col, inplace=True)
            result['result'] = True
            #result['resultMessage'] = df_outlier

            df.set_index(index_trgt_col, inplace=True)
            if is_create=='N':
                print(df_outlier)
                result['resultMessage'] = df_outlier
            else:
                frontName = 'outlier_' + str(paramData['set_order']) + '_'
                outlierFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])

                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, output_cols] = np.nan
                    #df.to_csv(outlierFile, index=True)
                    #result['resultMessage'] = outlierFile
                    #df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)
                    #result['resultMessage'] = paramData
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)        

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)                    

                    result['resultMessage'] = paramData                      
                else:
                    #result['resultMessage'] = outlierFile   
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    result['resultMessage'] = paramData  

        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'AutoEncoder')
            result['result'] = False
            result['resultMessage'] = errorMsg      

        return result



    def createAELearningModel_New(self, paramData=None):
        '''
        Auto Encoder 기준 이상치 탐지 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            modelFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            modelFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        #file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, parse_dates=True)
        df=pd.read_csv(dataFile, header=0, parse_dates=True)
        today = date.today()
        filepath = os.path.join(MODEL_AE_PATH_META, f'{today.year}', f'{today.month:02d}', '9999')
        #fileName = 'ID_LM_AE_TEST.h5'
        fileName = paramData['target_file_name']
        output_cols = paramData['output_cols']  #종속변수
        #output_cols = ['ondo', 'sbdo']    #종속변수

        modelArgs = ModelParameters(window_size=paramData['window_size'], batch_size=paramData['batch_size'], units=paramData['units'], test_size=paramData['test_size'], epochs=paramData['epochs'], patience=paramData['patience'])
        inputArgs = InputParameters(filepath=paramData['model_file_path'], filename=paramData['model_file_name'], output_cols=output_cols)
  
        try:
            #df.info()
            #ol = outlier.Manager(df)
            #df = ol.autoEncoder()
            #print(df)
            m = rnnGeneraterMeta.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df = m.modelAETrainning_New()
           
            #손실 결과
            df_loss = pd.DataFrame(df['fit'])
            self.sql.fitSave(paramData['modelID'], df_loss)


            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'createAEModelGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-' + ' '
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg          
        return result
    
    def dataAEGenerater_New(self, paramData=None):
        '''
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        

        if paramData['model_file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            modelFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            outlierFile = os.path.join(DATA_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            modelFile = os.path.join(paramData['model_file_path'], paramData['model_file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
            

        df=pd.read_csv(dataFile, header=0, parse_dates=True)
        #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True) 
        #today = date.today()
        #modelFile = os.path.join(MODEL_PATH_META, f'{today.year}', f'{today.month:02d}', '9999', 'ID_LM_AE_TEST.h5')            
        #modelPath = os.path.join(MODEL_PATH_META, f'{today.year}', f'{today.month:02d}', '9999')
        
        #output_cols = ['ondo']    #종속변수
        output_cols = paramData['output_cols']     #종속변수
        threshold = paramData['threshold']    #이상치 경계

        modelArgs = ModelParameters(window_size=paramData['window_size'])
        inputArgs = InputParameters(filepath=paramData['model_file_path'], filename=modelFile, output_cols=output_cols)

        is_create =  paramData['isCreate']
        #feature = paramData['feature']
        index_trgt_col = paramData['index_trgt_col']

        try:
            m = rnnGeneraterMeta.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df_outlier = m.dataAEGenerater_New(threshold)
            #print(df_outlier)
            #m = rnnGenerater.Manager(data=df, window_size=12)
            #dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)
            #df_outlier.set_index(index_trgt_col, inplace=True)
            result['result'] = True
            #result['resultMessage'] = df_outlier

            df.set_index(index_trgt_col, inplace=True)
            if is_create=='N':
                print(df_outlier)
                result['resultMessage'] = df_outlier
            else:
                frontName = 'outlier_' + str(paramData['set_order']) + '_'
                outlierFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])

                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, output_cols] = np.nan
                    #df.to_csv(outlierFile, index=True)
                    #result['resultMessage'] = outlierFile
                    #df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)
                    #result['resultMessage'] = paramData
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)        

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)                    

                    result['resultMessage'] = paramData                      
                else:
                    #result['resultMessage'] = outlierFile   
                    df.reset_index(inplace=True)
                    df.to_csv(outlierFile, index=False, quoting=csv.QUOTE_ALL)

                    df_outlier.reset_index(inplace=True)
                    df_outlier.to_csv(outlierFilterFile, index=False, quoting=csv.QUOTE_ALL)

                    result['resultMessage'] = paramData  

        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'AutoEncoder')
            result['result'] = False
            result['resultMessage'] = errorMsg      

        return result




    """
    def processorMakefirstColumnSetData(self, paramData=None, pageParam=None):
        '''
        데이터셋 데이터정보
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search = None
        sort = None

        try:            
            #if paramData['field']:
                #search = str.format("AND {0} LIKE '%{1}%'", paramData['field'], paramData['keyword'])
            search = str.format("AND DATE_FORMAT(yyyymmdd, '%Y%m%d') BETWEEN {0} AND {1}", paramData['target_start_date'], paramData['target_end_date'])

            #if paramData['sort_field']:
            sort = str.format('ORDER BY {0} {1}', 'yyyymmdd', 'asc')

            data = self.sql.metaTestListQuery(pageParam=pageParam, search=search, sort=sort)

            '''
            if not os.path.exists(paramData['file_path']):
                os.makedirs(paramData['file_path'])

            df = pd.DataFrame(data)
    
            # 파일 경로 생성
            file_path = os.path.join(paramData['file_path'], paramData['file_name'])
            
            import csv
            df.to_csv(file_path, index=False, quoting=csv.QUOTE_ALL)
            '''

            paramData['base_dir'] = os.path.basename(paramData['file_path'])

            result['result'] = True
            result['resultMessage'] = paramData

            #return False
            #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #info = self.dataInfo.info(df)

            #result['result'] = True
            #result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    """