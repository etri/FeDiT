#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.vrfcService import vrfcService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json

class vrfcViewSet(viewsets.ViewSet):
    '''
    VRFC View class
    ---
    데이터검증 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = vrfcService()
    
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
    def vrfcList(self, request):
        '''
        데이터검증 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'vrfc_tp': 'DT'
            }
        
        data = self.service.vrfcList(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.VRFC.value + '-0001' , message='VRFC List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def vrfcRegistration(self, request):
        '''
        데이터검증 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "vrfc_tp": 'DT',
                "vrfc_nm": '실수형 검증1',
                "rule_value_1": 'float',
                "rule_value_2": '1.0',
                "rule_value_3": '10.0',
                "rule_value_4": '1111',
                "ordby": 1,
                "use_yn": "Y",
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            }

        data = self.service.vrfcRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.VRFC.value + '-0002' , message='VRFC Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def vrfcUpdate(self, request):
        '''
        데이터검증 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "vrfc_seq": 6,
                "vrfc_tp": 'DT',
                "vrfc_nm": '실수형 검증2',
                "rule_value_1": 'float1',
                "rule_value_2": '1.01',
                "rule_value_3": '10.01',
                "rule_value_4": '2222',
                "ordby": 1,
                "use_yn": "Y",
                "mdfcn_user_seq": 2,
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.vrfcUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.VRFC.value + '-0003' , message='VRFC Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def vrfcRemove(self, request):
        '''
        데이터검증 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "vrfc_seq": 6,
                "del_user_seq": 1,
                "del_ip": "0.0.0.0"                
            }

        data = self.service.vrfcRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.VRFC.value + '-0004' , message='VRFC Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    