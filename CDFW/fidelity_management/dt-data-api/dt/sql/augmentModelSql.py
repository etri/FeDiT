from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class augmentModelQuery():
    '''
    데이터증강 학습모델 데이터
    ---
    학습모델 결과 LOSS, FID 등
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
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
                INSERT INTO TB_AUGMENT_MODEL_LOSS(MODEL_SEQ, VRFC_TP, EPOCHS, LOSS, VRFC_LOSS, METRICS_TP, METRICS, VRFC_METRICS, USE_YN, DEL_YN) VALUES(
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

    def modelList(self, pageParam=None, search=None, sort=None):
        '''
        학습모델 목록
        Args:
            pageParam(any): 페이지정보
        '''
        result = None

        try:                    
            queryData = '''
                SELECT MODEL_SEQ
                    , PPRCS_SEQ
                    , MODEL_NM
                    , MODEL_DERPN
                    , MODEL_ALGRM_SEQ
                    , LEARNING_BGNG_DT
                    , LEARNING_END_DT
                    , MODEL_STATUS
                    , RLS_YN
                    , USE_YN
                    , DEL_YN
                    , REG_USER_SEQ
                    , DATE_FORMAT(REG_DT, '%Y-%m-%d %H:%i') AS REG_DT
                    , REG_IP
                    , MDFCN_USER_SEQ
                    , DATE_FORMAT(MDFCN_DT, '%Y-%m-%d %H:%i') AS MDFCN_DT
                    , MDFCN_IP
                    , DEL_USER_SEQ
                    , DEL_DT
                    , DEL_IP
                FROM TB_AUGMENT_MODEL
                WHERE 1=1
                {0}
                {1}
            '''
            
            queryData = str.format(queryData, ('' if search==None else search), ('' if sort==None else sort))            
            pageData = Page.paging(pageParam)
            queryData = Page.makeQuery(queryData, pageData)
            
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result

    def modelRegistration(self, paramData=None):
        '''
        학습모델 등록
        Args:
            paramData(any): 학습모델 정보
        Returns: 모델 등록 정보
            result
        '''
        result = None

        try:    
            modelData = paramData['model_data']
            queryParam = {
                'model_seq': None,
                'pprcs_seq' : modelData["pprcs_seq"],
                'model_nm' : modelData["model_nm"],
                'model_derpn' : modelData["model_derpn"],
                'model_algrm_seq' : modelData["model_algrm_seq"],
                'learning_bgng_dt': modelData["learning_bgng_dt"],
                'learning_end_dt': modelData["learning_end_dt"],
                'model_status': 'R',
                'rls_yn': modelData["rls_yn"],
                'use_yn': 'Y',
                'del_yn': 'N',
                'reg_user_seq': modelData["reg_user_seq"],
                'reg_ip': modelData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_AUGMENT_MODEL (
                    PPRCS_SEQ, MODEL_NM, MODEL_DERPN, MODEL_ALGRM_SEQ, LEARNING_BGNG_DT, LEARNING_END_DT, 
                    MODEL_STATUS, RLS_YN, USE_YN, DEL_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(pprcs_seq)s, %(model_nm)s, %(model_derpn)s, %(model_algrm_seq)s, %(learning_bgng_dt)s, %(learning_end_dt)s, 
                    %(model_status)s, %(rls_yn)s, %(use_yn)s, %(del_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            with transaction.atomic(using=self.databases):
                id = self.query.execute_t_return(queryData, queryParam) 
                self.modelItemAdd(paramData=paramData['model_item'], modelSeq=id)
                self.modelParamsAdd(paramData=paramData['model_params'], modelSeq=id)
                
                if id:
                    result = queryParam
                    result["model_seq"] = id
                
        except Exception as e:            
            raise e  
        
        return result
    
    def modelItemAdd(self, paramData=None, modelSeq=None):
        '''
        학습모델 종속/독립 변수 등록
        Args:
            paramData(any): 모델 변수 정보
            modelSeq(any): 모델 식별자
        '''
        try:                    
            for item in paramData:
                queryParam = {
                    'model_seq': modelSeq,
                    'model_col_tp': item['model_col_tp'],
                    'model_col_nm': item['model_col_nm']
                }

                queryData = '''
                    INSERT INTO TB_AUGMENT_MODEL_COLUMN(
                        MODEL_SEQ, MODEL_COL_TP, MODEL_COL_NM
                    ) VALUES (
                        %(model_seq)s, %(model_col_tp)s, %(model_col_nm)s
                    )
                '''
                
                self.query.execute_t_return(queryData, queryParam)                                                        
        except Exception as e:            
            raise e  
    
    def modelItemDel(self, modelSeq=None):
        '''
        학습모델 종속/독립 변수 삭제
        Args:            
            modelSeq(any): 모델 식별자
        '''
        try:                    
            queryParam = {
                'model_seq': modelSeq                    
            }

            queryData = '''
                UPDATE TB_AUGMENT_MODEL_COLUMN SET
                    DEL_YN='Y'
                WHERE MODEL_SEQ=%(model_seq)s                    
            '''
            
            self.query.execute_t(queryData, queryParam)
        except Exception as e:            
            raise e  
    
    def modelParamsAdd(self, paramData=None, modelSeq=None):
        '''
        학습모델 파라메터 설정 값 등록
        Args:
            paramData(any): 모델 변수 정보
            modelSeq(any): 모델 식별자
        '''

        try:                    
            model_algram_seq = paramData['model_algram_seq']

            for item in paramData['items']:
                queryParam = {
                    'model_seq': modelSeq,
                    'model_algram_seq': model_algram_seq,
                    'model_params_item_seq': item['model_params_item_seq'],
                    'model_params_item_value': item['model_params_item_value']
                }

                queryData = '''
                    INSERT INTO TB_AUGMENT_MODEL_PARAMS (
                        MODEL_SEQ, MODEL_ALGRM_SEQ, MODEL_PARAMS_ITEM_SEQ, MODEL_PARAMS_ITEM_VALUE
                    ) VALUES (
                        %(model_seq)s, %(model_algram_seq)s, %(model_params_item_seq)s, %(model_params_item_value)s
                    )
                '''

                self.query.execute_t_return(queryData, queryParam)                                                       
        except Exception as e:            
            raise e   

    def modelParamsDel(self, modelSeq=None):
        '''
        학습모델 파라메터 설정 값 삭제
        Args:            
            modelSeq(any): 모델 식별자
        '''

        try:                    
            queryParam = {
                'model_seq': modelSeq                    
            }

            queryData = '''
                UPDATE TB_AUGMENT_MODEL_PARAMS SET
                    DEL_YN='Y'
                WHERE MODEL_SEQ=%(model_seq)s                
            '''

            self.query.execute_t(queryData, queryParam)                                                       
        except Exception as e:            
            raise e    
               
    
    def modelUpdate(self, paramData=None):
        '''
        학습모델 수정
        Args:
            paramData(any): 학습모델 정보
        Returns: 모델 수정 정보
            result
        '''
        result = None

        try:    
            modelData = paramData['model_data']
            queryParam = {
                'model_seq': modelData["model_seq"],
                'pprcs_seq' : modelData["pprcs_seq"],
                'model_nm' : modelData["model_nm"],
                'model_derpn' : modelData["model_derpn"],
                'model_algrm_seq' : modelData["model_algrm_seq"],
                'learning_bgng_dt': modelData["learning_bgng_dt"],
                'learning_end_dt': modelData["learning_end_dt"],
                'rls_yn': modelData["rls_yn"],
                'use_yn': modelData["use_yn"],
                'mdfcn_user_seq': modelData["mdfcn_user_seq"],
                'mdfcn_ip': modelData["mdfcn_ip"]
            }
            
            queryData = '''
                UPDATE TB_AUGMENT_MODEL SET 
                    PPRCS_SEQ=%(pprcs_seq)s, MODEL_NM=%(model_nm)s, MODEL_DERPN=%(model_derpn)s, MODEL_ALGRM_SEQ=%(model_algrm_seq)s, 
                    LEARNING_BGNG_DT=%(learning_bgng_dt)s, LEARNING_END_DT=%(learning_end_dt)s, RLS_YN=%(rls_yn)s, USE_YN=%(use_yn)s, 
                    MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE MODEL_SEQ=%(model_seq)s                
            '''

            with transaction.atomic(using=self.databases):
                self.query.execute_t(queryData, queryParam) 
                
                #기존데이터 삭제
                self.modelItemDel(modelSeq=modelData["model_seq"])
                self.modelParamsDel(modelSeq=modelData["model_seq"])
                
                #신규데이터 추가
                self.modelItemAdd(paramData=paramData['model_item'], modelSeq=modelData["model_seq"])
                self.modelParamsAdd(paramData=paramData['model_params'], modelSeq=modelData["model_seq"])

                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def modelRemove(self, paramData=None):
        '''
        학습모델 삭제
        Args:
            paramData(any): 학습모델 정보
        Returns: 모델 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'model_seq': paramData["model_seq"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_AUGMENT_MODEL SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE MODEL_SEQ=%(model_seq)s                
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def modelStatus(self, paramData=None):
        '''
        학습모델 상태 조회
        Args:
            paramData(any): 학습모델 식별자
        Returns: 모델 상태 정보
            result
        '''
        result = None

        try:    
            queryData = '''
                SELECT MODEL_SEQ
                    , PPRCS_SEQ
                    , MODEL_NM
                    , MODEL_DERPN
                    , MODEL_ALGRM_SEQ
                    , LEARNING_BGNG_DT
                    , LEARNING_END_DT
                    , MODEL_STATUS
                    , (SELECT DTL_CD_NM FROM TB_CODE_DTL WHERE GRP_CD='MODEL_STATUS' and DTL_CD=MODEL_STATUS) AS MODEL_STATUS_NAME
                    , RLS_YN
                    , USE_YN
                    , DEL_YN
                FROM TB_AUGMENT_MODEL
                WHERE MODEL_SEQ={0}
                AND USE_YN='Y'
                AND DEL_YN='N'
            '''
            queryData = str.format(queryData, paramData['model_seq'])            
            result = self.query.select(queryData)            
        except Exception as e:            
            raise e  
        
        return result