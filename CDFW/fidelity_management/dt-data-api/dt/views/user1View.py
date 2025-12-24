from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
#from dt_api.serializers import PersonSerializer, SpeciesSerializer, TestSerializer, Test1Serializer
#from dt_api.models import Person, Species, Test
from django.http import HttpResponse, JsonResponse
from django.db import connections

class User1View(APIView):
    '''
    API 테스트 입니다
    ---
    class 테스트
    '''

    """
    POST /user
    """
    def post(self, request):
        print("post")
        return Response("post ok", status=200)
 
    """
    GET /user
    GET /user/{user_id}
    """
    def get(self, request):
        print("get")
        return Response("get ok", status=200)
 
    """
    PUT /user/{user_id}
    """
    def put(self, request):
        print("put")
        #return JsonResponse("put ok", status=200)
        return Response("put ok", status=200)
 
    """
    DELETE /user/{user_id}
    """
    def delete(self, request):
        print("delete")
        return Response("delete ok", status=200)
    
    #@action(detail=False, methods=['GET'])
    @action(detail=False, methods=['GET'])
    def aaaa(self, request):
        print("list")
        return Response("list ok", status=200)