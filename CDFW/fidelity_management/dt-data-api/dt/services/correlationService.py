import pandas as pd
import logging
import os
import json
from datetime import date, datetime, timedelta
import numpy as np
import csv
import logging
from dateutil.parser import parse

logging = logging.getLogger("dt")

from dt_data_api.common.lib import (
    MD_IP_METHOD,
    DB_NAME,
    MD_VFY_TYPE,
    ERROR_CODE,
    MD_TYPE,
    MD_LOSS,
    MD_OTMZ,
    MD_METRICS,
    DATA_PATH_META,
    MODEL_PATH_META,
    MODEL_AE_PATH_META,
    interpolate,
    resample,
    outlier,
    DataInfo,
    rnnGeneraterMeta,
    ModelParameters,
    InputParameters,
    infoMessage,
    debugMessage,
    errorMessage,
    exceptionMessage,
)


class correlationService(object):

    # 데이터셋 객체
    dataInfo = DataInfo()

    def processorDatasetCorrelation(self, data=None):
        """
        데이터셋 상관관계
        Args:
            data(any): 전처리 상관관계 그래프 데이터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = None

        try:
            dataFile = os.path.join(data["file_path"], data["file_name"])
            type = data["type"]
            df = pd.read_csv(
                dataFile, header=0, index_col=data["index_trgt_col"], parse_dates=True
            )
            if type == "pandas":
                method = data["method"]
                data = self.dataInfo.pandas_correlation_matrix(
                    df[data["columns"]], method
                )
            elif type == "ddtw":
                if data.get("num_quantiles") is not None:
                    data = self.dataInfo.calculate_derivative_fastdtw(df[data["columns"]], data["num_quantiles"])
                else:
                    data = self.dataInfo.calculate_derivative_fastdtw(df[data["columns"]])
            elif type == "granger":
                # maxlag (int): 최대 시차(lag) 값.
                maxlag = data["maxlag"]
                data = self.dataInfo.granger_causality_matrix(df[data["columns"]], maxlag)
            else:
                errorMsg = "Type is not matched"
                result["result"] = False
                result["resultMessage"] = errorMsg
                return result
            result["result"] = True
            result["resultMessage"] = data
        except Exception as e:
            errorMsg = exceptionMessage(
                e, ERROR_CODE.PRE_PROCESS.value, "processorDatasetCorrelation"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg
        return result
