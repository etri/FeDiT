#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.menuService import menuService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json

class menuViewSet(viewsets.ViewSet):
    '''
    Menu View class
    ---
    메뉴관리 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = menuService()
    
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
    def menuList(self, request):
        '''
        메뉴 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'page': 1,
                'page_size': 10,
                'field': 'MENU_NM',
                'keyword': '코드관리',
                'sort_field': 'reg_dt',
                'sort_type': 'desc'
            }
        
        pageParam = {
            'page': paramData['page'], 
            'page_size': paramData['page_size']
        }

        data = self.service.menuList(paramData=paramData, pageParam=pageParam)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.MENU.value + '-0001' , message='Menu List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def menuRegistration(self, request):
        '''
        메뉴 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "menu_cd": 'M05',
                "menu_nm": '테스트',
                "up_menu_cd": 'TOP',
                "menu_url": None,
                "menu_icon": 'book',
                "menu_class": 'aa',
                "ordby": 1,
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            }

        data = self.service.menuRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.MENU.value + '-0002' , message='Menu Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def menuUpdate(self, request):
        '''
        메뉴 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "menu_cd": 'M05',
                "menu_nm": '테스트',
                "up_menu_cd": 'TOP',
                "menu_url": None,
                "menu_icon": 'book',
                "menu_class": 'aa',
                "ordby": 1,                
                "use_yn": "Y",
                "mdfcn_user_seq": 2,
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.menuUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.MENU.value + '-0003' , message='Menu Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def menuRemove(self, request):
        '''
        메뉴 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "menu_cd": "M05",
                "del_user_seq": 1,
                "del_ip": "0.0.0.0"                
            }

        data = self.service.menuRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.MENU.value + '-0004' , message='Menu Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def menuExist(self, request):
        '''
        메뉴 확인
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "menu_cd": "M05"
            }

        data = self.service.menuExist(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.MENU.value + '-0005' , message='Menu Exist Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    