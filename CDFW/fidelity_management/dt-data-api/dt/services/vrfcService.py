import pandas as pd
import logging
import os
import json
from datetime import date
from dt.sql.vrfcSql import vrfcQuery

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


class vrfcService(object):
    """
    VRFC Service
    ---
    데이터검증 서비스 클래스
    """

    # 데이터베이스 객체
    sql = vrfcQuery(database=DB_NAME.DT_DATA_PLATFORM)

    # def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def vrfcList(self, paramData=None):
        """
        데이터검증 목록
        Args:
            paramData(any): 목록 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""
        search = None

        try:
            if paramData["vrfc_tp"]:
                search = str.format("AND VRFC_TP='{0}'", paramData["vrfc_tp"])

            dt = self.sql.vrfcList(search)
            # dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.VRFC.value, "vrfcList")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def vrfcRegistration(self, paramData=None):
        """
        데이터검증 등록
        Args:
            paramData(any): 데이터검증 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.vrfcRegistration(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.VRFC.value, "vrfcRegistration")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def vrfcUpdate(self, paramData=None):
        """
        데이터검증 수정
        Args:
            paramData(any): 데이터검증 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.vrfcUpdate(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.VRFC.value, "vrfcUpdate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def vrfcRemove(self, paramData=None):
        """
        데이터검증 삭제
        Args:
            paramData(any): 데이터검증 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.vrfcRemove(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.VRFC.value, "vrfcRemove")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result
