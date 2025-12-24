#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.unitService import unitService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json

class unitViewSet(viewsets.ViewSet):
    '''
    Unit View class
    ---
    단위변환 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = unitService()
    
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
    def unitList(self, request):
        '''
        단위변환 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'unit_tp': 'UNIT_TMPT'
            }
        
        data = self.service.unitList(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.UNIT.value + '-0001' , message='Unit List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def unitRegistration(self, request):
        '''
        단위변환 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "unit_tp": 'UNIT_TMPT',
                "unit_nm_1": '화씨온도1',
                "unit_cd_1": 'FT',
                "unit_nm_2": '섭씨온도1',
                "unit_cd_2": 'CT',
                "unit_formula": '({0} - 32)  * 5.0 / 9.0 111111',
                "formula_derpn": '화씨->섭씨1 변환',
                "ordby": 1,
                "use_yn": "Y",
                "reg_user_seq": "1",
                "reg_ip": "0.0.0.0"
            }

        data = self.service.unitRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.UNIT.value + '-0002' , message='Unit Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def unitUpdate(self, request):
        '''
        단위변환 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "unit_seq": 17,
                "unit_tp": 'UNIT_TMPT',
                "unit_nm_1": '화씨온도1',
                "unit_cd_1": 'FT',
                "unit_nm_2": '섭씨온도1',
                "unit_cd_2": 'CT',
                "unit_formula": '({0} - 32)  * 5.0 / 9.0 111111',
                "formula_derpn": '화씨->섭씨1 변환',
                "ordby": 1,
                "use_yn": "Y",
                "mdfcn_user_seq": "2",
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.unitUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.UNIT.value + '-0003' , message='Unit Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def unitRemove(self, request):
        '''
        단위변환 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "unit_seq": 17,
                "del_user_seq": 1,
                "del_ip": "0.0.0.0"                
            }

        data = self.service.unitRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.UNIT.value + '-0004' , message='Unit Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    