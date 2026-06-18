from dt_data_api.common.lib import DB_NAME, ExecuteQuery


class learningQueryMeta:
    """
    학습모델 생성 데이터
    ---
    학습모델 결과 LOSS, FID 등
    """

    query = ExecuteQuery

    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.query = ExecuteQuery(database.value)

    def fitSave(
        self, modelID=None, loss=None, data=None, metericsType=None, meterics=None
    ):
        """
        학습 결과 저장
        Args:
            modelID(any): 모델ID
            loss(any): 손실 유형
            data(any): 데이터 값
        """
        try:
            dt = []
            for i in range(len(data)):
                # nan이 아닐 때
                if not (
                    data.iloc[i]["loss"] != data.iloc[i]["loss"]
                    or data.iloc[i]["val_loss"] != data.iloc[i]["val_loss"]
                    or data.iloc[i][meterics] != data.iloc[i][meterics]
                    or data.iloc[i]["val_" + meterics]
                    != data.iloc[i]["val_" + meterics]
                ):
                    dt.append(
                        (
                            modelID,
                            loss,
                            i + 1,
                            data.iloc[i]["loss"],
                            data.iloc[i]["val_loss"],
                            metericsType,
                            data.iloc[i][meterics],
                            data.iloc[i]["val_" + meterics],
                        )
                    )

            queryData = """
                INSERT INTO TB_META_MODEL_LOSS(MODEL_SEQ, VRFC_TP, EPOCHS, LOSS, VRFC_LOSS, METRICS_TP, METRICS, VRFC_METRICS, USE_YN, DEL_YN) VALUES(
                    %s, %s, %s, %s, %s, %s, %s, %s, 'Y', 'N' 
                )
            """

            self.query.execute_bulk(queryData, dt)
        except Exception as e:
            raise e

    def fidSave(self, modelID=None, data=None):
        """
        학습 평가 저장
        Args:
            modelID(any): 모델ID
            data(any): 데이터 값
        """
        try:
            dt = []
            for d in data:
                dt.append((modelID, d[0], d[1], d[2], d[3], d[4]))

            queryData = """
                INSERT INTO TB_META_MODEL_FID(MODEL_SEQ, EPOCHS, FID_SCORE, REAL_FILE_NM, FAKE_FILE_NM, REAL_FAKE_FILE_NM, USE_YN, DEL_YN) VALUES(
                    %s, %s, %s, %s, %s, %s, 'Y', 'N' 
                )
            """

            self.query.execute_bulk(queryData, dt)
        except Exception as e:
            raise e

    def xaiSave(self, modelID=None, data=None):
        """
        학습 결과 저장
        Args:
            modelID (int): 모델 ID
            data (str): 데이터 값
        """
        try:
            if modelID is None or data is None:
                raise ValueError("modelID와 data는 필수 입력값입니다.")

            # 데이터 준비
            dt = [(data, modelID)]

            # SQL 쿼리 정의
            queryData = """
                INSERT INTO TB_META_MODEL_XAI (SHAP, MODEL_SEQ, USE_YN, DEL_YN) 
                VALUES (%s, %s, 'Y', 'N')
            """

            self.query.execute_bulk(queryData, dt)

        except Exception as e:
            print(f"데이터 저장 중 오류 발생: {e}")
            raise  # 에러 재발생
