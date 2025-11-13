#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.userService import userService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json

class userViewSet(viewsets.ViewSet):
    '''
    User View class
    ---
    사용자 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = userService()
    
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
    def userList(self, request):
        '''
        사용자 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'page': 1,
                'page_size': 10,
                'field': 'USER_NM',
                'keyword': '관리자',
                'sort_field': 'reg_dt',
                'sort_type': 'desc'
            }
        
        pageParam = {
            'page': paramData['page'], 
            'page_size': paramData['page_size']
        }

        data = self.service.userList(paramData=paramData, pageParam=pageParam)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0001' , message='User List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def userRegistration(self, request):
        '''
        사용자 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "user_id": 'admin1',
                "user_pw": '$2a$10$kFifQKKHY11QRmchTN4XNu7oXtcB3hfJhs/wMCYLRHtia0rM6yBKm',
                "user_nm": '관리자1',
                "user_auth_cd": 'AU00',
                "uniq_idn_key": None,
                "user_eml": 'admin@stoneitgt.com',
                "user_birth_ymd": '19900302',
                "user_cont_1": '010',
                "user_cont_2": '1111',
                "user_cont_3": '2222',
                "user_hp_1": '010',
                "user_hp_2": '3333',
                "user_hp_3": '4444',
                "user_zip": '05020',
                "user_road_nm_addr": '서울 강남구',
                "user_lotno_addr": '신사동',
                "user_dtl_addr": '97',
                "tncnd_agre_yn": 'Y',
                "prvc_agre_yn": 'Y',
                "info_pvsn_agre_yn": 'Y',
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            }

        data = self.service.userRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0002' , message='User Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def userUpdate(self, request):
        '''
        사용자 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "user_seq": 15,
                "user_id": 'admin1',
                "user_pw": '$2a$10$kFifQKKHY11QRmchTN4XNu7oXtcB3hfJhs/wMCYLRHtia0rM6yBKm',
                "user_nm": '관리자1',
                "user_auth_cd": 'AU00',
                "uniq_idn_key": None,
                "user_eml": 'admin@stoneitgt.com',
                "user_birth_ymd": '19900302',
                "user_cont_1": '010',
                "user_cont_2": '1111',
                "user_cont_3": '2222',
                "user_hp_1": '010',
                "user_hp_2": '3333',
                "user_hp_3": '4444',
                "user_zip": '05020',
                "user_road_nm_addr": '서울 강남구',
                "user_lotno_addr": '신사동',
                "user_dtl_addr": '97',
                "tncnd_agre_yn": 'Y',
                "prvc_agre_yn": 'Y',
                "info_pvsn_agre_yn": 'Y',
                "use_yn": "Y",
                "mdfcn_user_seq": 2,
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.userUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0003' , message='User Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def userRemove(self, request):
        '''
        사용자 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "user_seq": 15,
                "user_id": "admin1",
                "del_user_seq": 1,
                "del_ip": "0.0.0.0"                
            }

        data = self.service.userRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0004' , message='User Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def userExist(self, request):
        '''
        사용자 확인
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "user_id": "admin1"
            }

        data = self.service.userExist(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0005' , message='User Exist Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 

    @action(detail=False, methods=['POST', 'GET'])
    def userLogin(self, request):
        '''
        사용자 로그인
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "user_id": "admin1"
            }

        data = self.service.userLogin(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0006' , message='User Login Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def userLastLoginUpdate(self, request):
        '''
        사용자 마지막 로그인 시간 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "user_id": "admin1"
            }

        data = self.service.userLastLoginUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.USER.value + '-0007' , message='User Last Login Update Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 