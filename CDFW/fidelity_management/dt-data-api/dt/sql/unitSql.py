from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class unitQuery():
    '''
    단위변환 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def unitList(self, search=None):
        '''
        단위변환 목록
        Args:
            pageParam(any): 페이지정보            
        '''
        result = None

        try:                    
            queryData = '''
                SELECT UNIT_SEQ
                    , UNIT_TP
                    , UNIT_NM_1
                    , UNIT_CD_1
                    , UNIT_NM_2
                    , UNIT_CD_2
                    , UNIT_FORMULA
                    , FORMULA_DERPN
                    , ORDBY
                    , USE_YN
                    , DEL_YN
                    , REG_USER_SEQ
                    , REG_DT
                    , REG_IP
                    , MDFCN_USER_SEQ
                    , MDFCN_DT
                    , MDFCN_IP
                    , DEL_USER_SEQ
                    , DEL_DT
                    , DEL_IP              
                FROM TB_UNIT
                WHERE 1=1
                {0}
                ORDER BY ORDBY ASC
            '''
            
            queryData = str.format(queryData, ('' if search==None else search))                        
            print(queryData)
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result

    def unitRegistration(self, paramData=None):
        '''
        단위변환 등록
        Args:
            paramData(any): 단위변환 정보
        Returns: 단위변환 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'unit_tp': paramData["unit_tp"],
                'unit_nm_1' : paramData["unit_nm_1"],
                'unit_cd_1' : paramData["unit_cd_1"],
                'unit_nm_2' : paramData["unit_nm_2"],
                'unit_cd_2' : paramData["unit_cd_2"],
                'unit_formula': paramData["unit_formula"],
                'formula_derpn': paramData["formula_derpn"],                
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'del_yn': 'N',
                'reg_user_seq': paramData["reg_user_seq"],
                'reg_ip': paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_UNIT (
                    UNIT_TP, UNIT_NM_1, UNIT_CD_1, UNIT_NM_2, UNIT_CD_2, UNIT_FORMULA, FORMULA_DERPN,
                    ORDBY, USE_YN, DEL_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(unit_tp)s, %(unit_nm_1)s, %(unit_cd_1)s, %(unit_nm_2)s, %(unit_cd_2)s, %(unit_formula)s, %(formula_derpn)s,
                    %(ordby)s, %(use_yn)s, %(del_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            id = self.query.execute_return(queryData, queryParam) 
            
            if id:
                result = queryParam
                result["unit_seq"] = id
                
        except Exception as e:            
            raise e  
        
        return result
    
    def unitUpdate(self, paramData=None):
        '''
        단위변환 수정
        Args:
            paramData(any): 단위변환 정보
        Returns: 단위변환 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                "unit_seq": paramData["unit_seq"],
                'unit_tp': paramData["unit_tp"],
                'unit_nm_1' : paramData["unit_nm_1"],
                'unit_cd_1' : paramData["unit_cd_1"],
                'unit_nm_2' : paramData["unit_nm_2"],
                'unit_cd_2' : paramData["unit_cd_2"],
                'unit_formula': paramData["unit_formula"],
                'formula_derpn': paramData["formula_derpn"],                
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_UNIT SET 
                    UNIT_NM_1=%(unit_nm_1)s, UNIT_CD_1=%(unit_cd_1)s, UNIT_NM_2=%(unit_nm_2)s, UNIT_CD_2=%(unit_cd_2)s, 
                    UNIT_FORMULA=%(unit_formula)s, FORMULA_DERPN=%(formula_derpn)s, ORDBY=%(ordby)s, USE_YN=%(use_yn)s,
                    MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE UNIT_SEQ=%(unit_seq)s AND UNIT_TP=%(unit_tp)s
            '''

            self.query.execute(queryData, queryParam) 
            result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def unitRemove(self, paramData=None):
        '''
        단위변환 삭제
        Args:
            paramData(any): 단위변환 데이터
        Returns: 단위변환 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'unit_seq': paramData["unit_seq"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_UNIT SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE unit_seq=%(unit_seq)s                
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    