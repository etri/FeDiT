#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.learningService import learningService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
#import json

class learningViewSet(viewsets.ViewSet):
    '''
    learning class
    ---
    학습모델 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = learningService()
    
    def list(self, request):
        '''
        목록 예시 메소드 (데이터모델)
        '''
        print("list")
        return Response("list ok", status=200)
    
    def create(self, request):
        '''
        생성 예시 메소드 (데이터모델)
        '''
        print("create")
        return Response("create ok", status=200)
    
    def retrieve(self, request, pk=None):
        '''
        상세 예시 메소드 (데이터모델)
        '''
        print("retrieve")
        return Response("retrieve ok", status=status.HTTP_404_NOT_FOUND)
    
    def update(self, request, pk=None):
        '''
        수정 예시 메소드 (데이터모델)
        '''
        print("update")
        return Response("update ok", status=200)

    def partial_update(self, request, pk=None):
        '''
        부분수정 예시 메소드 (데이터모델)
        '''
        print("partial_update")
        return Response("partial_update ok", status=200)

    def destroy(self, request, pk=None):
        '''
        삭제 예시 메소드 (데이터모델)
        '''
        print("destroy")
        return Response("destroy ok", status=200)
    
    @action(detail=False, methods=['POST', 'GET'])
    def modelGenerater_create(self, request):
        '''
        RNN 학습모델 생성
        '''
        fileName = ('ID_2023.h5' if request.data.get('filename')==None else request.data.get('filename'))
        outputs_cols = (['w60'] if request.data.get('outputs')==None else request.data.get('outputs'))
        features_cols = (['w10','w20'] if request.data.get('features')==None else request.data.get('features'))        
        data = self.service.createLearningModel(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())

    @action(detail=False, methods=['POST', 'GET'])
    def modelGenerater_export(self, request):
        '''
        RNN 학습모델에서 데이터 생성
        '''
        fileName = ('ID_2023.h5' if request.data.get('filename')==None else request.data.get('filename'))        
        outputs_cols = (['w60'] if request.data.get('outputs')==None else request.data.get('outputs'))
        features_cols = (['w10','w20'] if request.data.get('features')==None else request.data.get('features'))
        data = self.service.exportDataGenerater(fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())      

    @action(detail=False, methods=['POST', 'GET'])
    def modelGenerater_fid(self, request):
        '''
        RNN 학습모델을 통해 생성한 데이터 비교 검증 (FID Secore)
        '''
        fileName = ('ID_2023.h5' if request.data.get('filename')==None else request.data.get('filename'))        
        outputs_cols = (['w60'] if request.data.get('outputs')==None else request.data.get('outputs'))        
        features_cols = (['w10','w20'] if request.data.get('features')==None else request.data.get('features'))
        data = self.service.fidDataGenerater(fileName=fileName, output_cols=outputs_cols, feature_cols=features_cols)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())   
    
    @action(detail=False, methods=['POST', 'GET'])    
    def modelGenerater_predict(self, request):
        '''
        RNN 학습모델에서 데이터 생성 (예측+예측...)
        '''
        fileName = ('ID_2023.h5' if request.data.get('filename')==None else request.data.get('filename'))        
        outputs_cols = (['w60'] if request.data.get('outputs')==None else request.data.get('outputs'))
        features_cols = (['w10','w20'] if request.data.get('features')==None else request.data.get('features'))
        data = self.service.exportPredictDataGenerater(fileName=fileName, outputs_cols=outputs_cols, features_cols=features_cols)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson()) 

    @action(detail=False, methods=['POST', 'GET'])
    def dataImage_fid(self, request):
        '''
        FID Secore 원본/생성 이미지 비교
        '''
        data = self.service.GetDataImageFID()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())     

    @action(detail=False, methods=['POST', 'GET'])
    def timeGAN_create(self, request):        
        '''
        TimeGAN 학습모델 생성
        '''
        data = self.service.createLearningTimeGAN()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def createModelGenerater(self, request):
        '''
        RNN 학습모델 생성
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_targetFileName = request.data.get('targetFileName')
        req_modelFilePath = request.data.get('modelFilePath')
        req_modelFileName = request.data.get('modelFileName')
        req_outputs = request.data.get('outputs')
        req_features = request.data.get('features')
        req_modelType = request.data.get('modelType')
        req_windowSize = request.data.get('windowSize')
        req_batchSize = request.data.get('batchSize')
        req_testSize = request.data.get('testSize')
        req_epochs = request.data.get('epochs')
        req_loss = request.data.get('loss')
        req_meterics = request.data.get('meterics')
        req_optimizer = request.data.get('optimizer')
        req_optimizerLr = request.data.get('optimizerLr')
        req_modelID = request.data.get('modelID')
        req_indexColumn = request.data.get('indexColumn')
        req_dataSize = request.data.get('dataSize')
        
        req_targetColList = request.data.get('trgt_col_list')
        '''
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
        '''

        filePath = req_filePath
        #filename = ('201901_201912유동인구.csv' if req_filename==None else req_filename)
        fileName = ('test_data_201901_201902_imputer.csv' if req_fileName==None else req_fileName)        
        targetFileName = ('test_data_201901_201902.csv' if req_targetFileName==None else req_targetFileName)
        modelFilePath = req_modelFilePath
        modelFileName = ('ID_2023.h5' if req_modelFileName==None else req_modelFileName)
        outputs = (['w60'] if req_outputs==None else req_outputs)
        #outputs = (['LRAIN'] if req_outputs==None else req_outputs)
        #features = (['w20'] if req_features==None else req_features)
        features = ([] if req_features==None else req_features)
        #modelType = ('lstm' if req_modelType==None else req_modelType)
        modelType = ('seg_rnn' if req_modelType==None else req_modelType)
        windowSize = (8 if req_windowSize==None else req_windowSize)
        batchSize = (16 if req_batchSize==None else req_batchSize)
        testSize = (0.2 if req_testSize==None else req_testSize)
        epochs = (10 if req_epochs==None else req_epochs)
        loss = ('hub' if req_loss==None else req_loss)
        #loss = ('mse' if req_loss==None else req_loss)
        #meterics = ('mse' if req_meterics==None else req_meterics)
        meterics = ('mae' if req_meterics==None else req_meterics)
        optimizer = ('adam' if req_optimizer==None else req_optimizer)
        #optimizer = ('sgd' if req_optimizer==None else req_optimizer)
        optimizerLr = (0.0005 if req_optimizerLr==None else req_optimizerLr)
        modelID = (9999 if req_modelID==None else req_modelID)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)
        dataSize = (100 if req_dataSize==None else req_dataSize)
        targetColList = (['w60'] if req_features==None else req_targetColList)


        data = self.service.createModelGenerater(
            filePath=filePath, fileName=fileName, targetFileName=targetFileName, modelFilePath=modelFilePath, modelFileName=modelFileName, outputs=outputs, features=features, modelType=modelType, 
            windowSize=windowSize, batchSize=batchSize, testSize=testSize, epochs=epochs, loss=loss, meterics=meterics, optimizer=optimizer, optimizerLr=optimizerLr,
            modelID=modelID, indexColumn=indexColumn, dataSize=dataSize, targetColList=targetColList
        )
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())
    

    @action(detail=False, methods=['POST', 'GET'])
    def createDataGenerater(self, request):
        '''
        RNN 학습모델에서 데이터 생성
        '''
        req_modelFilePath = request.data.get('modelFilePath')
        req_modelFileName = request.data.get('modelFileName')
        req_testFilePath = request.data.get('testFilePath')
        req_testFileName = request.data.get('testFileName')
        req_outputs = request.data.get('outputs')
        req_features = request.data.get('features')
        req_windowSize = request.data.get('windowSize')
        req_batchSize = request.data.get('batchSize')
        req_modelID = request.data.get('modelID')
        req_indexColumn = request.data.get('indexColumn')
        
        modelFilePath = req_modelFilePath
        modelFileName = ('ID_2023.h5' if req_modelFileName==None else req_modelFileName)        
        testFilePath = req_testFilePath
        testFileName = ('test_data_201901_201902_imputer.csv' if req_testFileName==None else req_testFileName)        
        outputs = (['w60'] if req_outputs==None else req_outputs)
        features = ([] if req_features==None else req_features)
        windowSize = (8 if req_windowSize==None else req_windowSize)
        batchSize = (16 if req_batchSize==None else req_batchSize)
        modelID = (9999 if req_modelID==None else req_modelID)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)

        data = self.service.createDataGenerater(
            modelFilePath=modelFilePath, modelFileName=modelFileName, testFilePath=testFilePath, testFileName=testFileName, outputs=outputs, features=features,
            windowSize=windowSize, batchSize=batchSize, modelID=modelID, indexColumn=indexColumn
        )
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())      