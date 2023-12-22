import pandas as pd
import logging 
logging = logging.getLogger('dt')
import os
from datetime import date
from dt.sql.learningSql import learningQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, timeganGenerater, imputerganGenerater, imputerGenerater
)

class learningService(object):
    '''
    learning Service
    ---
    학습모델 서비스 클래스
    '''
    
    #데이터베이스 객체
    sql = learningQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def createModelGenerater(self, 
            filePath=None, fileName=None, targetFileName=None, modelFilePath=None, modelFileName=None, outputs=None, features=None, 
            modelType=None, windowSize=None, batchSize=None, testSize=None, epochs=None, loss=None, meterics=None, optimizer=None, optimizerLr=None,
            modelID=None, indexColumn=None, dataSize=None
        ):
        '''
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
        result = {'result': False, 'resultMessage':None}
        
        today = date.today()
        if filePath==None:
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)            
            dataPath = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        else:
            dataPath = filePath
            dataFile = os.path.join(filePath, fileName)            
        
        if modelFilePath==None:
            modelFilePath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        
        #운영시 주석
        #dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        #modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        df=pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)
        
        if features:
            is_indpds = True
        else:
            is_indpds = False
        
        if str(modelType).lower() == MD_TYPE.LSTM.value:
            modelType = MD_TYPE.LSTM
        elif str(modelType).lower() == MD_TYPE.GRU.value:
            modelType = MD_TYPE.GRU
        elif str(modelType).lower() == MD_TYPE.GAN.value:
            modelType = MD_TYPE.GAN
        else:
            modelType = MD_TYPE.LSTM

        if str(loss).lower() == MD_LOSS.HUB.value:
            loss = MD_LOSS.HUB
        elif str(loss).lower() == MD_LOSS.MSE.value:
            loss = MD_LOSS.MSE
        elif str(loss).lower() == MD_LOSS.MAE.value:
            loss = MD_LOSS.MAE
        elif str(loss).lower() == MD_LOSS.MAPE.value:
            loss = MD_LOSS.MAPE
        else:
            loss = MD_LOSS.HUB
        
        if str(optimizer).lower() == MD_OTMZ.ADAM:
            optimizer = MD_OTMZ.ADAM
        elif str(optimizer).lower() == MD_OTMZ.SGD:
            optimizer = MD_OTMZ.SGD
        elif str(optimizer).lower() == MD_OTMZ.AGD:
            optimizer = MD_OTMZ.AGD
        elif str(optimizer).lower() == MD_OTMZ.RMS:
            optimizer = MD_OTMZ.RMS
        else:
            optimizer = MD_OTMZ.ADAM

        if str(meterics).lower() == MD_METRICS.MSE.value:
            metrics = "mean_squared_error"
        elif str(meterics).lower() == MD_METRICS.RMSE.value:
            metrics = "root_mean_squared_error"
        elif str(meterics).lower() == MD_METRICS.MAE.value:
            metrics = "mean_absolute_error"
        elif str(meterics).lower() == MD_METRICS.MAPE.value:
            metrics = "mean_absolute_percentage_error"
        else:
            metrics = "mean_squared_error"

        modelArgs = ModelParameters(model_type=modelType, window_size=windowSize, batch_size=batchSize, units=32, test_size=testSize, epochs=epochs, patience=10, loss=loss, meterics=metrics, optimizer=optimizer, optimizer_lr=optimizerLr, data_size=dataSize)
        inputArgs = InputParameters(filepath=modelFilePath, filename=modelFileName, output_cols=outputs, feature_cols=features, is_indpds=is_indpds)
        
        try:
            #if modelType=='lstm':
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            r = m.modelTrainning()
            
            #모델평가
            print(r['evaluate_loss'])
            print(r['evaluate_acc'])

            #테스트 데이터생성
            name, ext = os.path.splitext(targetFileName)                
            #testFile = os.path.join(dataPath, name.replace('_resample','_test') + ext)
            testFile = os.path.join(dataPath, name + '_test' + ext)
            y_test = pd.DataFrame(r['y_test'], columns=outputs)
            x_test = pd.DataFrame(r['x_test'], columns=features)
            xy_test = pd.concat([y_test, x_test], axis=1)
            print(xy_test)
            xy_test[windowSize:].to_csv(testFile, index=True)
            print(testFile)

            #추론 데이터생성
            #predFile = os.path.join(dataPath, name.replace('_resample','_pred') + ext)                
            predFile = os.path.join(dataPath, name + '_pred' + ext)
            y_pred = pd.DataFrame(r['y_pred'], columns=outputs)
            y_pred.to_csv(predFile, index=True)
            print(predFile)
            
            #손실 결과
            df_loss = pd.DataFrame(r['fit'])
            self.sql.fitSave(modelID, loss.value, df_loss, meterics, metrics)

            #FID 결과
            self.sql.fidSave(modelID, r['fid'])


            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'createModelGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-' + ' '
            logging.error(errorMsg[:-1])
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
        
        df=pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)

        if features:
            is_indpds = True
        else:
            is_indpds = False
        
        modelArgs = ModelParameters(window_size=windowSize, batch_size=batchSize, units=16, patience=10)
        inputArgs = InputParameters(filepath=modelPath, filename=modelFile, output_cols=outputs, feature_cols=features, is_indpds=is_indpds)

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGenerater()

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'createDataGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def createLearningModel(self, fileName, outputs_cols, features_cols):
        '''
        RNN 학습모델 생성
        Args:
            fileName(any): 생성모델 파일명
            outputs_cols(any): 종속변수
            features_cols(any): 독립변수 (종속변수 데이터 생산에 영향)            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/201901_201912유동인구.csv'
        #file='dt_data_api/data/유동인구_kp0172_cgv_2018_2021.csv'
        #file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        #file='dt_data_api/data/lo.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        #fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        #fileName = 'ID_2023.h5'
        fileName = 'ID_LM_TEST.h5'
        modelFilepath = 'dt_data_api\\file\\model\\'

        #output_size = 3 #결과데이터 수
        is_indpds = False #독립변수 여부
        output_cols = ['w60']    #종속변수
        feature_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50']   #독립변수
        #features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']   #독립변수
        
        #outputs_cols = ['no1']    #종속변수
        #features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        

        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filepath=modelFilepath, filename=fileName, output_cols=output_cols, feature_cols=feature_cols, is_indpds=is_indpds)
        
        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            m.modelTrainning()

            #m = rnnGenerater.Manager(data=df, window_size=12)
            #m.modelTrainning(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)
            
            #다대다 테스트
            #m = modelGenerater2.manager(data=df, window_size=10)
            #m.modelTrainning(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, is_indpds=is_indpds)

            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'createLearningModel Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def exportDataGenerater(self, fileName, output_cols, feature_cols):
        '''
        RNN 학습모델에서 데이터 생성
        Args:
            fileName(any): 생성모델 파일명
            outputs_cols(any): 종속변수
            features_cols(any): 독립변수 (종속변수 데이터 생산에 영향)            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/201901_201912유동인구.csv'
        #file='dt_data_api/data/유동인구_kp0172_cgv_2021.csv'
        #file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        #file='dt_data_api/data/lo.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        #fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        #fileName = 'ID_2023.h5'
        fileName = 'ID_LM_TEST.h5'
        
        is_indpds = False #독립변수 여부
        output_cols = ['w60']    #종속변수
        feature_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50']   #독립변수

        #outputs_cols = ['no1']    #종속변수
        #features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filename=fileName, output_cols=output_cols, feature_cols=feature_cols, is_indpds=is_indpds)

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGenerater()

            #m = rnnGenerater.Manager(data=df, window_size=12)
            #dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'exportDataGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def fidDataGenerater(self, fileName, output_cols, feature_cols):
        '''
        RNN 학습모델을 통해 생성한 데이터 비교 검증 (FID Secore)
        Args:
            fileName(any): 생성모델 파일명
            outputs_cols(any): 종속변수
            features_cols(any): 독립변수 (종속변수 데이터 생산에 영향)            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/201901_201912유동인구.csv'
        #file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        #file='dt_data_api/data/lo.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        fileName = 'ID_LM_TEST.h5'
        
        is_indpds = False #독립변수 여부
        output_cols = ['w60']    #종속변수
        feature_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50']   #독립변수
        #features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']

        #outputs_cols = ['no1']    #종속변수
        #features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filename=fileName, output_cols=output_cols, feature_cols=feature_cols, is_indpds=is_indpds)

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGeneraterFID()

            #m = rnnGenerater.manager(data=df, window_size=12)
            #dt = m.dataGeneraterFID(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'fidDataGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def exportPredictDataGenerater(self, fileName, outputs_cols, features_cols):
        '''
        RNN 학습모델에서 데이터 생성 (예측+예측...)
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/201901_201912유동인구.csv'
        #file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        #file='dt_data_api/data/lo.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        #fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        #fileName = 'ID_2023.h5'
        fileName = 'ID_LM_TEST.h5'
        
        output_size = 24 #결과데이터 수
        isIndpds = False #독립변수 여부
        output_cols = ['w60']    #종속변수
        feature_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50']   #독립변수

        #outputs_cols = ['no1']    #종속변수
        #features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filename=fileName, output_cols=output_cols, feature_cols=feature_cols, output_size=output_size)
        
        try:
            #종속변수만 가능
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGeneraterPredict()
            
            #m = rnnGenerater.manager(data=df, window_size=window_size)
            #dt = m.dataGeneraterPredict(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, outputs_size=outputs_size)
            #dt = m.dataGeneraterPredict2(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, outputs_size=outputs_size, isIndpds=isIndpds)
            
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'exportPredictDataGenerater Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def GetDataImageFID(self):
        '''
        FID Secore 원본과 생성 이미지 비교
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        try:            
            real = 'dt_data_api/file/history/real_02.png'
            fake = 'dt_data_api/file/history/fake_02.png'
            
            f = fid.Manager(None, None, None)
            score = f.exportScore(real, fake)
            #score = f.preProcess()
            
            result['result'] = True
            result['resultMessage'] = score
        except Exception as e:
            errorMsg = 'GetDataImageFID Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def createLearningTimeGAN(self):
        '''
        TimeGAN 학습모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        #file='dt_data_api/data/test_data_201901_201902_2.csv'
        file='dt_data_api/data/201901_201912유동인구.csv'
        #file='dt_data_api/data/1_문화누리카드 이용자 수_영향인자_O_연령대별_1원본.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file)
        df=df.sort_index()

        #fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        #fileName = 'ID_2023.h5'
        
        #fileName = 'ID_2023_pop_synthetic.pkl'
        #item = 'w60'

        fileName = 'synthesizer_exp.pkl'
        item = 'w60'

        try:
            m = timeganGenerater.Manager(df)
            m.modelTrainninSynthetic(fileName, item)

            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'createLearningTimeGAN Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
