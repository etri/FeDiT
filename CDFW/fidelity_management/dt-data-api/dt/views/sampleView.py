from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework.decorators import action
from rest_framework import viewsets, status
from dt.models.responseData import responseData
from dt.serializers.sampleSerializer import sampleSerializer
from dt.models.sampleModel import sampleModel
from dt.services.sampleService import sampleService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser

class sampleViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    service = sampleService()


    def list(self, request, pk=None):
        data = sampleService.List(request)
        
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 

        #return Response(responseData(code=status.HTTP_200_OK, message='OK', data=obj).getJson())

    def create(self, request):
        '''
        {
            "sample_id" : "id01",
            "sample_name" : "아이디01",
            "sample_bgng_ymd" : "20230101",
            "sample_end_ymd" : "20231231",
            "sample_status" : "F"
        }
        '''
        data = sampleService.Save(request.data)
        if data['result']:
            return Response(responseData(code=status.HTTP_201_CREATED, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 
    
    
    '''
    def retrieve(self, request, pk=None):
        #print("aaaaaaa")
        data = sampleService.getRowDataCount(pk)
        if int(data) > 0:
            model = sampleModel.objects.get(sample_seq=pk)
            serializer = sampleSerializer(model)
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=serializer.data).getJson()) 
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', data=[]).getJson()) 
    '''

    def retrieve(self, request, pk=None):
        data = sampleService.View(pk)

        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 

    def update(self, request, pk=None):
        data = sampleService.Update(pk, request.data)
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 

    '''
    def update(self, request, pk=None):
        data = sampleService.getRowDataCount(pk)
   
        if int(data) == 0:
            pk = 0

        data = sampleService.Update(pk, request.data)
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 
    '''

    def destroy(self, request, pk=None):
        data = sampleService.getRowDataCount(pk)
   
        if int(data) == 0:
            pk = 0

        data = sampleService.Delete(pk)
        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 
   
    '''
    @action(detail=False, methods=['GET'])
    def list_query_sample(self, request):
        data = sampleService.getQueryList(request)

        if data['result']:
            return Response(responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage']).getJson())
        return Response(responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'], data=[]).getJson()) 
    ''' 

    @action(detail=False, methods=['GET'])
    def list_query_sample(self, request):
        data = self.service.getQueryList(request)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())    

    @action(detail=False, methods=['GET','POST'])
    def update_query_sample(self, request):

        data = self.service.updateQuery(request.data)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson()) 

    @action(detail=False, methods=['GET','POST'])
    def delete_query_sample(self, request):
        #print(request.data)
        data = self.service.deleteQuery(request.data)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())
    
    @action(detail=False, methods=['POST', 'GET'])
    def LinearRegression(self, request):
        
        data = self.service.SetLinearRegression()

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())
