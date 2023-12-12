import pandas as pd
# import logging 
# logging = logging.getLogger('dt')
import os
import json
from datetime import date
from dt.sql.augmentModelSql import augmentModelQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS, ERROR_CODE,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, timeganGenerater, imputerganGenerater, imputerGenerater,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class augmentModelService(object):
    '''
    Augment Model Service
    ---
    데이터증강 학습모델 서비스 클래스
    '''
    
    #데이터베이스 객체
    sql = augmentModelQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    def modelList(self, paramData=None, pageParam=None):
        '''
        학습모델 목록
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

            dt = self.sql.modelList(pageParam, search, sort)
            #dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            
            # logging.error(ERROR_CODE.AUGMENT_MODEL.value + '-modelList : ' + errorMsg)
            
            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'modelList')

            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def modelRegistration(self, paramData=None):
        '''
        학습모델 등록
        Args:
            paramData(any): 학습모델 등록 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.modelRegistration(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            #logging.error(errorMsg)
            
            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'modelRegistration')
            
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def modelUpdate(self, paramData=None):
        '''
        학습모델 수정
        Args:
            paramData(any): 학습모델 수정 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.modelUpdate(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            #logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'modelUpdate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def modelRemove(self, paramData=None):
        '''
        학습모델 삭제
        Args:
            paramData(any): 학습모델 삭제 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.modelRemove(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            #logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'modelRemove')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def modelStatus(self, paramData=None):
        '''
        학습모델 상태 조회
        Args:
            paramData(any): 학습모델 식별자
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.modelStatus(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            #logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'modelStatus')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    '''
    def createModelGenerater(self, 
            filePath=None, fileName=None, targetFileName=None, modelFilePath=None, modelFileName=None, outputs=None, features=None, 
            modelType=None, windowSize=None, batchSize=None, testSize=None, epochs=None, loss=None, meterics=None, optimizer=None, optimizerLr=None,
            modelID=None, indexColumn=None, dataSize=None
        ):
        RNN 학습모델 생성
        Args:
            filepath(any): 학습파일 경로
            filename(any): 학습파일 명
            targetFileName(any): 학습모델 테스트파일 명
            modelFilepath(any): 모델파일 경로
            modelFilename(any): 모델파일 명
            outputs(any): 종속변수
            features(any): 독립변수
            modelType(any): 모델유형
            windowSize(any): 데이터분할 크기
            batchSize(any): 배치 크기
            testSize(any): 학습비율
            epochs(any): 학습횟수
            loss(any): 손실유형
            meterics(any): 결과분석 유형
            optimizer(any): 성능옵션 
            optimizerLr(any): 성능옵션 lr
            modelID(any): 모델ID
            indexColumn(any): index 항목
            dataSize(any): fid 비교 데이터수
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
    '''        
    
    def modelCreate(self, paramData):
        '''
        RNN 학습모델 생성
        Args:
            paramData(any): 학습모델 파라메터            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        today = date.today()
        if paramData['file_path']==None:
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])            
            dataPath = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            dataPath = paramData['file_path']
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])            
        
        if paramData['model_file_path']==None:
            modelFilePath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            modelFilePath = paramData['model_file_path']
        
        #운영시 주석
        #dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        #modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData['features']:
            is_indpds = True
        else:
            is_indpds = False
        
        if str(paramData['model_type']).lower() == MD_TYPE.LSTM.value:
            modelType = MD_TYPE.LSTM
        elif str(paramData['model_type']).lower() == MD_TYPE.GRU.value:
            modelType = MD_TYPE.GRU
        elif str(paramData['model_type']).lower() == MD_TYPE.GAN.value:
            modelType = MD_TYPE.GAN
        else:
            modelType = MD_TYPE.LSTM

        if str(paramData['loss']).lower() == MD_LOSS.HUB.value:
            loss = MD_LOSS.HUB
        elif str(paramData['loss']).lower() == MD_LOSS.MSE.value:
            loss = MD_LOSS.MSE
        elif str(paramData['loss']).lower() == MD_LOSS.MAE.value:
            loss = MD_LOSS.MAE
        elif str(paramData['loss']).lower() == MD_LOSS.MAPE.value:
            loss = MD_LOSS.MAPE
        else:
            loss = MD_LOSS.HUB
        
        if str(paramData['optimizer']).lower() == MD_OTMZ.ADAM:
            optimizer = MD_OTMZ.ADAM
        elif str(paramData['optimizer']).lower() == MD_OTMZ.SGD:
            optimizer = MD_OTMZ.SGD
        elif str(paramData['optimizer']).lower() == MD_OTMZ.AGD:
            optimizer = MD_OTMZ.AGD
        elif str(paramData['optimizer']).lower() == MD_OTMZ.RMS:
            optimizer = MD_OTMZ.RMS
        else:
            optimizer = MD_OTMZ.ADAM

        if str(paramData['meterics']).lower() == MD_METRICS.MSE.value:
            meterics = "mean_squared_error"
        elif str(paramData['meterics']).lower() == MD_METRICS.RMSE.value:
            meterics = "root_mean_squared_error"
        elif str(paramData['meterics']).lower() == MD_METRICS.MAE.value:
            meterics = "mean_absolute_error"
        elif str(paramData['meterics']).lower() == MD_METRICS.MAPE.value:
            meterics = "mean_absolute_percentage_error"
        else:
            meterics = "mean_squared_error"

        modelArgs = ModelParameters(model_type=modelType, window_size=paramData['window_size'], batch_size=paramData['batch_size'], units=16, test_size=paramData['test_size'], epochs=paramData['epochs'], patience=10, loss=loss, meterics=meterics, optimizer=optimizer, optimizer_lr=paramData['optimizer_lr'], data_size=paramData['data_size'])
        inputArgs = InputParameters(filepath=modelFilePath, filename=paramData['model_file_name'], output_cols=paramData['outputs'], feature_cols=paramData['features'], is_indpds=is_indpds) #output_size=paramData['output_size']
        
        try:
            df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            #if modelType=='lstm':
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            r = m.modelTrainning()
            
            #모델평가
            print(r['evaluate_loss'])
            print(r['evaluate_acc'])

            #테스트 데이터생성
            name, ext = os.path.splitext(paramData['target_file_name'])                
            #testFile = os.path.join(dataPath, name.replace('_resample','_test') + ext)
            testFile = os.path.join(dataPath, name + '_test' + ext)
            y_test = pd.DataFrame(r['y_test'], columns=paramData['outputs'])
            x_test = pd.DataFrame(r['x_test'], columns=paramData['features'])
            xy_test = pd.concat([y_test, x_test], axis=1)
            print(xy_test)
            xy_test[paramData['window_size']:].to_csv(testFile, index=True)
            print(testFile)

            #추론 데이터생성
            #predFile = os.path.join(dataPath, name.replace('_resample','_pred') + ext)                
            predFile = os.path.join(dataPath, name + '_pred' + ext)
            y_pred = pd.DataFrame(r['y_pred'], columns=paramData['outputs'])
            y_pred.to_csv(predFile, index=True)
            print(predFile)
            
            #손실 결과
            df_loss = pd.DataFrame(r['fit'])
            self.sql.fitSave(paramData['model_id'], loss.value, df_loss, paramData['meterics'], meterics)
            
            #FID 결과
            self.sql.fidSave(paramData['model_id'], r['fid'])


            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # errorMsg = errorMsg[:-1]
            #logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'modelCreate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def createDataGenerater(self, 
            modelFilePath=None, modelFileName=None, testFilePath=None, testFileName=None, outputs=None, features=None, windowSize=None, batchSize=None, 
            modelID=None, indexColumn=None
        ):
        '''
        RNN 학습모델에서 데이터 생성
        Args:
            modelFilePath(any): 모델파일 경로
            modelFileName(any): 모델파일 명
            testFilePath(any): 테스트파일 경로
            testFileName(any): 테스트파일 명
            outputs(any): 종속변수
            features(any): 독립변수
            windowSize(any): 데이터분할 크기
            batchSize(any): 배치 크기
            modelID(any): 모델ID
            indexColumn(any): index 항목            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        today = date.today()
        if modelFilePath==None:
            modelFile = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999', modelFileName)            
            modelPath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            modelPath = modelFilePath
            modelFile = os.path.join(modelFilePath, modelFileName)

        if testFilePath==None:
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', testFileName)            
            dataPath = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            dataPath = testFilePath
            dataFile = os.path.join(testFilePath, testFileName)            

        #운영시 주석
        #dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        #modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'
        
        if features:
            is_indpds = True
        else:
            is_indpds = False
        
        modelArgs = ModelParameters(window_size=windowSize, batch_size=batchSize, units=16, patience=10)
        inputArgs = InputParameters(filepath=modelPath, filename=modelFile, output_cols=outputs, feature_cols=features, is_indpds=is_indpds)

        try:
            df=pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)
            
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGenerater()

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            #logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT_MODEL.value, 'createDataGenerater')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
