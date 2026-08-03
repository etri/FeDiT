import pandas as pd
import logging
import os
import json
from datetime import date
from dt.sql.menuSql import menuQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS, ERROR_CODE,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, imputerganGenerater, imputerGenerater,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class menuService(object):
    '''
    Menu Service
    ---
    메뉴관리 서비스 클래스
    '''
    
    #데이터베이스 객체
    sql = menuQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    def menuList(self, paramData=None, pageParam=None):
        '''
        메뉴 목록
        Args:
            paramData(any): 목록 정보
            pageParam(any): 페이지 정보            
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''
        search=None
        sort=None

        try:
            if paramData['field']:
                search = str.format("AND {0}='{1}'", paramData['field'], paramData['keyword'])
            if paramData['sort_field']:
                sort = str.format('ORDER BY {0} {1}', paramData['sort_field'], paramData['sort_type'])

            dt = self.sql.menuList(pageParam, search, sort)
            #dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.MENU.value, 'codeMstList')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def menuRegistration(self, paramData=None):
        '''
        메뉴 등록
        Args:
            paramData(any): 메뉴 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.menuRegistration(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.MENU.value, 'menuRegistration')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def menuUpdate(self, paramData=None):
        '''
        메뉴 수정
        Args:
            paramData(any): 메뉴 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.menuUpdate(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.MENU.value, 'menuUpdate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def menuRemove(self, paramData=None):
        '''
        메뉴 삭제
        Args:
            paramData(any): 메뉴 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.menuRemove(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.MENU.value, 'menuRemove')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def menuExist(self, paramData=None):
        '''
        메뉴 확인
        Args:
            paramData(any): 메뉴 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.menuExist(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.MENU.value, 'menuExist')
            result['result'] = False
            result['resultMessage'] = errorMsg

        return result
    