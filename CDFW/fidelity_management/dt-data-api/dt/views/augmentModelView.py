#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.augmentModelService import augmentModelService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json

class augmentModelViewSet(viewsets.ViewSet):
    '''
    Augment Model View class
    ---
    데이터증강 학습모델 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = augmentModelService()
    
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
    def modelList(self, request):
        '''
        학습모델 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'page': 1,
                'page_size': 10,
                'field': 'MODEL_SEQ',
                'keyword': '1',
                'sort_field': 'reg_dt',
                'sort_type': 'desc'
            }
            
        pageParam = {
            'page': paramData['page'], 
            'page_size': paramData['page_size']
        }

        data = self.service.modelList(paramData=paramData, pageParam=pageParam)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT_MODEL.value + '-0001' , message='Model List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def modelRegistration(self, request):
        '''
        학습모델 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "model_data": {
                    "pprcs_seq": "1",
                    "model_nm": "test",
                    "model_derpn": "test desc",
                    "model_algrm_seq": "1",
                    "learning_bgng_dt": "2023-06-01",
                    "learning_end_dt": "2023-06-30",
                    "rls_yn": "N",
                    "reg_user_seq": "1",
                    "reg_ip": "0.0.0.0"
                },
                "model_item": [
                    {
                        "model_col_tp": "OC",
                        "model_col_nm": "W60"
                    },
                    {
                        "model_col_tp": "FC",
                        "model_col_nm": "W50"
                    },                    
                ],
                "model_params": {
                    "model_algram_seq": "1",
                    "items": 
                    [
                        {
                            "model_params_item_seq": "1",
                            "model_params_item_value": "0.5"
                        },
                        {
                            "model_params_item_seq": "2",
                            "model_params_item_value": "0.6"
                        }
                    ]
                }
            }

        data = self.service.modelRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT_MODEL.value + '-0002' , message='Model Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def modelUpdate(self, request):
        '''
        학습모델 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "model_data": {
                    "model_seq": "2",
                    "pprcs_seq": "3",
                    "model_nm": "test1",
                    "model_derpn": "test desc1",
                    "model_algrm_seq": "1",
                    "learning_bgng_dt": "2023-06-02",
                    "learning_end_dt": "2023-06-29",
                    "rls_yn": "N",
                    "use_yn": "Y",
                    "mdfcn_user_seq": "2",
                    "mdfcn_ip": "0.0.0.0"
                },
                "model_item": [
                    {
                        "model_col_tp": "OC",
                        "model_col_nm": "M60"
                    },
                    {
                        "model_col_tp": "FC",
                        "model_col_nm": "M50"
                    },                    
                ],
                "model_params": {
                    "model_algram_seq": "1",
                    "items": 
                    [
                        {
                            "model_params_item_seq": "3",
                            "model_params_item_value": "0.8"
                        },
                        {
                            "model_params_item_seq": "4",
                            "model_params_item_value": "0.9"
                        }
                    ]
                }
            }

        data = self.service.modelUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT_MODEL.value + '-0003' , message='Model Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def modelRemove(self, request):
        '''
        학습모델 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "model_seq": "1",
                "del_user_seq": "1",
                "del_ip": "0.0.0.0"                
            }

        data = self.service.modelRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT_MODEL.value + '-0004' , message='Model Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def modelStatus(self, request):
        '''
        학습모델 상태 조회
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "model_seq": "1"                
            }

        data = self.service.modelStatus(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT_MODEL.value + '-0005' , message='Model Status Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 

    @action(detail=False, methods=['POST', 'GET'])
    def modelCreate(self, request):
        '''
        학습모델 생성
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
            paramData = {
                "file_path": None,
                "file_name": "test_data_201901_201902_imputer.csv",
                "target_file_name": "test_data_201901_201902.csv",
                "model_file_path": None,
                "model_file_name": "ID_2023.h5",
                "outputs": ["w40"],
                "features": [],
                "model_type": "lstm",
                "window_size": 8,
                "batch_size": 16,
                "test_size": 0.2,
                "epochs": 50,
                "loss": "hub",
                "meterics": "mse",
                "optimizer": "adam",
                "optimizer_lr": 0.0005,
                "model_id": 9999,
                "index_column": 0,
                "data_size": 100                
            }
            '''

            '''
            paramData = {
                "file_path": "Z:\\DT\\storage\\preprocess\\2023\\06\\9999\\augment_sample_test",
                "file_name": "origin_sample_7d.csv",
                "target_file_name": "test_data_201901_201902.csv",
                "model_file_path": "Z:\\DT\\storage\\preprocess\\2023\\06\\9999\\augment_sample_test",
                "model_file_name": "origin_sample_7d_w8.h5",
                "outputs": ["ondo","m10","m60","m30","w30","w20"],
                "features": [],
                "model_type": "lstm",
                "window_size": 8,
                "batch_size": 16,
                "test_size": 0.2,
                "epochs": 50,
                "loss": "hub",
                "meterics": "mse",
                "optimizer": "adam",
                "optimizer_lr": 0.0005,
                "model_id": 9999,
                "index_column": 0,
                "data_size": 100                
            }
            '''

            paramData = {
                "file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "file_name": "1_sample_2020a_2022h.csv",
                "target_file_name": "1_sample_2020a_2022h_test.csv",
                "model_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_file_name": "1_sample_2020a_2022h_w12.h5",
                "outputs": ["w00","w10","w20","w30","w40","w50","w60"],
                "features": [],
                "model_type": "lstm",
                "window_size": 12,
                "batch_size": 16,
                "test_size": 0.2,
                "epochs": 50,
                "loss": "hub",
                "meterics": "mse",
                "optimizer": "adam",
                "optimizer_lr": 0.0005,
                "model_id": 9999,
                "index_column": 0,
                "data_size": 100                
            }


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

        '''
        filePath = req_filePath
        #filename = ('201901_201912유동인구.csv' if req_filename==None else req_filename)
        fileName = ('test_data_201901_201902_imputer.csv' if req_fileName==None else req_fileName)        
        targetFileName = ('test_data_201901_201902.csv' if req_targetFileName==None else req_targetFileName)
        modelFilePath = req_modelFilePath
        modelFileName = ('ID_2023.h5' if req_modelFileName==None else req_modelFileName)
        outputs = (['w40'] if req_outputs==None else req_outputs)
        #outputs = (['LRAIN'] if req_outputs==None else req_outputs)
        #features = (['w20'] if req_features==None else req_features)
        features = ([] if req_features==None else req_features)
        modelType = ('lstm' if req_modelType==None else req_modelType)
        windowSize = (8 if req_windowSize==None else req_windowSize)
        batchSize = (16 if req_batchSize==None else req_batchSize)
        testSize = (0.2 if req_testSize==None else req_testSize)
        epochs = (50 if req_epochs==None else req_epochs)
        loss = ('hub' if req_loss==None else req_loss)
        meterics = ('mse' if req_meterics==None else req_meterics)
        optimizer = ('adam' if req_optimizer==None else req_optimizer)
        optimizerLr = (0.0005 if req_optimizerLr==None else req_optimizerLr)
        modelID = (9999 if req_modelID==None else req_modelID)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)
        dataSize = (100 if req_dataSize==None else req_dataSize)
        
        data = self.service.createModelGenerater(
            filePath=filePath, fileName=fileName, targetFileName=targetFileName, modelFilePath=modelFilePath, modelFileName=modelFileName, outputs=outputs, features=features, modelType=modelType, 
            windowSize=windowSize, batchSize=batchSize, testSize=testSize, epochs=epochs, loss=loss, meterics=meterics, optimizer=optimizer, optimizerLr=optimizerLr,
            modelID=modelID, indexColumn=indexColumn, dataSize=dataSize
        )
        '''

        data = self.service.modelCreate(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT_MODEL.value + '-0006' , message='Model Create Error', detail=data['resultMessage'])
        return Response(rd.getJson())
    