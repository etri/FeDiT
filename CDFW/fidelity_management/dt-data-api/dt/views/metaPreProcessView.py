# from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from dt.models.responseData import responseData
from dt.services.metaPreProcessService import metaPreProcessService
from dt.services.correlationService import correlationService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import ERROR_CODE


class metaPreProcessViewSet(viewsets.ViewSet):
    """
    processor class
    ---
    전처리 클래스
    """

    # 권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    # 서비스 객체 생성
    service = metaPreProcessService()
    correlationService = correlationService()

    @action(detail=False, methods=["POST", "GET"])
    def processorMakeUserUploadBaseDataSet(self, request):
        """
        초기 full json 에서 보여지는 샘플메타중 최초 지정한 갯수 1000건 기준
        """
        paramData = request.data
        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60",
            }

        pageParam = {
            #'page': paramData['page'],
            #'page_size': paramData['page_size']
            "page": 1,
            "page_size": 1000,
        }

        data = self.service.processorMakeUserUploadBaseDataSet(
            paramData=paramData, pageParam=pageParam
        )

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0006",
                message="Processor Dataset Info Error",
                detail=data["resultMessage"],
            )

        # print(rd.getJson())
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorMakeBaseDataSet(self, request):
        """
        초기 full json 에서 보여지는 샘플메타중 최초 지정한 갯수 1000건 기준
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60",
            }

        pageParam = {
            #'page': paramData['page'],
            #'page_size': paramData['page_size']
            "page": 1,
            "page_size": 1000,
        }

        data = self.service.processorMakeBaseDataSet(
            paramData=paramData, pageParam=pageParam
        )

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0006",
                message="Processor Dataset Info Error",
                detail=data["resultMessage"],
            )

        # print(rd.getJson())
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorCheckIndexTimeColumn(self, request):
        """
        초기 인덱스 컬럼의 시계열 여부 확인용 메소드
        """
        paramData = request.data
        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60",
            }

        data = self.service.processorCheckIndexTimeColumn(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-99999",
                message="Processor Column Index Check Error",
                detail=data["resultMessage"],
            )

        # print(rd.getJson())
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorMakeBaseDataSetRangeRow(self, request):
        """
        초기 full json 에서 보여지는 샘플메타의 실 데이터를 가져온 후에 범위만큼 잘라서 csv로 생성
        """
        paramData = request.data
        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60",
            }

        data = self.service.processorMakeBaseDataSetRangeRow(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0006",
                message="Processor Dataset Info Error",
                detail=data["resultMessage"],
            )

        # print(rd.getJson())
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorMakeBaseDataSetRangeCol(self, request):
        """
        범위만큼 자른 데이터에서 전처리를 위한 사용자가 지정 한 컬럼만 추출하여 csv 생성
        """
        paramData = request.data
        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60",
            }

        data = self.service.processorMakeBaseDataSetRangeCol(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0006",
                message="Processor Dataset Info Error",
                detail=data["resultMessage"],
            )

        # print(rd.getJson())
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetInfo(self, request):
        """
        데이터셋 데이터정보
        """
        paramData = request.data
        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60",
            }

        data = self.service.processorDatasetInfo(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0006",
                message="Processor Dataset Info Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetVerify(self, request):
        """
        데이터셋 검증
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "target_file_name": "test_data_201901_201902_verify.csv",
                "index_trgt_col": "date",
                "vrfc_tp": "DT",
                "vrfc_trgt_col": "m10",
                "vrfc_clear_type": "I",
                "is_create": "Y",
                "rule1": "int",
                "rule2": None,
                "rule3": None,
                "rule4": None,
            }
        print("========processorDatasetVerify============")
        print(paramData)
        data = self.service.processorDatasetVerify(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0010",
                message="Processor Dataset Verify Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorOutlierStandardDeviation(self, request):
        """
        데이터셋 검증
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file": "Z:\\DT\\storage\\data\\2023\\07\\9999\\기상청_신사동_2018.csv",
                "index_trgt_col": "date",
                "feature": "ondo",
                "freq": 50,
                "p_value": 0.05,
            }

        print("========processorOutlierStandardDeviation============")
        print(paramData)
        data = self.service.standardDeviation(paramData=paramData)

        if data["result"]:
            rd = responseData(code=200, message="OK", data=data["resultMessage"])
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0099",
                message="Outlier Standard Deviation Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorOutlierKMeans(self, request):
        """
        데이터셋 검증
        """
        paramData = request.data
        print("==========KMeans============")
        # 테스트용
        if not paramData:
            paramData = {
                "file": "Z:\\DT\\storage\\data\\2023\\07\\9999\\기상청_신사동_2018.csv",
                "index_trgt_col": "date",
                "feature": "ondo",
                "freq": 50,
                "p_value": 0.05,
            }

        print("========processorOutlierKMeans============")
        print(paramData)

        data = self.service.kMeans(paramData=paramData)

        if data["result"]:
            rd = responseData(code=200, message="OK", data=data["resultMessage"])
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0099",
                message="Outlier kMeans Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorOutlierDBscan(self, request):
        """
        데이터셋 검증
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file": "Z:\\DT\\storage\\data\\2023\\07\\9999\\기상청_신사동_2018.csv",
                "index_trgt_col": "date",
                "feature": "ondo",
                "freq": 50,
                "p_value": 0.05,
            }

        print("========processorOutlierDBscan============")
        print(paramData)

        data = self.service.dbScan(paramData=paramData)

        if data["result"]:
            rd = responseData(code=200, message="OK", data=data["resultMessage"])
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0099",
                message="Outlier DBscan Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetInterpolate(self, request):
        """
        데이터셋 결측 보완
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "target_file_name": "test_data_201901_201902_imputer.csv",
                "index_trgt_col": "date",
                "interpl_tp": "w30",
            }

        data = self.service.processorDatasetInterpolate(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0007",
                message="Processor Dataset Interpolate Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDateTimeCheck(self, request):
        """
        데이터셋 날짜시간 체크
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999",
                "file_name": "9999_origin_sample.csv",
                "index_column": "date",
            }

        data = self.service.dataDateTimeCheck(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetResample(self, request):
        """
        데이터셋 샘플링
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\preprocess\\2023\\06\\9999",
                "file_name": "test.csv",
                "target_file_name": "test_resample.csv",
                "index_trgt_col": "date",
                "resmpl_tp": "linear",
                "time_rule": "1D",
            }

        data = self.service.processorDatasetResample(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0008",
                message="Processor Dataset Resample Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetUnitConverter(self, request):
        """
        데이터셋 단위변환
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_resample.csv",
                "target_file_name": "test_data_201901_201902_unit.csv",
                "index_trgt_col": "date",
                "unit_trgt_col": "w60",
                "unit_formula": "{0} * 9.0 / 5.0 + 32.0",
            }

        data = self.service.processorDatasetUnitConverter(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0009",
                message="Processor Dataset Unit Converter Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetCorrelation(self, request):
        """
        데이터셋 상관관계
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "기상청_신사동_2021_2.csv",
                "index_trgt_col": 0,
                "columns": [
                    "ondo",
                    "gangsulyang",
                    "gangsutype",
                    "punghyang",
                    "pungsok",
                    "sbdo",
                ],
            }

        data = self.service.processorDatasetCorrelation(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0012",
                message="Processor Dataset Correlation Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDatasetCorrelationOption(self, request):
        """
        데이터셋 상관관계 (다양한 상관관계 함수들)
        """
        parameters = request.data
        print("parameters", parameters)

        data = self.correlationService.processorDatasetCorrelation(parameters)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0012",
                message="Processor Dataset Correlation Error",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorCreateAELearningModel(self, request):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        """
        paramData = request.data
        print("======processorCreateAELearningModel=========")
        print(paramData)

        data = self.service.createAELearningModel(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDataAEGenerater(self, request):
        """
        Auto Encoder 기준 이상치 탐지
        """
        fileName = (
            "ID_LM_AE_TEST.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["ondo"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            [] if request.data.get("features") == None else request.data.get("features")
        )

        paramData = request.data

        print("========processorDataAEGenerater============")
        print(paramData)

        # data = self.service.dataAEGenerater(fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols)
        data = self.service.dataAEGenerater(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0099",
                message="Outlier AutoEncoder Error",
                detail=data["resultMessage"],
            )

        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorCreateAELearningModel_New(self, request):
        """
        Auto Encoder New 기준 이상치 탐지 모델 생성
        """
        paramData = request.data
        print("======processorCreateAELearningModel=========")
        print(paramData)

        data = self.service.createAELearningModel_New(paramData=paramData)

        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDataAEGenerater_New(self, request):
        """
        Auto Encoder New 기준 이상치 탐지
        """
        fileName = (
            "ID_LM_AE_TEST.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["ondo"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            [] if request.data.get("features") == None else request.data.get("features")
        )

        paramData = request.data

        print("========processorDataAEGenerater============")
        print(paramData)

        # data = self.service.dataAEGenerater(fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols)
        data = self.service.dataAEGenerater_New(paramData=paramData)
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
            )
        else:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0099",
                message="Outlier AutoEncoder New Error",
                detail=data["resultMessage"],
            )

        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorEmptyCheck(self, request):
        """
        데이터셋 검증
        """
        paramData = request.data

        print("========processorOutlierEmptyCheck============")
        print(paramData)

        try:
            result = self.service.processorEmptyCheck(paramData=paramData)
            rd = responseData(code=200, message="OK", data=result, detail=None)
            return Response(rd.getJson())
        except Exception as e:
            rd = responseData(
                code=ERROR_CODE.PRE_PROCESS.value + "-0099",
                message="Processor Empty Check Error",
                detail=str(e),
            )
            return Response(rd.getJson())
