#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.metaAugmentService import augmentService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json
import os

class augmentViewSet(viewsets.ViewSet):
    '''
    Augment View class
    ---
    데이터증강 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = augmentService()
    
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
    def augmentCreate(self, request):
        '''
        학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
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
            '''
            '''
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
            '''

            #모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_file_name": "1_sample_2020a_2022a_w8.h5",
                "model_use_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_use_file_name": "1_sample_2020a_2022a_not_all.csv",
                "test_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "test_file_name": "1_sample_2020a_2022a_test.csv",
                "output_file": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test\\1_sample_2020a_2022a_test_augment.csv",
                "outputs": ["w00","w10","w20","w30","w40","w50","w60"],
                "features": [],
                "window_size": 24,
                "batch_size": 16,
                "model_id": 9999,
                "index_column": "yyyymmdd",
                "use_model_yn": "Y",
                "real_time_yn": "N",
                "date_term_tp": "hours",
                "date_term_value": 3,
                "resmpl_intvl_tp": "hours",
                "resmpl_intvl_value": 1
            }

        if paramData['use_model_yn'] == 'Y':
            if paramData['real_time_yn'] == 'N':
                test_file_set = self.service.calcModelTestDataTargetDate(paramData=paramData)
                file_path = test_file_set['resultMessage']
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData['test_file_path'] = directory
                paramData['test_file_name'] = filename
            
        data = self.service.augmentCreate(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Error', detail=data['resultMessage'])
        return Response(rd.getJson())      
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_repeat(self, request):
        '''
        학습모델 활용 데이터 추론 생성(반복)
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
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
            '''
            '''
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
            '''

            #모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_file_name": "1_sample_2020a_2022a_w8.h5",
                "model_use_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_use_file_name": "1_sample_2020a_2022a_not_all.csv",
                "test_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "test_file_name": "1_sample_2020a_2022a_test.csv",
                "output_file": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test\\1_sample_2020a_2022a_test_augment.csv",
                "outputs": ["w00","w10","w20","w30","w40","w50","w60"],
                "features": [],
                "window_size": 24,
                "batch_size": 16,
                "model_id": 9999,
                "index_column": "yyyymmdd",
                "use_model_yn": "Y",
                "real_time_yn": "N",
                "date_term_tp": "hours",
                "date_term_value": 3,
                "resmpl_intvl_tp": "hours",
                "resmpl_intvl_value": 1
            }

        if paramData['use_model_yn'] == 'Y':
            if paramData['real_time_yn'] == 'N':
                test_file_set = self.service.calcModelTestDataTargetDate(paramData=paramData)
                file_path = test_file_set['resultMessage']
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData['test_file_path'] = directory
                paramData['test_file_name'] = filename
            
        data = self.service.augmentCreate_repeat(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create repeat Error', detail=data['resultMessage'])
        return Response(rd.getJson())    


    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_interpolation(self, request):
        '''
        학습모델 활용 데이터 추론 생성(입력 데이터 추론 보간 기능 추가)
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
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
            '''
            '''
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
            '''

            #모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_use_file_path" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\",
                "model_use_file_name" : "200_153_admin_20240827125704_interval.csv",
                "test_file_path" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\",
                "test_file_name" : "200_153_admin_20240827125704_interval_simulation_target.csv",
                "model_file_path" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\model\\2024\\08\\153\\",
                "model_file_name" : "MODEL_153_20240827123022999.h5",
                "output_file_name" : "200_153_admin_20240827125704_interval_augment.csv",
                "output_file" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\200_153_admin_20240827125704_interval_augment.csv",
                "original_file" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\200_153_admin_20240827125704_interval_ori.csv",
                "features" : ["RAIN5", "RAIN6", "RAIN7", "LEVEL32"],
                "outputs" : ["ALERT"],
                "use_model_yn" : "Y",
                "real_time_yn" : "N",
                "target_start_date" : "2024-08-26 23:59:50",
                "target_last_date" : "2024-08-27 12:57:04",
                "batch_size" : 16,
                "count" : 4661,
                "model_id" : 153,
                "index_column" : "rowtime",
                "window_size" : 10,
                "trgt_col_list" : "",
                "resmpl_intvl_tp" : "seconds",
                "resmpl_intvl_value" : 10
            }

            
        data = self.service.augmentCreate_interpolation(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Interpolation Error', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_deepAR(self, request):
        '''
        학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
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
            '''
            '''
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
            '''

            #모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_file_name": "1_sample_2020a_2022a_w8.h5",
                "model_use_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "model_use_file_name": "1_sample_2020a_2022a_not_all.csv",
                "test_file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test",
                "test_file_name": "1_sample_2020a_2022a_test.csv",
                "output_file": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999\\augment_sample_test\\1_sample_2020a_2022a_test_augment.csv",
                "outputs": ["w00","w10","w20","w30","w40","w50","w60"],
                "features": [],
                "window_size": 24,
                "batch_size": 16,
                "model_id": 9999,
                "index_column": "yyyymmdd",
                "use_model_yn": "Y",
                "real_time_yn": "N",
                "date_term_tp": "hours",
                "date_term_value": 3,
                "resmpl_intvl_tp": "hours",
                "resmpl_intvl_value": 1
            }

        if paramData['use_model_yn'] == 'Y':
            if paramData['real_time_yn'] == 'N':
                test_file_set = self.service.calcModelTestDataTargetDate(paramData=paramData)
                file_path = test_file_set['resultMessage']
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData['test_file_path'] = directory
                paramData['test_file_name'] = filename
            
        data = self.service.augmentCreate_deepAR(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Error', detail=data['resultMessage'])
        return Response(rd.getJson())      
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_deepAR_interpolation(self, request):
        '''
        학습모델 활용 데이터 추론 생성(입력 데이터 추론 보간 기능 추가)
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
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
            '''
            '''
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
            '''

            #모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_use_file_path" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\",
                "model_use_file_name" : "200_153_admin_20240827125704_interval.csv",
                "test_file_path" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\",
                "test_file_name" : "200_153_admin_20240827125704_interval_simulation_target.csv",
                "model_file_path" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\model\\2024\\08\\153\\",
                "model_file_name" : "MODEL_153_20240827123022999.h5",
                "output_file_name" : "200_153_admin_20240827125704_interval_augment.csv",
                "output_file" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\200_153_admin_20240827125704_interval_augment.csv",
                "original_file" : "D:\\DT_FILE_TMP\\DT_META_FILE\\files\\storage\\augment\\2024\\08\\200\\200_153_admin_20240827125704_interval_ori.csv",
                "features" : ["RAIN5", "RAIN6", "RAIN7", "LEVEL32"],
                "outputs" : ["ALERT"],
                "use_model_yn" : "Y",
                "real_time_yn" : "N",
                "target_start_date" : "2024-08-26 23:59:50",
                "target_last_date" : "2024-08-27 12:57:04",
                "batch_size" : 16,
                "count" : 4661,
                "model_id" : 153,
                "index_column" : "rowtime",
                "window_size" : 10,
                "trgt_col_list" : "",
                "resmpl_intvl_tp" : "seconds",
                "resmpl_intvl_value" : 10
            }

            
        data = self.service.augmentCreate_deepAR_interpolation(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create DeepAR Interpolation Error', detail=data['resultMessage'])
        return Response(rd.getJson())        

    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_randomForest(self, request):
        '''
        학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            '''
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
            '''
            '''
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
            '''

            #모델, 입력:기간지정, 실시간:X
            paramData = {
                "model_file_path" : "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\",
                "model_file_name" : "MODEL_RF_20240904154156966.plk",        
                "model_use_file_path" : "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\",
                "model_use_file_name" : "24_2차입식_데이터합본_수정_0612_4.csv",    
                "output_file" : "D:\\PythonProject\\dt-data-api\\dt_data_api\\data\\24_2차입식_데이터합본_수정_0612_4_interval_augment.csv",
                "output_file_name" : "24_2차입식_데이터합본_수정_0612_4_augment.csv",
                "outputs" : ["MET"],
                "features" : ["temp","RH","CO2","AMM","Temp_Out","RH_Out","Solar"],
                "model_id" : 153,
                "index_column" : "time",
                "trgt_col_list" : ""
            }

            
        data = self.service.augmentCreate_randomForest(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Error', detail=data['resultMessage'])
        return Response(rd.getJson())    

    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_arima(self, request):
        '''
        ARIMA 학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        
            
        data = self.service.augmentCreate_arima(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Error', detail=data['resultMessage'])
        return Response(rd.getJson())  
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_arima2(self, request):
        '''
        학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        

        if paramData['use_model_yn'] == 'Y':
            if paramData['real_time_yn'] == 'N':
                test_file_set = self.service.calcModelTestDataTargetDate(paramData=paramData)
                file_path = test_file_set['resultMessage']
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData['test_file_path'] = directory
                paramData['test_file_name'] = filename
            
        data = self.service.augmentCreate_arima2(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Error', detail=data['resultMessage'])
        return Response(rd.getJson())          
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_arima_interpolation(self, request):
        '''
        학습모델 활용 데이터 추론 생성(입력 데이터 추론 보간 기능 추가)
        '''
        paramData = request.data        

            
        data = self.service.augmentCreate_arima_interpolation(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create Interpolation Error', detail=data['resultMessage'])
        return Response(rd.getJson())        
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_brits(self, request):
        '''
        brits 학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        

        data = self.service.augmentCreate_brits(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_brits_ori(self, request):
        '''
        brits 학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        
            
        data = self.service.augmentCreate_brits_ori(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_nbeats(self, request):
        '''
        학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        

        if paramData['use_model_yn'] == 'Y':
            if paramData['real_time_yn'] == 'N':
                test_file_set = self.service.calcModelTestDataTargetDate(paramData=paramData)
                file_path = test_file_set['resultMessage']
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData['test_file_path'] = directory
                paramData['test_file_name'] = filename
            
        data = self.service.augmentCreate_nbeats(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create nbeats Error', detail=data['resultMessage'])
        return Response(rd.getJson())    

    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_nbeats_interpolation(self, request):
        '''
        학습모델 활용 데이터 추론 생성(입력 데이터 추론 보간 기능 추가)
        '''
        paramData = request.data        
           
        data = self.service.augmentCreate_nbeats_interpolation(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0006' , message='Augment Create nbeats Interpolation Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
        
    @action(detail=False, methods=['POST', 'GET'])
    def augmentCreate_naomi(self, request):
        '''
        naomi 학습모델 활용 데이터 추론 생성
        '''
        paramData = request.data        
            
        data = self.service.augmentCreate_naomi(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    