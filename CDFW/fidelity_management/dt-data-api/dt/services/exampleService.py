import pandas as pd
import logging
import os
from datetime import date
from dt.models.augment1Model import augment1Model
from dt.serializers.augment1Serializer import augment1Serializer
from dt.sql.augment1Sql import augment1Query

from dt_data_api.common.lib import (
    MD_FILL_METHOD,
    MD_FILL_TYPE,
    MD_IP_METHOD,
    DB_NAME,
    MD_IP_SI,
    ERROR_CODE,
    MD_TYPE,
    MD_LOSS,
    MD_OTMZ,
    MD_METRICS,
    DATA_PATH,
    MODEL_PATH,
    DATA_PATH_META,
    MODEL_PATH_META,
    ModelParameters,
    InputParameters,
    fillna,
    interpolate,
    resample,
    regression,
    fid,
    rnnGenerater,
    imputerganGenerater,
    imputerGenerater,
    imputerBritsGenerater,
    outlier,
    decisionTree,
    DataInfo,
    Utils,
    randomForestGenerater,
    arimaGenerater,
    imputerNaomiGenerater,
    exceptionMessage,
)


class exampleService(object):
    """
    example Service
    ---
    기능 테스트용 서비스 클래스
    """

    # 데이터베이스 객체
    sql = augment1Query(database=DB_NAME.DT_DATA_PLATFORM)

    # 데이터셋 객체
    dataInfo = DataInfo()

    # def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def Save(param=None):
        """
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
        """

        result = {"result": False, "resultMessage": None}
        serializer = augment1Serializer(data=param)
        if serializer.is_valid():
            serializer.save()
            result["result"] = True
            result["resultMessage"] = serializer.data
        else:
            result["resultMessage"] = serializer.errors
        return result

    def Search(param=None):
        """
        augment 데이터 검색
        Args:
            param(any): 검색어
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """

        result = {"result": False, "resultMessage": None}
        if param:
            augements = augment1Model.objects.all().filter(augment_nm__icontains=param)
            serializer = augment1Serializer(augements, many=True)
            result["result"] = True
            result["resultMessage"] = serializer.data
        else:
            result["resultMessage"] = ""
        return result

    def SetDataFill():
        """
        결측값을 정해진 값으로 채움
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """

        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902.csv"
        # df=pd.read_csv(file)
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        print("----------A")
        # 객체생성
        fna = fillna.Manager(data=df)
        print(df[:20])

        # 빈값제거
        # df = fna.drop()
        # print(df[:20])

        # 빈값 특정값 채우기
        df = fna.blankFill(1000)
        print(df[:20])

        # 빈값 method 방식 채우기
        # df = fna.methodFill(method=MD_FILL_METHOD.FFILL)
        # print(df[:20])

        # 빈값 유형별 채우기
        # df = fna.typeFill(type=MD_FILL_TYPE.MEAN, isInplace=False, column='m00')
        # json 변환 오류 (지정한 컬럼만 보강때문)
        # print(df[:20])
        # print(df[['date','m00']])
        print("----------B")

        result["result"] = True
        result["resultMessage"] = df
        # result['resultMessage'] = df[['date','m00']]
        return result

    def SetDataInterpolation():
        """
        결측값을 보간법으로 채움
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        print("----------A")
        itp = interpolate.Manager(data=df)
        print(df[:20])

        # df = itp.defaultInterpolate()
        # print(df[:20])

        # df = itp.methodFillInterpolate(method=MD_FILL_METHOD.FFILL)
        # print(df[:20])

        # df = itp.methodInterpolate(method=MD_IP_METHOD.LINEAR)
        # print(df[:20])

        df = itp.methodInterpolate(method=MD_IP_METHOD.SPLINE, order=2)
        print(df[:20])
        print("----------B")

        result["result"] = True
        result["resultMessage"] = df
        return result

    def SetDataResample():
        """
        데이터 리샘플링 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        print("----------A")
        rs = resample.Manager(data=df)
        print(df[:20])

        df = rs.getResampling(timeRule="1T", type=MD_FILL_TYPE.MEAN)
        print(df[:20])

        df = rs.getInterpolateResampling(timeRule="1T", method=MD_IP_METHOD.LINEAR)
        print(df[:20])

        df = rs.getInterpolateResampling(timeRule="1D", method=MD_IP_METHOD.LINEAR)
        print(df[:20])
        print("----------B")

        result["result"] = True
        result["resultMessage"] = df
        return result

    def GetDataQuery(self):
        """
        데이터 쿼리 테스트
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        try:
            dt = self.sql.getTestData()
            # dt = augmentQuery(Database.dt_data_api).setTestData('sdfsdf')
            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "GetDataQuery Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def GetDataQuerySave(self):
        """
        데이터 쿼리 테스트 (저장)
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        dt = [{"id": "1", "name": "aaaㅁ"}, {"id": "1", "name": "bbbㅁ"}]

        try:
            # 단일저장
            self.sql.getTestDataSave(dt[0])

            # 단일 루프 저장
            # for d in dt:
            #    self.sql.getTestDataSave(d)

            # 대용량 저장
            # self.sql.getTestDataSaveBulk(dt)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "GetDataQuerySave Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def SetDataRegression(self, item):
        """
        선형회귀 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902_3.csv"
        df = pd.read_csv(file)

        try:
            r = regression.Manager(data=df)
            dt = r.linearRegression(column=item, isIndex=False)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createLearningModel(self, fileName, outputs_cols, features_cols):
        """
        RNN 학습모델 생성
        Args:
            fileName(any): 생성모델 파일명
            outputs_cols(any): 종속변수
            features_cols(any): 독립변수 (종속변수 데이터 생산에 영향)
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/57_201901_201912유동인구_outlier.csv"
        # file='dt_data_api/data/유동인구_kp0172_cgv_2018_2021.csv'
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'
        fileName = "ID_LM_TEST.h5"

        # output_size = 3 #결과데이터 수
        is_indpds = False  # 독립변수 여부
        output_cols = ["w60"]  # 종속변수
        feature_cols = [
            "m00",
            "m10",
            "m20",
            "m30",
            "m40",
            "m50",
            "m60",
            "w00",
            "w10",
            "w20",
            "w30",
            "w40",
            "w50",
        ]  # 독립변수
        # features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']   #독립변수

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filename=fileName,
            output_cols=output_cols,
            feature_cols=feature_cols,
            is_indpds=is_indpds,
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            m.modelTrainning()

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # m.modelTrainning(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            # 다대다 테스트
            # m = modelGenerater2.manager(data=df, window_size=10)
            # m.modelTrainning(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, is_indpds=is_indpds)

            result["result"] = True
            result["resultMessage"] = "학습완료"
        except Exception as e:
            errorMsg = "SetCreateLearningModel Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def exportDataGenerater(self, fileName, output_cols, feature_cols):
        """
        RNN 학습모델에서 데이터 생성
        Args:
            fileName(any): 생성모델 파일명
            outputs_cols(any): 종속변수
            features_cols(any): 독립변수 (종속변수 데이터 생산에 영향)
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/유동인구_kp0172_cgv_2021.csv'
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'
        fileName = "ID_LM_TEST.h5"

        is_indpds = False  # 독립변수 여부
        output_cols = ["w60"]  # 종속변수
        feature_cols = [
            "m00",
            "m10",
            "m20",
            "m30",
            "m40",
            "m50",
            "m60",
            "w00",
            "w10",
            "w20",
            "w30",
            "w40",
            "w50",
        ]  # 독립변수

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filename=fileName,
            output_cols=output_cols,
            feature_cols=feature_cols,
            is_indpds=is_indpds,
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGenerater()

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def fidDataGenerater(self, fileName, output_cols, feature_cols):
        """
        RNN 학습모델을 통해 생성한 데이터 비교 검증 (FID Secore)
        Args:
            fileName(any): 생성모델 파일명
            outputs_cols(any): 종속변수
            features_cols(any): 독립변수 (종속변수 데이터 생산에 영향)
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        fileName = "ID_LM_TEST.h5"

        is_indpds = False  # 독립변수 여부
        output_cols = ["w60"]  # 종속변수
        feature_cols = [
            "m00",
            "m10",
            "m20",
            "m30",
            "m40",
            "m50",
            "m60",
            "w00",
            "w10",
            "w20",
            "w30",
            "w40",
            "w50",
        ]  # 독립변수
        # features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filename=fileName,
            output_cols=output_cols,
            feature_cols=feature_cols,
            is_indpds=is_indpds,
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGeneraterFID()

            # m = rnnGenerater.manager(data=df, window_size=12)
            # dt = m.dataGeneraterFID(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def exportPredictDataGenerater(self, fileName, outputs_cols, features_cols):
        """
        RNN 학습모델에서 데이터 생성 (예측+예측...)
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'
        fileName = "ID_LM_TEST.h5"

        output_size = 24  # 결과데이터 수
        isIndpds = False  # 독립변수 여부
        output_cols = ["w60"]  # 종속변수
        feature_cols = [
            "m00",
            "m10",
            "m20",
            "m30",
            "m40",
            "m50",
            "m60",
            "w00",
            "w10",
            "w20",
            "w30",
            "w40",
            "w50",
        ]  # 독립변수

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filename=fileName,
            output_cols=output_cols,
            feature_cols=feature_cols,
            output_size=output_size,
        )

        try:
            # 종속변수만 가능
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataGeneraterPredict()

            # m = rnnGenerater.manager(data=df, window_size=window_size)
            # dt = m.dataGeneraterPredict(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, outputs_size=outputs_size)
            # dt = m.dataGeneraterPredict2(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, outputs_size=outputs_size, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def GetDataImageFID(self):
        """
        FID Secore 원본과 생성 이미지 비교
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        try:
            real = "dt_data_api/file/history/real_02.png"
            fake = "dt_data_api/file/history/fake_02.png"

            f = fid.Manager(None, None, None)
            score = f.exportScore(real, fake)
            # score = f.preProcess()

            result["result"] = True
            result["resultMessage"] = score
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createLearningImputationGAN(self):
        """
        GAIN 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_결측.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            m = imputerganGenerater.Manager(df)
            m.modelTrainning()

            result["result"] = True
            result["resultMessage"] = "학습완료"
        except Exception as e:
            errorMsg = "SetCreateLearningModel Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createImputationSimple(self):
        """
        sklearn SimpleImputer 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            m = imputerGenerater.Manager(df)

            print(df[:20])
            df = m.simpleImputer(type=MD_IP_SI.MEAN)
            print(df[:20])

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = "SetCreateLearningModel Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createImputationKNN(self):
        """
        sklearn KNNImputer 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            m = imputerGenerater.Manager(df)

            print(df[:20])
            df = m.knnImputer()
            print(df[:20])

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = "createImputationKNN Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createImputationIterative(self):
        """
        sklearn IterativeImputer 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            m = imputerGenerater.Manager(df)

            print(df[:20])
            df = m.iterativeImputer()
            print(df[:20])

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createImputationBrits(self):
        """
        Brits 결측 보간
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        # file='dt_data_api/data/ae_train.csv'
        # file='dt_data_api/data/test_data_201901_201902_imputer.csv'
        file = "dt_data_api/data/서인천IC-부평IC_평균속도.csv"

        # file='dt_data_api/data/test_data_201901_201902_2col.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            m = imputerBritsGenerater.Manager(df)

            # print(df[:20])
            df = m.britsImputer()
            # print(df[:20])

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def datasetInfoDescribe(self):
        """
        데이터셋 요약정보 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            df = self.dataInfo.describe(df)
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def datasetInfoType(self):
        """
        데이터셋 데이터타입 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            df = self.dataInfo.typeInfo(df)
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def datasetInfoData(self):
        """
        데이터셋 정보 추출
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            df = self.dataInfo.datasetInfo(df, "mean")
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def datasetInfoHist(self):
        """
        데이터셋 히스토그램
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            columns = ["w60"]
            df = pd.DataFrame(df, columns=columns)
            print(df)

            self.dataInfo.hist(df)

            result["result"] = True
            result["resultMessage"] = "이미지생성"
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def datasetInfoInfo(self):
        """
        데이터셋 데이터정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            r = self.dataInfo.info(df)

            result["result"] = True
            result["resultMessage"] = r
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def dataDateTimeCheck(self):
        """
        데이터셋 날짜시간 체크
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구_1.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        try:
            # df.info()
            df["date"] = pd.to_datetime(df.date, format="%Y-%m-%d %H:%M:%S")
            # df.info()
            df = self.dataInfo.dateTimeCheck(df)

            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = (
                "createImputationIterative Error : " + e.args[0] + " - " + e.args[1]
            )
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def outlierZTest(self):
        """
        정규분포 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            df.info()
            ol = outlier.Manager()
            df = ol.zTest(df)

            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            errorMsg = "outlierZTest Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def outlierStandardDeviation(self):
        """
        표준편차 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            feature = "ondo"
            freq = 50
            p_value = 0.05

            df.info()
            ol = outlier.Manager(df)
            t, s, r = ol.tsDecompose(feature=feature, freq=freq)

            p = ol.zTest(r)
            print(p)
            if p[0] < p_value:
                raise Exception(
                    str.format(
                        "p-value {0} 이하로 정규분포를 적용할 수 없습니다.", p_value
                    )
                )

            df = ol.standardDeviation(r)
            # df = df.reset_index()
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def outlierKMeans(self):
        """
        k-means 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            features = ["ondo"]
            freq = 50

            df.info()
            ol = outlier.Manager(df)
            df = ol.kMeans(features=features, freq=freq)
            # df = df.reset_index()
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def outlierDBScan(self):
        """
        dbScan 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        try:
            features = ["ondo"]
            freq = 50

            df.info()
            ol = outlier.Manager(df)
            df = ol.dbScan(features=features, freq=freq)
            # df = df.reset_index()
            # print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def createAELearningModel(self):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        filepath = os.path.join(
            MODEL_PATH, f"{today.year}", f"{today.month:02d}", "9999"
        )
        fileName = "ID_LM_AE_TEST.h5"

        # output_cols = ['ondo']    #종속변수
        output_cols = ["ondo", "sbdo"]  # 종속변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=filepath, filename=fileName, output_cols=output_cols
        )

        try:
            # df.info()
            # ol = outlier.Manager(df)
            # df = ol.autoEncoder()
            # print(df)

            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df = m.modelAETrainning()
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def dataAEGenerater(self, fileName=None, output_cols=None, feature_cols=None):
        """
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        modelFile = os.path.join(
            MODEL_PATH,
            f"{today.year}",
            f"{today.month:02d}",
            "9999",
            "ID_LM_AE_TEST.h5",
        )
        modelPath = os.path.join(
            MODEL_PATH, f"{today.year}", f"{today.month:02d}", "9999"
        )

        # output_cols = ['ondo']    #종속변수
        output_cols = ["ondo", "sbdo"]  # 종속변수
        threshold = 0.6  # 이상치 경계

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath, filename=modelFile, output_cols=output_cols
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataAEGenerater_New(threshold)

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createAELearningModel_New(self):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/ae_train.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        filepath = os.path.join(
            MODEL_PATH, f"{today.year}", f"{today.month:02d}", "9999"
        )
        fileName = "ID_LM_AE_TEST_NEW.h5"

        # output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수
        output_cols = ["RAIN5", "RAIN6", "RAIN7", "LEVEL32", "ALERT"]  # 종속변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=256,
            units=16,
            test_size=0.2,
            epochs=1000,
            patience=5,
        )
        inputArgs = InputParameters(
            filepath=filepath, filename=fileName, output_cols=output_cols
        )

        try:
            # df.info()
            # ol = outlier.Manager(df)
            # df = ol.autoEncoder()
            # print(df)

            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            df = m.modelAETrainning_New()
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def dataAEGenerater_New(self, fileName=None, output_cols=None, feature_cols=None):
        """
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """

        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/ae_infer.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        modelFile = os.path.join(
            MODEL_PATH,
            f"{today.year}",
            f"{today.month:02d}",
            "9999",
            "ID_LM_AE_TEST_NEW.h5",
        )
        modelPath = os.path.join(
            MODEL_PATH, f"{today.year}", f"{today.month:02d}", "9999"
        )

        # output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수
        output_cols = ["RAIN5", "RAIN6", "RAIN7", "LEVEL32", "ALERT"]  # 종속변수
        threshold = 0.6  # 이상치 경계

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=256,
            units=16,
            test_size=0.2,
            epochs=1000,
            patience=5,
        )
        inputArgs = InputParameters(
            filepath=modelPath, filename=modelFile, output_cols=output_cols
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataAEGenerater_New(threshold)

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "dataAEGenerater_New Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createNAOMILearningModel_New(self):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/ae_train.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        filepath = os.path.join(
            MODEL_PATH, f"{today.year}", f"{today.month:02d}", "9999"
        )
        fileName = "ID_LM_AE_TEST_NEW.h5"

        # output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수
        output_cols = ["RAIN5", "RAIN6", "RAIN7", "LEVEL32", "ALERT"]  # 종속변수

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=256,
            units=16,
            test_size=0.2,
            epochs=1000,
            patience=5,
        )
        inputArgs = InputParameters(
            filepath=filepath, filename=fileName, output_cols=output_cols
        )

        try:
            # df.info()
            # ol = outlier.Manager(df)
            # df = ol.autoEncoder()
            # print(df)

            m = imputerNaomiGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            df = m.modelNAOMITrainning()
            print(df)

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result

    def dataNAOMIGenerater_New(
        self, fileName=None, output_cols=None, feature_cols=None
    ):
        """
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """

        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/ae_infer.csv"
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df = pd.read_csv(file, header=0, parse_dates=True)

        today = date.today()
        modelFile = os.path.join(
            MODEL_PATH,
            f"{today.year}",
            f"{today.month:02d}",
            "9999",
            "ID_LM_AE_TEST_NEW.h5",
        )
        modelPath = os.path.join(
            MODEL_PATH, f"{today.year}", f"{today.month:02d}", "9999"
        )

        # output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수
        output_cols = ["RAIN5", "RAIN6", "RAIN7", "LEVEL32", "ALERT"]  # 종속변수
        threshold = 0.6  # 이상치 경계

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=256,
            units=16,
            test_size=0.2,
            epochs=1000,
            patience=5,
        )
        inputArgs = InputParameters(
            filepath=modelPath, filename=modelFile, output_cols=output_cols
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.dataAEGenerater_New(threshold)

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "dataAEGenerater_New Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def decisionTree(self, paramData=None):

        print("파라메터 데이터 ", paramData)

        """
        결정트리 분류(처리후 모델 저장)
        Args:
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None, "label": None}
        errorMsg = ""
        name, ext = os.path.splitext(paramData["file_name"])

        if paramData["file_path"] == None:
            today = date.today()
            dataFile = os.path.join(
                DATA_PATH,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["file_name"],
            )
            outlierFile = os.path.join(
                DATA_PATH,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["target_file_name"],
            )
        else:
            preDataFile = os.path.join(
                paramData["file_path"], paramData["prev_file_name"]
            )
            dataFile = os.path.join(paramData["file_path"], paramData["file_name"])
            outlierFile = os.path.join(
                paramData["file_path"], paramData["target_file_name"]
            )
            resultFileName = (
                "missing_"
                + str(paramData["set_order"])
                + "_"
                + paramData["target_file_name"]
            )
            resultFile = os.path.join(paramData["file_path"], resultFileName)
        try:
            print("dataFile", dataFile)

            model_path = paramData["model_path"]
            index_column = paramData["index_column"]
            outputs = paramData["outputs"]
            feature = paramData["feature"]
            is_create = paramData["isCreate"]

            # df=pd.read_csv(dataFile, header=0, index_col=0, parse_dates=True)

            pre_df = pd.read_csv(
                preDataFile, header=0, parse_dates=True
            )  # , encoding='cp949')

            # output_cols = ['RAIN5', 'RAIN6', 'RAIN7']    #종속변수
            utils = Utils()
            if utils.is_mixed_column(pre_df, feature, True):
                errorMsg = (
                    "decisionTree Error : "
                    + "보간대상 항목에 숫자타입,문자타입의 데이터가 함께 포함되어 있습니다. 한종류 타입의 데이터만 존재해야 합니다."
                )
                logging.error(errorMsg)
                result["result"] = False
                result["resultMessage"] = errorMsg
                return result

            cur_df = pd.read_csv(
                dataFile, header=0, parse_dates=True
            )  # , encoding='cp949')

            # feature 컬럼만 제외
            x_cols = []
            for c in cur_df.columns:
                if c != feature:
                    x_cols.append(c)

            # 현재 데이터(보간된)에서 feature컬럼만 제외하고 이전 데이터(보간전)에서 feature 컬럼만 선택해서 합침
            df = pd.concat([cur_df[x_cols], pre_df[feature]], axis=1)

            # feature컬럼이 숫자형이 아니면(문자형일때) 문자를 라벨링해서 숫자로 변환
            if pd.api.types.is_numeric_dtype(df[feature]) == False:
                df, label = utils.label_encode_column_ignore_blanks(df, feature)
                # df[feature] = label_encoder.fit_transform(df[feature])
                # df = pd.concat([cur_df[x_cols],pre_df[feature]], axis=1)
                # df[feature].fillna(pd.Series(labeled.flatten()), inplace=True)
            else:
                label = None

            # print('*******************************************************')
            # print(df.head(30))
            print("라벨값", label)
            dTree = decisionTree.Manager(df)

            df_all, r_state = dTree.decisionTree(outputs, feature, model_path)

            if r_state == -1:
                errorMsg = (
                    "decisionTree Error : "
                    + "훈련을 진행할 수 있는 데이터가 없습니다. "
                )
                logging.error(errorMsg)
                result["result"] = False
                result["resultMessage"] = errorMsg
                return result

            # 날짜와 지정된 컬럼들만 추출한 데이터
            apply_colums = outputs.copy()
            apply_colums.append(feature)

            if (
                index_column != None
            ):  # 인덱스 컬럼이 지정됐을때 결과 데이터에 인덱스 컬럼 붙임
                apply_colums = [index_column] + list(apply_colums)  # 인덱스 컬럼 추가

            df_result = df_all[apply_colums]

            """
            if decode_label == True:
                label = label_encoder.classes_
                #y_pred = label_encoder.inverse_transform(y_pred)
            else:
                label = []
            """
            print(label)

            # print('결과', dTree.data.head(30))
            result["result"] = True
            result["label"] = label
            # result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            if is_create == "N":
                result["resultMessage"] = df_result
            else:
                df_all.to_csv(outlierFile, index=False)  # 전체
                df_result.to_csv(resultFile, index=False)  # 선택한 필드만
                result["resultMessage"] = outlierFile

            print(result)
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def decisionTree_useSavedModel(self, paramData=None):

        print("파라메터 데이터 ", paramData)

        """
        결정트리 분류(저장된 모델 사용)
        Args:
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""
        name, ext = os.path.splitext(paramData["file_name"])

        if paramData["file_path"] == None:
            today = date.today()
            dataFile = os.path.join(
                DATA_PATH,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["file_name"],
            )
            outlierFile = os.path.join(
                DATA_PATH,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["target_file_name"],
            )
        else:
            if (
                paramData["prev_file_name"] != None
                and paramData["prev_file_name"] != ""
            ):
                preDataFile = os.path.join(
                    paramData["file_path"], paramData["prev_file_name"]
                )
            dataFile = os.path.join(paramData["file_path"], paramData["file_name"])
            outlierFile = os.path.join(
                paramData["file_path"], paramData["target_file_name"]
            )
            resultFileName = (
                "missing_"
                + str(paramData["set_order"])
                + "_"
                + paramData["target_file_name"]
            )
            resultFile = os.path.join(paramData["file_path"], resultFileName)
        try:
            # print('dataFile', dataFile)

            model_path = paramData["model_path"]
            index_column = paramData["index_column"]
            outputs = paramData["outputs"]
            feature = paramData["feature"]
            is_create = paramData["isCreate"]

            parse_dates = paramData.get("parse_dates")
            if parse_dates is not None:
                print("parse_dates:", parse_dates)
                df = pd.read_csv(dataFile, header=0, parse_dates=parse_dates)
            else:
                print("parse_dates is None")
                df = pd.read_csv(dataFile, header=0, parse_dates=True)

            # df=pd.read_csv(dataFile, header=0, parse_dates=True)#, encoding='cp949')

            # print('*******************************************************')
            # print(df.head(30))
            dTree = decisionTree.Manager(df)

            df_all, r_state = dTree.decisionTree_useSavedModel(
                outputs, feature, model_path
            )

            apply_colums = outputs.copy()
            apply_colums.append(feature)

            # 원본과 날짜가 같으면 원본 데이터를 유지하기 위한 처리
            if (
                paramData["prev_file_name"] != None
                and paramData["prev_file_name"] != ""
            ):
                pre_df = pd.read_csv(
                    preDataFile, header=0, parse_dates=True
                )  # 원본 로드.
                merge_df = pd.merge(
                    df_all, pre_df, on=index_column, how="left"
                ).dropna()
                for column in apply_colums:
                    df_all.loc[merge_df.index, column] = merge_df[f"{column}_y"]

            # 날짜와 지정된 컬럼들만 추출한 데이터
            if (
                index_column != None
            ):  # 인덱스 컬럼이 지정됐을때 결과 데이터에 인덱스 컬럼 붙임
                apply_colums = [index_column] + list(apply_colums)  # 인덱스 컬럼 추가

            df_result = df_all[apply_colums]

            print("결과", df_all.head(40))
            # if index_column != None:
            #    df_result = pd.concat([df[index_column],df_result], axis=1)

            # print('결과', dTree.data.head(30))

            result["result"] = True
            # result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            if is_create == "N":
                result["resultMessage"] = df_result
            else:
                df_all.to_csv(outlierFile, index=False)  # 전체
                df_result.to_csv(resultFile, index=False)  # 선택한 필드만
                result["resultMessage"] = outlierFile

            print(result)
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def arimaModelGenerater(self, fileName=None, output_cols=None, feature_cols=None):
        """
        ARIMA 모델 생성
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        errorMsg = ""
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/기상청_신사동_2018.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        # today = date.today()
        # filepath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')
        # fileName = 'ID_LM_AE_TEST.h5'

        # output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수

        # modelArgs = ModelParameters(window_size=10, batch_size=32, units=16, test_size=0.2, epochs=100, patience=10)
        # inputArgs = InputParameters(filepath=filepath, filename=fileName, output_cols=output_cols)

        try:
            m = arimaGenerater.Manager()
            # m.test_autocorrelation(df['ondo'])

            # df_diff = df.resample('W').last().ondo
            # print(df_diff)
            # m.test_diff(df_diff)
            # m.test_autocorrelation(x=df_diff, n_lags=20)
            # m.test_modelSummary(df_diff)
            # m.arima_diagnostics(resids=df_diff, n_lags=20)
            # m.arima_acorr(df_diff)

            # m.auto_arima(df_diff)

            # m.arima_prediction(df_diff)

            # m.a_plot_ts(df['ondo'], 'blue', 0.25, 'org')
            # m.a_ADF_test(df['ondo'])
            # m.a_plot_rolling(df['ondo'], 6)

            df_diff = df - df.shift()  # default=1임
            # m.a_plot_ts(df_diff['ondo'], 'blue', 0.25, 'diff')
            # m.a_plot_rolling(df_diff['ondo'], 6)
            # m.a_ADF_test(df_diff['ondo'].dropna())

            ts_diff2 = df["ondo"].diff().dropna()
            # m.a_ADF_test(ts_diff2)
            # m.a_ACF_PACF(ts_diff2)
            m.a_ARIMA(df["ondo"])

            result["result"] = True
            result["resultMessage"] = df
        except Exception as e:
            for m in e.args:
                errorMsg += str(m) + "-"
            errorMsg = errorMsg[:-1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    """
    FID 스코어
    """

    def fidDataGenerater1(self, fileName, outputs_cols, features_cols):
        result = {"result": False, "resultMessage": None}
        # file='dt_data_api/data/201901_201912유동인구.csv'
        file = "dt_data_api/data/유동인구_kp0172_cgv_2021.csv"
        file1 = "dt_data_api/data/유동인구_kp0172_cgv_2018.csv"
        file2 = "dt_data_api/data/유동인구_kp0172_cgv_2019.csv"
        file3 = "dt_data_api/data/유동인구_kp0172_cgv_2020.csv"
        file4 = "dt_data_api/data/유동인구_kp0172_cgv_2022.csv"
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df_2018 = pd.read_csv(file1, header=0, index_col=0, parse_dates=True)
        df_2019 = pd.read_csv(file2, header=0, index_col=0, parse_dates=True)
        df_2020 = pd.read_csv(file3, header=0, index_col=0, parse_dates=True)
        df_2022 = pd.read_csv(file4, header=0, index_col=0, parse_dates=True)

        fileName = "ID_LM_TEST.h5"
        # item = 'w60'

        is_indpds = False  # 독립변수 여부
        outputs_cols = ["w60"]  # 종속변수
        features_cols = [
            "m00",
            "m10",
            "m20",
            "m30",
            "m40",
            "m50",
            "m60",
            "w00",
            "w10",
            "w20",
            "w30",
            "w40",
            "w50",
        ]  # 독립변수
        # features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        try:
            # m = modelGenerater.manager(data=df, window_size=40)
            m = rnnGenerater.manager(data=df, window_size=12)
            dt = m.dataGeneraterFID(
                fileName=fileName,
                outputs_cols=outputs_cols,
                features_cols=features_cols,
                is_indpds=is_indpds,
                dt_2018=df_2018,
                dt_2019=df_2019,
                dt_2020=df_2020,
                dt_2022=df_2022,
            )

            # 다대다 테스트
            # m = modelGenerater2.manager(data=df, window_size=744)
            # dt = m.dataGeneraterFID(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, is_indpds=is_indpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def loadAndInfer(self, fileName=None, output_cols=None, feature_cols=None):
        """
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        # file='dt_data_api/data/기상청_신사동_2018.csv'
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # file='dt_data_api/module/data/infer.csv'
        # file='dt_data_api/module/data/infer_error.csv'

        # today = date.today()
        # modelFile = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999', 'ID_LM_AE_TEST.h5')
        # modelPath = os.path.join(MODEL_PATH, f'{today.year}', f'{today.month:02d}', '9999')

        # output_cols = ['ondo']    #종속변수
        # output_cols = ['ondo', 'sbdo']    #종속변수
        threshold = 0.017  # 이상치 경계

        # file = f"./data/{self.name}.csv"
        # df=pd.read_csv(file, header=0, parse_dates=True)
        file = "dt_data_api/module/data/infer_error.csv"
        df = pd.read_csv(file)

        modelFile = "dt_data_api/module/model/scaler.pkl"
        modelPath = "dt_data_api/module/model"

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath, filename=modelFile, output_cols=output_cols
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            dt = m.autoTrain(threshold)

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def etri_model_train_and_save(
        self, fileName=None, output_cols=None, feature_cols=None
    ):
        """
        Auto Encoder 기준 이상치 탐지
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        threshold = 0.017  # 이상치 경계

        file = "dt_data_api/module/data/infer_error.csv"
        df = pd.read_csv(file)

        modelFile = "dt_data_api/module/model/scaler.pkl"
        modelPath = "dt_data_api/module/model"

        modelArgs = ModelParameters(
            window_size=10,
            batch_size=32,
            units=16,
            test_size=0.2,
            epochs=100,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath, filename=modelFile, output_cols=output_cols
        )

        try:
            m = rnnGenerater.Manager(data=df, modelArgs=modelArgs, inputArgs=inputArgs)
            patience = 100
            dt = m.train_and_save(patience)

            # m = rnnGenerater.Manager(data=df, window_size=12)
            # dt = m.dataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, isIndpds=isIndpds)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def GetDataFID(self):
        """
        FID Secore 원본과 생성 데이터 비교
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}

        try:
            real = "dt_data_api/data/1_real.png"
            fake = "dt_data_api/data/1_fake.png"
            real_fake = "dt_data_api/data/1_real_fake.png"

            df = pd.read_csv("dt_data_api/data/연합트윈암모니아실제vs예측.csv")

            df_fake = df.copy()
            df_fake["a"] = df["Predicted"]

            df_real = df.copy()
            df_real["a"] = df["Actual"]

            f = fid.Manager(fakeData=df_fake, realData=df_real, windowSize=0)
            score = f.createRecurrence(
                outputs_cols="a",
                data_size=500,
                real_file=real,
                fake_file=fake,
                real_fake=real_fake,
            )

            # score = f.exportScore(real, fake)
            # score = f.preProcess()

            result["result"] = True
            result["resultMessage"] = score
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def createImputationBrits_New(
        self,
        filePath=None,
        fileName=None,
        targetFileName=None,
        modelFilePath=None,
        modelFileName=None,
        outputs=None,
        modelType=None,
        batchSize=None,
        testSize=None,
        epochs=None,
        timesteps=None,
        loss=None,
        meterics=None,
        optimizer=None,
        optimizerLr=None,
        modelID=None,
        indexColumn=None,
        dataSize=None,
        targetColList=None,
    ):
        """
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
        """
        result = {"result": False, "resultMessage": None}

        today = date.today()
        if filePath == None:
            dataFile = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999", fileName
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = filePath
            dataFile = os.path.join(filePath, fileName)

        if modelFilePath == None:
            modelFilePath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        df = pd.read_csv(dataFile, header=0, index_col=indexColumn, parse_dates=True)

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

        modelArgs = ModelParameters(
            model_type=modelType,
            batch_size=batchSize,
            units=32,
            test_size=testSize,
            epochs=epochs,
            patience=10,
            loss=loss,
            meterics=metrics,
            optimizer=optimizer,
            optimizer_lr=optimizerLr,
            data_size=dataSize,
        )
        inputArgs = InputParameters(
            filepath=modelFilePath,
            filename=modelFileName,
            output_cols=outputs,
            trgt_col_list=targetColList,
        )

        try:
            # if modelType=='lstm':
            m = imputerBritsGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs, timesteps=timesteps
            )

            r = m.modelTrainning()

            # 모델평가
            print(r["evaluate_loss"])
            print(r["evaluate_acc"])

            # if features == None or features == "" or features == "[]" or len(features) == 0:
            #    features = outputs

            # 테스트 데이터생성
            name, ext = os.path.splitext(targetFileName)
            # testFile = os.path.join(dataPath, name.replace('_resample','_test') + ext)
            testFile = os.path.join(dataPath, name + "_test" + ext)
            y_test = pd.DataFrame(r["y_test_unscaled"], columns=outputs)

            y_test.to_csv(testFile, index=True)
            """
            if features == None or features == "" or features == "[]" or len(features) == 0:
                y_test.to_csv(testFile, index=True)    
            else:
                x_test = pd.DataFrame(r['x_test_unscaled'], columns=features)
                xy_test = pd.concat([y_test, x_test], axis=1)
                xy_test.to_csv(testFile, index=True)
            """
            # y_test = pd.DataFrame(r['y_test_unscaled'], columns=outputs)
            # x_test = pd.DataFrame(r['x_test_unscaled'], columns=features)

            # 추론 데이터생성
            # predFile = os.path.join(dataPath, name.replace('_resample','_pred') + ext)
            predFile = os.path.join(dataPath, name + "_pred" + ext)
            y_pred = pd.DataFrame(r["y_pred_unscaled"], columns=outputs)
            # y_pred = pd.DataFrame(r['y_pred_unscaled'], columns=outputs)
            y_pred.to_csv(predFile, index=True)
            print(predFile)

            # 손실 결과
            df_loss = pd.DataFrame(r["fit"])
            self.sql.fitSave(modelID, loss.value, df_loss, meterics, metrics)

            # FID 결과
            self.sql.fidSave(modelID, r["fid"])
            result["result"] = True
            result["resultMessage"] = "학습완료"
        except Exception as e:
            errorMsg = "createModelGenerater Error : "
            for m in e.args:
                errorMsg += str(m) + "-" + " "
            logging.error(errorMsg[:-1])
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_brits(self, paramData=None):
        """
        brits 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["model_use_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_use_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["model_use_file_path"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        modelArgs = ModelParameters()
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            print(dataFile)
            df_ori = pd.read_csv(dataFile, header=0, parse_dates=True)
            # df_ori.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            # feature_cols = paramData['features']
            index_column = paramData["index_column"]
            df = df_ori[output_cols]

            m = imputerBritsGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            print("결과", df_ori, dt)

            # 빈 데이터 값만 예측 보정된 값으로 대체
            for col in output_cols:
                valid_idx = df_ori[col].isnull() | (
                    df_ori[col] == ""
                )  # 원본에 컬럼의 값이 비어있는 인덱스 가져옴
                print("valid_idx", valid_idx)
                df_ori.loc[valid_idx, col] = dt.loc[valid_idx, col]

            # df_ori[output_cols] = dt[output_cols]
            print("합침", df_ori)
            df_ori.to_csv(paramData["output_file"], index=False)
            result["result"] = True
            result["resultMessage"] = paramData["output_file"]
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, "augmentCreate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result
