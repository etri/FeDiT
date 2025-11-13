# from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.learningServiceMeta import learningServiceMeta
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
# import json


class learningViewSetMeta(viewsets.ViewSet):
    """
    learning class
    ---
    학습모델 클래스
    """

    # 권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    # 서비스 객체 생성
    service = learningServiceMeta()

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
        data = self.service.createLearningModelMeta(
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
        data = self.service.exportDataGeneraterMeta(
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
        data = self.service.fidDataGeneraterMeta(
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
        data = self.service.exportPredictDataGeneraterMeta(
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
        data = self.service.GetDataImageFIDMeta()
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
    def timeGAN_create(self, request):
        """
        TimeGAN 학습모델 생성
        """
        data = self.service.createLearningTimeGANMeta()
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
    def createModelGenerater(self, request):
        """
        RNN 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")
        req_modelType = request.data.get("modelType")
        req_windowSize = request.data.get("windowSize")
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
        features = [] if req_features == None else req_features
        modelType = "lstm" if req_modelType == None else req_modelType
        windowSize = 8 if req_windowSize == None else req_windowSize
        batchSize = 16 if req_batchSize == None else req_batchSize
        testSize = 0.2 if req_testSize == None else req_testSize
        epochs = 10 if req_epochs == None else req_epochs
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
        targetColList = ["w60"] if req_features == None else req_targetColList

        data = self.service.createModelGeneraterMeta(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            features=features,
            modelType=modelType,
            windowSize=windowSize,
            batchSize=batchSize,
            testSize=testSize,
            epochs=epochs,
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
    def createDataGenerater(self, request):
        """
        RNN 학습모델에서 데이터 생성
        """
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_testFilePath = request.data.get("testFilePath")
        req_testFileName = request.data.get("testFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")
        req_windowSize = request.data.get("windowSize")
        req_batchSize = request.data.get("batchSize")
        req_modelID = request.data.get("modelID")
        req_indexColumn = request.data.get("indexColumn")

        modelFilePath = req_modelFilePath
        modelFileName = "ID_2023.h5" if req_modelFileName == None else req_modelFileName
        testFilePath = req_testFilePath
        testFileName = (
            "test_data_201901_201902_imputer.csv"
            if req_testFileName == None
            else req_testFileName
        )
        outputs = ["w60"] if req_outputs == None else req_outputs
        features = [] if req_features == None else req_features
        windowSize = 8 if req_windowSize == None else req_windowSize
        batchSize = 16 if req_batchSize == None else req_batchSize
        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn

        data = self.service.createDataGeneraterMeta(
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            testFilePath=testFilePath,
            testFileName=testFileName,
            outputs=outputs,
            features=features,
            windowSize=windowSize,
            batchSize=batchSize,
            modelID=modelID,
            indexColumn=indexColumn,
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
    def createModelGenerater_randomForest(self, request):
        """
        RandomForestRegression 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")

        req_testSize = request.data.get("testSize")
        req_modelID = request.data.get("modelID")
        req_indexColumn = request.data.get("indexColumn")
        req_targetColList = request.data.get("trgt_col_list")

        req_n_estimator = request.data.get("n_estimator")
        req_min_samples_leaf = request.data.get("min_samples_leaf")
        req_min_samples_split = request.data.get("min_samples_split")
        req_max_features = request.data.get("max_features")
        req_max_depth = request.data.get("max_depth")

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
        features = [] if req_features == None else req_features
        testSize = 0.2 if req_testSize == None else req_testSize

        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn

        targetColList = [] if req_features == None else req_targetColList

        n_estimator = 100 if req_n_estimator == None else req_n_estimator
        min_samples_leaf = 1 if req_min_samples_leaf == None else req_min_samples_leaf
        min_samples_split = (
            2 if req_min_samples_split == None else req_min_samples_split
        )
        max_features = 1 if req_max_features == None else req_max_features
        max_depth = (
            None if req_max_depth == None or req_max_depth == "" else req_max_depth
        )

        data = self.service.createModelGeneraterMeta_randomForest(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            features=features,
            testSize=testSize,
            modelID=modelID,
            indexColumn=indexColumn,
            targetColList=targetColList,
            n_estimator=n_estimator,
            min_samples_leaf=min_samples_leaf,
            min_samples_split=min_samples_split,
            max_features=max_features,
            max_depth=max_depth,
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
    def createModelGenerater_deepAR(self, request):
        """
        RNN 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")
        req_modelType = request.data.get("modelType")
        req_windowSize = request.data.get("windowSize")
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
        features = [] if req_features == None else req_features
        modelType = "lstm" if req_modelType == None else req_modelType
        windowSize = 8 if req_windowSize == None else req_windowSize
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
        targetColList = [] if req_features == None else req_targetColList

        data = self.service.createModelGeneraterMeta_deepAR(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            features=features,
            modelType=modelType,
            windowSize=windowSize,
            batchSize=batchSize,
            testSize=testSize,
            epochs=epochs,
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
    def createModelGenerater_arima(self, request):
        print("ARIMA 모델 생성")
        """
        ARIMA 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")
        req_windowSize = request.data.get("windowSize")
        req_testSize = request.data.get("testSize")
        req_modelID = request.data.get("modelID")
        req_indexColumn = request.data.get("indexColumn")
        req_targetColList = request.data.get("trgt_col_list")

        req_p = request.data.get("p")
        req_d = request.data.get("d")
        req_q = request.data.get("q")

        print(request.data)

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
        features = [] if req_features == None else req_features
        windowSize = 8 if req_windowSize == None else req_windowSize
        testSize = 0.2 if req_testSize == None else req_testSize

        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn

        targetColList = [] if req_features == None else req_targetColList
        p = 5 if req_p == None else req_p
        d = 1 if req_d == None else req_d
        q = 0 if req_q == None else req_q

        data = self.service.createModelGeneraterMeta_arima(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            features=features,
            windowSize=windowSize,
            testSize=testSize,
            modelID=modelID,
            indexColumn=indexColumn,
            targetColList=targetColList,
            p=p,
            d=d,
            q=q,
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
        meterics = "mse" if req_meterics == None else req_meterics
        optimizer = "adam" if req_optimizer == None else req_optimizer
        # optimizer = ('sgd' if req_optimizer==None else req_optimizer)
        optimizerLr = 0.001 if req_optimizerLr == None else req_optimizerLr
        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn
        dataSize = 100 if req_dataSize == None else req_dataSize
        targetColList = [] if req_targetColList == None else req_targetColList

        data = self.service.createImputationBrits(
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
    def createModelGenerater_brits_ori(self, request):
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
        req_optimizerLr = request.data.get("optimizerLr")
        req_modelID = request.data.get("modelID")
        req_indexColumn = request.data.get("indexColumn")
        # req_dataSize = request.data.get('dataSize')

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
        # loss = ('mse' if req_loss==None else req_loss)
        # meterics = ('mse' if req_meterics==None else req_meterics)

        # optimizer = ('sgd' if req_optimizer==None else req_optimizer)
        optimizerLr = 0.0005 if req_optimizerLr == None else req_optimizerLr
        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn
        # dataSize = (100 if req_dataSize==None else req_dataSize)
        targetColList = [] if req_targetColList == None else req_targetColList

        data = self.service.createImputationBrits_ori(
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
            optimizerLr=optimizerLr,
            modelID=modelID,
            indexColumn=indexColumn,
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
    def createModelGenerater_naomi(self, request):
        """
        naomi 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        # req_features = request.data.get('features')
        req_modelType = request.data.get("modelType")
        req_windowSize = request.data.get("windowSize")

        req_batchSize = request.data.get("batchSize")
        req_testSize = request.data.get("testSize")
        req_epochs = request.data.get("epochs")
        req_optimizerLr = request.data.get("optimizerLr")
        req_modelID = request.data.get("modelID")
        req_indexColumn = request.data.get("indexColumn")
        req_gradientClipping = request.data.get("gradientClipping")
        req_missingGroup = request.data.get("missingGroup")
        req_missingRange = request.data.get("missingRange")
        req_testSizePerDataLength = request.data.get("testSizePerDataLength")

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
        windowSize = 8 if req_windowSize == None else req_windowSize

        batchSize = 16 if req_batchSize == None else req_batchSize
        testSize = 0.2 if req_testSize == None else req_testSize
        epochs = 50 if req_epochs == None else req_epochs
        # loss = ('mse' if req_loss==None else req_loss)
        # meterics = ('mse' if req_meterics==None else req_meterics)

        # optimizer = ('sgd' if req_optimizer==None else req_optimizer)
        optimizerLr = 0.005 if req_optimizerLr == None else req_optimizerLr
        modelID = 9999 if req_modelID == None else req_modelID
        indexColumn = 0 if req_indexColumn == None else req_indexColumn
        gradientClipping = 10 if req_gradientClipping == None else req_gradientClipping
        missingGroup = 4 if req_missingGroup == None else req_missingGroup
        missingRange = [10, 30] if req_missingRange == None else req_missingRange
        testSizePerDataLength = (
            100 if req_testSizePerDataLength == None else req_testSizePerDataLength
        )
        targetColList = [] if req_targetColList == None else req_targetColList

        data = self.service.createImputationNaomi(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            modelType=modelType,
            windowSize=windowSize,
            batchSize=batchSize,
            testSize=testSize,
            epochs=epochs,
            optimizerLr=optimizerLr,
            gradientClipping=gradientClipping,
            missingGroup=missingGroup,
            missingRange=missingRange,
            testSizePerDataLength=testSizePerDataLength,
            modelID=modelID,
            indexColumn=indexColumn,
            targetColList=targetColList,
        )
        if data["result"]:
            rd = responseData(
                code=status.HTTP_200_OK, message="OK", data=data
            )  # ['resultMessage'])
        else:
            rd = responseData(
                code=status.HTTP_400_BAD_REQUEST,
                message="BAD_REQUEST",
                detail=data["resultMessage"],
            )
        return Response(rd.getJson())

    @action(detail=False, methods=["POST", "GET"])
    def createModelGenerater_nbeats(self, request):
        """
        nbeats 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")
        req_modelType = request.data.get("modelType")
        req_windowSize = request.data.get("windowSize")
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
        req_units = request.data.get("units")
        # req_timeSteps = request.data.get('timeSteps')

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
        features = [] if req_features == None else req_features
        modelType = "lstm" if req_modelType == None else req_modelType
        windowSize = 8 if req_windowSize == None else req_windowSize
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
        targetColList = [] if req_features == None else req_targetColList
        units = 64 if req_units == None else req_units
        # timeSteps = (100 if req_timeSteps==None else req_timeSteps)

        data = self.service.createModelGeneraterMeta_nbeats(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            features=features,
            modelType=modelType,
            windowSize=windowSize,
            batchSize=batchSize,
            testSize=testSize,
            epochs=epochs,
            loss=loss,
            meterics=meterics,
            optimizer=optimizer,
            optimizerLr=optimizerLr,
            modelID=modelID,
            indexColumn=indexColumn,
            dataSize=dataSize,
            targetColList=targetColList,
            units=units,
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
    def createModelGenerater_SEG_RNN(self, request):
        """
        RNN 학습모델 생성
        """
        req_filePath = request.data.get("filePath")
        req_fileName = request.data.get("fileName")
        req_targetFileName = request.data.get("targetFileName")
        req_modelFilePath = request.data.get("modelFilePath")
        req_modelFileName = request.data.get("modelFileName")
        req_outputs = request.data.get("outputs")
        req_features = request.data.get("features")
        req_modelType = request.data.get("modelType")
        req_windowSize = request.data.get("windowSize")
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

        req_num_segments = request.data.get("num_segments")
        req_segment_len = request.data.get("segment_len")

        filePath = req_filePath
        # filename = ('201901_201912유동인구.csv' if req_filename==None else req_filename)
        fileName = (
            "test_data_201901_201902_imputer.csv"
            if req_fileName is None
            else req_fileName
        )
        targetFileName = (
            "test_data_201901_201902.csv"
            if req_targetFileName is None
            else req_targetFileName
        )
        modelFilePath = req_modelFilePath
        modelFileName = "ID_2023.h5" if req_modelFileName is None else req_modelFileName
        outputs = ["w60"] if req_outputs is None else req_outputs
        # outputs = (['LRAIN'] if req_outputs==None else req_outputs)
        # features = (['w20'] if req_features==None else req_features)
        features = [] if req_features is None else req_features
        modelType = "lstm" if req_modelType == None else req_modelType
        windowSize = 8 if req_windowSize == None else req_windowSize
        batchSize = 16 if req_batchSize == None else req_batchSize
        testSize = 0.2 if req_testSize == None else req_testSize
        epochs = 10 if req_epochs == None else req_epochs
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
        targetColList = ["w60"] if req_features == None else req_targetColList
        num_segments = 4 if req_num_segments is None else req_num_segments
        segment_len = 8 if req_segment_len is None else req_segment_len

        data = self.service.createModelGeneraterMeta_SEG_RNN(
            filePath=filePath,
            fileName=fileName,
            targetFileName=targetFileName,
            modelFilePath=modelFilePath,
            modelFileName=modelFileName,
            outputs=outputs,
            features=features,
            modelType=modelType,
            windowSize=windowSize,
            batchSize=batchSize,
            testSize=testSize,
            epochs=epochs,
            loss=loss,
            meterics=meterics,
            optimizer=optimizer,
            optimizerLr=optimizerLr,
            modelID=modelID,
            indexColumn=indexColumn,
            dataSize=dataSize,
            targetColList=targetColList,
            num_segments=num_segments,
            segment_len=segment_len,
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
