# from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.augment1Model import augment1Model
from dt.models.responseData import responseData
from dt.serializers.augment1Serializer import augment1Serializer
from dt.services.augment1Service import augment1Service
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
# import json


class augment1ViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    service = augment1Service()

    """
    데이터 증강/보강
    ---
    단일 트윈 메타 항목별 보강/증강 한다
    """

    def list(self, request):
        print("list")
        return Response("list ok", status=200)

    def create(self, request):
        print("create")
        return Response("create ok", status=200)

    def retrieve(self, request, pk=None):
        print("retrieve")
        return Response("retrieve ok", status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        print("update")
        return Response("update ok", status=200)

    def partial_update(self, request, pk=None):
        print("partial_update")
        return Response("partial_update ok", status=200)

    def destroy(self, request, pk=None):
        print("destroy")
        return Response("destroy ok", status=200)

    @action(detail=False, methods=["POST", "GET"])
    def augmentList(self, request):
        augments = augment1Model.objects.all()
        serializer = augment1Serializer(augments, many=True)
        return Response(
            responseData(
                code=status.HTTP_200_OK, message="OK", data=serializer.data
            ).getJson(),
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["POST"])
    def augmentSave(self, request):
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
    def augmentSave1(self, request):
        data = augment1Service.Save(request.data)
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
    def augmentSearch(self, request):
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
    def augmentSearch1(self, request):
        if request.data.get("param"):
            data = augment1Service.Search(request.data.get("param"))
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
        param = request.data.get("param")
        print(param)

        with connections["dt_db"].cursor() as cursor:
            cursor.execute("select * from test where name='" + param + "'")
            user = cursor.fetchall()
            print(user)

        return Response(param, status=200)

    @action(detail=False, methods=["POST", "GET"])
    def setDT(self, request):
        print("bbbb")
        return Response("bbbb ok", status=200)

    @action(detail=False, methods=["POST", "GET"])
    def dataDataFill(self, request):
        # rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail='', data='')
        data = augment1Service.SetDataFill()
        if data["result"]:
            # rd['code'] = status.HTTP_200_OK
            # rd['message'] = 'OK'
            # rd['detail'] = ''
            # rd['data'] = data['resultMessage']
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
    def dataDataInterpolation(self, request):
        data = augment1Service.SetDataInterpolation()
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
    def dataResample(self, request):
        data = augment1Service.SetDataResample()
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
    def dataQuery(self, request):
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
    def dataQuerySave(self, request):
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
    def createLearningModel(self, request):
        fileName = (
            "ID_2023.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        item = "w60" if request.data.get("item") == None else request.data.get("item")
        data = self.service.SetCreateLearningModel(fileName, item)
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
    def dataGenerater(self, request):
        fileName = (
            "ID_2023.h5"
            if request.data.get("filename") == None
            else request.data.get("filename")
        )
        item = "w60" if request.data.get("item") == None else request.data.get("item")
        data = self.service.SetDataGenerater(fileName, item)
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
    def dataGenerater2(self, request):
        item = "w60" if request.data.get("item") == None else request.data.get("item")
        data = self.service.SetDataGenerater2(item)
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
    def dataGenerater_fid(self, request):
        data = self.service.GetDataGeneraterFID()
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

    """
    모델생성
    """

    @action(detail=False, methods=["POST", "GET"])
    def modelGenerater_create(self, request):
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

    """
    예측 데이터생성 (검증)
    """

    @action(detail=False, methods=["POST", "GET"])
    def modelGenerater_export(self, request):
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

    """
    예측 데이터생성 (예측)
    """

    @action(detail=False, methods=["POST", "GET"])
    def modelGenerater_predict(self, request):
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

    """
    FID 스코어
    """

    @action(detail=False, methods=["POST", "GET"])
    def modelGenerater_fid(self, request):
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

    """
    Imputation GAIN 
    """

    @action(detail=False, methods=["POST", "GET"])
    def imputationGAIN_create(self, request):
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
