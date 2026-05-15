import pandas as pd
import numpy as np
import logging
import os
import json
from datetime import datetime, date, timedelta
from dt.sql.augmentSql import augmentQuery
from collections import Counter

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
    DATA_PATH_META,
    MODEL_PATH_META,
    ModelParameters,
    InputParameters,
    fillna,
    interpolate,
    resample,
    regression,
    fid,
    rnnGenerater,
    timeganGenerater,
    imputerganGenerater,
    imputerGenerater,
    rnnGeneraterMeta,
    randomForestGenerater,
    deepARGenerater,
    arimaGenerater,
    imputerBritsGenerater,
    nbeatsGenerater,
    imputerNaomiGenerater,
    infoMessage,
    debugMessage,
    errorMessage,
    exceptionMessage,
)


class augmentService(object):
    """
    Augment Service
    ---
    데이터증강 서비스 클래스
    """

    # 로그설정
    logging = logging.getLogger("dt")

    # 데이터베이스 객체
    sql = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    # def __init__(self) -> None:
    #    self.query = augmentQuery(database=DB_NAME.DT_DATA_PLATFORM)

    def augmentCreate(self, paramData=None):
        """
        RNN 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["test_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["test_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["test_file_path"]
            dataFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        modelArgs = ModelParameters(
            window_size=paramData["window_size"],
            batch_size=paramData["batch_size"],
            units=16,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            is_indpds=is_indpds,
            use_model_yn=paramData["use_model_yn"],
            real_time_yn=paramData["real_time_yn"],
            output_file=paramData["output_file"],
            target_start_date=paramData["target_start_date"],
            target_last_date=paramData["target_last_date"],
            resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
            resmpl_intvl_value=paramData["resmpl_intvl_value"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            df = pd.read_csv(dataFile, header=0, parse_dates=True)
            df.set_index(paramData["index_column"], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            # df = df[output_cols + feature_cols]
            if feature_cols == None or feature_cols == "":
                df = df[output_cols]
            else:
                data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                df = df[data_cols]

            # df = df.iloc[-1000:]
            m = rnnGeneraterMeta.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, "augmentCreate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_repeat(self, paramData=None):
        """
        RNN 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["test_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["test_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["test_file_path"]
            dataFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        modelArgs = ModelParameters(
            window_size=paramData["window_size"],
            batch_size=paramData["batch_size"],
            units=16,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            is_indpds=is_indpds,
            use_model_yn=paramData["use_model_yn"],
            real_time_yn=paramData["real_time_yn"],
            output_file=paramData["output_file"],
            target_start_date=paramData["target_start_date"],
            target_last_date=paramData["target_last_date"],
            resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
            resmpl_intvl_value=paramData["resmpl_intvl_value"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            df = pd.read_csv(dataFile, header=0, parse_dates=True)
            df.set_index(paramData["index_column"], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            df = df[output_cols + feature_cols]

            df = df.iloc[-1000:]
            m = rnnGeneraterMeta.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater_repeat(loop_count=paramData["window_size"])

            result["result"] = True
            result["resultMessage"] = dt
            print("데이터", dt)
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, "augmentCreate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def calcModelTestDataTargetDate(self, paramData=None):
        result = {"result": False, "resultMessage": None}
        # current_year = str(datetime.now().year)

        try:
            set_start_date = datetime.strptime(
                paramData["target_start_date"], "%Y-%m-%d %H:%M:%S"
            )
            set_last_date = datetime.strptime(
                paramData["target_last_date"], "%Y-%m-%d %H:%M:%S"
            )

            index_col = paramData["index_column"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            testFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            os.makedirs(paramData["test_file_path"], exist_ok=True)
            df = pd.read_csv(dataFile, header=0, parse_dates=True)
            df[index_col] = pd.to_datetime(df[index_col])

            print("============간격체크==========")
            intvl_param = calculate_most_common_interval(df, index_col)
            # print(intvl_param['interval_type'])
            # print(intvl_param['interval_value'])
            paramData["resmpl_intvl_tp"] = intvl_param["interval_type"]
            paramData["resmpl_intvl_value"] = intvl_param["interval_value"]

            year_range = df[index_col].dt.year.unique()
            year_range = pd.Series(year_range).sort_values(ascending=False).to_numpy()

            test_data_start_date = None
            test_data_last_date = None
            time_check_yn = None
            data_frame = None
            index_col_date = None

            for index, year in enumerate(year_range):
                if paramData["resmpl_intvl_tp"] == "days":
                    index_col_date = df[index_col].dt.strftime("%m-%d 00:00:00")
                    target_start_date = set_start_date.strftime("%m-%d 00:00:00")
                    target_last_date = set_last_date.strftime("%m-%d 00:00:00")
                elif paramData["resmpl_intvl_tp"] == "hours":
                    index_col_date = df[index_col].dt.strftime("%m-%d %H:00:00")
                    target_start_date = set_start_date.strftime("%m-%d %H:00:00")
                    target_last_date = set_last_date.strftime("%m-%d %H:00:00")
                elif paramData["resmpl_intvl_tp"] == "minutes":
                    index_col_date = df[index_col].dt.strftime("%m-%d %H:%M:00")
                    target_start_date = set_start_date.strftime("%m-%d %H:%M:00")
                    target_last_date = set_last_date.strftime("%m-%d %H:%M:00")
                elif paramData["resmpl_intvl_tp"] == "seconds":
                    index_col_date = df[index_col].dt.strftime("%m-%d %H:%M:%S")
                    target_start_date = set_start_date.strftime("%m-%d %H:%M:%S")
                    target_last_date = set_last_date.strftime("%m-%d %H:%M:%S")
                else:
                    index_col_date = None
                    target_start_date = None
                    target_last_date = None

                if (
                    df[
                        (df[index_col].dt.year == year)
                        & (index_col_date == target_last_date)
                    ].shape[0]
                    > 0
                ):
                    print(f" 매칭 있음")
                    time_check_yn = "Y"
                    data_frame = None
                    test_data_last_date = str(year) + "-" + target_last_date
                    test_data_start_date = str(year) + "-" + target_start_date

                    break
                else:
                    print(f" 다 없음")

                    time_check_yn = "N"
                    row_count = self.calcModelDataDateTermRowCount(
                        start_time=target_start_date,
                        end_time=target_last_date,
                        resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                        resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    )

                    test_row_count = row_count + paramData["window_size"]
                    print(row_count)
                    print(paramData["window_size"])

                    df = df.iloc[-test_row_count:]
                    data_frame = df.reset_index(drop=True)

            test_file_path = self.makeCsvUseModelTestFile(
                file_path=dataFile,
                test_file_path=testFile,
                index_col=index_col,
                start_date=test_data_start_date,
                end_date=test_data_last_date,
                window_size=paramData["window_size"],
                time_check_yn=time_check_yn,
                data_frame=data_frame,
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
            )

            result["result"] = True
            result["resultMessage"] = test_file_path

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "calcModelTestDataTargetDate"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_interpolation(self, paramData=None):
        """
        RNN 학습모델에서 데이터 생성(입력 누락 데이터 추론 보간 기능 추가)
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        try:
            print("params", paramData)
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            # 입력 파일 로드(샘플링된 데이터.)
            useDataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            df = pd.read_csv(useDataFile, header=0, parse_dates=True)
            print("보간할 데이터", df)
            # df.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            window_size = paramData["window_size"]
            count = paramData["count"]
            # df = df.iloc[-1000:]
            df_ori = pd.read_csv(
                paramData["original_file"], header=0, parse_dates=True
            )  # 오리지날 파일 로드
            print("오리지날 데이터", df_ori)
            need_interpolation = (
                df_ori[index_column].isnull().any() or df_ori[index_column].eq("").any()
            )  # index_column 비어있는지 체크해서 보간 작업을 수행해야되는지 체크
            if need_interpolation:
                print("보간 수행", need_interpolation)

                # 예측 데이터 보간 예측
                df2 = df.iloc[
                    -(window_size):
                ]  # 보간을 해야될 누락된 데이터가 있는 df의 아래에서부터 window_size+1 만큼의 데이터
                df1 = df.drop(
                    index=df.index[-(window_size):]
                )  # df2를 보간하기 위해서 입력값으로 넣을 df2를 제외한 상단 나머지 데이터

                if (
                    paramData["use_model_yn"] == "Y"
                    and paramData["real_time_yn"] == "N"
                ):
                    test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                        df_source=df1, paramData=paramData
                    )  # df1을 입력값으로 넣을것임
                    file_path = test_file_set["resultMessage"]
                    directory = os.path.dirname(file_path)
                    filename = os.path.basename(file_path)

                    paramData["test_file_path"] = directory
                    paramData["test_file_name"] = filename
                else:
                    if (
                        os.path.isfile(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            )
                        )
                        == False
                    ):
                        df1 = df1.iloc[-(window_size + 1) :]
                        df1.to_csv(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            ),
                            index=False,
                        )

                if paramData["test_file_path"] == None:
                    dataFile = os.path.join(
                        DATA_PATH_META,
                        f"{today.year}",
                        f"{today.month:02d}",
                        "9999",
                        paramData["test_file_name"],
                    )
                    dataPath = os.path.join(
                        DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                    )
                else:
                    dataPath = paramData["test_file_path"]
                    dataFile = os.path.join(
                        paramData["test_file_path"], paramData["test_file_name"]
                    )

                df1_target = pd.read_csv(dataFile, header=0, parse_dates=True)

                modelArgs = ModelParameters(
                    window_size=window_size,
                    batch_size=paramData["batch_size"],
                    units=16,
                    patience=10,
                )
                inputArgs = InputParameters(
                    filepath=modelPath,
                    filename=modelFile,
                    output_cols=paramData["outputs"],
                    feature_cols=paramData["features"],
                    is_indpds=is_indpds,
                    use_model_yn=paramData["use_model_yn"],
                    real_time_yn=paramData["real_time_yn"],
                    output_file=paramData["output_file"],
                    target_start_date=paramData["target_start_date"],
                    target_last_date=paramData["target_last_date"],
                    resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                    resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    index_column=paramData["index_column"],
                    trgt_col_list=paramData["trgt_col_list"],
                )

                new_index = range(len(df1_target))
                df1_target.index = new_index
                # 처리할 컬럼들만 추림
                if feature_cols == None or feature_cols == "":
                    df1_target = df1_target[output_cols]
                else:
                    df1_target = df1_target[output_cols + feature_cols]

                m = rnnGeneraterMeta.Manager(
                    data=df1_target, modelArgs=modelArgs, inputArgs=inputArgs
                )
                df1_predict = m.dataGenerater_repeat(
                    loop_count=len(df2), auto_save_file=False
                )

                # 인덱스 재정렬
                new_index = range(len(df2))
                df2.index = new_index

                valid_idx = df_ori[index_column].isnull() | (
                    df_ori[index_column] == ""
                )  # 원본에 index_column컬럼의 값이 비어있는 인덱스 가져옴

                print("이전 예측 보정 1", df2, valid_idx)

                # 빈 데이터 값만 예측 보정된 값으로 대체
                for col in output_cols:
                    df2.loc[valid_idx, col] = df1_predict.loc[valid_idx, col]

                print("이전 예측 보정 2", df2)

                # 실제 예측을 할 값으로 df2를 사용할건데 현재 df2갯수가 윈도우 사이즈+1보다 작다면 df1에서 아래부분을 모자란만큼 가져와서 df2 윗쪽에 추가.
                n_add_line = window_size + 1 - len(df2)
                if n_add_line > 0:
                    df1_bottom = df1.tail(n_add_line)
                    df2 = pd.concat([df1_bottom, df2]).reset_index(drop=True)
            else:
                df2 = df

            # 실제 예측
            if paramData["use_model_yn"] == "Y" and paramData["real_time_yn"] == "N":
                test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                    df_source=df2, paramData=paramData
                )
                file_path = test_file_set["resultMessage"]
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData["test_file_path"] = directory
                paramData["test_file_name"] = filename
            else:
                if (
                    os.path.isfile(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        )
                    )
                    == False
                ):
                    df2 = df2.iloc[-(window_size + 1) :]
                    df2.to_csv(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        ),
                        index=False,
                    )

            if paramData["test_file_path"] == None:
                dataFile = os.path.join(
                    DATA_PATH_META,
                    f"{today.year}",
                    f"{today.month:02d}",
                    "9999",
                    paramData["test_file_name"],
                )
                dataPath = os.path.join(
                    DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                )
            else:
                dataPath = paramData["test_file_path"]
                dataFile = os.path.join(
                    paramData["test_file_path"], paramData["test_file_name"]
                )

            modelArgs = ModelParameters(
                window_size=paramData["window_size"],
                batch_size=paramData["batch_size"],
                units=16,
                patience=10,
            )
            inputArgs = InputParameters(
                filepath=modelPath,
                filename=modelFile,
                output_cols=paramData["outputs"],
                feature_cols=paramData["features"],
                is_indpds=is_indpds,
                use_model_yn=paramData["use_model_yn"],
                real_time_yn=paramData["real_time_yn"],
                output_file=paramData["output_file"],
                target_start_date=paramData["target_start_date"],
                target_last_date=paramData["target_last_date"],
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
                index_column=paramData["index_column"],
                trgt_col_list=paramData["trgt_col_list"],
            )

            df2_target = pd.read_csv(dataFile, header=0, parse_dates=True)

            if feature_cols == None or feature_cols == "":
                df2_target = df2_target[output_cols]
            else:
                data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                df2_target = df2_target[data_cols]

            print("최종 입력값", df2_target)

            m = rnnGeneraterMeta.Manager(
                data=df2_target, modelArgs=modelArgs, inputArgs=inputArgs
            )
            df2_predict = m.dataGenerater_repeat(
                loop_count=window_size * count, auto_save_file=False
            )

            if "df1_target" not in locals():
                df_all = df2_predict
            else:
                df2 = df2[[index_column] + output_cols].loc[valid_idx]
                df_all = pd.concat([df2, df2_predict], axis=0)

            print("현재 예측 보정", df2_predict)
            result["result"] = True
            df_all.to_csv(paramData["output_file"], index=False)
            result["resultMessage"] = paramData["output_file"]
            print("데이터", df_all)
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_interpolation"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_randomForest(self, paramData=None):
        """
        RandomForest 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["model_use_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_use_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["model_use_file_path"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        modelArgs = ModelParameters()
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            print(dataFile)
            df_ori = pd.read_csv(dataFile, header=0, parse_dates=True)
            # df_ori.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            df = df_ori[output_cols + feature_cols]

            m = randomForestGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            print("결과", df_ori, dt)

            # 빈 데이터 값만 예측 보정된 값으로 대체
            for col in output_cols:
                valid_idx = df_ori[col].isnull() | (
                    df_ori[col] == ""
                )  # 원본에 컬럼의 값이 비어있는 인덱스 가져옴
                print("valid_idx", valid_idx)
                df_ori.loc[valid_idx, col] = dt.loc[valid_idx, col]

            # df_ori[output_cols] = dt[output_cols]
            print("합침", df_ori)
            df_ori.to_csv(paramData["output_file"], index=False)
            result["result"] = True
            result["resultMessage"] = paramData["output_file"]
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(e, ERROR_CODE.AUGMENT.value, "augmentCreate")
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    # 공백이나 None을 대체
    def fill_empty(self, a_value, b_value):
        if pd.isnull(a_value) or a_value == "" or a_value is None:
            return b_value
        return a_value

    def augmentCreate_deepAR(self, paramData=None):
        """
        deepAR 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["test_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["test_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["test_file_path"]
            dataFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        modelArgs = ModelParameters(
            window_size=paramData["window_size"],
            batch_size=paramData["batch_size"],
            units=16,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            is_indpds=is_indpds,
            use_model_yn=paramData["use_model_yn"],
            real_time_yn=paramData["real_time_yn"],
            output_file=paramData["output_file"],
            target_start_date=paramData["target_start_date"],
            target_last_date=paramData["target_last_date"],
            resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
            resmpl_intvl_value=paramData["resmpl_intvl_value"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            df = pd.read_csv(dataFile, header=0, parse_dates=True)
            df.set_index(paramData["index_column"], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            if feature_cols == None or feature_cols == "":
                df = df[output_cols]
            else:
                data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                df = df[data_cols]
            # df = df[output_cols + feature_cols]

            # df = df.iloc[-1000:]
            m = deepARGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_deepAR"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_deepAR_interpolation(self, paramData=None):
        """
        deepAR 학습모델에서 데이터 생성(입력 누락 데이터 추론 보간 기능 추가)
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            # 입력 파일 로드(샘플링된 데이터.)
            useDataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            df = pd.read_csv(useDataFile, header=0, parse_dates=True)
            print("보간할 데이터", df)
            # df.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            window_size = paramData["window_size"]
            count = paramData["count"]
            # df = df.iloc[-1000:]
            df_ori = pd.read_csv(
                paramData["original_file"], header=0, parse_dates=True
            )  # 오리지날 파일 로드
            print("오리지날 데이터", df_ori)
            need_interpolation = (
                df_ori[index_column].isnull().any() or df_ori[index_column].eq("").any()
            )  # index_column 비어있는지 체크해서 보간 작업을 수행해야되는지 체크
            if need_interpolation:
                print("보간 수행", need_interpolation)

                # 예측 데이터 보간 예측
                df2 = df.iloc[
                    -(window_size):
                ]  # 보간을 해야될 누락된 데이터가 있는 df의 아래에서부터 window_size+1 만큼의 데이터
                df1 = df.drop(
                    index=df.index[-(window_size):]
                )  # df2를 보간하기 위해서 입력값으로 넣을 df2를 제외한 상단 나머지 데이터

                if (
                    paramData["use_model_yn"] == "Y"
                    and paramData["real_time_yn"] == "N"
                ):
                    test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                        df_source=df1, paramData=paramData
                    )  # df1을 입력값으로 넣을것임
                    file_path = test_file_set["resultMessage"]
                    directory = os.path.dirname(file_path)
                    filename = os.path.basename(file_path)

                    paramData["test_file_path"] = directory
                    paramData["test_file_name"] = filename
                else:
                    if (
                        os.path.isfile(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            )
                        )
                        == False
                    ):
                        df1 = df1.iloc[-(window_size + 1) :]
                        df1.to_csv(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            ),
                            index=False,
                        )

                if paramData["test_file_path"] == None:
                    dataFile = os.path.join(
                        DATA_PATH_META,
                        f"{today.year}",
                        f"{today.month:02d}",
                        "9999",
                        paramData["test_file_name"],
                    )
                    dataPath = os.path.join(
                        DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                    )
                else:
                    dataPath = paramData["test_file_path"]
                    dataFile = os.path.join(
                        paramData["test_file_path"], paramData["test_file_name"]
                    )

                df1_target = pd.read_csv(dataFile, header=0, parse_dates=True)

                modelArgs = ModelParameters(
                    window_size=window_size,
                    batch_size=paramData["batch_size"],
                    units=16,
                    patience=10,
                )
                inputArgs = InputParameters(
                    filepath=modelPath,
                    filename=modelFile,
                    output_cols=paramData["outputs"],
                    feature_cols=paramData["features"],
                    is_indpds=is_indpds,
                    use_model_yn=paramData["use_model_yn"],
                    real_time_yn=paramData["real_time_yn"],
                    output_file=paramData["output_file"],
                    target_start_date=paramData["target_start_date"],
                    target_last_date=paramData["target_last_date"],
                    resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                    resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    index_column=paramData["index_column"],
                    trgt_col_list=paramData["trgt_col_list"],
                )

                new_index = range(len(df1_target))
                df1_target.index = new_index
                # 처리할 컬럼들만 추림
                if feature_cols == None or feature_cols == "":
                    df1_target = df1_target[output_cols]
                else:
                    data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                    df1_target = df1_target[data_cols]

                m = deepARGenerater.Manager(
                    data=df1_target, modelArgs=modelArgs, inputArgs=inputArgs
                )
                df1_predict = m.dataGenerater_repeat(
                    loop_count=len(df2), auto_save_file=False
                )

                # 인덱스 재정렬
                new_index = range(len(df2))
                df2.index = new_index

                valid_idx = df_ori[index_column].isnull() | (
                    df_ori[index_column] == ""
                )  # 원본에 index_column컬럼의 값이 비어있는 인덱스 가져옴

                print("이전 예측 보정 1", df2, valid_idx)

                # 빈 데이터 값만 예측 보정된 값으로 대체
                for col in output_cols:
                    df2.loc[valid_idx, col] = df1_predict.loc[valid_idx, col]

                print("이전 예측 보정 2", df2)

                # 실제 예측을 할 값으로 df2를 사용할건데 현재 df2갯수가 윈도우 사이즈+1보다 작다면 df1에서 아래부분을 모자란만큼 가져와서 df2 윗쪽에 추가.
                n_add_line = window_size + 1 - len(df2)
                if n_add_line > 0:
                    df1_bottom = df1.tail(n_add_line)
                    df2 = pd.concat([df1_bottom, df2]).reset_index(drop=True)
            else:
                df2 = df

            # 실제 예측
            if paramData["use_model_yn"] == "Y" and paramData["real_time_yn"] == "N":
                test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                    df_source=df2, paramData=paramData
                )
                file_path = test_file_set["resultMessage"]
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData["test_file_path"] = directory
                paramData["test_file_name"] = filename
            else:
                if (
                    os.path.isfile(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        )
                    )
                    == False
                ):
                    df2 = df2.iloc[-(window_size + 1) :]
                    df2.to_csv(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        ),
                        index=False,
                    )

            if paramData["test_file_path"] == None:
                dataFile = os.path.join(
                    DATA_PATH_META,
                    f"{today.year}",
                    f"{today.month:02d}",
                    "9999",
                    paramData["test_file_name"],
                )
                dataPath = os.path.join(
                    DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                )
            else:
                dataPath = paramData["test_file_path"]
                dataFile = os.path.join(
                    paramData["test_file_path"], paramData["test_file_name"]
                )

            modelArgs = ModelParameters(
                window_size=paramData["window_size"],
                batch_size=paramData["batch_size"],
                units=16,
                patience=10,
            )
            inputArgs = InputParameters(
                filepath=modelPath,
                filename=modelFile,
                output_cols=paramData["outputs"],
                feature_cols=paramData["features"],
                is_indpds=is_indpds,
                use_model_yn=paramData["use_model_yn"],
                real_time_yn=paramData["real_time_yn"],
                output_file=paramData["output_file"],
                target_start_date=paramData["target_start_date"],
                target_last_date=paramData["target_last_date"],
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
                index_column=paramData["index_column"],
                trgt_col_list=paramData["trgt_col_list"],
            )

            df2_target = pd.read_csv(dataFile, header=0, parse_dates=True)

            if feature_cols == None or feature_cols == "":
                df2_target = df2_target[output_cols]
            else:
                df2_target = df2_target[output_cols + feature_cols]

            print("최종 입력값", df2_target)

            m = rnnGeneraterMeta.Manager(
                data=df2_target, modelArgs=modelArgs, inputArgs=inputArgs
            )
            df2_predict = m.dataGenerater_repeat(
                loop_count=window_size * count, auto_save_file=False
            )

            if "df1_target" not in locals():
                df_all = df2_predict
            else:
                df2 = df2[[index_column] + output_cols].loc[valid_idx]
                df_all = pd.concat([df2, df2_predict], axis=0)

            print("현재 예측 보정", df2_predict)
            result["result"] = True
            df_all.to_csv(paramData["output_file"], index=False)
            result["resultMessage"] = paramData["output_file"]
            print("데이터", df_all)
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_deepAR_interpolation"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_arima(self, paramData=None):
        """
        ARIMA 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        print(paramData)

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["model_use_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_use_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["model_use_file_path"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        modelArgs = ModelParameters()
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            print(dataFile)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]

            df_ori = pd.read_csv(
                dataFile, header=0, index_col=index_column, parse_dates=True
            )
            # df_ori.set_index(paramData['index_column'], inplace=True)

            df = df_ori[output_cols + feature_cols]
            if paramData["refit"] == "Y":
                refit = True
            else:
                refit = False

            m = arimaGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater(refit=refit)
            print("결과", len(df_ori), len(dt))
            df_ori[output_cols] = dt[output_cols]
            print("합침", df_ori)
            df_ori.to_csv(paramData["output_file"], index=False)
            result["result"] = True
            result["resultMessage"] = paramData["output_file"]
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate arima"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_arima2(self, paramData=None):
        """
        arima 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["test_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["test_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["test_file_path"]
            dataFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )

        dataFile = os.path.join(
            paramData["model_use_file_path"], paramData["model_use_file_name"]
        )
        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        modelArgs = ModelParameters(
            window_size=paramData["window_size"],
            batch_size=paramData["batch_size"],
            units=16,
            patience=10,
        )
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            is_indpds=is_indpds,
            use_model_yn=paramData["use_model_yn"],
            real_time_yn=paramData["real_time_yn"],
            output_file=paramData["output_file"],
            target_start_date=paramData["target_start_date"],
            target_last_date=paramData["target_last_date"],
            resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
            resmpl_intvl_value=paramData["resmpl_intvl_value"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            print(dataFile)
            df = pd.read_csv(dataFile, header=0, parse_dates=True)
            # df.set_index(paramData['index_column'], inplace=True)

            print("1", df)

            if paramData["refit"] == "Y":
                refit = True
            else:
                refit = False

            if feature_cols == None or feature_cols == "":
                # df = df[output_cols]
                df = df[[index_column] + output_cols]
            else:
                data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                # df = df[data_cols]
                df = df[[index_column] + data_cols]

            print("2", df)

            # df = df.iloc[-1000:]
            m = arimaGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )

            dt = m.dataGenerater(
                index_column=index_column, refit=refit, auto_save_file=False
            )

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate arima"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_arima_interpolation(self, paramData=None):
        """
        arima 학습모델에서 데이터 생성(입력 누락 데이터 추론 보간 기능 추가)
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            window_size = paramData["window_size"]
            count = paramData["count"]

            # 입력 파일 로드(샘플링된 데이터.)
            useDataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            df = pd.read_csv(useDataFile, header=0, parse_dates=True)
            print("보간할 데이터", df)
            # df.set_index(paramData['index_column'], inplace=True)

            if paramData["refit"] == "Y":
                refit = True
            else:
                refit = False
            # df = df.iloc[-1000:]
            df_ori = pd.read_csv(
                paramData["original_file"], header=0, parse_dates=True
            )  # 오리지날 파일 로드
            print("오리지날 데이터", df_ori)
            need_interpolation = (
                df_ori[index_column].isnull().any() or df_ori[index_column].eq("").any()
            )  # index_column 비어있는지 체크해서 보간 작업을 수행해야되는지 체크
            if need_interpolation:
                print("보간 수행", need_interpolation)

                # 예측 데이터 보간 예측
                df2 = df.iloc[
                    -(window_size):
                ]  # 보간을 해야될 누락된 데이터가 있는 df의 아래에서부터 window_size+1 만큼의 데이터
                df1 = df.drop(
                    index=df.index[-(window_size):]
                )  # df2를 보간하기 위해서 입력값으로 넣을 df2를 제외한 상단 나머지 데이터

                if (
                    paramData["use_model_yn"] == "Y"
                    and paramData["real_time_yn"] == "N"
                ):
                    test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                        df_source=df1, paramData=paramData
                    )  # df1을 입력값으로 넣을것임
                    file_path = test_file_set["resultMessage"]
                    directory = os.path.dirname(file_path)
                    filename = os.path.basename(file_path)

                    paramData["test_file_path"] = directory
                    paramData["test_file_name"] = filename
                else:
                    if (
                        os.path.isfile(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            )
                        )
                        == False
                    ):
                        df1 = df1.iloc[-(window_size + 1) :]
                        df1.to_csv(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            ),
                            index=False,
                        )

                if paramData["test_file_path"] == None:
                    dataFile = os.path.join(
                        DATA_PATH_META,
                        f"{today.year}",
                        f"{today.month:02d}",
                        "9999",
                        paramData["test_file_name"],
                    )
                    dataPath = os.path.join(
                        DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                    )
                else:
                    dataPath = paramData["test_file_path"]
                    dataFile = os.path.join(
                        paramData["test_file_path"], paramData["test_file_name"]
                    )

                df1_target = pd.read_csv(dataFile, header=0, parse_dates=True)

                modelArgs = ModelParameters(
                    window_size=window_size,
                    batch_size=paramData["batch_size"],
                    units=16,
                    patience=10,
                )
                inputArgs = InputParameters(
                    filepath=modelPath,
                    filename=modelFile,
                    output_cols=paramData["outputs"],
                    feature_cols=paramData["features"],
                    is_indpds=is_indpds,
                    use_model_yn=paramData["use_model_yn"],
                    real_time_yn=paramData["real_time_yn"],
                    output_file=paramData["output_file"],
                    target_start_date=paramData["target_start_date"],
                    target_last_date=paramData["target_last_date"],
                    resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                    resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    index_column=paramData["index_column"],
                    trgt_col_list=paramData["trgt_col_list"],
                )

                new_index = range(len(df1_target))
                df1_target.index = new_index
                # 처리할 컬럼들만 추림
                if feature_cols == None or feature_cols == "":
                    df1_target = df1_target[output_cols]
                else:
                    data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                    df1_target = df1_target[data_cols]

                m = arimaGenerater.Manager(
                    data=df1_target, modelArgs=modelArgs, inputArgs=inputArgs
                )
                df1_predict = m.dataGenerater(refit=False, auto_save_file=False)

                # 인덱스 재정렬
                new_index = range(len(df2))
                df2.index = new_index

                valid_idx = df_ori[index_column].isnull() | (
                    df_ori[index_column] == ""
                )  # 원본에 index_column컬럼의 값이 비어있는 인덱스 가져옴

                print("이전 예측 보정 1", df2, valid_idx)

                # 빈 데이터 값만 예측 보정된 값으로 대체
                for col in output_cols:
                    df2.loc[valid_idx, col] = df1_predict.loc[valid_idx, col]

                print("이전 예측 보정 2", df2)

                # 실제 예측을 할 값으로 df2를 사용할건데 현재 df2갯수가 윈도우 사이즈+1보다 작다면 df1에서 아래부분을 모자란만큼 가져와서 df2 윗쪽에 추가.
                n_add_line = window_size + 1 - len(df2)
                if n_add_line > 0:
                    df1_bottom = df1.tail(n_add_line)
                    df2 = pd.concat([df1_bottom, df2]).reset_index(drop=True)
            else:
                df2 = df

            # 실제 예측
            if paramData["use_model_yn"] == "Y" and paramData["real_time_yn"] == "N":
                test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                    df_source=df2, paramData=paramData
                )
                file_path = test_file_set["resultMessage"]
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData["test_file_path"] = directory
                paramData["test_file_name"] = filename
            else:
                if (
                    os.path.isfile(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        )
                    )
                    == False
                ):
                    df2 = df2.iloc[-(window_size + 1) :]
                    df2.to_csv(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        ),
                        index=False,
                    )

            if paramData["test_file_path"] == None:
                dataFile = os.path.join(
                    DATA_PATH_META,
                    f"{today.year}",
                    f"{today.month:02d}",
                    "9999",
                    paramData["test_file_name"],
                )
                dataPath = os.path.join(
                    DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                )
            else:
                dataPath = paramData["test_file_path"]
                dataFile = os.path.join(
                    paramData["test_file_path"], paramData["test_file_name"]
                )

            modelArgs = ModelParameters(
                window_size=paramData["window_size"],
                batch_size=paramData["batch_size"],
                units=16,
                patience=10,
            )
            inputArgs = InputParameters(
                filepath=modelPath,
                filename=modelFile,
                output_cols=paramData["outputs"],
                feature_cols=paramData["features"],
                is_indpds=is_indpds,
                use_model_yn=paramData["use_model_yn"],
                real_time_yn=paramData["real_time_yn"],
                output_file=paramData["output_file"],
                target_start_date=paramData["target_start_date"],
                target_last_date=paramData["target_last_date"],
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
                index_column=paramData["index_column"],
                trgt_col_list=paramData["trgt_col_list"],
            )

            df2_target = pd.read_csv(dataFile, header=0, parse_dates=True)

            if feature_cols == None or feature_cols == "":
                df2_target = df2_target[output_cols]
            else:
                df2_target = df2_target[output_cols + feature_cols]

            print("최종 입력값", df2_target)

            m = arimaGenerater.Manager(
                data=df2_target, modelArgs=modelArgs, inputArgs=inputArgs
            )
            df2_predict = m.dataGenerater(
                refit=refit, loop_count=count, auto_save_file=False
            )

            if "df1_target" not in locals():
                df_all = df2_predict
            else:
                df2 = df2[[index_column] + output_cols].loc[valid_idx]
                df_all = pd.concat([df2, df2_predict], axis=0)

            print("현재 예측 보정", df2_predict)
            result["result"] = True
            df_all.to_csv(paramData["output_file"], index=False)
            result["resultMessage"] = paramData["output_file"]
            print("데이터", df_all)
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_arima_interpolation"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_brits(self, paramData=None):
        """
        brits 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["model_use_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_use_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["model_use_file_path"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        modelArgs = ModelParameters()
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            print(dataFile)
            df_ori = pd.read_csv(dataFile, header=0, parse_dates=True)
            # df_ori.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            # feature_cols = paramData['features']
            index_column = paramData["index_column"]
            df = df_ori[output_cols]

            m = imputerBritsGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            print("결과", df_ori, dt)

            # 빈 데이터 값만 예측 보정된 값으로 대체
            for col in output_cols:
                valid_idx = df_ori[col].isnull() | (
                    df_ori[col] == ""
                )  # 원본에 컬럼의 값이 비어있는 인덱스 가져옴
                print("valid_idx", valid_idx)
                df_ori.loc[valid_idx, col] = dt.loc[valid_idx, col]

            # df_ori[output_cols] = dt[output_cols]
            print("합침", df_ori)
            df_ori.to_csv(paramData["output_file"], index=False)
            result["result"] = True
            result["resultMessage"] = paramData["output_file"]
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate brits"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_brits_ori(self, paramData=None):
        """
        brits 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["model_use_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_use_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["model_use_file_path"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        modelArgs = ModelParameters()
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            print(dataFile)
            df_ori = pd.read_csv(dataFile, header=0, parse_dates=True)
            # df_ori.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            # feature_cols = paramData['features']
            index_column = paramData["index_column"]
            df = df_ori[output_cols]

            m = imputerBritsGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater_ori()

            print("결과", df_ori, dt)

            # 빈 데이터 값만 예측 보정된 값으로 대체
            for col in output_cols:
                valid_idx = df_ori[col].isnull() | (
                    df_ori[col] == ""
                )  # 원본에 컬럼의 값이 비어있는 인덱스 가져옴
                print("valid_idx", valid_idx)
                df_ori.loc[valid_idx, col] = dt.loc[valid_idx, col]

            # df_ori[output_cols] = dt[output_cols]
            print("합침", df_ori)
            df_ori.to_csv(paramData["output_file"], index=False)
            result["result"] = True
            result["resultMessage"] = paramData["output_file"]
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate brits"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_nbeats(self, paramData=None):
        """
        nbeats 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["test_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["test_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["test_file_path"]
            dataFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        modelArgs = ModelParameters(window_size=paramData["window_size"])
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            feature_cols=paramData["features"],
            is_indpds=is_indpds,
            use_model_yn=paramData["use_model_yn"],
            real_time_yn=paramData["real_time_yn"],
            output_file=paramData["output_file"],
            target_start_date=paramData["target_start_date"],
            target_last_date=paramData["target_last_date"],
            resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
            resmpl_intvl_value=paramData["resmpl_intvl_value"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            df = pd.read_csv(dataFile, header=0, parse_dates=True)
            df.set_index(paramData["index_column"], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            if feature_cols == None or feature_cols == "":
                df = df[output_cols]
            else:
                data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                df = df[data_cols]
            # df = df[output_cols + feature_cols]

            # df = df.iloc[-1000:]
            m = nbeatsGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            result["result"] = True
            result["resultMessage"] = dt
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_nbeats"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_nbeats_interpolation(self, paramData=None):
        """
        deepAR 학습모델에서 데이터 생성(입력 누락 데이터 추론 보간 기능 추가)
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            # 입력 파일 로드(샘플링된 데이터.)
            useDataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            df = pd.read_csv(useDataFile, header=0, parse_dates=True)
            print("보간할 데이터", df)
            # df.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            window_size = paramData["window_size"]
            count = paramData["count"]
            # df = df.iloc[-1000:]
            df_ori = pd.read_csv(
                paramData["original_file"], header=0, parse_dates=True
            )  # 오리지날 파일 로드
            print("오리지날 데이터", df_ori)
            need_interpolation = (
                df_ori[index_column].isnull().any() or df_ori[index_column].eq("").any()
            )  # index_column 비어있는지 체크해서 보간 작업을 수행해야되는지 체크
            if need_interpolation:
                print("보간 수행", need_interpolation)

                # 예측 데이터 보간 예측
                df2 = df.iloc[
                    -(window_size):
                ]  # 보간을 해야될 누락된 데이터가 있는 df의 아래에서부터 window_size+1 만큼의 데이터
                df1 = df.drop(
                    index=df.index[-(window_size):]
                )  # df2를 보간하기 위해서 입력값으로 넣을 df2를 제외한 상단 나머지 데이터

                if (
                    paramData["use_model_yn"] == "Y"
                    and paramData["real_time_yn"] == "N"
                ):
                    test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                        df_source=df1, paramData=paramData
                    )  # df1을 입력값으로 넣을것임
                    file_path = test_file_set["resultMessage"]
                    directory = os.path.dirname(file_path)
                    filename = os.path.basename(file_path)

                    paramData["test_file_path"] = directory
                    paramData["test_file_name"] = filename
                else:
                    if (
                        os.path.isfile(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            )
                        )
                        == False
                    ):
                        df1 = df1.iloc[-(window_size + 1) :]
                        df1.to_csv(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            ),
                            index=False,
                        )

                if paramData["test_file_path"] == None:
                    dataFile = os.path.join(
                        DATA_PATH_META,
                        f"{today.year}",
                        f"{today.month:02d}",
                        "9999",
                        paramData["test_file_name"],
                    )
                    dataPath = os.path.join(
                        DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                    )
                else:
                    dataPath = paramData["test_file_path"]
                    dataFile = os.path.join(
                        paramData["test_file_path"], paramData["test_file_name"]
                    )

                df1_target = pd.read_csv(dataFile, header=0, parse_dates=True)

                modelArgs = ModelParameters(window_size=window_size)
                inputArgs = InputParameters(
                    filepath=modelPath,
                    filename=modelFile,
                    output_cols=paramData["outputs"],
                    feature_cols=paramData["features"],
                    is_indpds=is_indpds,
                    use_model_yn=paramData["use_model_yn"],
                    real_time_yn=paramData["real_time_yn"],
                    output_file=paramData["output_file"],
                    target_start_date=paramData["target_start_date"],
                    target_last_date=paramData["target_last_date"],
                    resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                    resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    index_column=paramData["index_column"],
                    trgt_col_list=paramData["trgt_col_list"],
                )

                new_index = range(len(df1_target))

                df1_target.index = new_index
                # 처리할 컬럼들만 추림
                if feature_cols is None or feature_cols == "":
                    df1_target = df1_target[output_cols]
                else:
                    data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                    df1_target = df1_target[data_cols]

                m = nbeatsGenerater.Manager(
                    data=df1_target, modelArgs=modelArgs, inputArgs=inputArgs
                )
                df1_predict = m.dataGenerater_repeat(
                    loop_count=len(df2), auto_save_file=False
                )

                # 인덱스 재정렬
                new_index = range(len(df2))
                df2.index = new_index

                valid_idx = df_ori[index_column].isnull() | (
                    df_ori[index_column] == ""
                )  # 원본에 index_column컬럼의 값이 비어있는 인덱스 가져옴

                print("이전 예측 보정 1", df2, valid_idx)

                # 빈 데이터 값만 예측 보정된 값으로 대체
                for col in output_cols:
                    df2.loc[valid_idx, col] = df1_predict.loc[valid_idx, col]

                print("이전 예측 보정 2", df2)

                # 실제 예측을 할 값으로 df2를 사용할건데 현재 df2갯수가 윈도우 사이즈+1보다 작다면 df1에서 아래부분을 모자란만큼 가져와서 df2 윗쪽에 추가.
                n_add_line = window_size + 1 - len(df2)
                if n_add_line > 0:
                    df1_bottom = df1.tail(n_add_line)
                    df2 = pd.concat([df1_bottom, df2]).reset_index(drop=True)
            else:
                df2 = df

            # 실제 예측
            if paramData["use_model_yn"] == "Y" and paramData["real_time_yn"] == "N":
                test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                    df_source=df2, paramData=paramData
                )
                file_path = test_file_set["resultMessage"]
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData["test_file_path"] = directory
                paramData["test_file_name"] = filename
            else:
                if (
                    os.path.isfile(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        )
                    )
                    == False
                ):
                    df2 = df2.iloc[-(window_size + 1) :]
                    df2.to_csv(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        ),
                        index=False,
                    )

            if paramData["test_file_path"] == None:
                dataFile = os.path.join(
                    DATA_PATH_META,
                    f"{today.year}",
                    f"{today.month:02d}",
                    "9999",
                    paramData["test_file_name"],
                )
                dataPath = os.path.join(
                    DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                )
            else:
                dataPath = paramData["test_file_path"]
                dataFile = os.path.join(
                    paramData["test_file_path"], paramData["test_file_name"]
                )

            modelArgs = ModelParameters(window_size=paramData["window_size"])
            inputArgs = InputParameters(
                filepath=modelPath,
                filename=modelFile,
                output_cols=paramData["outputs"],
                feature_cols=paramData["features"],
                is_indpds=is_indpds,
                use_model_yn=paramData["use_model_yn"],
                real_time_yn=paramData["real_time_yn"],
                output_file=paramData["output_file"],
                target_start_date=paramData["target_start_date"],
                target_last_date=paramData["target_last_date"],
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
                index_column=paramData["index_column"],
                trgt_col_list=paramData["trgt_col_list"],
            )

            df2_target = pd.read_csv(dataFile, header=0, parse_dates=True)

            if feature_cols == None or feature_cols == "":
                df2_target = df2_target[output_cols]
            else:
                df2_target = df2_target[output_cols + feature_cols]

            print("최종 입력값", df2_target)

            m = nbeatsGenerater.Manager(
                data=df2_target, modelArgs=modelArgs, inputArgs=inputArgs
            )
            df2_predict = m.dataGenerater_repeat(
                loop_count=window_size * count, auto_save_file=False
            )

            if "df1_target" not in locals():
                df_all = df2_predict
            else:
                df2 = df2[[index_column] + output_cols].loc[valid_idx]
                df_all = pd.concat([df2, df2_predict], axis=0)

            print("현재 예측 보정", df2_predict)
            result["result"] = True
            df_all.to_csv(paramData["output_file"], index=False)
            result["resultMessage"] = paramData["output_file"]
            print("데이터", df_all)
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_nbeats_interpolation"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def augmentCreate_naomi(self, paramData=None):
        """
        naomi 학습모델에서 데이터 생성
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] == None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["model_use_file_path"] == None:
            dataFile = os.path.join(
                DATA_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_use_file_name"],
            )
            dataPath = os.path.join(
                DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            dataPath = paramData["model_use_file_path"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )

        # 운영시 주석
        # dataPath = 'dt_data_api\\storage\\data\\2023\\04\\0000\\'
        # dataFile = 'dt_data_api\\storage\\data\\2023\\04\\0000\\' + filename
        # modelFilepath = 'dt_data_api\\storage\\model\\2023\\04\\0000\\'

        modelArgs = ModelParameters(window_size=paramData["windowSize"])
        inputArgs = InputParameters(
            filepath=modelPath,
            filename=modelFile,
            output_cols=paramData["outputs"],
            index_column=paramData["index_column"],
            trgt_col_list=paramData["trgt_col_list"],
        )

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)
            print(dataFile)
            df_ori = pd.read_csv(dataFile, header=0, parse_dates=True)
            # df_ori.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            # feature_cols = paramData['features']
            index_column = paramData["index_column"]
            df = df_ori[output_cols]

            m = imputerNaomiGenerater.Manager(
                data=df, modelArgs=modelArgs, inputArgs=inputArgs
            )
            dt = m.dataGenerater()

            print("결과", df_ori, dt)

            # 빈 데이터 값만 예측 보정된 값으로 대체
            for col in output_cols:
                valid_idx = df_ori[col].isnull() | (
                    df_ori[col] == ""
                )  # 원본에 컬럼의 값이 비어있는 인덱스 가져옴
                print("valid_idx", valid_idx)
                df_ori.loc[valid_idx, col] = dt.loc[valid_idx, col]

            # df_ori[output_cols] = dt[output_cols]
            print("합침", df_ori)
            df_ori.to_csv(paramData["output_file"], index=False)
            result["result"] = True
            result["resultMessage"] = paramData["output_file"]
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate naomi"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def calcModelTestDataTargetDate_dataFrame(self, df_source, paramData=None, index=0):
        result = {"result": False, "resultMessage": None}
        # current_year = str(datetime.now().year)

        try:
            set_start_date = datetime.strptime(
                paramData["target_start_date"], "%Y-%m-%d %H:%M:%S"
            )
            set_last_date = datetime.strptime(
                paramData["target_last_date"], "%Y-%m-%d %H:%M:%S"
            )

            index_col = paramData["index_column"]
            dataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            testFile = os.path.join(
                paramData["test_file_path"], paramData["test_file_name"]
            )
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            os.makedirs(paramData["test_file_path"], exist_ok=True)
            # df=pd.read_csv(dataFile, header=0, parse_dates=True)
            df = pd.DataFrame(df_source)
            df[index_col] = pd.to_datetime(df[index_col])

            print("============간격체크==========")
            intvl_param = calculate_most_common_interval(df, index_col)
            # print(intvl_param['interval_type'])
            # print(intvl_param['interval_value'])
            paramData["resmpl_intvl_tp"] = intvl_param["interval_type"]
            paramData["resmpl_intvl_value"] = intvl_param["interval_value"]

            year_range = df[index_col].dt.year.unique()
            year_range = pd.Series(year_range).sort_values(ascending=False).to_numpy()

            test_data_start_date = None
            test_data_last_date = None
            time_check_yn = None
            data_frame = None
            index_col_date = None

            for index, year in enumerate(year_range):
                if paramData["resmpl_intvl_tp"] == "days":
                    index_col_date = df[index_col].dt.strftime("%m-%d 00:00:00")
                    target_start_date = set_start_date.strftime("%m-%d 00:00:00")
                    target_last_date = set_last_date.strftime("%m-%d 00:00:00")
                elif paramData["resmpl_intvl_tp"] == "hours":
                    index_col_date = df[index_col].dt.strftime("%m-%d %H:00:00")
                    target_start_date = set_start_date.strftime("%m-%d %H:00:00")
                    target_last_date = set_last_date.strftime("%m-%d %H:00:00")
                elif paramData["resmpl_intvl_tp"] == "minutes":
                    index_col_date = df[index_col].dt.strftime("%m-%d %H:%M:00")
                    target_start_date = set_start_date.strftime("%m-%d %H:%M:00")
                    target_last_date = set_last_date.strftime("%m-%d %H:%M:00")
                elif paramData["resmpl_intvl_tp"] == "seconds":
                    index_col_date = df[index_col].dt.strftime("%m-%d %H:%M:%S")
                    target_start_date = set_start_date.strftime("%m-%d %H:%M:%S")
                    target_last_date = set_last_date.strftime("%m-%d %H:%M:%S")
                else:
                    index_col_date = None
                    target_start_date = None
                    target_last_date = None

                if (
                    df[
                        (df[index_col].dt.year == year)
                        & (index_col_date == target_last_date)
                    ].shape[0]
                    > 0
                ):
                    print(f" 매칭 있음")
                    time_check_yn = "Y"
                    data_frame = None
                    test_data_last_date = str(year) + "-" + target_last_date
                    test_data_start_date = str(year) + "-" + target_start_date

                    break
                else:
                    print(f" 다 없음")

                    time_check_yn = "N"
                    row_count = self.calcModelDataDateTermRowCount(
                        start_time=target_start_date,
                        end_time=target_last_date,
                        resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                        resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    )

                    test_row_count = row_count + paramData["window_size"]
                    print("row_count", row_count)
                    print("paramData['window_size']", paramData["window_size"])
                    print("df", df)
                    df = df.iloc[-test_row_count:]
                    data_frame = df.reset_index(drop=True)

            test_file_path = self.makeCsvUseModelTestFile_dataFrame(
                df=df_source,
                test_file_path=testFile,
                index_col=index_col,
                start_date=test_data_start_date,
                end_date=test_data_last_date,
                window_size=paramData["window_size"],
                time_check_yn=time_check_yn,
                data_frame=data_frame,
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
            )

            result["result"] = True
            result["resultMessage"] = test_file_path

        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "calcModelTestDataTargetDate_dataFrame"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result

    def calcModelDataDateTermRowCount(
        self,
        start_time=None,
        end_time=None,
        resmpl_intvl_tp=None,
        resmpl_intvl_value=None,
    ):
        result = None
        current_year = datetime.now().year
        start_time = datetime.strptime(
            str(current_year) + "-" + start_time, "%Y-%m-%d %H:%M:%S"
        )
        end_time = datetime.strptime(
            str(current_year) + "-" + end_time, "%Y-%m-%d %H:%M:%S"
        )

        time_row_check = end_time - start_time
        row_term = None

        # resmpl_intvl_tp='seconds'
        # resmpl_intvl_value=5

        if resmpl_intvl_tp == "hours":
            row_term = timedelta(hours=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        elif resmpl_intvl_tp == "minutes":
            row_term = timedelta(minutes=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        elif resmpl_intvl_tp == "seconds":
            row_term = timedelta(seconds=resmpl_intvl_value)

            time_row_check.total_seconds()
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        elif resmpl_intvl_tp == "days":
            row_term = timedelta(days=resmpl_intvl_value)
            result = int(time_row_check.total_seconds() / row_term.total_seconds())
        else:
            result = None

        return result

    def makeCsvUseModelTestFile(
        self,
        file_path=None,
        test_file_path=None,
        index_col=None,
        start_date=None,
        end_date=None,
        window_size=None,
        time_check_yn=None,
        data_frame=None,
        resmpl_intvl_tp=None,
        resmpl_intvl_value=None,
    ):
        if time_check_yn == "Y":
            df = pd.read_csv(file_path, header=0, parse_dates=True)
            df[index_col] = pd.to_datetime(df[index_col])

            start_date = pd.to_datetime(start_date)
            end_date = pd.to_datetime(end_date)
            start_index = None

            start_index = df[
                df[index_col] >= (start_date - pd.DateOffset(days=window_size))
            ].index[0]

            if resmpl_intvl_tp == "days":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(days=window_size))
                ].index[0]
            elif resmpl_intvl_tp == "hours":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(hours=window_size))
                ].index[0]
            elif resmpl_intvl_tp == "minutes":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(minutes=window_size))
                ].index[0]
            elif resmpl_intvl_tp == "seconds":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(seconds=window_size))
                ].index[0]
            else:
                start_index = None

            end_index = df[df[index_col] <= end_date].index[-1]
            df_cut = df.loc[start_index:end_index]

            # new_year = date.today().year
            # df_cut[index_col] = df_cut[index_col].apply(
            #     lambda x: x.replace(year=new_year).strftime("%Y-%m-%d %H:%M:%S")
            # )
            ref_date = pd.to_datetime(start_date) if start_date else datetime.now()
            new_year = ref_date.year
            df_cut[index_col] = df_cut[index_col].apply(
                lambda x: x.replace(year=new_year).strftime("%Y-%m-%d %H:%M:%S")
            )
            df_cut.to_csv(test_file_path, index=False)
        else:
            data_frame.to_csv(test_file_path, index=False)
        return test_file_path

    def makeCsvUseModelTestFile_dataFrame(
        self,
        df,
        test_file_path=None,
        index_col=None,
        start_date=None,
        end_date=None,
        window_size=None,
        time_check_yn=None,
        data_frame=None,
        resmpl_intvl_tp=None,
        resmpl_intvl_value=None,
    ):
        if time_check_yn == "Y":
            # df=pd.read_csv(file_path, header=0, parse_dates=True)
            df[index_col] = pd.to_datetime(df[index_col])

            start_date = pd.to_datetime(start_date)
            end_date = pd.to_datetime(end_date)
            start_index = None

            start_index = df[
                df[index_col] >= (start_date - pd.DateOffset(days=window_size))
            ].index[0]

            if resmpl_intvl_tp == "days":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(days=window_size))
                ].index[0]
            elif resmpl_intvl_tp == "hours":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(hours=window_size))
                ].index[0]
            elif resmpl_intvl_tp == "minutes":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(minutes=window_size))
                ].index[0]
            elif resmpl_intvl_tp == "seconds":
                start_index = df[
                    df[index_col] > (start_date - pd.DateOffset(seconds=window_size))
                ].index[0]
            else:
                start_index = None

            end_index = df[df[index_col] <= end_date].index[-1]
            df_cut = df.loc[start_index:end_index]

            # new_year = date.today().year
            # df_cut[index_col] = df_cut[index_col].apply(
            #     lambda x: x.replace(year=new_year).strftime("%Y-%m-%d %H:%M:%S")
            # )
            ref_date = pd.to_datetime(start_date) if start_date else datetime.now()
            new_year = ref_date.year
            df_cut[index_col] = df_cut[index_col].apply(
                lambda x: x.replace(year=new_year).strftime("%Y-%m-%d %H:%M:%S")
            )
            
            df_cut.to_csv(test_file_path, index=False)
        else:
            data_frame.to_csv(test_file_path, index=False)
        return test_file_path

    def augmentCreate_seg_rnn_interpolation(self, paramData=None):
        """
        RNN 학습모델에서 데이터 생성(입력 누락 데이터 추론 보간 기능 추가)
        Args:
            paramData(any): 데이터증강 파라메터
        Returns: 결과여부, 데이터 값
            {'result': False, 'resultMessage':None}
        """
        result = {"result": False, "resultMessage": None}
        errorMsg = ""

        today = date.today()
        if paramData["model_file_path"] is None:
            modelFile = os.path.join(
                MODEL_PATH_META,
                f"{today.year}",
                f"{today.month:02d}",
                "9999",
                paramData["model_file_name"],
            )
            modelPath = os.path.join(
                MODEL_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
            )
        else:
            modelPath = paramData["model_file_path"]
            modelFile = os.path.join(
                paramData["model_file_path"], paramData["model_file_name"]
            )

        if paramData["features"]:
            is_indpds = True
        else:
            is_indpds = False

        try:
            # df=pd.read_csv(dataFile, header=0, index_col=paramData['index_column'], parse_dates=True)

            # 입력 파일 로드(샘플링된 데이터.)
            useDataFile = os.path.join(
                paramData["model_use_file_path"], paramData["model_use_file_name"]
            )
            df = pd.read_csv(useDataFile, header=0, parse_dates=True)
            print("보간할 데이터", df)
            # df.set_index(paramData['index_column'], inplace=True)
            output_cols = paramData["outputs"]
            feature_cols = paramData["features"]
            index_column = paramData["index_column"]
            window_size = paramData["window_size"]
            count = paramData["count"]
            # df = df.iloc[-1000:]
            df_ori = pd.read_csv(
                paramData["original_file"], header=0, parse_dates=True
            )  # 오리지날 파일 로드
            print("오리지날 데이터", df_ori)
            need_interpolation = (
                df_ori[index_column].isnull().any() or df_ori[index_column].eq("").any()
            )  # index_column 비어있는지 체크해서 보간 작업을 수행해야되는지 체크
            if need_interpolation:
                print("보간 수행", need_interpolation)

                # 예측 데이터 보간 예측
                df2 = df.iloc[
                    -(window_size):
                ]  # 보간을 해야될 누락된 데이터가 있는 df의 아래에서부터 window_size+1 만큼의 데이터
                df1 = df.drop(
                    index=df.index[-(window_size):]
                )  # df2를 보간하기 위해서 입력값으로 넣을 df2를 제외한 상단 나머지 데이터

                if (
                    paramData["use_model_yn"] == "Y"
                    and paramData["real_time_yn"] == "N"
                ):
                    test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                        df_source=df1, paramData=paramData
                    )  # df1을 입력값으로 넣을것임
                    file_path = test_file_set["resultMessage"]
                    directory = os.path.dirname(file_path)
                    filename = os.path.basename(file_path)

                    paramData["test_file_path"] = directory
                    paramData["test_file_name"] = filename
                else:
                    if not os.path.isfile(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        )
                    ):
                        df1 = df1.iloc[-(window_size + 1) :]
                        df1.to_csv(
                            os.path.join(
                                paramData["test_file_path"], paramData["test_file_name"]
                            ),
                            index=False,
                        )

                if paramData["test_file_path"] is None:
                    dataFile = os.path.join(
                        DATA_PATH_META,
                        f"{today.year}",
                        f"{today.month:02d}",
                        "9999",
                        paramData["test_file_name"],
                    )
                    dataPath = os.path.join(
                        DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                    )
                else:
                    dataPath = paramData["test_file_path"]
                    dataFile = os.path.join(
                        paramData["test_file_path"], paramData["test_file_name"]
                    )

                df1_target = pd.read_csv(dataFile, header=0, parse_dates=True)

                modelArgs = ModelParameters(
                    model_type=MD_TYPE.SEG_RNN,
                    window_size=window_size,
                    batch_size=paramData["batch_size"],
                    units=16,
                    patience=10,
                )
                inputArgs = InputParameters(
                    filepath=modelPath,
                    filename=modelFile,
                    output_cols=paramData["outputs"],
                    feature_cols=paramData["features"],
                    is_indpds=is_indpds,
                    use_model_yn=paramData["use_model_yn"],
                    real_time_yn=paramData["real_time_yn"],
                    output_file=paramData["output_file"],
                    target_start_date=paramData["target_start_date"],
                    target_last_date=paramData["target_last_date"],
                    resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                    resmpl_intvl_value=paramData["resmpl_intvl_value"],
                    index_column=paramData["index_column"],
                    trgt_col_list=paramData["trgt_col_list"],
                )

                new_index = range(len(df1_target))
                df1_target.index = new_index
                # 처리할 컬럼들만 추림
                if feature_cols is None or feature_cols == "":
                    df1_target = df1_target[output_cols]
                else:
                    df1_target = df1_target[output_cols + feature_cols]

                m = rnnGeneraterMeta.Manager(
                    data=df1_target, modelArgs=modelArgs, inputArgs=inputArgs
                )
                df1_predict = m.dataGenerater_repeat(
                    loop_count=len(df2), auto_save_file=False
                )

                # 인덱스 재정렬
                new_index = range(len(df2))
                df2.index = new_index

                valid_idx = df_ori[index_column].isnull() | (
                    df_ori[index_column] == ""
                )  # 원본에 index_column컬럼의 값이 비어있는 인덱스 가져옴

                print("이전 예측 보정 1", df2, valid_idx)

                # 빈 데이터 값만 예측 보정된 값으로 대체
                for col in output_cols:
                    df2.loc[valid_idx, col] = df1_predict.loc[valid_idx, col]

                print("이전 예측 보정 2", df2)

                # 실제 예측을 할 값으로 df2를 사용할건데 현재 df2갯수가 윈도우 사이즈+1보다 작다면 df1에서 아래부분을 모자란만큼 가져와서 df2 윗쪽에 추가.
                n_add_line = window_size + 1 - len(df2)
                if n_add_line > 0:
                    df1_bottom = df1.tail(n_add_line)
                    df2 = pd.concat([df1_bottom, df2]).reset_index(drop=True)
            else:
                df2 = df

            # 실제 예측
            if paramData["use_model_yn"] == "Y" and paramData["real_time_yn"] == "N":
                test_file_set = self.calcModelTestDataTargetDate_dataFrame(
                    df_source=df2, paramData=paramData
                )
                file_path = test_file_set["resultMessage"]
                directory = os.path.dirname(file_path)
                filename = os.path.basename(file_path)

                paramData["test_file_path"] = directory
                paramData["test_file_name"] = filename
            else:
                if not os.path.isfile(
                    os.path.join(
                        paramData["test_file_path"], paramData["test_file_name"]
                    )
                ):
                    df2 = df2.iloc[-(window_size + 1) :]
                    df2.to_csv(
                        os.path.join(
                            paramData["test_file_path"], paramData["test_file_name"]
                        ),
                        index=False,
                    )

            if paramData["test_file_path"] is None:
                dataFile = os.path.join(
                    DATA_PATH_META,
                    f"{today.year}",
                    f"{today.month:02d}",
                    "9999",
                    paramData["test_file_name"],
                )
                dataPath = os.path.join(
                    DATA_PATH_META, f"{today.year}", f"{today.month:02d}", "9999"
                )
            else:
                dataPath = paramData["test_file_path"]
                dataFile = os.path.join(
                    paramData["test_file_path"], paramData["test_file_name"]
                )

            modelArgs = ModelParameters(
                model_type=MD_TYPE.SEG_RNN,
                window_size=paramData["window_size"],
                batch_size=paramData["batch_size"],
                units=16,
                patience=10,
            )
            inputArgs = InputParameters(
                filepath=modelPath,
                filename=modelFile,
                output_cols=paramData["outputs"],
                feature_cols=paramData["features"],
                is_indpds=is_indpds,
                use_model_yn=paramData["use_model_yn"],
                real_time_yn=paramData["real_time_yn"],
                output_file=paramData["output_file"],
                target_start_date=paramData["target_start_date"],
                target_last_date=paramData["target_last_date"],
                resmpl_intvl_tp=paramData["resmpl_intvl_tp"],
                resmpl_intvl_value=paramData["resmpl_intvl_value"],
                index_column=paramData["index_column"],
                trgt_col_list=paramData["trgt_col_list"],
            )

            df2_target = pd.read_csv(dataFile, header=0, parse_dates=True)

            if feature_cols is None or feature_cols == "":
                df2_target = df2_target[output_cols]
            else:
                data_cols = output_cols + list(set(feature_cols) - set(output_cols))
                df2_target = df2_target[data_cols]

            print("최종 입력값", df2_target)

            m = rnnGeneraterMeta.Manager(
                data=df2_target, modelArgs=modelArgs, inputArgs=inputArgs
            )
            df2_predict = m.dataGenerater_repeat(
                loop_count=window_size * count, auto_save_file=False
            )

            if "df1_target" not in locals():
                df_all = df2_predict
            else:
                df2 = df2[[index_column] + output_cols].loc[valid_idx]
                df_all = pd.concat([df2, df2_predict], axis=0)

            print("현재 예측 보정", df2_predict)
            result["result"] = True
            df_all.to_csv(paramData["output_file"], index=False)
            result["resultMessage"] = paramData["output_file"]
            print("데이터", df_all)
        except Exception as e:
            # for m in e.args:
            #     errorMsg += str(m) + '-'
            # errorMsg = errorMsg[:-1]
            # logging.error(errorMsg)

            errorMsg = exceptionMessage(
                e, ERROR_CODE.AUGMENT.value, "augmentCreate_interpolation"
            )
            result["result"] = False
            result["resultMessage"] = errorMsg

        return result


def calculate_most_common_interval(df, index_col):
    # 마지막 5개 행 추출
    last_5_rows = df.tail(5)

    # 시간 차이 계산 (초 단위)
    time_diffs = last_5_rows[index_col].diff().dropna().dt.total_seconds()

    # 빈도가 가장 높은 간격 계산
    most_common_diff = Counter(time_diffs).most_common(1)[0][0]

    # 결과 저장을 위한 딕셔너리 초기화
    paramData = {"interval_type": "", "interval_value": 0}

    if most_common_diff <= 60:
        paramData["interval_type"] = "seconds"
        paramData["interval_value"] = most_common_diff
    elif most_common_diff <= 3600:
        paramData["interval_type"] = "minutes"
        paramData["interval_value"] = most_common_diff / 60
    elif most_common_diff <= 86400:
        paramData["interval_type"] = "hours"
        paramData["interval_value"] = most_common_diff / 3600
    else:
        paramData["interval_type"] = "days"
        paramData["interval_value"] = most_common_diff / 86400

    return paramData
