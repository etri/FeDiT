import pandas as pd
import logging
import os
from datetime import date
from dt.models.augment1Model import augment1Model
from dt.serializers.augment1Serializer import augment1Serializer

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, timeganGenerater, imputerganGenerater, imputerGenerater, imputerBritsGenerater, outlier,
    DataInfo, arimaGenerater, vectorGenerater
)

class exampleService(object):
    '''
    example Service
    ---
    기능 테스트용 서비스 클래스
    '''
   
    #데이터셋 객체
    dataInfo = DataInfo()
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def Save(param=None):
        '''
        augment 데이터 저장
        Args:
            param(any): augment 데이터
            {
                "sdt_seq" : 1,
                "augment_nm" : "test",
                "augment_tp" : 1,
                "augment_bgng_ymd" : "20230404",
                "augment_end_ymd" : "20230430",
                "model_seq" : 1,
                "augment_status" : "W"
            }
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''

        result = {'result': False, 'resultMessage':None}
        serializer = augment1Serializer(data=param)
        if serializer.is_valid():
            serializer.save()            
            result['result'] = True
            result['resultMessage'] = serializer.data
        else:
            result['resultMessage'] = serializer.errors
        return result
        
    def Search(param=None):
        '''
        augment 데이터 검색
        Args:
            param(any): 검색어            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        
        result = {'result': False, 'resultMessage':None}
        if param:
            augements = augment1Model.objects.all().filter(augment_nm__icontains=param)
            serializer = augment1Serializer(augements, many=True)
            result['result'] = True
            result['resultMessage'] = serializer.data
        else:
            result['resultMessage'] = ''
        return result
    
    def SetDataFill():
        '''
        결측값을 정해진 값으로 채움
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''

        result = {'result': False, 'resultMessage':None}
        
        file='dt_data_api/data/test_data_201901_201902.csv'
        #df=pd.read_csv(file)
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        print("----------A")
        #객체생성
        fna = fillna.Manager(data=df)
        print(df[:20])
        
        #빈값제거                
        #df = fna.drop()
        #print(df[:20])

        #빈값 특정값 채우기
        df = fna.blankFill(1000)
        print(df[:20])

        #빈값 method 방식 채우기
        #df = fna.methodFill(method=MD_FILL_METHOD.FFILL)
        #print(df[:20])

        #빈값 유형별 채우기
        #df = fna.typeFill(type=MD_FILL_TYPE.MEAN, isInplace=False, column='m00')
        #json 변환 오류 (지정한 컬럼만 보강때문)
        #print(df[:20])
        #print(df[['date','m00']])
        print("----------B")

        result['result'] = True
        result['resultMessage'] = df
        #result['resultMessage'] = df[['date','m00']]
        return result
    
    def SetDataInterpolation():
        '''
        결측값을 보간법으로 채움
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        file='dt_data_api/data/test_data_201901_201902.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        print("----------A")
        itp = interpolate.Manager(data=df)
        print(df[:20])

        #df = itp.defaultInterpolate()
        #print(df[:20])

        #df = itp.methodFillInterpolate(method=MD_FILL_METHOD.FFILL)
        #print(df[:20])

        #df = itp.methodInterpolate(method=MD_IP_METHOD.LINEAR)
        #print(df[:20])

        df = itp.methodInterpolate(method=MD_IP_METHOD.SPLINE, order=2)
        print(df[:20])
        print("----------B")

        result['result'] = True
        result['resultMessage'] = df
        return result
    
    def SetDataResample():
        '''
        데이터 리샘플링 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        
        print("----------A")
        rs = resample.Manager(data=df)
        print(df[:20])
        
        df = rs.getResampling(timeRule='1T', type=MD_FILL_TYPE.MEAN)
        print(df[:20])
        
        df = rs.getInterpolateResampling(timeRule='1T', method=MD_IP_METHOD.LINEAR)
        print(df[:20])
        
        df = rs.getInterpolateResampling(timeRule='1D', method=MD_IP_METHOD.LINEAR)
        print(df[:20])
        print("----------B")
        
        result['result'] = True
        result['resultMessage'] = df
        return result
    
    def GetDataQuery(self):
        '''
        데이터 쿼리 테스트
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        try:
            dt = self.sql.getTestData()        
            #dt = augmentQuery(Database.dt_data_api).setTestData('sdfsdf')        
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'GetDataQuery Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg            
        return result
    
    def GetDataQuerySave(self):
        '''
        데이터 쿼리 테스트 (저장)
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        dt = [
            {'id':'1', 'name':'aaaㅁ'},
            {'id':'1', 'name':'bbbㅁ'}
        ]
        
        try:
            #단일저장
            self.sql.getTestDataSave(dt[0])
            
            #단일 루프 저장
            #for d in dt:
            #    self.sql.getTestDataSave(d)
            
            #대용량 저장
            #self.sql.getTestDataSaveBulk(dt)
            
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'GetDataQuerySave Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def SetDataRegression(self, item):
        '''
        선형회귀 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        file='dt_data_api/data/test_data_201901_201902_3.csv'
        df=pd.read_csv(file)

        try:
            r = regression.Manager(data=df)
            dt = r.linearRegression(column=item, isIndex=False)
            
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
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
        
        #output_size = 3 #결과데이터 수
        is_indpds = False #독립변수 여부
        output_cols = ['w60']    #종속변수
        feature_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50']   #독립변수
        #features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']   #독립변수
        
        #outputs_cols = ['no1']    #종속변수
        #features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filename=fileName, output_cols=output_cols, feature_cols=feature_cols, is_indpds=is_indpds)
        
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
            errorMsg = 'SetCreateLearningModel Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
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
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
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
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
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
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
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
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
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
        item = ['m50', 'm60', 'w50', 'w60']

        try:
            m = timeganGenerater.Manager(df)
            m.modelTrainninSynthetic(fileName, item)

            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'SetCreateLearningModel Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def fidTimeGAN(self):
        '''
        TimeGAN 학습모델을 통해 생성한 데이터 비교 검증 (FID Secore)
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        #file='dt_data_api/data/test_data_201901_201902_2.csv'
        file='dt_data_api/data/201901_201912유동인구.csv'
        #file='dt_data_api/data/1_문화누리카드 이용자 수_영향인자_O_연령대별_1원본.csv'
        #file='dt_data_api/data/Regression_upsample_result_날씨.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file)
        #df=df.set_index('date').sort_index()

        fileName = 'synthesizer_exp_ln_real.h5'
        item = 'w60'
        
        try:
            #m = learningGAN.manager(df)
            #dt = m.dataGeneraterFID(fileName=fileName, data=df, column=item, windowSize=10)

            m = timeganGenerater.Manager(df)
            dt = m.dataGeneraterFID(fileName=fileName, data=df, column=item, windowSize=24)
            
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def createLearningImputationGAN(self):
        '''
        GAIN 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_결측.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            m = imputerganGenerater.Manager(df)
            m.modelTrainning()

            result['result'] = True
            result['resultMessage'] = '학습완료'
        except Exception as e:
            errorMsg = 'SetCreateLearningModel Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def createImputationSimple(self):
        '''
        sklearn SimpleImputer 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            m = imputerGenerater.Manager(df)
            
            print(df[:20])
            df = m.simpleImputer(type=MD_IP_SI.MEAN)
            print(df[:20])

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'SetCreateLearningModel Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def createImputationKNN(self):
        '''
        sklearn KNNImputer 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            m = imputerGenerater.Manager(df)
            
            print(df[:20])
            df = m.knnImputer()
            print(df[:20])
            
            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationKNN Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def createImputationIterative(self):
        '''
        sklearn IterativeImputer 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            m = imputerGenerater.Manager(df)
            
            print(df[:20])
            df = m.iterativeImputer()
            print(df[:20])
            
            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def createImputationBrits(self):
        '''
        Brits 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_2col.csv'
        #file='dt_data_api/data/test_data_201901_201902_2col.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            m = imputerBritsGenerater.Manager(df)

            print(df[:20])
            df = m.britsImputer()
            print(df[:20])
            
            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def datasetInfoDescribe(self):
        '''
        데이터셋 요약정보 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            df = self.dataInfo.describe(df)
            print(df)
            
            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def datasetInfoType(self):
        '''
        데이터셋 데이터타입 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            df = self.dataInfo.typeInfo(df)
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def datasetInfoData(self):
        '''
        데이터셋 정보 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            df = self.dataInfo.datasetInfo(df, 'mean')
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def datasetInfoHist(self):
        '''
        데이터셋 히스토그램
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            columns = ['w60']
            df = pd.DataFrame(df, columns=columns)            
            print(df)

            self.dataInfo.hist(df)
            
            result['result'] = True
            result['resultMessage'] = '이미지생성'
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def datasetInfoInfo(self):
        '''
        데이터셋 데이터정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/test_data_201901_201902_1.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:            
            r = self.dataInfo.info(df)

            result['result'] = True
            result['resultMessage'] = r
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def dataDateTimeCheck(self):
        '''
        데이터셋 날짜시간 체크
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/201901_201912유동인구_1.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            #df.info()
            df['date'] = pd.to_datetime(df.date, format='%Y-%m-%d %H:%M:%S')            
            #df.info()
            df = self.dataInfo.dateTimeCheck(df)
            
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def outlierZTest(self):
        '''
        정규분포 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/기상청_신사동_2018.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            df.info()
            ol = outlier.Manager()
            df = ol.zTest(df)
            
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            errorMsg = 'outlierZTest Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def outlierStandardDeviation(self):
        '''
        표준편차 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        file='dt_data_api/data/기상청_신사동_2018.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            feature = 'ondo'
            freq = 50
            p_value = 0.05

            df.info()
            ol = outlier.Manager(df)
            t, s, r = ol.tsDecompose(feature=feature, freq=freq)
            
            p = ol.zTest(r)
            print(p)
            if p[0] < p_value:
                raise Exception(str.format('p-value {0} 이하로 정규분포를 적용할 수 없습니다.', p_value))
                
            df = ol.standardDeviation(r)
            #df = df.reset_index()
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + '-'
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
    
    def outlierKMeans(self):
        '''
        k-means 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        file='dt_data_api/data/기상청_신사동_2018.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            features = ['ondo']
            freq = 50
            
            df.info()
            ol = outlier.Manager(df)
            df = ol.kMeans(features=features, freq=freq)
            df = df.reset_index()
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + '-'
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
    
    def outlierDBScan(self):
        '''
        dbScan 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        file='dt_data_api/data/기상청_신사동_2018.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        try:
            features = ['ondo']
            freq = 50
            
            df.info()
            ol = outlier.Manager(df)
            df = ol.dbScan(features=features, freq=freq)
            df = df.reset_index()
            #print(df)
            
            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + '-'
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
    
    def createAELearningModel(self):
        '''
        Auto Encoder 기준 이상치 탐지 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df=pd.read_csv(file, header=0, parse_dates=True)
        
        today = date.today()
        filepath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        fileName = 'ID_LM_AE_TEST.h5'
        
        #output_cols = ['ondo']    #종속변수
        output_cols = ['ondo', 'sbdo']    #종속변수
        
        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filepath=filepath, filename=fileName, output_cols=output_cols)

        try:
            #df.info()
            #ol = outlier.Manager(df)
            #df = ol.autoEncoder()
            #print(df)

            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df = m.modelAETrainning()
            print(df)

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + '-'
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
    
    def dataAEGenerater(self, fileName=None, output_cols=None, feature_cols=None):
        '''
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df=pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        modelFile = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999', 'ID_LM_AE_TEST.h5')            
        modelPath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        
        #output_cols = ['ondo']    #종속변수
        output_cols = ['ondo', 'sbdo']    #종속변수
        threshold = 0.6     #이상치 경계

        modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        inputArgs = InputParameters(filepath=modelPath, filename=modelFile, output_cols=output_cols)

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataAEGenerater(threshold)

            #m = rnnGenerater.Manager(data=df, window_size=12)
            #dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def arimaModelGenerater(self, fileName=None, output_cols=None, feature_cols=None):
        '''
        ARIMA 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        file='dt_data_api/data/기상청_신사동_2018.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)
        
        # today = date.today()
        # filepath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        # fileName = 'ID_LM_AE_TEST.h5'
        
        #output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수
        
        # modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        # inputArgs = InputParameters(filepath=filepath, filename=fileName, output_cols=output_cols)

        try:
            m = arimaGenerater.Manager()
            #m.test_autocorrelation(df['ondo'])
            
            #df_diff = df.resample('W').last().ondo
            #print(df_diff)
            #m.test_diff(df_diff)
            #m.test_autocorrelation(x=df_diff, n_lags=20)
            #m.test_modelSummary(df_diff)
            #m.arima_diagnostics(resids=df_diff, n_lags=20)
            #m.arima_acorr(df_diff)
            
            #m.auto_arima(df_diff)
            
            #m.arima_prediction(df_diff)


            #m.a_plot_ts(df['ondo'], 'blue', 0.25, 'org')
            #m.a_ADF_test(df['ondo'])
            #m.a_plot_rolling(df['ondo'], 6)

            df_diff = df-df.shift() # default=1임
            #m.a_plot_ts(df_diff['ondo'], 'blue', 0.25, 'diff')
            #m.a_plot_rolling(df_diff['ondo'], 6)
            #m.a_ADF_test(df_diff['ondo'].dropna())

            ts_diff2 = df['ondo'].diff().dropna()
            #m.a_ADF_test(ts_diff2)
            #m.a_ACF_PACF(ts_diff2)
            m.a_ARIMA(df['ondo'])

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + '-'
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg        

        return result
    
    def vectorDataGenerater(self, text=None):
        '''
        vector 데이터 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        errorMsg = ''
        result = {'result': False, 'resultMessage':None}        
        #file='dt_data_api/data/기상청_신사동_2018.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        #df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            m = vectorGenerater.Manager(data=text)
            
            df = m.vectorText()

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + '-'
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg        

        return result





    

    
    
    
    

    
    
    '''
    FID 스코어
    '''
    def fidDataGenerater1(self, fileName, outputs_cols, features_cols):
        result = {'result': False, 'resultMessage':None}
        #file='dt_data_api/data/201901_201912유동인구.csv'
        file='dt_data_api/data/유동인구_kp0172_cgv_2021.csv'
        file1='dt_data_api/data/유동인구_kp0172_cgv_2018.csv'
        file2='dt_data_api/data/유동인구_kp0172_cgv_2019.csv'
        file3='dt_data_api/data/유동인구_kp0172_cgv_2020.csv'
        file4='dt_data_api/data/유동인구_kp0172_cgv_2022.csv'
        #file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        #file='dt_data_api/data/lo.csv'
        df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df_2018=pd.read_csv(file1, header=0, index_col=0, parse_dates=True)
        df_2019=pd.read_csv(file2, header=0, index_col=0, parse_dates=True)
        df_2020=pd.read_csv(file3, header=0, index_col=0, parse_dates=True)
        df_2022=pd.read_csv(file4, header=0, index_col=0, parse_dates=True)

        fileName = 'ID_LM_TEST.h5'
        #item = 'w60'
        
        is_indpds = False #독립변수 여부
        outputs_cols = ['w60']    #종속변수
        features_cols = ['m00','m10','m20','m30','m40','m50','m60','w00','w10','w20','w30','w40','w50']   #독립변수        
        #features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']

        #outputs_cols = ['no1']    #종속변수
        #features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        try:
            #m = modelGenerater.manager(data=df, window_size=40)
            m = rnnGenerater.manager(data=df, window_size=12)
            dt = m.dataGeneraterFID(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, is_indpds=is_indpds, dt_2018=df_2018, dt_2019=df_2019, dt_2020=df_2020, dt_2022=df_2022)

            #다대다 테스트
            #m = modelGenerater2.manager(data=df, window_size=744)
            #dt = m.dataGeneraterFID(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, is_indpds=is_indpds)
            
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'SetDataGenerater Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    