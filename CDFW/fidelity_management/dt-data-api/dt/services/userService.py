import pandas as pd
import logging
import os
import json
from datetime import date
from dt.sql.userSql import userQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD, MD_FILL_TYPE, MD_IP_METHOD, DB_NAME, MD_IP_SI, MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS, ERROR_CODE,
    DATA_PATH, MODEL_PATH, 
    ModelParameters, InputParameters,
    fillna, interpolate, resample, regression, fid, rnnGenerater, imputerganGenerater, imputerGenerater,
    infoMessage, debugMessage, errorMessage, exceptionMessage
)

class userService(object):
    '''
    User Service
    ---
    사용자 서비스 클래스
    '''
    
    #데이터베이스 객체
    sql = userQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    #def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)
    
    def userList(self, paramData=None, pageParam=None):
        '''
        사용자 목록
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

            dt = self.sql.userList(pageParam, search, sort)
            #dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userList')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def userRegistration(self, paramData=None):
        '''
        사용자 등록
        Args:
            paramData(any): 사용자 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.userRegistration(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userRegistration')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def userUpdate(self, paramData=None):
        '''
        사용자 수정
        Args:
            paramData(any): 사용자 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.userUpdate(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userUpdate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def userRemove(self, paramData=None):
        '''
        사용자 삭제
        Args:
            paramData(any): 사용자 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.userRemove(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userRemove')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def userExist(self, paramData=None):
        '''
        사용자 확인
        Args:
            paramData(any): 사용자 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.userExist(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userExist')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result

    def userLogin(self, paramData=None):
        '''
        사용자 로그인
        Args:
            paramData(any): 사용자 로그인 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.userLogin(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userLogin')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
    
    def userLastLoginUpdate(self, paramData=None):
        '''
        사용자 마지막 로그인 시간 수정
        Args:
            paramData(any): 사용자 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        '''
        result = {'result': False, 'resultMessage':None}
        errorMsg = ''

        try:
            dt = self.sql.userLastLoginUpdate(paramData=paramData)

            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.USER.value, 'userLastLoginUpdate')
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result