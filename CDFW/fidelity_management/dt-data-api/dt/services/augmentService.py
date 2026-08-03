import pandas as pd
import logging
import os
import json
from datetime import datetime, date, timedelta
from dt.sql.augmentSql import augmentQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS, ERROR_CODE,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, imputerganGenerater, imputerGenerater,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class augmentService(object):
    '''
    Augment Service
    ---
    데이터증강 서비스 클래스
    '''
    
    #로그설정
    logging = logging.getLogger('dt')

    #데이터베이스 객체
    sql = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    def augmentList(self, paramData=None, pageParam=None):
        '''
        증강데이터 설정 목록
        Args:
            paramData(any): 목록 정보
            pageParam(any): 페이지 정보            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search=None
        sort=None

        try:
            if paramData['field']:
                search = str.format("AND {0}='{1}'", paramData['field'], paramData['keyword'])
            if paramData['sort_field']:
                sort = str.format('ORDER BY {0} {1}', paramData['sort_field'], paramData['sort_type'])

            dt = self.sql.augmentList(pageParam, search, sort)
            #dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'augmentList')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def augmentRegistration(self, paramData=None):
        '''
        증강데이터 설정 등록
        Args:
            paramData(any): 증강데이터 설정 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.augmentRegistration(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'augmentRegistration')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def augmentUpdate(self, paramData=None):
        '''
        증강데이터 설정 수정
        Args:
            paramData(any): 증강데이터 설정 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.augmentUpdate(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'augmentUpdate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def augmentRemove(self, paramData=None):
        '''
        증강데이터 설정 삭제
        Args:
            paramData(any): 증강데이터 설정 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.augmentRemove(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'augmentRemove')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def augmentStatus(self, paramData=None):
        '''
        증강데이터 상태 조회
        Args:
            paramData(any): 증강데이터 식별자
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.augmentStatus(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'augmentStatus')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def augmentCreate(self, paramData=None):   
        '''
        RNN 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}        
        '''     
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        today = date.today()
        if paramData['model_file_path']==None:
            modelFile = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['model_file_name'])            
            modelPath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            modelPath = paramData['model_file_path']
            modelFile = os.path.join(paramData['model_file_path'], paramData['model_file_name'])

        if paramData['test_file_path']==None:
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['test_file_name'])            
            dataPath = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            dataPath = paramData['test_file_path']
            dataFile = os.path.join(paramData['test_file_path'], paramData['test_file_name'])            

        #운영시 주석
        #dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        #modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'
        
        if paramData['features']:
            is_indpds = True
        else:
            is_indpds = False
        
        modelArgs = ModelParameters(window_size=paramData['window_size'], batch_size=paramData['batch_size'], units=16, patience=10)
        inputArgs = InputParameters(filepath=modelPath, filename=modelFile, output_cols=paramData['outputs'], feature_cols=paramData['features'], is_indpds=is_indpds, use_model_yn=paramData['use_model_yn'], real_time_yn=paramData['real_time_yn'], output_file=paramData['output_file'], target_start_date=paramData['target_start_date'], target_last_date=paramData['target_last_date'], resmpl_intvl_tp=paramData['resmpl_intvl_tp'], resmpl_intvl_value=paramData['resmpl_intvl_value'], index_column=paramData['index_column'], trgt_col_list=paramData['trgt_col_list'])
    
        try:
            df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGenerater()

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'augmentCreate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def calcModelTestDataTargetDate(self, paramData=None):  
        result = {'result': False, 'resultMessage':None}
        #current_year = str(datetime.now().year)        

        try:
            set_start_date = datetime.strptime(paramData['target_start_date'], '%Y-%m-%d %H:%M:%S')
            set_last_date = datetime.strptime(paramData['target_last_date'], '%Y-%m-%d %H:%M:%S')

            index_col = paramData['index_column']
            dataFile = os.path.join(paramData['model_use_file_path'], paramData['model_use_file_name'])
            testFile = os.path.join(paramData['test_file_path'], paramData['test_file_name'])
            #df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            os.makedirs(paramData['test_file_path'], exist_ok=True)
            df=pd.read_csv(dataFile, header=0, parse_dates=True)
            df[index_col] = pd.to_datetime(df[index_col])

            year_range = df[index_col].dt.year.unique()
            year_range = pd.Series(year_range).sort_values(ascending=False).to_numpy()

            test_data_start_date = None
            test_data_last_date = None
            time_check_yn  = None
            data_frame = None
            index_col_date = None

            for index, year in enumerate(year_range):
                if paramData['resmpl_intvl_tp'] == 'days':
                    index_col_date = df[index_col].dt.strftime('%m-%d 00:00:00')
                    target_start_date = set_start_date.strftime('%m-%d 00:00:00')
                    target_last_date = set_last_date.strftime('%m-%d 00:00:00')          
                elif paramData['resmpl_intvl_tp'] == 'hours':
                    index_col_date = df[index_col].dt.strftime('%m-%d %H:00:00')
                    target_start_date = set_start_date.strftime('%m-%d %H:00:00')
                    target_last_date = set_last_date.strftime('%m-%d %H:00:00')  
                elif paramData['resmpl_intvl_tp'] == 'minutes':
                    index_col_date = df[index_col].dt.strftime('%m-%d %H:%M:00')
                    target_start_date = set_start_date.strftime('%m-%d %H:%M:00')
                    target_last_date = set_last_date.strftime('%m-%d %H:%M:00')     
                elif paramData['resmpl_intvl_tp'] == 'seconds':
                    index_col_date = df[index_col].dt.strftime('%m-%d %H:%M:%S')
                    target_start_date = set_start_date.strftime('%m-%d %H:%M:%S')
                    target_last_date = set_last_date.strftime('%m-%d %H:%M:%S')  
                else:
                    index_col_date = None
                    target_start_date = None
                    target_last_date = None

                if df[(df[index_col].dt.year == year) & (index_col_date == target_last_date)].shape[0] > 0:
                    print(f" 매칭 있음")
                    time_check_yn  = 'Y'
                    data_frame = None
                    test_data_last_date = str(year) + '-' + target_last_date
                    test_data_start_date = str(year) + '-' + target_start_date
                    
                    break
                else:
                    print(f" 다 없음")
                    time_check_yn  = 'N'
                    row_count = self.calcModelDataDateTermRowCount(start_time=target_start_date, end_time=target_last_date, resmpl_intvl_tp=paramData['resmpl_intvl_tp'], resmpl_intvl_value=paramData['resmpl_intvl_value'])
                                                    
                    test_row_count = row_count + paramData['window_size']
                    print(row_count + paramData['window_size'])
                    
                    df = df.iloc[-test_row_count:]
                    data_frame = df.reset_index(drop=True)

            test_file_path = self.makeCsvUseModelTestFile(file_path=dataFile, test_file_path=testFile, index_col=index_col, start_date=test_data_start_date, end_date=test_data_last_date, window_size=paramData['window_size'], time_check_yn = time_check_yn, data_frame=data_frame, resmpl_intvl_tp=paramData['resmpl_intvl_tp'], resmpl_intvl_value=paramData['resmpl_intvl_value'])
        
            result['result'] = True
            result['resultMessage'] = test_file_path

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, 'calcModelTestDataTargetDate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def calcModelDataDateTermRowCount(self, start_time=None, end_time=None, resmpl_intvl_tp=None, resmpl_intvl_value=None):  
        result = None
        current_year = datetime.now().year
        start_time = datetime.strptime(str(current_year) + '-' + start_time, '%Y-%m-%d %H:%M:%S')
        end_time = datetime.strptime(str(current_year) + '-' + end_time, '%Y-%m-%d %H:%M:%S')

        time_row_check = end_time - start_time
        row_term = None

        if resmpl_intvl_tp=='hours':
            row_term = timedelta(hours=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        elif resmpl_intvl_tp=='minutes':
            row_term = timedelta(minutes=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        elif resmpl_intvl_tp=='seconds':
            row_term = timedelta(seconds=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        elif resmpl_intvl_tp=='days':
            row_term = timedelta(days=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        else:
            result = None

        return result

    def makeCsvUseModelTestFile(self, file_path=None, test_file_path=None, index_col=None, start_date=None, end_date=None, window_size=None, time_check_yn=None, data_frame=None, resmpl_intvl_tp=None, resmpl_intvl_value=None):  
        if time_check_yn=='Y':
            df=pd.read_csv(file_path, header=0, parse_dates=True)
            df[index_col] = pd.to_datetime(df[index_col])

            start_date = pd.to_datetime(start_date)
            end_date = pd.to_datetime(end_date)
            start_index = None

            start_index = df[df[index_col] >= (start_date - pd.DateOffset(days=window_size))].index[0]
            
            if resmpl_intvl_tp == 'days':
                start_index = df[df[index_col] > (start_date - pd.DateOffset(days=window_size))].index[0]
            elif resmpl_intvl_tp == 'hours':
                start_index = df[df[index_col] > (start_date - pd.DateOffset(hours=window_size))].index[0]
            elif resmpl_intvl_tp == 'minutes':
                start_index = df[df[index_col] > (start_date - pd.DateOffset(minutes=window_size))].index[0]
            elif resmpl_intvl_tp == 'seconds':
                start_index = df[df[index_col] > (start_date - pd.DateOffset(seconds=window_size))].index[0]
            else:
                start_index = None

            end_index = df[df[index_col] <= end_date].index[-1]
            df_cut = df.loc[start_index:end_index]

            new_year = date.today().year
            df_cut[index_col] = df_cut[index_col].apply(lambda x: x.replace(year=new_year).strftime('%Y-%m-%d %H:%M:%S'))
            df_cut.to_csv(test_file_path, index=False)
        else:
            data_frame.to_csv(test_file_path, index=False)
        return test_file_path
