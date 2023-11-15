#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.codeService import codeService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)
#import json

class codeViewSet(viewsets.ViewSet):
    '''
    Code View class
    ---
    코드관리 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = codeService()
    
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
    def codeMstList(self, request):
        '''
        메인코드 목록
        '''        
        data = self.service.codeMstList()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0001' , message='Code Mst List Error', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def codeMstRegistration(self, request):
        '''
        메인코드 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": 'DT',
                "grp_cd_nm": '실수형 검증1',
                "rmrk": 'float',
                "ordby": 1,
                "use_yn": "Y",
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            }

        data = self.service.codeMstRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0002' , message='Code Mst Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeMstUpdate(self, request):
        '''
        메인코드 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": 'DT',
                "grp_cd_nm": '실수형 검증1',
                "rmrk": 'float',
                "ordby": 1,
                "use_yn": "Y",
                "mdfcn_user_seq": 2,
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.codeMstUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0003' , message='Code Mst Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeMstRemove(self, request):
        '''
        메인코드 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": "DT",
                "del_user_seq": 1,
                "del_ip": "0.0.0.0"                
            }

        data = self.service.codeMstRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0004' , message='Code Mst Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeMstExist(self, request):
        '''
        메인코드 확인
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": "DT"
            }

        data = self.service.codeMstExist(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0005' , message='Code Mst Exist Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeDtlList(self, request):
        '''
        세부코드 목록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                'grp_cd': 'TESTTEST'
            }
        
        data = self.service.codeDtlList(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0006' , message='Code Detail List Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeDtlRegistration(self, request):
        '''
        세부코드 등록
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": 'TESTTEST',
                "dtl_cd": 'SSSSSSS 111',
                "dtl_cd_nm": 'eeeeeeee 111',
                "rmrk": 'test',
                "ref_cd": '1',
                "ref_class": '2',
                "ref_value": '3',
                "ordby": 1,
                "use_yn": "Y",
                "reg_user_seq": 1,
                "reg_ip": "0.0.0.0"
            }

        data = self.service.codeDtlRegistration(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0007' , message='Code Detail Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeDtlUpdate(self, request):
        '''
        세부코드 수정
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": 'TESTTEST',
                "dtl_cd": 'SSSSSSS 222',
                "dtl_cd_nm": 'eeeeeeee 333',
                "rmrk": 'tes 111',
                "ref_cd": '12',
                "ref_class": '23',
                "ref_value": '34',
                "ordby": 1,
                "use_yn": "Y",
                "mdfcn_user_seq": 2,
                "mdfcn_ip": "0.0.0.0"
            }
        
        data = self.service.codeDtlUpdate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0008' , message='Code Detail Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeDtlRemove(self, request):
        '''
        세부코드 삭제
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": "TESTTEST",
                "dtl_cd": "SSSSSSS 111",
                "del_user_seq": 1,
                "del_ip": "0.0.0.0"                
            }

        data = self.service.codeDtlRemove(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0009' , message='Code Detail Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 
    
    @action(detail=False, methods=['POST', 'GET'])
    def codeDtlExist(self, request):
        '''
        세부코드 확인
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "grp_cd": "TESTTEST",
                "dtl_cd": "SSSSSSS 111"                
            }

        data = self.service.codeDtlExist(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.CODE.value + '-0010' , message='Code Detail Exist Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 