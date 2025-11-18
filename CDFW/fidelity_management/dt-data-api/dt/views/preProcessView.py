#from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from dt.models.responseData import responseData
from dt.services.preProcessService import preProcessService
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from dt_data_api.common.lib import (
    ERROR_CODE
)

class preProcessViewSet(viewsets.ViewSet):
    '''
    processor class
    ---
    전처리 클래스
    '''
    #권한설정
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    #서비스 객체 생성
    service = preProcessService()

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
    def processorList(self, request):
        '''
        검증 값 설정 정보목록
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "page": 1,
                "page_size": 20,
                "field": "PPRCS_NM",
                "keyword": "aaaa",
                "sort_type": "desc",
                "sort_field": "reg_dt"
            }

        pageParam = {
            'page': paramData['page'], 
            'page_size': paramData['page_size']
        }

        data = self.service.processorList(paramData=paramData, pageParam=pageParam)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0001' , message='Processor List Error', detail=data['resultMessage'])
        return Response(rd.getJson())
    

    @action(detail=False, methods=['POST', 'GET'])
    def processorRegistration(self, request):
        '''
        검증 값 초기 설정 정보 등록
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "pprcs_set": {
                            "pprcs_nm": "aaaa",
                            "pprcs_derpn": "dddd",
                            "twin_tp": "DB",
                            "index_crtr_col" : "yyyymmdd",
                            "reg_user_seq" : 100
                },
                "pprcs_twin_set": [
                {
                    "twin_seq": 3,
                    "twin_tbl_nm" : "TB_TWIN_003",
                    "pprcs_trgt_col": "m10",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "Y"
                },
                {
                    "twin_seq": 3,
                    "twin_tbl_nm" : "TB_TWIN_003",
                    "pprcs_trgt_col": "m60",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "Y"
                },
                {
                    "twin_seq": 3,
                    "twin_tbl_nm" : "TB_TWIN_003",
                    "pprcs_trgt_col": "m30",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "Y"
                },      
                {
                    "twin_seq": 2,
                    "twin_tbl_nm" : "TB_TWIN_002",
                    "pprcs_trgt_col": "ondo",
                    "index_trgt_col": "date",
                    "index_crtr_yn": "N"
                },
                {
                    "twin_seq": 4,
                    "twin_tbl_nm" : "TB_TWIN_004",
                    "pprcs_trgt_col": "w30",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "N"
                },
                {
                    "twin_seq": 4,
                    "twin_tbl_nm" : "TB_TWIN_004",
                    "pprcs_trgt_col": "w20",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "N"
                }
                ]
            }

        data = self.service.processorRegistration(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0002' , message='Processor Registration Error', detail=data['resultMessage'])
        return Response(rd.getJson())


    @action(detail=False, methods=['POST', 'GET'])
    def processorUpdate(self, request):
        '''
        검증 값 초기 설정 정보 등록
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "pprcs_set": {
                            "pprcs_nm": "test9",
                            "pprcs_derpn": "test9",
                            "twin_tp": "DB",
                            "index_crtr_col" : "yyyymmdd",
                            "reg_user_seq" : 100,
                            "pprcs_seq" : 24
                },
                "pprcs_twin_set": [
                {
                    "twin_seq": 3,
                    "twin_tbl_nm" : "TB_TWIN_003",
                    "pprcs_trgt_col": "m10",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "Y"
                },
                {
                    "twin_seq": 3,
                    "twin_tbl_nm" : "TB_TWIN_003",
                    "pprcs_trgt_col": "m60",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "Y"
                },
                {
                    "twin_seq": 3,
                    "twin_tbl_nm" : "TB_TWIN_003",
                    "pprcs_trgt_col": "m30",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "Y"
                },      
                {
                    "twin_seq": 2,
                    "twin_tbl_nm" : "TB_TWIN_002",
                    "pprcs_trgt_col": "ondo",
                    "index_trgt_col": "date",
                    "index_crtr_yn": "N"
                },
                {
                    "twin_seq": 4,
                    "twin_tbl_nm" : "TB_TWIN_004",
                    "pprcs_trgt_col": "w30",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "N"
                },
                {
                    "twin_seq": 4,
                    "twin_tbl_nm" : "TB_TWIN_004",
                    "pprcs_trgt_col": "w20",
                    "index_trgt_col": "yyyymmdd",
                    "index_crtr_yn": "N"
                }
                ]
            }

        data = self.service.processorUpdate(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0003' , message='Processor Update Error', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def processorRemove(self, request):
        '''
        검증 값 삭제
        '''
        paramData = request.data
        client_ip = request.META.get('REMOTE_ADDR')

        #테스트용
        if not paramData:
            paramData = {
                "pprcs_seq": 2,
                "reg_user_seq" : 100
            }

        data = self.service.processorRemove(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0004' , message='Processor Remove Error', detail=data['resultMessage'])
        return Response(rd.getJson())


    @action(detail=False, methods=['POST', 'GET'])
    def processorStatus(self, request):
        '''
        검증 설정 조회
        '''
        paramData = request.data        

        #테스트용
        if not paramData:
            paramData = {
                "pprcs_seq": "1"                
            }

        data = self.service.processorStatus(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0005' , message='Processor Status Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 

    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetInfo(self, request):
        '''
        데이터셋 데이터정보
        '''
        paramData = request.data
        #테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_trgt_col": 0,
                "column": "w60"
            }

        data = self.service.processorDatasetInfo(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0006' , message='Processor Dataset Info Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
    
    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetInterpolate(self, request):
        '''
        데이터셋 결측 보완
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": 'Z:\\DT\\storage\\data\\2023\\06\\9999',
                "file_name": 'test_data_201901_201902_1.csv',
                "target_file_name": 'test_data_201901_201902_imputer.csv',
                "index_trgt_col": 'date',
                "interpl_tp": 'w30',
            }

        data = self.service.processorDatasetInterpolate(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0007' , message='Processor Dataset Interpolate Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 


    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetInterpolateKnn(self, request):
        '''
        데이터셋 결측 보완
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": 'Z:\\DT\\storage\\data\\2023\\06\\9999',
                "file_name": 'test_data_201901_201902_1.csv',
                "target_file_name": 'test_data_201901_201902_imputer.csv',
                "index_trgt_col": 'date',
                "interpl_tp": 'w30',
            }

        data = self.service.processorDatasetInterpolateKnn(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0007' , message='Processor Dataset Interpolate Error', detail=data['resultMessage'])
        return Response(rd.getJson()) 



    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetResample(self, request):
        '''
        데이터셋 샘플링
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": 'Z:\\DT\\storage\\preprocess\\2023\\06\\9999',
                "file_name": 'test.csv',
                "target_file_name": 'test_resample.csv',
                "index_trgt_col": 'date',
                "resmpl_tp": 'linear',
                "time_rule": '1D'
            }

        data = self.service.processorDatasetResample(paramData=paramData)        

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0008' , message='Processor Dataset Resample Error', detail=data['resultMessage'])
        return Response(rd.getJson())   

    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetUnitConverter(self, request):
        '''
        데이터셋 단위변환
        '''
        paramData = request.data
        
        #테스트용
        if not paramData:
            paramData = {
                "file_path": 'Z:\\DT\\storage\\data\\2023\\06\\9999',
                "file_name": 'test_data_201901_201902_resample.csv',
                "target_file_name": 'test_data_201901_201902_unit.csv',
                "index_trgt_col": 'date',
                "unit_trgt_col": 'w60',
                "unit_formula": '{0} * 9.0 / 5.0 + 32.0'
            }

        data = self.service.processorDatasetUnitConverter(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0009' , message='Processor Dataset Unit Converter Error', detail=data['resultMessage'])
        return Response(rd.getJson())    
    
    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetVerify(self, request):
        '''
        데이터셋 검증
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData =  {
                "file_path": 'Z:\\DT\\storage\\data\\2023\\06\\9999',
                "file_name": 'test_data_201901_201902_1.csv',
                "target_file_name": 'test_data_201901_201902_verify.csv',
                "index_trgt_col": 'date',
                "vrfc_tp": 'DT',
                "vrfc_trgt_col": 'm10',
                "vrfc_clear_type": 'I',
                "is_create": 'Y',
                "rule1": 'int',
                "rule2": None,
                "rule3": None,
                "rule4": None,
            }

        data = self.service.processorDatasetVerify(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0010' , message='Processor Dataset Verify Error', detail=data['resultMessage'])
        return Response(rd.getJson())    

    @action(detail=False, methods=['POST', 'GET'])
    def processorDataSetStepAll(self, request):
        '''
        검증 값 초기 설정 정보 등록
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData =  {
                "pprcs_seq": 1,
                "reg_user_seq": 4,
                "vrfc": [
                {
                    "vrfc_seq": 1,
                    "vrfc_tp": "DT",
                    "vrfc_trgt_col": "w30",
                    "vrfc_clear_type": "I",
                    "vrfc_order": 1
                },
                {
                    "vrfc_seq": 4,
                    "vrfc_tp": "DT",
                    "vrfc_trgt_col": "w20",
                    "vrfc_clear_type": "I",
                    "vrfc_order": 2
                }
                ],
                "interpolate1": [
                {
                    "interpl_tp": "LINEAR"
                }
                ],
                "resample1": [
                {
                    "resmpl_tp": "LINEAR",
                    "resmpl_intvl_tp": "T",
                    "resmpl_intvl_value": 3
                }
                ],
                "unit1": [
                {
                    "unit_seq": 1,
                    "unit_tp": "UNIT_TMPT",
                    "unit_trgt_col": "ondo",
                    "unit_order": 1
                },
                {
                    "unit_seq": 2,
                    "unit_tp": "UNIT_TMPT",
                    "unit_trgt_col": "m10",
                    "unit_order": 2
                }
                ]
            }

        data = self.service.processorDataSetStepAll(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0011' , message='Processor DataSet Step All Error', detail=data['resultMessage'])
        return Response(rd.getJson())

    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetCorrelation(self, request):
        '''
        데이터셋 상관관계
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": 'Z:\\DT\\storage\\data\\2023\\06\\9999',
                "file_name": '기상청_신사동_2021_2.csv',
                "index_trgt_col": 0,
                "columns": ['ondo','gangsulyang','gangsutype','punghyang','pungsok','sbdo']
            }

        data = self.service.processorDatasetCorrelation(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0012' , message='Processor Dataset Correlation Error', detail=data['resultMessage'])
        return Response(rd.getJson())    

    @action(detail=False, methods=['POST', 'GET'])
    def processorDatasetHist(self, request):
        '''
        데이터셋 히스토그램
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\data\\2023\\06\\9999",
                "file_name": "test_data_201901_201902_1.csv",
                "index_column": 0,
                "column": "w60"
            }

        data = self.service.processorDatasetHist(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0013' , message='Processor Dataset Histogram Error', detail=data['resultMessage'])
        return Response(rd.getJson())     
       
    @action(detail=False, methods=['POST', 'GET'])
    def processorUpdateFile(self, request):
        '''
        검증 값 초기 설정 정보 등록
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "pprcs_set": {
                            "pprcs_nm": "TEST1",
                            "pprcs_derpn": "TEST1",
                            "twin_tp": "FILE",
                            "index_crtr_col" : "date",
                            "reg_user_seq" : 100,
                            "pprcs_seq" : 9999
                },
                "pprcs_file_set": [
                {
                    "file_seq": 9999,
                    "pprcs_trgt_col": "m10",
                    "index_trgt_col": "date",
                    "index_crtr_yn": "Y"
                },
                {
                    "file_seq": 9999,
                    "pprcs_trgt_col": "w60",
                    "index_trgt_col": "date",
                    "index_crtr_yn": "Y"
                },
                {
                    "file_seq": 9999,
                    "pprcs_trgt_col": "m30",
                    "index_trgt_col": "date",
                    "index_crtr_yn": "Y"
                }
                ]
            }

        data = self.service.processorUpdateFile(paramData=paramData)

        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0014' , message='Processor Update File Error', detail=data['resultMessage'])
        return Response(rd.getJson())

    @action(detail=False, methods=['POST', 'GET'])
    def addTimeSeriesIndexRow(self, request):
        '''
        데이터셋 단위변환
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": 'Z:\\DT\\storage\\preprocess\\2023\\06\\9999',
                "file_name": 'test_data_201901_201902_resample.csv',
                "target_file_name": 'test_data_201901_201902_augment.csv',
                "index_column": 'date',
                "output_size": 70
            }

        data = self.service.addTimeSeriesIndexRow(paramData=paramData)        
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())
    
    @action(detail=False, methods=['POST', 'GET'])
    def processorDateTimeCheck(self, request):
        '''
        데이터셋 날짜시간 체크
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file_path": "Z:\\DT\\storage\\preprocess\\2023\\07\\9999",
                "file_name": "9999_origin_sample.csv",
                "index_column": "date"
            }

        data = self.service.dataDateTimeCheck(paramData=paramData)
        if data['result']:
            rd = responseData(code=status.HTTP_200_OK, message='OK', data=data['resultMessage'])     
        else:
            rd = responseData(code=status.HTTP_400_BAD_REQUEST, message='BAD_REQUEST', detail=data['resultMessage'])
        return Response(rd.getJson())

    @action(detail=False, methods=['POST', 'GET'])
    def processorOutlierStandardDeviation(self, request):
        '''
        데이터셋 검증
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file": 'Z:\\DT\\storage\\data\\2023\\07\\9999\\기상청_신사동_2018.csv',
                "index_trgt_col": "date",
                "feature": 'ondo',
                "freq": 50,
                "p_value": 0.05
            }

        data = self.service.standardDeviation(paramData=paramData)
       
        if data['result']:
            rd = responseData(code=200, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0099' , message='Outlier Standard Deviation Error', detail=data['resultMessage'])
        return Response(rd.getJson())

    @action(detail=False, methods=['POST', 'GET'])
    def processorOutlierKMeans(self, request):
        '''
        데이터셋 검증
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file": 'Z:\\DT\\storage\\data\\2023\\07\\9999\\기상청_신사동_2018.csv',
                "index_trgt_col": "date",
                "feature": 'ondo',
                "freq": 50,
                "p_value": 0.05
            }

        data = self.service.kMeans(paramData=paramData)
       
        if data['result']:
            rd = responseData(code=200, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0099' , message='Outlier kMeans Error', detail=data['resultMessage'])
        return Response(rd.getJson())
    
    @action(detail=False, methods=['POST', 'GET'])
    def processorOutlierDBscan(self, request):
        '''
        데이터셋 검증
        '''
        paramData = request.data

        #테스트용
        if not paramData:
            paramData = {
                "file": 'Z:\\DT\\storage\\data\\2023\\07\\9999\\기상청_신사동_2018.csv',
                "index_trgt_col": "date",
                "feature": 'ondo',
                "freq": 50,
                "p_value": 0.05
            }

        data = self.service.dbScan(paramData=paramData)
       
        if data['result']:
            rd = responseData(code=200, message='OK', data=data['resultMessage'])            
        else:
            rd = responseData(code=ERROR_CODE.PRE_PROCESS.value + '-0099' , message='Outlier kMeans Error', detail=data['resultMessage'])
        return Response(rd.getJson())    
