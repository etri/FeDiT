import pandas as pd
import logging
import os
from datetime import date

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_VFY_TYPE,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, timeganGenerater, imputerganGenerater, imputerGenerater,
    DataInfo
)

class processorService(object):
    '''
    processor Service
    ---
    전처리 서비스 클래스
    '''
    
    #데이터셋 객체
    dataInfo = DataInfo()

    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def SetDataFill(self):
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
        df = fna.methodFill(method=MD_FILL_METHOD.FFILL)
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
    
    def SetDataInterpolation(self):
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
    
    def SetDataResample(self):
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
            errorMsg = 'SetDataRegression Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
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
            errorMsg = 'SetCreateLearningModel Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
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
            errorMsg = 'SetCreateLearningModel Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
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
            errorMsg = 'createImputationKNN Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
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
            errorMsg = 'createImputationIterative Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def datasetInfo(self, filePath=None, fileName=None, indexColumn=None):
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

        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
        else:
            dataFile = os.path.join(filePath, fileName)

        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)       
      
        try:            
            info = self.dataInfo.info(df)

            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            #errorMsg = 'datasetInfo Error : ' + str(e.args[0]) + ' - ' + e.args[1]
            errorMsg = 'datasetInfo Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def datasetHist(self, filePath=None, fileName=None, column=None, indexColumn=None):
        '''
        데이터셋 히스토그램
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            column(any): 항목
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        name, ext = os.path.splitext(fileName)
        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
            histFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', name + '_hist.png')
        else:
            dataFile = os.path.join(filePath, fileName)
            histFile = os.path.join(filePath, name + '_hist.png')

        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)                
        try:
            columns = [column]
            df = pd.DataFrame(df, columns=columns)
            print(df)
            self.dataInfo.hist(df, histFile=histFile)

            result['result'] = True
            result['resultMessage'] = histFile
        except Exception as e:
            errorMsg = 'datasetHist Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  
        
        return result
    
    def datasetInterpolate(self, filePath=None, fileName=None, targetFileName=None, method=None, indexColumn=None):
        '''
        데이터셋 결측 보완
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            targetFileName(any): 변환파일 명
            method(any): 결측 보간 유형 
            indexColumn(any): index 항목          
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}

        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
            imputerFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', targetFileName)
        else:
            dataFile = os.path.join(filePath, fileName)
            imputerFile = os.path.join(filePath, targetFileName)
        
        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        #imputerFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_imputer' + ext

        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)                
        try:
            ipt = interpolate.Manager(df)
            
            print(df[:20])
            
            if method=='linear':
                data = ipt.methodInterpolate(MD_IP_METHOD.LINEAR)
            elif method=='slinear':
                data = ipt.methodInterpolate(MD_IP_METHOD.SLINEAR)
            elif method=='time':
                data = ipt.methodInterpolate(MD_IP_METHOD.TIME)
            elif method=='spline':
                data = ipt.methodInterpolate(MD_IP_METHOD.SPLINE, order=2)
            else:
                data = ipt.methodInterpolate(MD_IP_METHOD.LINEAR)
            
            data.to_csv(imputerFile, index=True)
            print(data[:20])
            
            result['result'] = True
            result['resultMessage'] = imputerFile
        except Exception as e:
            errorMsg = 'datasetInterpolate Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            #errorMsg = 'datasetInterpolate Error : ' + e.args[0] + ' - ' + e.args[1]            
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def datasetResample(self, filePath=None, fileName=None, targetFileName=None, method=None, timeRule=None, indexColumn=None):
        '''
        데이터셋 샘플링
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            targetFileName(any): 변환파일 명
            method(any): 샘플링 유형
            timerule(any): 시계열 간격 설정
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
            resampleFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', targetFileName)
        else:
            dataFile = os.path.join(filePath, fileName)
            resampleFile = os.path.join(filePath, targetFileName)

        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        #resampleFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name.replace('_imputer','_resample') + ext

        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)                
        try:
            rs = resample.Manager(df)
            
            print(df[:20])
            
            if method=='linear':
                data = rs.getInterpolateResampling(timeRule=timeRule, method=MD_IP_METHOD.LINEAR)
            elif method=='slinear':
                data = rs.getInterpolateResampling(timeRule=timeRule, method=MD_IP_METHOD.SPLINE)
            elif method=='time':
                data = rs.getInterpolateResampling(timeRule=timeRule, method=MD_IP_METHOD.TIME)
            elif method=='spline':
                data = rs.getInterpolateResampling(timeRule=timeRule, method=MD_IP_METHOD.SPLINE, order=2)
            else:
                data = rs.getInterpolateResampling(timeRule=timeRule, method=MD_IP_METHOD.LINEAR)
            
            data.to_csv(resampleFile, index=True)
            print(data[:20])

            result['result'] = True
            result['resultMessage'] = resampleFile
        except Exception as e:
            errorMsg = 'datasetInterpolate Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def datasetCorrelation(self, filePath=None, fileName=None, columns=None, indexColumn=None):
        '''
        데이터셋 상관관계
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            columns(any): 선택항목
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        name, ext = os.path.splitext(fileName)
        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
            corrFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', name + '_corr.png')
        else:
            dataFile = os.path.join(filePath, fileName)
            corrFile = os.path.join(filePath, name + '_corr.png')

        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)                
        try:
            print(df)
            data = self.dataInfo.correlation(df[columns], corrFile=corrFile)

            print(data)
            result['result'] = True
            result['resultMessage'] = data
        except Exception as e:
            errorMsg = 'datasetCorrelation Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def datasetUnitConverter(self, filePath=None, fileName=None, targetFileName=None, unitColumn=None, unitFormula=None,indexColumn=None):
        '''
        데이터셋 단위변환
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            targetFileName(any): 변환파일 명
            unitColumn(any): 단위변환 항목
            unitFormula(any): 계산공식
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        name, ext = os.path.splitext(fileName)
        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
            unitFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', targetFileName)
        else:
            dataFile = os.path.join(filePath, fileName)
            unitFile = os.path.join(filePath, targetFileName)

        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)                
        try:
            
            if not os.path.exists(unitFile):
                df.to_csv(unitFile, index=True)    

            df_unit = pd.read_csv(unitFile, header=0, index_col=indexColumn, parse_dates=True)

            print(df)
            data = self.dataInfo.unitConverter(df=df, df_unit=df_unit, unitColumn=unitColumn, unitFormula=unitFormula)
            data.to_csv(unitFile, index=True)
            print(data[:20])

            result['result'] = True
            result['resultMessage'] = unitFile
        except Exception as e:
            errorMsg = 'datasetUnitConverter Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def datasetVerify(self, filePath=None, fileName=None, targetFileName=None, verifyColumn=None, verifyType=None, 
            rule1=None, rule2=None, rule3=None, rule4=None, isCreate=None, clearType=None, indexColumn=None):
        '''
        데이터셋 단위변환
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            targetFileName(any): 변환파일 명
            verifyColumn(any): 검증 항목
            verifyType(any): 검증 유형
            rule1(any): 규칙1
            rule2(any): 규칙2
            rule3(any): 규칙3
            rule4(any): 규칙4
            isCreate(any): 검증파일 생성여부
            clearType(any): 데이터 지우기 유형 (O:이외, I:내부)
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        
        name, ext = os.path.splitext(fileName)
        if filePath==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', fileName)
            verifyFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', targetFileName)
        else:
            dataFile = os.path.join(filePath, fileName)
            verifyFile = os.path.join(filePath, targetFileName)

        #운영시 주석
        #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
        #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

        if str(verifyType).lower() == MD_VFY_TYPE.DT.value:
            verifyType = MD_VFY_TYPE.DT
        elif str(verifyType).lower() == MD_VFY_TYPE.DF.value:
            verifyType = MD_VFY_TYPE.DF
        elif str(verifyType).lower() == MD_VFY_TYPE.RG.value:
            verifyType = MD_VFY_TYPE.RG
        else:
            verifyType =  MD_VFY_TYPE.DT

        try:
            df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True, dtype=object)

            if isCreate=="Y":
                if not os.path.exists(verifyFile):
                    df.to_csv(verifyFile, index=True)    

                df_verify = pd.read_csv(verifyFile, header=0, index_col=indexColumn, parse_dates=True, dtype=object)

                print(df)
                data = self.dataInfo.dataVerify(df=df, df_verify=df_verify, verifyType=verifyType, verifyColumn=verifyColumn, clearType=clearType, rule1=rule1, rule2=rule2, rule3=rule3, rule4=rule4)
                data.to_csv(verifyFile, index=True)
                print(data[:20])
                result['resultMessage'] = verifyFile
            else:
                if os.path.isfile(verifyFile):
                    df = pd.read_csv(verifyFile, header=0, index_col=indexColumn, parse_dates=True, dtype=object)

                print(df)
                data = self.dataInfo.dataVerifyInfo(df=df, verifyType=verifyType, verifyColumn=verifyColumn, rule1=rule1, rule2=rule2, rule3=rule3, rule4=rule4)
                print(data)
                result['resultMessage'] = data

            result['result'] = True            
        except Exception as e:
            errorMsg = 'datasetVerifyConverter Error : '
            for m in e.args:
                errorMsg += str(m) + '-'
            logging.error(errorMsg[:-1])
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result