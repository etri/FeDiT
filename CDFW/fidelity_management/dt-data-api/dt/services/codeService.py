import pandas as pd
import logging
import os
import json
from datetime import date
from dt.sql.codeSql import codeQuery

from dt_data_api.common.lib import (
    MD_FILL_METHOD,
    MD_FILL_TYPE,
    MD_IP_METHOD,
    DB_NAME,
    MD_IP_SI,
    MD_TYPE,
    MD_LOSS,
    MD_OTMZ,
    MD_METRICS,
    ERROR_CODE,
    DATA_PATH,
    MODEL_PATH,
    ModelParameters,
    InputParameters,
    fillna,
    interpolate,
    resample,
    regression,
    fid,
    rnnGenerater,
    imputerganGenerater,
    imputerGenerater,
    infoMessage,
    debugMessage,
    errorMessage,
    exceptionMessage,
)


class codeService(object):
    """
    Code Service
    ---
    코드관리 서비스 클래스
    """

    # 데이터베이스 객체
    sql = codeQuery(database=DB_NAME.DT_DATA_PLATFORM)

    # def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def codeMstList(self):
        """
        메인코드 목록
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeMstList()
            # dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeMstList")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeMstRegistration(self, paramData=None):
        """
        메인코드 등록
        Args:
            paramData(any): 메인코드 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeMstRegistration(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeMstRegistration")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeMstUpdate(self, paramData=None):
        """
        메인코드 수정
        Args:
            paramData(any): 데이터검증 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeMstUpdate(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeMstUpdate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeMstRemove(self, paramData=None):
        """
        메인코드 삭제
        Args:
            paramData(any): 메인코드 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeMstRemove(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeMstRemove")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeMstExist(self, paramData=None):
        """
        메인코드 확인
        Args:
            paramData(any): 메인코드 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeMstExist(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeMstExist")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeDtlList(self, paramData=None):
        """
        세부코드 목록
        Args:
            paramData(any): 목록 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""
        search = None

        try:
            if paramData["grp_cd"]:
                search = str.format("AND GRP_CD='{0}'", paramData["grp_cd"])

            dt = self.sql.codeDtlList(search)
            # dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeDtlList")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeDtlRegistration(self, paramData=None):
        """
        세부코드 등록
        Args:
            paramData(any): 세부코드 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeDtlRegistration(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeDtlRegistration")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeDtlUpdate(self, paramData=None):
        """
        세부코드 수정
        Args:
            paramData(any): 세부코드 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeDtlUpdate(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeDtlUpdate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeDtlRemove(self, paramData=None):
        """
        세부코드 삭제
        Args:
            paramData(any): 세부코드 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeDtlRemove(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeDtlRemove")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def codeDtlExist(self, paramData=None):
        """
        세부코드 확인
        Args:
            paramData(any): 세부코드 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.codeDtlExist(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.CODE.value, "codeDtlExist")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result
