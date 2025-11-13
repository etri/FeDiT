#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.augmentService import augmentService
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
    def augmentList(self, request):
        '''
        증강데이터 설정 목록
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

        data = self.service.augmentList(paramData=paramData, pageParam=pageParam)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0001' , message='Augment List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def augmentRegistration(self, request):
        '''
        증강데이터 설정 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "title": 'test',
                "derpn": 'test desc',
                "pprcs_seq": 1,
                "model_seq": 1,
                "augment_tp": 'R',
                "data_tp": 'D',
                "augment_crt_bgng": '2023-06-01',
                "augment_crt_end": '2023-06-30',
                "data_crt_intvl_tp": 'H',
                "data_crt_intvl_value": 1,
                "augment_status": 'R',
                "rls_yn": "N",
                "reg_user_seq": "1",
                "reg_ip": "0.0.0.0"
            }

        data = self.service.augmentRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0002' , message='Augment Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentUpdate(self, request):
        '''
        증강데이터 설정 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "augment_seq": 2,
                "title": 'test1',
                "derpn": 'test desc1',
                "pprcs_seq": 1,
                "model_seq": 1,
                "augment_tp": 'R',
                "data_tp": 'D',
                "augment_crt_bgng": '2023-06-01',
                "augment_crt_end": '2023-06-30',
                "data_crt_intvl_tp": 'H',
                "data_crt_intvl_value": 1,
                "rls_yn": "N",
                "use_yn": "Y",
                "mdfcn_user_seq": "2",
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.augmentUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0003' , message='Augment Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentRemove(self, request):
        '''
        증강데이터 설정 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "augment_seq": "1",
                "del_user_seq": "1",
                "del_ip": "0.0.0.0"                
            }

        data = self.service.augmentRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0004' , message='Augment Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def augmentStatus(self, request):
        '''
        증강데이터 상태 조회
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "augment_seq": "1"                
            }

        data = self.service.augmentStatus(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUGMENT.value + '-0005' , message='Augment Status Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 

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