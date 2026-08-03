import pandas as pd
import logging
import os
from datetime import date
from dt.sql.preProcessSql import preProcessQuery
import json
from datetime import datetime, timedelta
import numpy as np
import csv
import logging
logging = logging.getLogger('dt')


from dt_data_api.common.lib import (
    MD_IP_METHOD, DB_NAME, MD_VFY_TYPE, ERROR_CODE,
    DATA_PATH,
    interpolate, resample, outlier,
    DataInfo,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class preProcessService(object):
    '''
    preprocess Service
    ---
    전처리 서비스 클래스
    '''

    #데이터베이스 객체
    sql = preProcessQuery(database=DB_NAME.DT_DATA_PLATFORM)

    #데이터셋 객체
    dataInfo = DataInfo()

    def processorList(self, paramData=None, pageParam=None):
        '''
        검증 값 설정 정보목록
        Args:
            paramData(any): 검증 변수 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''        
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search = None
        sort = None

        logging.info(('paramData: %s', paramData))

        try:
            if paramData['field']:
                search = str.format("AND {0} LIKE '%{1}%'", paramData['field'], paramData['keyword'])
            if paramData['sort_field']:
                sort = str.format('ORDER BY {0} {1}', paramData['sort_field'], paramData['sort_type'])

            data = self.sql.processorList(pageParam=pageParam, search=search, sort=sort)

            result['result'] = True
            result['resultMessage'] = data
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorList')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorRegistration(self, paramData=None):
        '''
        검증 대상 인서트 초기 값 설정
        Args:
            paramData(any): 검증 변수 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            info = self.sql.processorRegistration(paramData=paramData)
     
            if info['file_dir'] == None:
                info['data_set_info'] = info['file_path']
            else:
                paramData['file_path'] = info['file_dir']
                paramData['file_name'] = info['file_name']
                paramData['index_trgt_col'] = info['index_crtr_col']

                data_set_info = self.processorDatasetInfo(paramData=paramData)
                info['data_set_info'] = data_set_info
      
            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorRegistration')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def processorRegistrationFile(self, paramData=None):
        '''
        검증 대상 사용자 업로드 인서트 초기 값 설정
        Args:
            paramData(any): 검증 변수 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            info = self.sql.processorRegistrationFile(paramData=paramData)
            
            if info['file_dir'] == None:
                info['data_set_info'] = info['file_path']
            else:
                paramData['file_path'] = info['file_dir']
                paramData['file_name'] = info['file_name']
                paramData['index_trgt_col'] = info['index_crtr_col']

                data_set_info = self.processorDatasetInfo(paramData=paramData)
                info['data_set_info'] = data_set_info

            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorRegistrationFile')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def processorUpdate(self, paramData=None):
        '''
        검증 대상 수정 초기 값 설정
        Args:
            paramData(any): 검증 변수 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            info = self.sql.processorUpdate(paramData=paramData)

            paramData['file_path'] = info['file_dir']
            paramData['file_name'] = info['file_name']
            paramData['index_trgt_col'] = info['index_crtr_col']

            data_set_info = self.processorDatasetInfo(paramData=paramData)            
            info['data_set_info'] = data_set_info

            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorUpdate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
   
    def processorUpdateFile(self, paramData=None):
        '''
        검증 대상 수정 초기 값 설정
        Args:
            paramData(any): 검증 변수 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            info = self.sql.processorUpdateFile(paramData=paramData)

            paramData['file_path'] = info['file_dir']
            paramData['file_name'] = info['file_name']
            paramData['index_trgt_col'] = info['index_crtr_col']

            data_set_info = self.processorDatasetInfo(paramData=paramData)
            info['data_set_info'] = data_set_info

            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorUpdateFile')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def getTargetFileName(self, fileName=None, targetStr=None):
        '''
        전처리 단계 완료 파일명 처리
        Args:
            fileName(any): 오리지널 파일명
            targetStr(any): 뒤에 붙일 파일명
        Returns: result
        '''
        result = None
        name, ext = os.path.splitext(fileName) 
        result = name + '_' + targetStr + ext

        return result

    def processorDataSetStepAll(self, paramData=None):
        '''
        전처리 일괄 처리 프로세스
        Args:
            paramData(any): 검증 변수 정보
            pprcsTp: 전처리 유형
            refTp: PREPROCESS 고정
            pprcsStatus: 스케쥴러 처리중의 유형별 처리 코드
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            #초기 검증과 결측파라미터 없이 그냥 넘어왔을때 파일 기본검사
            file_path = self.sql.getFileDataPathLoad(paramData=paramData, refTp='PREPROCESS', pprcsTp='ORIGIN')

            if file_path:
                check = self.processorDataSetStepAllCheckStart(paramData=paramData, file_path=file_path)
                
                if check == False:
                    result['result'] = False
                    result['resultMessage'] = "형식 오류이거나 결측치가 존재합니다."

                    return result

            sourceFilePath = file_path[0].get('FILE_PATH')
            sourceFileName = file_path[0].get('FILE_NM')
            
            #검증 시작 상태값 업데이트 V
            if paramData.get('vrfc')!=None:
                self.sql.processorUpdatePprcsStatus(pprcsSeq=paramData.get('pprcs_seq'), pprcsStatus='V')
                verifySuccessYN = self.processorVerifyStart(paramData=paramData, filePath=file_path)
                
                if verifySuccessYN['result'] == False:
                    result['result'] = False
                    result['resultMessage'] = "검증 실패 : " + verifySuccessYN['resultMessage']

                    return result
                else:
                    sourceFilePath, sourceFileName = os.path.split(verifySuccessYN['resultMessage'])
            else:
                #파라미터가 없으면 기존 파일 삭제
                tmp = self.sql.processorFileDbSelectPprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='VALIDATION', refTp='PREPROCESS')
                if len(tmp) > 0:
                    delFilePath = tmp[0]['FILE_PATH'] + '/' + tmp[0]['FILE_NM']
                    self.sql.pprcsTpFilesDelete(pprcsSeq=paramData.get('pprcs_seq'), filePath=delFilePath)
                    self.sql.processorFileDbDeletePprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='VALIDATION', refTp='PREPROCESS')

            #보간 시작 상태값 업데이트 I
            if paramData.get('interpolate')!=None:
                self.sql.processorUpdatePprcsStatus(pprcsSeq=paramData.get('pprcs_seq'), pprcsStatus='I')
                interpolateSuccessYN = self.processorInterpolateStart(paramData=paramData, filePath=sourceFilePath, fileName=sourceFileName, originFileName=file_path[0].get('FILE_NM'), indexColumn=file_path[0].get('INDEX_CRTR_COL'))

                if interpolateSuccessYN['result'] == False:
                    result['result'] = False
                    result['resultMessage'] = "보간 실패 : " + interpolateSuccessYN['resultMessage']

                    return result
                else:
                    self.sql.interpolateMainDbUpdate(paramData.get('pprcs_seq'), interplTp=paramData['interpolate'][0]['interpl_tp'])
                    sourceFilePath, sourceFileName = os.path.split(interpolateSuccessYN['resultMessage'])
            else:
                #파라미터가 없으면 기존 파일 삭제
                tmp = self.sql.processorFileDbSelectPprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='INTERPOLATE', refTp='PREPROCESS')
                if len(tmp) > 0:
                    delFilePath = tmp[0]['FILE_PATH'] + '/' + tmp[0]['FILE_NM']
                    self.sql.pprcsTpFilesDelete(pprcsSeq=paramData.get('pprcs_seq'), filePath=delFilePath)
                    self.sql.processorFileDbDeletePprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='INTERPOLATE', refTp='PREPROCESS')

            #리샘플 시작 상태값 업데이트 S
            if paramData.get('resample')!=None:
                self.sql.processorUpdatePprcsStatus(pprcsSeq=paramData.get('pprcs_seq'), pprcsStatus='S')
                resampleSuccessYN = self.processorResampleStart(paramData=paramData, filePath=sourceFilePath, fileName=sourceFileName, originFileName=file_path[0].get('FILE_NM'), indexColumn=file_path[0].get('INDEX_CRTR_COL'))

                if resampleSuccessYN['result'] == False:
                    result['result'] = False
                    result['resultMessage'] = "리샘플 실패 : " + resampleSuccessYN['resultMessage']

                    return result
                else:
                    self.sql.resampleMainDbUpdate(pprcsSeq=paramData.get('pprcs_seq'), resmplTp=paramData['resample'][0]['resmpl_tp'], resmplIntvlTp=paramData['resample'][0]['resmpl_intvl_tp'], resmplIntvlValue=paramData['resample'][0]['resmpl_intvl_value'])
                    sourceFilePath, sourceFileName = os.path.split(resampleSuccessYN['resultMessage'])
            else:
                #파라미터가 없으면 기존 파일 삭제
                tmp = self.sql.processorFileDbSelectPprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='RESAMPLE', refTp='PREPROCESS')
                if len(tmp) > 0:
                    delFilePath = tmp[0]['FILE_PATH'] + '/' + tmp[0]['FILE_NM']
                    self.sql.pprcsTpFilesDelete(pprcsSeq=paramData.get('pprcs_seq'), filePath=delFilePath)
                    self.sql.processorFileDbDeletePprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='RESAMPLE', refTp='PREPROCESS')

            #단위 시작 상태값 업데이트 U
            if paramData.get('unit')!=None:
                self.sql.processorUpdatePprcsStatus(pprcsSeq=paramData.get('pprcs_seq'), pprcsStatus='U')
                unitSuccessYN = self.processorUnitStart(paramData=paramData, filePath=sourceFilePath, fileName=sourceFileName, originFileName=file_path[0].get('FILE_NM'), indexColumn=file_path[0].get('INDEX_CRTR_COL'))

                if unitSuccessYN['result'] == False:
                    result['result'] = False
                    result['resultMessage'] = "단위변환 실패 : " + unitSuccessYN['resultMessage']

                    return result
                else:
                    sourceFilePath, sourceFileName = os.path.split(unitSuccessYN['resultMessage'])
            else:
                #파라미터가 없으면 기존 파일 삭제
                tmp = self.sql.processorFileDbSelectPprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='UNIT', refTp='PREPROCESS')
                if len(tmp) > 0:
                    delFilePath = tmp[0]['FILE_PATH'] + '/' + tmp[0]['FILE_NM']
                    self.sql.pprcsTpFilesDelete(pprcsSeq=paramData.get('pprcs_seq'), filePath=delFilePath)
                    self.sql.processorFileDbDeletePprcsTp(pprcsSeq=paramData.get('pprcs_seq'), pprcsTp='UNIT', refTp='PREPROCESS')

            #이상치 시작 상태값 업데이트 O
            #outlier = paramData.get('outlier')

            result['result'] = True
            result['resultMessage'] = "최종 완료 파일 : " + sourceFilePath + sourceFileName
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDataSetStepAll')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def processorDataSetStepAllCheckStart(self, paramData=None, file_path=None):
        '''
        전처리 진행전 전처리와 결측 파라미터가 없을때 진행전 데이터 체크
        Args:
            filePath(any): 파일경로
            fileName: 파일명
            indexColumn: 시계열 컬럼
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}

        try:
            paramData['file_path'] = file_path[0].get('FILE_PATH')
            paramData['file_name'] = file_path[0].get('FILE_NM')
            paramData['index_trgt_col'] = file_path[0].get('INDEX_CRTR_COL')

            data_set_info = self.processorDatasetInfo(paramData=paramData)            

            if paramData.get('vrfc') == None or paramData.get('interpolate') == None:
                count_object_dtype = 0
                count_object_nan = 0
                
                for index, data in enumerate(data_set_info['resultMessage']['info']):
                    json_data = json.loads(data)
                    column = data_set_info['resultMessage']['columns'][index]

                    if json_data[column]['dtype'] == "object":
                        count_object_dtype += 1
                    if json_data[column]['nan'] > 0:
                        count_object_nan += 1
                
                if count_object_dtype > 0 or count_object_nan > 0:
                    return False
            else :
                    return True
        except Exception as e:
            return False


    def processorVerifyStart(self, paramData=None, filePath=None):
        '''
        전처리 검증 프로세스 시작
        Args:
            filePath(any): 파일경로
            fileName: 파일명
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            validate_params = paramData.get('vrfc')
            verifyTargetName = self.getTargetFileName(fileName=filePath[0].get('FILE_NM'), targetStr='verify')
            
            rule1=None
            rule2=None
            rule3=None
            rule4=None

            self.sql.vrfcMapDel(pprcsSeq=paramData.get('pprcs_seq'))

            for index, item in enumerate(validate_params):
                get_rule_value = self.sql.getVrfcRuleValue(vrfcSeq=validate_params[index]['vrfc_seq'])

                if get_rule_value[0]['RULE_VALUE_1']:
                    validate_params[index]['rule1'] = get_rule_value[0]['RULE_VALUE_1']
                else:
                    validate_params[index]['rule1'] = None
                if get_rule_value[0]['RULE_VALUE_2']:
                    validate_params[index]['rule2'] = get_rule_value[0]['RULE_VALUE_2']
                else:
                    validate_params[index]['rule2'] = None
                if get_rule_value[0]['RULE_VALUE_3']:
                    validate_params[index]['rule3'] = get_rule_value[0]['RULE_VALUE_3']
                else:
                    validate_params[index]['rule3'] = None
                if get_rule_value[0]['RULE_VALUE_4']:
                    validate_params[index]['rule4'] = get_rule_value[0]['RULE_VALUE_4']
                else:
                    validate_params[index]['rule4'] = None

                validate_params[index]['file_path'] = filePath[0].get('FILE_PATH')
                validate_params[index]['file_name'] = filePath[0].get('FILE_NM')
                validate_params[index]['index_trgt_col'] = filePath[0].get('INDEX_CRTR_COL')
                validate_params[index]['target_file_name'] = verifyTargetName
                validate_params[index]['is_create'] = 'Y'

                verify_file_path = self.processorDatasetVerify(paramData = validate_params[index])

                self.sql.registVrfcMapDB(pprcsSeq=paramData.get('pprcs_seq'), vrfcSeq=item['vrfc_seq'], dataVrfcItem=item['vrfc_trgt_col'], ordBy=item['vrfc_order'], userSeq=paramData.get('reg_user_seq'))
                self.sql.registProcessorFile(pprcsSeq=paramData.get('pprcs_seq'), filePath=verify_file_path['resultMessage'], pprcsTp='VALIDATION', refTp='PREPROCESS', userSeq=paramData.get('reg_user_seq'))

                result['result'] = True
                result['resultMessage'] = verify_file_path['resultMessage']

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorVerifyStart')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def processorInterpolateStart(self, paramData=None, filePath=None, fileName=None, originFileName=None, indexColumn=None):
        '''
        전처리 보간 프로세스 시작
        Args:
            filePath(any): 파일경로
            fileName: 파일명
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            interpolate_params = paramData.get('interpolate')
            interpolateTargetName = self.getTargetFileName(fileName=originFileName, targetStr='interpolate')

            interpolate_params[0]['file_path'] = filePath
            interpolate_params[0]['file_name'] = fileName
            interpolate_params[0]['index_trgt_col'] = indexColumn
            interpolate_params[0]['target_file_name'] = interpolateTargetName

            interpolate_file_path = self.processorDatasetInterpolate(paramData=interpolate_params[0])
        
            #print(interpolate_file_path)
            self.sql.registProcessorFile(pprcsSeq=paramData.get('pprcs_seq'), filePath=interpolate_file_path['resultMessage'], pprcsTp='INTERPOLATE', refTp='PREPROCESS', userSeq=paramData.get('reg_user_seq'))

            result['result'] = True
            result['resultMessage'] = interpolate_file_path['resultMessage']

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorInterpolateStart')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorResampleStart(self, paramData=None, filePath=None, fileName=None, originFileName=None, indexColumn=None):
        '''
        전처리 리샘플 프로세스 시작
        Args:
            filePath(any): 파일경로
            fileName: 파일명
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            resample_params = paramData.get('resample')
            resampleTargetName = self.getTargetFileName(fileName=originFileName, targetStr='resample')

            timeRule = str(resample_params[0]['resmpl_intvl_value']) + resample_params[0]['resmpl_intvl_tp']

            resample_params[0]['file_path'] = filePath
            resample_params[0]['file_name'] = fileName
            resample_params[0]['index_trgt_col'] = indexColumn
            resample_params[0]['target_file_name'] = resampleTargetName
            resample_params[0]['time_rule'] = timeRule

            resample_file_path = self.processorDatasetResample(paramData=resample_params[0])
                        
            #print(resample_file_path)
            self.sql.registProcessorFile(pprcsSeq=paramData.get('pprcs_seq'), filePath=resample_file_path['resultMessage'], pprcsTp='RESAMPLE', refTp='PREPROCESS', userSeq=paramData.get('reg_user_seq'))

            result['result'] = True
            result['resultMessage'] = resample_file_path['resultMessage']

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorResampleStart')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorUnitStart(self, paramData=None, filePath=None, fileName=None, originFileName=None, indexColumn=None):
        '''
        전처리 단위변환 프로세스 시작
        Args:
            filePath(any): 파일경로
            fileName: 파일명
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            unit_params = paramData.get('unit')
            unitTargetName = self.getTargetFileName(fileName=originFileName, targetStr='unit')
            
            self.sql.unitMapDel(pprcsSeq=paramData.get('pprcs_seq'))

            for index, item in enumerate(unit_params):
                get_formula_value = self.sql.getUnitFormulaValue(unitSeq=unit_params[index]['unit_seq'])

                unit_params[index]['file_path'] = filePath
                unit_params[index]['file_name'] = fileName
                unit_params[index]['index_trgt_col'] = indexColumn
                unit_params[index]['target_file_name'] = unitTargetName
                unit_params[index]['is_create'] = 'Y'
                unit_params[index]['unit_formula'] = get_formula_value[0]['UNIT_FORMULA']

                unit_file_path = self.processorDatasetUnitConverter(paramData=unit_params[index])

                self.sql.registUnitMapDB(pprcsSeq=paramData.get('pprcs_seq'), unitSeq=item['unit_seq'], unitItem=item['unit_trgt_col'], ordBy=item['unit_order'], userSeq=paramData.get('reg_user_seq'))
                self.sql.registProcessorFile(pprcsSeq=paramData.get('pprcs_seq'), filePath=unit_file_path['resultMessage'], pprcsTp='UNIT', refTp='PREPROCESS', userSeq=paramData.get('reg_user_seq'))

                result['result'] = True
                result['resultMessage'] = unit_file_path['resultMessage']

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorUnitStart')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result


    def processorRemove(self, paramData=None):
        '''
        검증 대상 삭제
        Args:
            pprcsSeq(any): 검증셋 등록 제목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            info = self.sql.processorRemove(paramData=paramData)
            
            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-' + ' '
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorRemove')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorStatus(self, paramData=None):
        '''
        검증 설정 조회
        Args:
            paramData(any):
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.processorStatus(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorStatus')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorDatasetInfo(self, paramData=None):
        '''
        데이터셋 데이터정보
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:            
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            info = self.dataInfo.info(df)

            result['result'] = True
            result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetInfo')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorDatasetHist(self, paramData=None):
        '''
        데이터셋 히스토그램
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            column(any): 항목
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                histFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', name + '_hist.png')
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                histFile = os.path.join(paramData['file_path'], name + '_hist.png')

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True) 
            
            columns = [paramData['column']]
            df = pd.DataFrame(df, columns=columns)
            self.dataInfo.hist(df, histFile=histFile)

            result['result'] = True
            result['resultMessage'] = histFile
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetHist')
            result['result'] = False
            result['resultMessage'] = errorMsg  
        
        return result

    def processorDatasetVerify(self, paramData=None):
          
        '''
        데이터셋 단위변환
        Args:
            paramData(any): 전처리데이터 검증 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                verifyFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                verifyFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            if str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.DT.value:
                paramData['vrfc_tp'] = MD_VFY_TYPE.DT
            elif str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.DF.value:
                paramData['vrfc_tp'] = MD_VFY_TYPE.DF
            elif str(paramData['vrfc_tp']).lower() == MD_VFY_TYPE.RG.value:
                paramData['vrfc_tp'] = MD_VFY_TYPE.RG
            else:
                paramData['vrfc_tp'] =  MD_VFY_TYPE.DT


            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True, dtype=object)

            if paramData['is_create']=="Y":
            
                if not os.path.exists(verifyFile):
                    df.to_csv(verifyFile, index=True)    

                df_verify = pd.read_csv(verifyFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True, dtype=object)

                #print(df)
                data = self.dataInfo.dataVerify(df=df, df_verify=df_verify, verifyType=paramData['vrfc_tp'], verifyColumn=paramData['vrfc_trgt_col'], clearType=paramData['vrfc_clear_type'], rule1=paramData['rule1'], rule2=paramData['rule2'], rule3=paramData['rule3'], rule4=paramData['rule4'])
                data.to_csv(verifyFile, index=True)
                print(data[:20])
                result['resultMessage'] = verifyFile
            else:
                if os.path.isfile(verifyFile):
                    df = pd.read_csv(verifyFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True, dtype=object)

                #print(df)
                data = self.dataInfo.dataVerifyInfo(df=df, verifyType=paramData['vrfc_tp'], verifyColumn=paramData['vrfc_trgt_col'], rule1=paramData['rule1'], rule2=paramData['rule2'], rule3=paramData['rule3'], rule4=paramData['rule4'])
                #print(data)
                result['resultMessage'] = data

            result['result'] = True            
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetVerify')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorDatasetInterpolate(self, paramData=None):
        '''
        데이터셋 결측 보완
        Args:
            paramData(any): 전처리데이터 결측 처리 데이터 
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        
        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                imputerFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                imputerFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
            
            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #imputerFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_imputer' + ext

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)        
            for column in df.columns:
                if pd.isna(df.at[df.index[0], column]):
                    row_index = 1
                    while pd.isna(df.at[df.index[row_index], column]):
                        row_index += 1
                    next_value = df.at[df.index[row_index], column]
                    df.at[df.index[0], column] = next_value
                    #df[column] = df[column].fillna(next_value)

            ipt = interpolate.Manager(df)
            
            #print(df[:20])
            
            if paramData['interpl_tp']=='linear':
                data = ipt.methodInterpolate(MD_IP_METHOD.LINEAR)
            elif paramData['interpl_tp']=='slinear':
                data = ipt.methodInterpolate(MD_IP_METHOD.SLINEAR)
            elif paramData['interpl_tp']=='time':
                data = ipt.methodInterpolate(MD_IP_METHOD.TIME)
            elif paramData['interpl_tp']=='spline':
                data = ipt.methodInterpolate(MD_IP_METHOD.SPLINE, order=2)
            else:
                data = ipt.methodInterpolate(MD_IP_METHOD.LINEAR)
            
            data.to_csv(imputerFile, index=True)
            print(data[:20])
            
            result['result'] = True
            result['resultMessage'] = imputerFile
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetInterpolate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    #def processorDatasetResample(self, filePath=None, fileName=None, targetFileName=None, method=None, timeRule=None, indexColumn=None):
    def processorDatasetResample(self, paramData=None):
        '''
        데이터셋 샘플링
        Args:
            paramData(any): 전처리 샘플링 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                resampleFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                resampleFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #resampleFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name.replace('_imputer','_resample') + ext

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)        


            rs = resample.Manager(df)
            
            if paramData['resmpl_tp']=='linear':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.LINEAR)
            elif paramData['resmpl_tp']=='slinear':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.SPLINE)
            elif paramData['resmpl_tp']=='time':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.TIME)
            elif paramData['resmpl_tp']=='spline':
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.SPLINE, order=2)
            else:
                data = rs.getInterpolateResampling(timeRule=paramData['time_rule'], method=MD_IP_METHOD.LINEAR)
            
            data.to_csv(resampleFile, index=True)
            print(data[:20])

            result['result'] = True
            result['resultMessage'] = resampleFile
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetResample')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    #def processorDatasetCorrelation(self, filePath=None, fileName=None, columns=None, indexColumn=None):
    def processorDatasetCorrelation(self, paramData=None):
        '''
        데이터셋 상관관계
        Args:
            paramData(any): 전처리 상관관계 그래프 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                corrFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', name + '_corr.png')
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                corrFile = os.path.join(paramData['file_path'], name + '_corr.png')

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)     

            
            #print(df)
            data = self.dataInfo.correlation(df[paramData['columns']], corrFile=corrFile)

            #print(data)
            result['result'] = True
            result['resultMessage'] = data
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetCorrelation')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def processorDatasetUnitConverter(self, paramData=None):
        '''
        데이터셋 단위변환
        Args:
            paramData(any): 전처리 단위변환 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
             
        try:
            name, ext = os.path.splitext(paramData['file_name'])
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
                unitFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
                unitFile = os.path.join(paramData['file_path'], paramData['target_file_name'])

            #운영시 주석
            #dataFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + filename
            #histFile = 'dt_data_api\\storage\\data\\2023\\04\\9999\\' + name + '_hist.png'

            df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)   
            
            if not os.path.exists(unitFile):
                df.to_csv(unitFile, index=True)    

            df_unit = pd.read_csv(unitFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)

            #print(df)
            data = self.dataInfo.unitConverter(df=df, df_unit=df_unit, unitColumn=paramData['unit_trgt_col'], unitFormula=paramData['unit_formula'])
            data.to_csv(unitFile, index=True)
            print(data[:20])

            result['result'] = True
            result['resultMessage'] = unitFile
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorDatasetUnitConverter')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def addTimeSeriesIndexRow(self, paramData=None):
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
                
        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            
            #input_file = df
            #output_file = '~PATH\\DT\\storage\\preprocess\\2023\\06\\9999\\output.csv'
            output_file = paramData['file_path'] + '\\' + paramData['target_file_name']
            n = paramData['output_size']

            data = self.addTimeSeries(dataFile, output_file, n)

            result['result'] = True
            result['resultMessage'] = data          

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'addTimeSeriesIndexRow')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def addTimeSeries(self, input_file, output_file, n):
        df = pd.read_csv(input_file)
        
        # 마지막 날짜
        last_date = df.iloc[-1, 0]

        # 비교 시작 날짜(마지막에서 2번째)와 종료 날짜
        #start_date = pd.to_datetime('2019-01-31 00:00:00')
        #end_date = pd.to_datetime('2019-02-01 01:00:00')
        start_date = pd.to_datetime(str(df.iloc[-2]['date']))
        end_date = pd.to_datetime(str(df.iloc[-1]['date']))

        # 날짜 간격 계산
        date_diff = end_date - start_date

        #모든 속성을 초단위로 모아서 변환
        total_seconds = date_diff.total_seconds()

        seconds = int(total_seconds) % 60
        minutes = int(total_seconds) // 60 % 60
        hours = int(total_seconds) // 3600 % 24
        days = int(total_seconds) // (3600 * 24)
        months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
        years = end_date.year - start_date.year

        # 결과 출력
        """
        print(f"전체 초: {total_seconds}초")
        print(f"초 증가량: {seconds}초")
        print(f"분 증가량: {minutes}분")
        print(f"시간 증가량: {hours}시간")
        print(f"일 증가량: {days}일")
        print(f"월 증가량: {months}개월")
        print(f"년 증가량: {years}년")

        print(start_date)
        print(end_date)
        """
        
        #date 포맷 일치
        datetime_format = '%Y-%m-%d %H:%M:%S'

        new_rows = []
        for i in range(n):
            #새로운 날짜 및 시간 값을 생성
            #Dataframe에 날짜 더하기 : DateOffset
            if seconds > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(seconds=i+1)
            elif minutes > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(minutes=i+1)
            elif hours > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(hours=i+1)
            elif days > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(days=i+1)
            elif months > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(months=i+1)
            elif years > 0:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(years=i+1)
            else:
                new_date = pd.to_datetime(last_date, format=datetime_format) + pd.DateOffset(hours=i+1)


            # +: 문자열 합치기 , *:문자열반복합치기
            # df.shape : 행,열, df.shape[0]:행, df.shape[1] :열
            # [''] * (df.shape[1]-1) 공백을 추가하고 열의 갯수 -1 만큼 반복해서 [''] 공백을 추가
            #print(['2019-01-01 23:00:02'] + [''] * (df.shape[1]-1))
            new_rows.append([new_date] + [''] * (df.shape[1]-1))
           
        # 새로운 DataFrame 생성
        new_df = pd.DataFrame(new_rows, columns=df.columns)
        
        # 기존 df, new_df 행 병합, 참고: 열병합 pd.concat([df, new_df], axis=1)
        result_df = pd.concat([df, new_df], ignore_index=True)
        result_df.to_csv(output_file, index=False)

        return new_rows

    def dataDateTimeCheck(self, paramData=None):
        '''
        데이터셋 날짜시간 체크
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            if paramData['file_path']==None:
                today = date.today()
                dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            else:
                dataFile = os.path.join(paramData['file_path'], paramData['file_name'])

            index_col = paramData['index_trgt_col']
            #df = pd.read_csv(dataFile, header=0, index_col=index_col, parse_dates=True)        
            df = pd.read_csv(dataFile, header=0, parse_dates=True)        
            df[index_col] = pd.to_datetime(df[index_col], format='%Y-%m-%d %H:%M:%S')            
            
            df = self.dataInfo.dateTimeCheck2(df, index_col)
            #count = sum(1 for delta in df['delta'] if delta != '0.0')
            count = sum(1 for delta in df['delta'] if delta != pd.Timedelta('0 days 00:00:00'))
            df['validation_count'] = count

            result['result'] = True
            result['resultMessage'] = df
        except Exception as e:
            # errorMsg = 'createImputationIterative Error : ' + e.args[0] + ' - ' + e.args[1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'dataDateTimeCheck')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def standardDeviation(self, paramData=None):
        '''
        표준편차 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''    
        result = {'result': False, 'resultMessage':None}   
        errorMsg = ''     
        name, ext = os.path.splitext(paramData['file_name'])
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            outlierFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
        
        try:
            df=pd.read_csv(dataFile, header=0, index_col=0, parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)

            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # feature = 'ondo' #항목
            # freq = 50
            # p_value = 0.05 #정규분포 경계
            
            feature = paramData['feature']
            freq = paramData['freq']
            p_value = paramData['p_value']
            is_create =  paramData['isCreate']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)
            t, s, r = oul.tsDecompose(feature=feature, freq=freq)


            p = oul.zTest(r)
            if p[0] < paramData['p_value']:
                raise Exception(str.format('p-value {0} 이하로 정규분포를 적용할 수 없습니다.', p_value))
                
            df_outlier = oul.standardDeviation(r, is_create)
            #df = df.reset_index()
            #print(df)

            result['result'] = True
            #result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            if is_create=='N':
                result['resultMessage'] = df_outlier
            else:
                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, feature] = np.nan
                    df.to_csv(outlierFile, index=True)
                    result['resultMessage'] = outlierFile
                else:
                    result['resultMessage'] = outlierFile   


        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'standardDeviation')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def kMeans(self, paramData=None):
        '''
        k-means 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}        
        errorMsg = ''
        name, ext = os.path.splitext(paramData['file_name'])
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            outlierFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])   

        try:
            df=pd.read_csv(dataFile, header=0, index_col=0, parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)
            
            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # features = ['ondo']
            # freq = 50

            features = [paramData['feature']]
            freq = paramData['freq']
            n_clusters = paramData['n_clusters']
            n_clusters_lable = paramData['n_clusters_lable']
            is_create =  paramData['isCreate']
            n_count =  paramData['n_count']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)
            
            df_outlier = oul.kMeans(features=features, freq=freq, n_clusters=n_clusters, n_clusters_lable=n_clusters_lable,is_create=is_create,n_count=n_count)
            #df = df.reset_index()
            #print(df)
            
            result['result'] = True
            if is_create=='N':
                result['resultMessage'] = df_outlier
            else:
                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, features] = np.nan
                    df.to_csv(outlierFile, index=True)
                    result['resultMessage'] = outlierFile
                else:
                    result['resultMessage'] = outlierFile   

        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'kMeans')
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result

    def dbScan(self, paramData=None):
        '''
        dbScan 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}        
        errorMsg = ''
        name, ext = os.path.splitext(paramData['file_name'])
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            outlierFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
        
        try:
            df=pd.read_csv(dataFile, header=0, index_col=0, parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)
            
            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # features = ['ondo']
            # freq = 50
            
            features = [paramData['feature']]
            freq = paramData['freq']
            eps = paramData['eps']
            min_samples = paramData['min_samples']
            is_create =  paramData['isCreate']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)

            df_outlier = oul.dbScan(features=features, freq=freq, eps=eps, min_samples=min_samples, is_create=is_create)
            #df = df.reset_index()
            #print(df)

            result['result'] = True
            #result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            if is_create=='N':
                result['resultMessage'] = df_outlier
            else:
                if len(df_outlier.index) > 0:
                    common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                    df.loc[common_index, features] = np.nan
                    df.to_csv(outlierFile, index=True)
                    result['resultMessage'] = outlierFile
                else:
                    result['resultMessage'] = outlierFile                 

        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'dbScan')
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
   
    def dbScanExecute(self, paramData=None):
        '''
        dbScan 기준 이상치 탐지
        Args:
            paramData(any): 전처리 이상치 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}        
        errorMsg = ''
        name, ext = os.path.splitext(paramData['file_name'])
        if paramData['file_path']==None:
            today = date.today()
            dataFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['file_name'])
            outlierFile = os.path.join(DATA_PATH, f'{today.year}', f'{today.month:02d}', '9999', paramData['target_file_name'])
        else:
            dataFile = os.path.join(paramData['file_path'], paramData['file_name'])
            outlierFile = os.path.join(paramData['file_path'], paramData['target_file_name'])
        
        try:
            df=pd.read_csv(dataFile, header=0, index_col=0, parse_dates=True)
            #df=pd.read_csv(file, header=0, parse_dates=True)
            
            # 입력이 json 경우 : 날짜형식 변환, 인덱스 지정 필요
            # df = pd.DataFrame(paramData['data'])        
            # df[paramData['index_trgt_col']] = pd.to_datetime(df[paramData['index_trgt_col']])
            # df = df.set_index(paramData['index_trgt_col'])        
            # print(df) 

            # features = ['ondo']
            # freq = 50
            
            features = [paramData['feature']]
            freq = paramData['freq']
            eps = paramData['eps']
            min_samples = paramData['min_samples']

            df.info()
            oul = outlier.Manager(df)
            oul.setData(df)

            df_outlier = oul.dbScanExecute(features=features, freq=freq, eps=eps, min_samples=min_samples)
            if len(df_outlier.index) > 0:
                common_index = df.index.intersection(df_outlier.index)  # df1과 df2의 공통 인덱스 찾기
                df.loc[common_index, features] = np.nan            
                df.to_csv(outlierFile, index=True)

            
            result['result'] = True
            #result['resultMessage'] = df.to_json(orient='records', date_format='iso')
            result['resultMessage'] = outlierFile
        except Exception as e:
            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'dbScan')
            result['result'] = False
            result['resultMessage'] = errorMsg              
        return result
    




































    """
    def processorMakefirstColumnSetData(self, paramData=None, pageParam=None):
        '''
        데이터셋 데이터정보
        Args:
            filepath(any): 데이터파일 경로
            filename(any): 데이터파일 명
            indexColumn(any): index 항목
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search = None
        sort = None

        try:            
            #if paramData['field']:
                #search = str.format("AND {0} LIKE '%{1}%'", paramData['field'], paramData['keyword'])
            search = str.format("AND DATE_FORMAT(yyyymmdd, '%Y%m%d') BETWEEN {0} AND {1}", paramData['target_start_date'], paramData['target_end_date'])

            #if paramData['sort_field']:
            sort = str.format('ORDER BY {0} {1}', 'yyyymmdd', 'asc')

            data = self.sql.metaTestListQuery(pageParam=pageParam, search=search, sort=sort)

            '''
            if not os.path.exists(paramData['file_path']):
                os.makedirs(paramData['file_path'])

            df = pd.DataFrame(data)
    
            # 파일 경로 생성
            file_path = os.path.join(paramData['file_path'], paramData['file_name'])
            
            import csv
            df.to_csv(file_path, index=False, quoting=csv.QUOTE_ALL)
            '''

            paramData['base_dir'] = os.path.basename(paramData['file_path'])

            result['result'] = True
            result['resultMessage'] = paramData

            #return False
            #df = pd.read_csv(dataFile, header=0, index_col=paramData['index_trgt_col'], parse_dates=True)
            #info = self.dataInfo.info(df)

            #result['result'] = True
            #result['resultMessage'] = info
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # logging.error(errorMsg[:-1])

            errorMsg = exceptionMessage(e, ERROR_CODE.PRE_PROCESS.value, 'processorMakeOriginFileSet')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    """