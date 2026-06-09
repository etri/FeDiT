import pandas as pd
import logging

logging = logging.getLogger("dt")
from datetime import datetime
from dt.models.augment1Model import augment1Model
from dt.serializers.augment1Serializer import augment1Serializer
from dt.sql.augment1Sql import augment1Query

# from dt_data_api.model import fillna, interpolation, resample
# from dt_data_api.common.enum import MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME
from dt_data_api.common.lib_x import (
    fillna,
    interpolation,
    resample,
    MD_FILL_METHOD,
    MD_FILL_TYPE,
    MD_IP_METHOD,
    DB_NAME,
    learningModel,
    regressionModel,
    fidscore,
    modelGenerater,
    modelGenerater2,
    imputationGenerater,
)
import logging


class augment1Service(object):
    sql = augment1Query(database=DB_NAME.DT_DATA_PLATFORM)

    # def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def Save(param=None):
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
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902.csv"
        # df=pd.read_csv(file)
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        print("A")
        fna = fillna.fill(df)
        print(df[:20])
        # df = fna.drop()
        # print(df[:20])
        df = fna.blankFill(1000)
        print(df[:20])
        # df = fna.methodFill(method=MD_FILL_METHOD.FFILL)
        # print(df[:20])
        # df = fna.typeFill(type=MD_FILL_TYPE.MEAN, isInplace=False, column='m00')
        # json 변환 오류 (지정한 컬럼만 보강때문)
        # print(df[:20])
        # print(df[['date','m00']])
        print("B")

        result["result"] = True
        result["resultMessage"] = df
        # result['resultMessage'] = df[['date','m00']]
        return result

    def SetDataInterpolation():
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        print("A")
        itp = interpolation.Interpolation(df)
        print(df[:20])
        # df = itp.defaultInterpolate()
        # print(df[:20])
        # df = itp.methodFillInterpolate(method=MD_FILL_METHOD.FFILL)
        # print(df[:20])
        # df = itp.methodInterpolate(method=MD_IP_METHOD.LINEAR)
        # print(df[:20])
        df = itp.methodInterpolate(method=MD_IP_METHOD.SPLINE, order=2)
        print(df[:20])
        print("B")

        result["result"] = True
        result["resultMessage"] = df
        return result

    def SetDataResample():
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        print("A")
        rs = resample.Resample(df)
        print(df[:20])
        df = rs.exportSampling(timeRule="1T", type=MD_FILL_TYPE.MEAN)
        print(df[:20])
        df = rs.interpolateResampling(timeRule="1T", method=MD_IP_METHOD.LINEAR)
        print(df[:20])
        df = rs.interpolateResampling(timeRule="1D", method=MD_IP_METHOD.LINEAR)
        print(df[:20])
        print("B")

        result["result"] = True
        result["resultMessage"] = df
        return result

    def GetDataQuery(self):
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
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902_1.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        dt = [{"id": "1", "name": "aaa"}, {"id": "1", "name": "bbb"}]

        try:
            self.sql.getTestDataSave(dt)

            # for d in dt:
            #    self.sql.getTestDataSave(d)

            # self.sql.getTestDataSaveBulk(dt)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "GetDataQuerySave Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def SetCreateLearningModel(self, fileName, item):
        result = {"result": False, "resultMessage": None}
        # file='dt_data_api/data/test_data_201901_201902_2.csv'
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/Regression_upsample_result.csv'
        # file='dt_data_api/data/1_문화누리카드 이용자 수_영향인자_O_연령대별_1원본.csv'
        # file='dt_data_api/data/Regression_upsample_result_날씨.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # file='dt_data_api/data/lo.csv'
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'

        # rs = resample.Resample(df)
        # df = rs.exportSampling(timeRule='1D', type=MD_FILL_TYPE.MEAN)
        # df = rs.interpolateResampling(timeRule='1D', method=MD_IP_METHOD.TIME)
        # df.to_csv('aaaa.csv', sep=',')

        # fileName = 'Regression_upsample_result_날씨.h5'
        # item = 'a10'

        try:
            m = learningModel.manager(df)
            m.modelTrainning(fileName, item)
            # m.dataGenerater(fileName=fileName, data=df[:10], column='w60', windowSize=10)
            # m.dataGenerater(fileName='ID_20230228.h5', data=df[:24], column='w60', windowSize=10)
            result["result"] = True
            result["resultMessage"] = "학습완료"
        except Exception as e:
            errorMsg = "SetCreateLearningModel Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def SetDataGenerater(self, fileName, item):
        result = {"result": False, "resultMessage": None}
        # file='dt_data_api/data/test_data_201901_201902_2.csv'
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/Regression_upsample_result.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # file='dt_data_api/data/lo.csv'
        # df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'

        # rs = resample.Resample(df)
        # df = rs.exportSampling(timeRule='1D', type=MD_FILL_TYPE.MEAN)
        # df = rs.interpolateResampling(timeRule='1D', method=MD_IP_METHOD.TIME)

        # fileName = 'FID_TEST_MODEL.h5'
        # item = 'w60'

        try:
            m = learningModel.manager(df)
            # dt = m.dataGenerater(fileName=fileName, data=df[:101], column=item, windowSize=10)
            dt = m.dataGenerater(
                fileName=fileName, data=df[:51], column=item, windowSize=10
            )

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def SetDataGenerater2(self, item):
        result = {"result": False, "resultMessage": None}

        file = "dt_data_api/data/test_data_201901_201902_3.csv"
        df = pd.read_csv(file)

        try:
            r = regressionModel.regression(df)
            dt = r.linearRegression(item, False)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def GetDataGeneraterFID(self):
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/test_data_201901_201902_2.csv'
        # file='dt_data_api/data/1_문화누리카드 이용자 수_영향인자_O_연령대별_1원본.csv'
        # file='dt_data_api/data/Regression_upsample_result_날씨.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'FID_TEST_MODEL.h5'
        fileName = "ID_2023.h5"
        item = "w60"

        # fileName = 'Regression_upsample_result_날씨.h5'
        # item = 'a10'

        # fileName = 'ID_2023_synthetic_ln_synth.h5'
        # item = 'w60'

        try:
            m = learningModel.manager(df)
            dt = m.dataGeneraterFID(
                fileName=fileName, data=df, column=item, windowSize=10
            )

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def GetDataImageFID(self):
        result = {"result": False, "resultMessage": None}

        try:
            fid = fidscore.fid(None, None)
            score = fid.preProcess()
            # score = fid.exportScore()

            result["result"] = True
            result["resultMessage"] = score
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    """
    학습모델
    다중 독립/종속 변수 적용
    """

    def createLearningModel(self, fileName, outputs_cols, features_cols):
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/유동인구_kp0172_cgv_2018_2021.csv'
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'

        fileName = "ID_LM_TEST.h5"
        # item = 'w10'

        window_size = 12  # 활용데이터 수
        outputs_size = 3  # 결과데이터 수
        is_indpds = True  # 독립변수 여부
        outputs_cols = ["w40", "w50", "w60"]  # 종속변수
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
        ]  # 독립변수
        # features_cols = ['gangsulyang','gangsutype','punghyang','pungsok','sbdo']   #독립변수

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        try:
            # m = modelGenerater.manager(data=df, window_size=40)
            # m = modelGenerater.manager(data=df, window_size=12)
            # m.modelTrainning(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, is_indpds=is_indpds)

            # 다대다 테스트
            m = modelGenerater2.manager(data=df, window_size=window_size)
            m.modelTrainning(
                fileName=fileName,
                outputs_cols=outputs_cols,
                features_cols=features_cols,
                is_indpds=is_indpds,
                outputs_size=outputs_size,
            )

            result["result"] = True
            result["resultMessage"] = "학습완료"
        except Exception as e:
            print(e)
            # errorMsg = 'SetCreateLearningModel Error : ' + e.args[0] + ' - ' + e.args[1]
            # logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = e

        return result

    """
    데이터생산 (검증)
    """

    def exportDataGenerater(self, fileName, outputs_cols, features_cols):
        result = {"result": False, "resultMessage": None}
        # file='dt_data_api/data/201901_201912유동인구.csv'
        file = "dt_data_api/data/유동인구_kp0172_cgv_2021.csv"
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'

        fileName = "ID_LM_TEST.h5"
        # item = 'w60'

        is_indpds = False  # 독립변수 여부
        outputs_cols = ["m60"]  # 종속변수
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

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        try:
            # m = modelGenerater.manager(data=df, window_size=40)
            m = modelGenerater.manager(data=df, window_size=12)
            dt = m.dataGenerater(
                fileName=fileName,
                outputs_cols=outputs_cols,
                features_cols=features_cols,
                is_indpds=is_indpds,
            )

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    """
    예측 데이터생산 (예측)
    """

    def exportPredictDataGenerater(self, fileName, outputs_cols, features_cols):
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/201901_201912유동인구.csv"
        # file='dt_data_api/data/3_유동인구_2019_kp1539.csv'
        # file='dt_data_api/data/lo.csv'
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)

        # fileName = 'ID_' + str(datetime.now().date()).replace('-','') + '.h5'
        # fileName = 'ID_2023.h5'

        fileName = "ID_LM_TEST.h5"
        # item = 'w60'

        window_size = 12  # 활용데이터 수
        outputs_size = 3  # 결과데이터 수
        is_indpds = True  # 독립변수 여부
        outputs_cols = ["w40", "w50", "w60"]  # 종속변수
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
        ]  # 독립변수

        # outputs_cols = ['no1']    #종속변수
        # features_cols = ['no2','no3','no4','no5','no6','bonus']   #독립변수

        try:
            # m = modelGenerater.manager(data=df, window_size=40)
            # m = modelGenerater.manager(data=df, window_size=window_size)
            # dt = m.dataGeneraterPredict(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, outputs_size=outputs_size)
            # dt = m.dataGeneraterPredict2(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols, outputs_size=outputs_size, is_indpds=is_indpds)

            # 다대다
            m = modelGenerater2.manager(data=df, window_size=window_size)
            dt = m.dataGeneraterPredict2(
                fileName=fileName,
                outputs_cols=outputs_cols,
                features_cols=features_cols,
                outputs_size=outputs_size,
                is_indpds=is_indpds,
            )

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            errorMsg = "SetDataGenerater Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    """
    FID 스코어
    """

    def fidDataGenerater(self, fileName, outputs_cols, features_cols):
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
            m = modelGenerater.manager(data=df, window_size=12)
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

    """
    Imputation GAIN
    """

    def createLearningImputationGAN(self):
        result = {"result": False, "resultMessage": None}
        file = "dt_data_api/data/test_data_201901_201902_결측.csv"
        df = pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        # df=pd.read_csv(file, header=0, parse_dates=True)

        fileName = "synthesizer_test1.pkl"
        item = "w60"

        try:
            m = imputationGenerater.manager(df)
            m.modelTrainning()

            result["result"] = True
            result["resultMessage"] = "학습완료"
        except Exception as e:
            errorMsg = "SetCreateLearningModel Error : " + e.args[0] + " - " + e.args[1]
            logging.error(errorMsg)
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result
