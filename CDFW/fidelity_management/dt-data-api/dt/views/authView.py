#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.authService import authService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)

#import json

class authViewSet(viewsets.ViewSet):
    '''
    Auth View class
    ---
    권한관리 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = authService()
    
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
    def authList(self, request):
        '''
        권한 목록
        '''
        data = self.service.authList()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUTH.value + '-0001' , message='Auth List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def authMenuList(self, request):
        '''
        메뉴권한 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'auth_cd': 'AU99'
            }
        
        data = self.service.authMenuList(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUTH.value + '-0002' , message='Auth Menu List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  
    
    @action(detail=False, methods=['POST', 'GET'])
    def authMenuRegistration(self, request):
        '''
        메뉴권한 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = [{
                "auth_cd": 'AU99',
                "menu_cd": 'M03',
                "inq_auth_yn": "Y",
                "wrt_auth_yn": "Y",
                "mdfcn_auth_yn": "Y",
                "del_auth_yn": "Y",
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            },
            {
                "auth_cd": 'AU99',
                "menu_cd": 'M99',
                "inq_auth_yn": "Y",
                "wrt_auth_yn": "Y",
                "mdfcn_auth_yn": "Y",
                "del_auth_yn": "Y",
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            }
            ]

        data = self.service.authMenuRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUTH.value + '-0003' , message='Auth Menu Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def authMenuRemove(self, request):
        '''
        메뉴권한 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "auth_cd": "AU99"
            }

        data = self.service.authMenuRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.AUTH.value + '-0004' , message='Auth Menu Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    