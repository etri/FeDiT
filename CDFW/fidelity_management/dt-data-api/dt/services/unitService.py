import pandas as pd
import logging
import os
import json
from datetime import date
from dt.sql.unitSql import unitQuery

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


class unitService(object):
    """
    Unit Service
    ---
    단위변환 서비스 클래스
    """

    # 데이터베이스 객체
    sql = unitQuery(database=DB_NAME.DT_DATA_PLATFORM)

    # def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def unitList(self, paramData=None):
        """
        단위변환 목록
        Args:
            paramData(any): 목록 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""
        search = None

        try:
            if paramData["unit_tp"]:
                search = str.format("AND UNIT_TP='{0}'", paramData["unit_tp"])

            dt = self.sql.unitList(search)
            # dt = json.dumps(self.sql.modelList(pageParam), ensure_ascii=False)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.UNIT.value, "unitList")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def unitRegistration(self, paramData=None):
        """
        단위변환 등록
        Args:
            paramData(any): 단위변환 정보
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.unitRegistration(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.UNIT.value, "unitRegistration")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def unitUpdate(self, paramData=None):
        """
        단위변환 수정
        Args:
            paramData(any): 단위변환 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.unitUpdate(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.UNIT.value, "unitUpdate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def unitRemove(self, paramData=None):
        """
        단위변환 삭제
        Args:
            paramData(any): 단위변환 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        try:
            dt = self.sql.unitRemove(paramData=paramData)

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.UNIT.value, "unitRemove")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result
