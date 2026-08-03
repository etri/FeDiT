import pandas as pd
import logging
import os
import json
from datetime import date
from dt.sql.authSql import authQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS, ERROR_CODE,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, imputerganGenerater, imputerGenerater,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class authService(object):
    '''
    Auth Service
    ---
    권한관리 서비스 클래스
    '''
    
    #데이터베이스 객체
    sql = authQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    def authList(self):
        '''
        권한 목록
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.authList()
            #dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUTH.value, 'authList')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def authMenuList(self, paramData=None):
        '''
        메뉴권한 목록
        Args:
            paramData(any): 목록 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search=None

        try:
            if paramData['auth_cd']:
                search = str.format("AND AUTH_CD='{0}'", paramData['auth_cd'])
            
            dt = self.sql.authMenuList(search)
            #dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUTH.value, 'authMenuList')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def authMenuRegistration(self, paramData=None):
        '''
        메뉴권한 등록
        Args:
            paramData(any): 메뉴권한 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.authMenuRegistration(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUTH.value, 'authMenuRegistration')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def authMenuRemove(self, paramData=None):
        '''
        메뉴권한 삭제
        Args:
            paramData(any): 메뉴권한 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.authMenuRemove(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUTH.value, 'authMenuRemove')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    