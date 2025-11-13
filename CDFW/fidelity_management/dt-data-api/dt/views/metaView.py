from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
#from dt_api.serializers import PersonSerializer, SpeciesSerializer, TestSerializer, Test1Serializer
#from dt_api.models import Person, Species, Test
from django.http import HttpResponse, JsonResponse
from django.db import connections

class metaViewSet(viewsets.ViewSet):
    """
    dtViewSet    
    """

    def list(self, request):
        print("list")
        return Response("list ok", status=200)
        pass

    def create(self, request):
        print("create")
        return Response("create ok", status=200)
        pass

    def retrieve(self, request, pk=None):
        print("retrieve")
        return Response("retrieve ok", status=200)
        pass

    def update(self, request, pk=None):
        print("update")
        return Response("update ok", status=200)
        pass

    def partial_update(self, request, pk=None):
        print("partial_update")
        return Response("partial_update ok", status=200)
        pass

    def destroy(self, request, pk=None):
        print("destroy")
        return Response("destroy ok", status=200)
        pass

    @action(detail=False, methods=['GET'])
    def aaaa(self, request):
        print("aaaa")
        return Response("aaaa ok", status=200)
    
    @action(detail=False, methods=['GET'])
    def getList(self, request):
        print("bbbb")
        return Response("bbbb ok", status=200)
    
    @action(detail=False, methods=['POST'])
    def setDT(self, request):
        print("bbbb")
        return Response("bbbb ok", status=200)