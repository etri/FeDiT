# from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.augment1Model import augment1Model
from dt.models.responseData import responseData
from dt.serializers.augment1Serializer import augment1Serializer
from dt.services.exampleService import exampleService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
# import json


class exampleViewSet(viewsets.ViewSet):
    """
    example class
    ---
    기능 테스트용 샘플 클래스
    """

    # 권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    # 서비스 객체 생성
    service = exampleService()

    def list(self, request):
        """
        목록 예시 메소드 (데이터모델)
        """
        print("list")
        return Response("list ok", status=200)

    def create(self, request):
        """
        생성 예시 메소드 (데이터모델)
        """
        print("create")
        return Response("create ok", status=200)

    def retrieve(self, request, pk=None):
        """
        상세 예시 메소드 (데이터모델)
        """
        print("retrieve")
        return Response("retrieve ok", status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        """
        수정 예시 메소드 (데이터모델)
        """
        print("update")
        return Response("update ok", status=200)

    def partial_update(self, request, pk=None):
        """
        부분수정 예시 메소드 (데이터모델)
        """
        print("partial_update")
        return Response("partial_update ok", status=200)

    def destroy(self, request, pk=None):
        """
        삭제 예시 메소드 (데이터모델)
        """
        print("destroy")
        return Response("destroy ok", status=200)

    @action(detail=False, methods=["POST", "GET"])
    def augment_List(self, request):
        """
        전체 데이터 모델 가져오기
        """
        augments = augment1Model.objects.all()
        serializer = augment1Serializer(augments, many=True)
        return Response(
            responseData(
                code=status.HTTP_200_OK, message="OK", data=serializer.data
            ).getJson(),
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["POST"])
    def augment_Save(self, request):
        """
        데이터 모델 저장
        """
        # data = json.loads(request.body)
        # serializer = augmentSerializer(data=data)
        serializer = augment1Serializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                responseData(
                    code=status.HTTP_201_CREATED, message="OK", data=serializer.data
                ).getJson(),
                status=status.HTTP_201_CREATED,
            )
            # return Response(serializer.data, status=status.HTTP_201_CREATED)

        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                data=serializer.errors,
            ).getJson(),
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(detail=False, methods=["POST"])
    def augment_Save1(self, request):
        """
        데이터 모델 저장
        """
        data = exampleService.Save(request.data)
        if data["result"]:
            return Response(
                responseData(
                    code=status.HTTP_201_CREATED,
                    message="OK",
                    data=data["resultMessage"],
                ).getJson()
            )
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
                data=[],
            ).getJson()
        )

    @action(detail=False, methods=["POST", "GET"])
    def augment_Search(self, request):
        """
        데이터 검색
        """
        param = request.data.get("param")
        print(param)

        if param:
            augements = augment1Model.objects.all().filter(augment_nm__icontains=param)
            serializer = augment1Serializer(augements, many=True)
            # response = responseData(code=status.HTTP_200_OK, message='OK', data=serializer.data)
            # self.response.data = serializer.data
            return Response(
                responseData(
                    code=status.HTTP_200_OK, message="OK", data=serializer.data
                ).getJson()
            )
            # return Response(self.response.getJson(), status=status.HTTP_200_OK)
        # else:
        # self.response.code = status.HTTP_400_BAD_REQUEST
        # self.response.message = 'BAD_REQUEST'
        # response = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', data='')

        # return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', data='').getJson(), status=status.HTTP_400_BAD_REQUEST)
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST, message="BAD_REQUEST", data=""
            ).getJson()
        )

    @action(detail=False, methods=["POST", "GET"])
    def augment_Search1(self, request):
        """
        데이터 검색
        """
        if request.data.get("param"):
            data = exampleService.Search(request.data.get("param"))
            if data["result"]:
                return Response(
                    responseData(
                        code=status.HTTP_200_OK,
                        message="OK",
                        data=data["resultMessage"],
                    ).getJson()
                )
        else:
            return Response(
                responseData(
                    code=status.HTTP_400_BAD_REQUEST,
                    message="BAD_REQUEST",
                    detail="param 값이 없습니다",
                    data=[],
                ).getJson()
            )
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
                data=[],
            ).getJson()
        )

    @action(detail=False, methods=["POST"])
    def getList(self, request):
        """
        데이터 검색 (DB)
        """
        param = request.data.get("param")
        print(param)

        with connections["dt_data_platform"].cursor() as cursor:
            cursor.execute(
                "select * from TB_DATA_AUGMENT where augment_nm='" + param + "'"
            )
            user = cursor.fetchall()
            print(user)

        return Response(param, status=200)

    @action(detail=False, methods=["POST", "GET"])
    def fillNa_Fill(self, request):
        """
        결측값을 정해진 값으로 채우기
        """
        data = exampleService.SetDataFill()
        if data["result"]:
            return Response(
                responseData(
                    code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
                ).getJson()
            )
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
                data=[],
            ).getJson()
        )

    @action(detail=False, methods=["POST", "GET"])
    def interpolation_Create(self, request):
        """
        결측값을 보간법으로 채우기
        """
        data = exampleService.SetDataInterpolation()
        if data["result"]:
            return Response(
                responseData(
                    code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
                ).getJson()
            )
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
                data=[],
            ).getJson()
        )

    @action(detail=False, methods=["POST", "GET"])
    def resample_Create(self, request):
        """
        데이터 리샘플링 추출
        """
        data = exampleService.SetDataResample()
        if data["result"]:
            return Response(
                responseData(
                    code=status.HTTP_200_OK, message="OK", data=data["resultMessage"]
                ).getJson()
            )
        return Response(
            responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
                data=[],
            ).getJson()
        )

    @action(detail=False, methods=["POST", "GET"])
    def query_Test(self, request):
        """
        DB Query 테스트 로드
        """
        data = self.service.GetDataQuery()
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
    def query_Save(self, request):
        """
        DB Query 테스트 저장
        """
        data = self.service.GetDataQuerySave()
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
    def regression_Create(self, request):
        """
        선형회귀 결측값 보간
        """
        item = "m60" if request.data.get("item") == None else request.data.get("item")
        data = self.service.SetDataRegression(item)
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
    def modelGenerater_create(self, request):
        """
        RNN 학습모델 생성
        """
        fileName = (
            "ID_2023.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["w60"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            ["w10", "w20"]
            if request.data.get("features") == None
            else request.data.get("features")
        )
        data = self.service.createLearningModel(
            fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols
        )
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
    def modelGenerater_export(self, request):
        """
        RNN 학습모델에서 데이터 생성
        """
        fileName = (
            "ID_2023.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["w60"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            ["w10", "w20"]
            if request.data.get("features") == None
            else request.data.get("features")
        )
        data = self.service.exportDataGenerater(
            fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols
        )
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
    def modelGenerater_fid(self, request):
        """
        RNN 학습모델을 통해 생성한 데이터 비교 검증 (FID Secore)
        """
        fileName = (
            "ID_2023.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["w60"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            ["w10", "w20"]
            if request.data.get("features") == None
            else request.data.get("features")
        )
        data = self.service.fidDataGenerater(
            fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols
        )
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
    def modelGenerater_predict(self, request):
        """
        RNN 학습모델에서 데이터 생성 (예측+예측...)
        """
        fileName = (
            "ID_2023.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["w60"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            ["w10", "w20"]
            if request.data.get("features") == None
            else request.data.get("features")
        )
        data = self.service.exportPredictDataGenerater(
            fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols
        )
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
    def dataImage_fid(self, request):
        """
        FID Secore 원본/생성 이미지 비교
        """
        data = self.service.GetDataImageFID()
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
    def imputationGAIN_create(self, request):
        """
        GAIN 결측 보간
        """
        data = self.service.createLearningImputationGAN()
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
    def imputationSimple_create(self, request):
        """
        sklearn SimpleImputer 결측 보간
        """
        data = self.service.createImputationSimple()
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
    def imputationKNN_create(self, request):
        """
        sklearn KNNImputer 결측 보간
        """
        data = self.service.createImputationKNN()
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
    def imputationIterative_create(self, request):
        """
        sklearn IterativeImputer 결측 보간
        """
        data = self.service.createImputationIterative()
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
    def imputationBrits_create(self, request):
        """
        Brits 결측 보간
        """
        data = self.service.createImputationBrits()
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
    def datasetInfo_describe(self, request):
        """
        데이터셋 요약정보 추출
        """
        data = self.service.datasetInfoDescribe()
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
    def datasetInfo_type(self, request):
        """
        데이터셋 데이터타입 추출
        """
        data = self.service.datasetInfoType()
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
    def datasetInfo_dataset(self, request):
        """
        데이터셋 정보 추출
        """
        data = self.service.datasetInfoData()
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
    def datasetInfo_hist(self, request):
        """
        데이터셋 히스토그램
        """
        data = self.service.datasetInfoHist()
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
    def datasetInfo_info(self, request):
        """
        데이터셋 데이터정보
        """
        data = self.service.datasetInfoInfo()
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
    def datasetInfo_dateTimeCheck(self, request):
        """
        데이터셋 날짜시간 체크
        """
        data = self.service.dataDateTimeCheck()
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
    def outlier_zTest(self, request):
        """
        정규분포 이상치 탐지
        """
        data = self.service.outlierZTest()
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
    def outlier_standardDeviation(self, request):
        """
        표준편차 기준 이상치 탐지
        """
        data = self.service.outlierStandardDeviation()
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
    def outlier_kMeans(self, request):
        """
        k-means 기준 이상치 탐지
        """
        data = self.service.outlierKMeans()
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
    def outlier_dbScan(self, request):
        """
        dbScan 기준 이상치 탐지
        """
        data = self.service.outlierDBScan()
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
    def outlier_createAELearningModel(self, request):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        """
        # data = self.service.createAELearningModel()
        data = self.service.createAELearningModel()
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
    def outlier_dataAEGenerater(self, request):
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
        data = self.service.dataAEGenerater(
            fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols
        )
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
    def outlier_createAELearningModel_New(self, request):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        """
        data = self.service.createAELearningModel_New()

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
    def outlier_dataAEGenerater_New(self, request):
        """
        Auto Encoder 기준 이상치 탐지
        """
        fileName = (
            "ID_LM_AE_TEST_NEW.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["RAIN5"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            [] if request.data.get("features") == None else request.data.get("features")
        )

        data = self.service.dataAEGenerater_New(
            fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols
        )
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
    def arima_modelGenerater(self, request):
        """
        ARIMA 모델 생성
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
        data = self.service.arimaModelGenerater(
            fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols
        )
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
    def outlier_anomalyDetection(self, request):
        """
        ETRI 이상 탐지 모듈
        """

        """
        fileName = ('ID_LM_AE_TEST.h5' if request.data.get('filename')==None else request.data.get('filename'))        
        outputs_cols = (['ondo'] if request.data.get('outputs')==None else request.data.get('outputs'))
        features_cols = ([] if request.data.get('features')==None else request.data.get('features'))
        data = self.service.dataAEGenerater(fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols)        
        """

        data = self.service.loadAndInfer()
        # data = self.service.etri_model_train_and_save()

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
    def processorDecisionTree(self, request):
        """
        결정트리 분류
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\",
                "file_name": "ae_train_test.csv",
                "target_file_name": "ae_train_test_target.csv",
                "model_path": "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\tmp\\model\\admin1723536407958.pkl",
                "index_column": "DATE",
                "outputs": ["RAIN5", "RAIN6", "RAIN7"],
                "feature": "LEVEL32",
                "set_order": 1,
                "isCreate": "Y",
            }

        data = self.service.decisionTree(paramData=paramData)

        if data["result"]:
            rd = responseData(code=200, message="OK", data=data)
        else:
            rd = responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def processorDecisionTree_model(self, request):
        """
        결정트리 분류
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            paramData = {
                "file_path": "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\",
                "file_name": "ae_train_test.csv",
                "target_file_name": "ae_train_test_target.csv",
                "model_path": "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\tmp\\model\\admin1723536407958.pkl",
                "index_column": "DATE",
                "outputs": ["RAIN5", "RAIN6", "RAIN7"],
                "feature": "LEVEL32",
                "set_order": 1,
                "isCreate": "Y",
            }

        data = self.service.decisionTree_useSavedModel(paramData=paramData)

        if data["result"]:
            rd = responseData(code=200, message="OK", data=data)
        else:
            rd = responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def data_fid(self, request):
        """
        FID Secore 원본/생성 데이터 비교
        """
        data = self.service.GetDataFID()
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
    def outlier_createNAOMILearningModel_New(self, request):
        """
        Auto Encoder 기준 이상치 탐지 모델 생성
        """
        data = self.service.createNAOMILearningModel_New()

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
    def outlier_dataNAOMIGenerater_New(self, request):
        """
        Auto Encoder 기준 이상치 탐지
        """
        fileName = (
            "ID_LM_AE_TEST_NEW.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        outputs_cols = (
            ["RAIN5"]
            if request.data.get("outputs") == None
            else request.data.get("outputs")
        )
        features_cols = (
            [] if request.data.get("features") == None else request.data.get("features")
        )

        data = self.service.dataNAOMIGenerater_New(
            fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols
        )
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
    def createModelGenerater_brits(self, request):
        """
        brits 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        # req_features = request.data.get('features')
        req_modelType = request.data.get("modelType")
        req_timeSteps = request.data.get("timeSteps")
        req_batchSize = request.data.get("batchSize")
        req_testSize = request.data.get("testSize")
        req_epochs = request.data.get("epochs")
        req_loss = request.data.get("loss")
        req_meterics = request.data.get("meterics")
        req_optimizer = request.data.get("optimizer")
        req_optimizerLr = request.data.get("optimizerLr")
        req_modelID = request.data.get("modelID")
        req_indexColumn = request.data.get("indexColumn")
        req_dataSize = request.data.get("dataSize")

        req_targetColList = request.data.get("trgt_col_list")
        """
        print(req_filePath)
        print(req_fileName)
        print(req_modelFilePath)
        print(req_modelFileName)
        print(req_outputs)
        print(req_features)
        print(req_modelType)
        print(req_windowSize)
        print(req_batchSize)
        print(req_testSize)
        print(req_epochs)
        print(req_loss)
        print(req_meterics)
        print(req_optimizer)
        print(req_modelID)
        print(req_indexColumn)
        """

        filePath = req_filePath
        # filename = ('201901_201912유동인구.csv' if req_filename==None else req_filename)
        fileName = (
            "test_data_201901_201902_imputer.csv"
            if req_fileName == None
            else req_fileName
        )
        targetFileName = (
            "test_data_201901_201902.csv"
            if req_targetFileName == None
            else req_targetFileName
        )
        modelFilePath = req_modelFilePath
        modelFileName = "ID_2023.h5" if req_modelFileName == None else req_modelFileName
        outputs = ["w60"] if req_outputs == None else req_outputs
        # outputs = (['LRAIN'] if req_outputs==None else req_outputs)
        # features = (['w20'] if req_features==None else req_features)
        # features = ([] if req_features==None else req_features)
        modelType = "lstm" if req_modelType == None else req_modelType
        timeSteps = 100 if req_timeSteps == None else req_timeSteps
        batchSize = 16 if req_batchSize == None else req_batchSize
        testSize = 0.2 if req_testSize == None else req_testSize
        epochs = 50 if req_epochs == None else req_epochs
        loss = "hub" if req_loss == None else req_loss
        # loss = ('mse' if req_loss==None else req_loss)
        # meterics = ('mse' if req_meterics==None else req_meterics)
        meterics = "mae" if req_meterics == None else req_meterics
        optimizer = "adam" if req_optimizer == None else req_optimizer
        # optimizer = ('sgd' if req_optimizer==None else req_optimizer)
        optimizerLr = 0.0005 if req_optimizerLr == None else req_optimizerLr
        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn
        dataSize = 100 if req_dataSize == None else req_dataSize
        targetColList = [] if req_targetColList == None else req_targetColList

        data = self.service.createImputationBrits_New(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            modelType=modelType,
            batchSize=batchSize,
            testSize=testSize,
            epochs=epochs,
            timesteps=timeSteps,
            loss=loss,
            meterics=meterics,
            optimizer=optimizer,
            optimizerLr=optimizerLr,
            modelID=modelID,
            indexColumn=indexColumn,
            dataSize=dataSize,
            targetColList=targetColList,
        )
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
    def augmentCreate_brits(self, request):
        """
        brits 학습모델 활용 데이터 추론 생성
        """
        paramData = request.data

        # 테스트용
        if not paramData:
            """
            paramData = {
                "model_file_path": None,
                "model_file_name": "ID_2023.h5",
                "test_file_path": None,
                "test_file_name": "254_RAIN015003_202305171245_ex1.csv",
                "outputs": ['LRAIN'],
                "features": [],
                "window_size": 8,
                "batch_size": 16,
                "model_id": 9999,
                "index_column": 0,
            }
            """
            """
            #사용자, 입력:전체, 실시간:X
            paramData = {
                "model_file_path": "Z:\\DT\\storage\\preprocess\\2023\\06\\9999\\augment_sample_test",
                "model_file_name": "origin_sample_7d_w12.h5",
                "test_file_path": "Z:\\DT\\storage\\preprocess\\2023\\06\\9999\\augment_sample_test",
                "test_file_name": "origin_sample_3d.csv",
                "outputs": ["ondo","m10","m60","m30","w30","w20"],
                "features": [],
                "window_size": 12,
                "batch_size": 16,
                "model_id": 9999,
                "index_column": "date"
            }
            """

            # 모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_file_path": "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\",
                "model_file_name": "MODEL_RF_20240904154156966.plk",
                "model_use_file_path": "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\",
                "model_use_file_name": "24_2차입식_데이터합본_수정_0612_4.csv",
                "output_file": "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\24_2차입식_데이터합본_수정_0612_4_interval_augment.csv",
                "output_file_name": "24_2차입식_데이터합본_수정_0612_4_augment.csv",
                "outputs": ["MET"],
                "features": ["temp", "RH", "CO2", "AMM", "Temp_Out", "RH_Out", "Solar"],
                "model_id": 153,
                "index_column": "time",
                "trgt_col_list": "",
            }

        data = self.service.augmentCreate_brits(paramData=paramData)

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
