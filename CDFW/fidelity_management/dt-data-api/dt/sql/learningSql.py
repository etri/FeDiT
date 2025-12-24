from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)

class learningQuery():
    '''
    학습모델 생성 데이터
    ---
    학습모델 결과 LOSS, FID 등
    '''
    query = ExecuteQuery

    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.query = ExecuteQuery(database.value)
    
    def fitSave(self, modelID=None, loss=None, data=None, metericsType=None, meterics=None):
        '''
        학습 결과 저장
        Args:
            modelID(any): 모델ID
            loss(any): 손실 유형
            data(any): 데이터 값
        '''
        try:
            dt = []
            for i in range(len(data)):
                dt.append((modelID, loss, i+1, data.iloc[i]['loss'], data.iloc[i]['val_loss'], metericsType, data.iloc[i][meterics], data.iloc[i]['val_' + meterics]))

            queryData = '''
                INSERT INTO TB_MODEL_LOSS(MODEL_SEQ, VRFC_TP, EPOCHS, LOSS, VRFC_LOSS, METRICS_TP, METRICS, VRFC_METRICS, USE_YN, DEL_YN) VALUES(
                    %s, %s, %s, %s, %s, %s, %s, %s, 'Y', 'N' 
                )
            '''

            self.query.execute_bulk(queryData, dt)
        except Exception as e:
            raise e        

    def fidSave(self, modelID=None, data=None):
        '''
        학습 평가 저장
        Args:
            modelID(any): 모델ID
            data(any): 데이터 값
        '''
        try:
            dt = []
            for d in data:
                dt.append((modelID, d[0], d[1], d[2], d[3], d[4]))

            queryData = '''
                INSERT INTO TB_MODEL_FID(MODEL_SEQ, EPOCHS, FID_SCORE, REAL_FILE_NM, FAKE_FILE_NM, REAL_FAKE_FILE_NM, USE_YN, DEL_YN) VALUES(
                    %s, %s, %s, %s, %s, %s, 'Y', 'N' 
                )
            '''

            self.query.execute_bulk(queryData, dt)
        except Exception as e:
            raise e        
