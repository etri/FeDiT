#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connections
from dt.models.responseData import responseData
from dt.services.processorService import processorService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
#import json

class processorViewSet(viewsets.ViewSet):
    '''
    processor class
    ---
    전처리 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = processorService()
    
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
    def fillNa_Fill(self, request):
        '''
        결측값을 정해진 값으로 채우기
        '''
        data = self.service.SetDataFill()
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())        
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson())       
    
    @action(detail=False, methods=['POST', 'GET'])
    def interpolation_Create(self, request):
        '''
        결측값을 보간법으로 채우기
        '''
        data = self.service.SetDataInterpolation()
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson())       
    
    @action(detail=False, methods=['POST', 'GET'])
    def resample_Create(self, request):
        '''
        데이터 리샘플링 추출
        '''
        data = self.service.SetDataResample()
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson())       
    
    @action(detail=False, methods=['POST', 'GET'])
    def regression_Create(self, request):
        '''
        선형회귀 결측값 보간
        '''
        item = ('m60' if request.data.get('item')==None else request.data.get('item'))
        data = self.service.SetDataRegression(item)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())       

    @action(detail=False, methods=['POST', 'GET'])
    def imputationGAIN_create(self, request):
        '''
        GAIN 결측 보간
        '''
        data = self.service.createLearningImputationGAN()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())  
    
    @action(detail=False, methods=['POST', 'GET'])
    def imputationSimple_create(self, request):
        '''
        sklearn SimpleImputer 결측 보간
        '''
        data = self.service.createImputationSimple()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())  
    
    @action(detail=False, methods=['POST', 'GET'])
    def imputationKNN_create(self, request):
        '''
        sklearn KNNImputer 결측 보간
        '''
        data = self.service.createImputationKNN()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())  
    
    @action(detail=False, methods=['POST', 'GET'])
    def imputationIterative_create(self, request):
        '''
        sklearn IterativeImputer 결측 보간
        '''
        data = self.service.createImputationIterative()
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())  

    @action(detail=False, methods=['POST', 'GET'])
    def datasetInfo(self, request):
        '''
        데이터셋 데이터정보
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_indexColumn = request.data.get('indexColumn')

        filePath = req_filePath
        fileName = ('test_data_201901_201902_1.csv' if req_fileName==None else req_fileName)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)        
        data = self.service.datasetInfo(filePath=filePath, fileName=fileName, indexColumn=indexColumn)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def datasetHist(self, request):
        '''
        데이터셋 히스토그램
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('filePame')
        req_column = request.data.get('column')
        req_indexColumn = request.data.get('indexColumn')
        
        filePath = req_filePath
        fileName = ('test_data_201901_201902_1.csv' if req_fileName==None else req_fileName)
        column = ('w60' if req_column==None else req_column)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)
        data = self.service.datasetHist(filePath=filePath, fileName=fileName, column=column, indexColumn=indexColumn)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def datasetInterpolate(self, request):
        '''
        데이터셋 결측 보완
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_targetFileName = request.data.get('targetFileName')
        req_method = request.data.get('method')
        req_indexColumn = request.data.get('indexColumn')

        filePath = req_filePath
        fileName = ('test_data_201901_201902.csv' if req_fileName==None else req_fileName)
        targetFileName = ('test_data_201901_201902_imputer.csv' if req_targetFileName==None else req_targetFileName)
        method = ('spline' if req_method==None else req_method)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)

        data = self.service.datasetInterpolate(filePath=filePath, fileName=fileName, targetFileName=targetFileName, method=method, indexColumn=indexColumn)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson()) 

    @action(detail=False, methods=['POST', 'GET'])
    def datasetResample(self, request):
        '''
        데이터셋 샘플링
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_targetFileName = request.data.get('targetFileName')
        req_method = request.data.get('method')
        req_timeRule = request.data.get('timeRule')
        req_indexColumn = request.data.get('indexColumn')

        filePath = req_filePath
        fileName = ('test_data_201901_201902_imputer.csv' if req_fileName==None else req_fileName)
        targetFileName = ('test_data_201901_201902_resample.csv' if req_targetFileName==None else req_targetFileName)
        method = ('spline' if req_method==None else req_method)
        timeRule = ('1T' if req_timeRule==None else req_timeRule)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)

        data = self.service.datasetResample(filePath=filePath, fileName=fileName, targetFileName=targetFileName, method=method, timeRule=timeRule, indexColumn=indexColumn)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())   
    
    @action(detail=False, methods=['POST', 'GET'])
    def datasetCorrelation(self, request):
        '''
        데이터셋 상관관계
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_columns = request.data.get('columns')
        req_indexColumn = request.data.get('indexColumn')
        

        filePath = req_filePath
        fileName = ('기상청_신사동_2021_2.csv' if req_fileName==None else req_fileName)
        columns = (['ondo','gangsulyang','gangsutype','punghyang','pungsok','sbdo'] if req_columns==None else req_columns)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)
        
        data = self.service.datasetCorrelation(filePath=filePath, fileName=fileName, columns=columns, indexColumn=indexColumn)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    

    @action(detail=False, methods=['POST', 'GET'])
    def datasetUnitConverter(self, request):
        '''
        데이터셋 단위변환
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_targetFileName = request.data.get('targetFileName')
        req_unitColumn = request.data.get('unitColumn')
        req_unitFormula = request.data.get('unitFormula')
        req_indexColumn = request.data.get('indexColumn')

        filePath = req_filePath
        fileName = ('test_data_201901_201902_resample.csv' if req_fileName==None else req_fileName)
        targetFileName = ('test_data_201901_201902_unit.csv' if req_targetFileName==None else req_targetFileName)        
        unitColumn = ('w60' if req_unitColumn==None else req_unitColumn)
        unitFormula = ('{0} * 9.0 / 5.0 + 32.0' if req_unitFormula==None else req_unitFormula)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)

        data = self.service.datasetUnitConverter(filePath=filePath, fileName=fileName, targetFileName=targetFileName, unitColumn=unitColumn, unitFormula=unitFormula, indexColumn=indexColumn)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def datasetVerify(self, request):
        '''
        데이터셋 검증
        '''
        req_filePath = request.data.get('filePath')
        req_fileName = request.data.get('fileName')
        req_targetFileName = request.data.get('targetFileName')
        req_verifyColumn = request.data.get('verifyColumn')
        req_verifyType = request.data.get('verifyType')
        req_rule1 = request.data.get('rule1')
        req_rule2 = request.data.get('rule2')
        req_rule3 = request.data.get('rule3')
        req_rule4 = request.data.get('rule4')
        req_isCreate = request.data.get('isCreate')
        req_clearType = request.data.get('clearType')
        req_indexColumn = request.data.get('indexColumn')
        
        filePath = req_filePath
        fileName = ('test_data_201901_201902_v1.csv' if req_fileName==None else req_fileName)
        targetFileName = ('test_data_201901_201902_verify.csv' if req_targetFileName==None else req_targetFileName)        
        verifyColumn = ('w60' if req_verifyColumn==None else req_verifyColumn)
        verifyType = ('RG' if req_verifyType==None else req_verifyType)
        rule1 = ('float' if req_rule1==None else req_rule1)
        rule2 = ('0.0' if req_rule2==None else req_rule2)
        rule3 = ('10.0' if req_rule3==None else req_rule3)
        rule4 = ('' if req_rule4==None else req_rule4)
        isCreate = ('Y' if req_isCreate==None else req_isCreate)
        clearType = ('O' if req_clearType==None else req_clearType)
        indexColumn = (0 if req_indexColumn==None else req_indexColumn)
        
        data = self.service.datasetVerify(
            filePath=filePath, fileName=fileName, targetFileName=targetFileName, verifyColumn=verifyColumn, verifyType=verifyType, 
            rule1=rule1, rule2=rule2, rule3=rule3, rule4=rule4, isCreate=isCreate, clearType=clearType, indexColumn=indexColumn
        )        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    