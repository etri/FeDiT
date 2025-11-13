from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class augmentQuery():
    '''
    증강데이터 생성 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def augmentList(self, pageParam=None, search=None, sort=None):
        '''
        증강데이터 설정 목록
        Args:
            pageParam(any): 페이지정보
            search(any): 검색 조건
            sort(any): 정렬 방식
        '''
        result = None

        try:                    
            queryData = '''
                SELECT AUGMENT_SEQ
                    , TITLE
                    , DERPN
                    , PPRCS_SEQ
                    , MODEL_SEQ
                    , AUGMENT_TP
                    , DATA_TP
                    , AUGMENT_CRT_BGNG
                    , AUGMENT_CRT_END
                    , DATA_PRCS_DT
                    , DATA_CRT_INTVL_TP
                    , DATA_CRT_INTVL_VALUE
                    , AUGMENT_STATUS
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
                FROM TB_AUGMENT
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

    def augmentRegistration(self, paramData=None):
        '''
        증강데이터 설정 등록
        Args:
            paramData(any): 증강데이터 설정 정보
        Returns: 모델 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'augment_seq': None,
                'title' : paramData["title"],
                'derpn' : paramData["derpn"],
                'pprcs_seq' : paramData["pprcs_seq"],
                'model_seq' : paramData["model_seq"],
                'augment_tp': paramData["augment_tp"],
                'data_tp': paramData["data_tp"],                
                'augment_crt_bgng': paramData["augment_crt_bgng"],
                'augment_crt_end': paramData["augment_crt_end"],
                'data_crt_intvl_tp': paramData["data_crt_intvl_tp"],
                'data_crt_intvl_value': paramData["data_crt_intvl_value"],                
                'augment_status': 'R',
                'rls_yn': paramData["rls_yn"],
                'use_yn': 'Y',
                'del_yn': 'N',
                'reg_user_seq': paramData["reg_user_seq"],
                'reg_ip': paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_AUGMENT (
                    TITLE, DERPN, PPRCS_SEQ, MODEL_SEQ, AUGMENT_TP, DATA_TP, AUGMENT_CRT_BGNG, AUGMENT_CRT_END,
                    DATA_CRT_INTVL_TP, DATA_CRT_INTVL_VALUE, AUGMENT_STATUS, 
                    RLS_YN, USE_YN, DEL_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(title)s, %(derpn)s, %(pprcs_seq)s, %(model_seq)s, %(augment_tp)s, %(data_tp)s, %(augment_crt_bgng)s, %(augment_crt_end)s, 
                    %(data_crt_intvl_tp)s, %(data_crt_intvl_value)s, %(augment_status)s,
                    %(rls_yn)s, %(use_yn)s, %(del_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            id = self.query.execute_return(queryData, queryParam) 
            
            if id:
                result = queryParam
                result["augment_seq"] = id
                
        except Exception as e:            
            raise e  
        
        return result
    
    def augmentUpdate(self, paramData=None):
        '''
        증강데이터 설정 수정
        Args:
            paramData(any): 증강데이터 설정 정보
        Returns: 모델 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'augment_seq': paramData["augment_seq"],
                'title' : paramData["title"],
                'derpn' : paramData["derpn"],
                'pprcs_seq' : paramData["pprcs_seq"],
                'model_seq' : paramData["model_seq"],
                'augment_tp': paramData["augment_tp"],
                'data_tp': paramData["data_tp"],                
                'augment_crt_bgng': paramData["augment_crt_bgng"],
                'augment_crt_end': paramData["augment_crt_end"],
                'data_crt_intvl_tp': paramData["data_crt_intvl_tp"],
                'data_crt_intvl_value': paramData["data_crt_intvl_value"],                                
                'rls_yn': paramData["rls_yn"],
                'rls_yn': paramData["rls_yn"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_AUGMENT SET 
                    TITLE=%(title)s, DERPN=%(derpn)s, PPRCS_SEQ=%(pprcs_seq)s, MODEL_SEQ=%(model_seq)s, 
                    AUGMENT_TP=%(augment_tp)s, DATA_TP=%(data_tp)s, AUGMENT_CRT_BGNG=%(augment_crt_bgng)s, AUGMENT_CRT_END=%(augment_crt_end)s, 
                    DATA_CRT_INTVL_TP=%(data_crt_intvl_tp)s, DATA_CRT_INTVL_VALUE=%(data_crt_intvl_value)s, RLS_YN=%(rls_yn)s, USE_YN=%(use_yn)s, 
                    MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE AUGMENT_SEQ=%(augment_seq)s                
            '''

            self.query.execute(queryData, queryParam) 
            result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def augmentRemove(self, paramData=None):
        '''
        증강데이터 설정 삭제
        Args:
            paramData(any): 증강데이터 설정 데이터
        Returns: 증강데이터 설정 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'augment_seq': paramData["augment_seq"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_AUGMENT SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE AUGMENT_SEQ=%(augment_seq)s                
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def augmentStatus(self, paramData=None):
        '''
        증강데이터 상태 조회
        Args:
            paramData(any): 증강데이터 식별자
        Returns: 증강데이터 상태 정보
            result
        '''
        result = None

        try:    
            queryData = '''
                SELECT AUGMENT_SEQ
                    , TITLE
                    , DERPN
                    , PPRCS_SEQ
                    , MODEL_SEQ
                    , AUGMENT_TP
                    , DATA_TP
                    , AUGMENT_CRT_BGNG
                    , AUGMENT_CRT_END
                    , DATA_PRCS_DT
                    , DATA_CRT_INTVL_TP
                    , DATA_CRT_INTVL_VALUE
                    , AUGMENT_STATUS
                    , (SELECT DTL_CD_NM FROM TB_CODE_DTL WHERE GRP_CD='AUGMENT_STATUS' and DTL_CD=AUGMENT_STATUS) AS AUGMENT_STATUS_NAME
                    , RLS_YN
                    , USE_YN
                    , DEL_YN                
                FROM TB_AUGMENT
                WHERE AUGMENT_SEQ={0}
                AND USE_YN='Y'
                AND DEL_YN='N'
            '''
            queryData = str.format(queryData, paramData['augment_seq'])            
            result = self.query.select(queryData)            
        except Exception as e:            
            raise e  
        
        return result