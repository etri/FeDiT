from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class vrfcQuery():
    '''
    데이터검증 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def vrfcList(self, search=None):
        '''
        데이터검증 목록
        Args:
            pageParam(any): 페이지정보            
        '''
        result = None

        try:                    
            queryData = '''
                SELECT VRFC_SEQ
                    , VRFC_TP
                    , VRFC_NM
                    , RULE_VALUE_1
                    , RULE_VALUE_2
                    , RULE_VALUE_3
                    , RULE_VALUE_4
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
                FROM TB_DATA_VRFC
                WHERE 1=1
                {0}
                ORDER BY ORDBY ASC
            '''
            
            queryData = str.format(queryData, ('' if search==None else search))                        
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result

    def vrfcRegistration(self, paramData=None):
        '''
        데이터검증 등록
        Args:
            paramData(any): 데이터검증 정보
        Returns: 데이터검증 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'vrfc_tp': paramData["vrfc_tp"],
                'vrfc_nm' : paramData["vrfc_nm"],
                'rule_value_1' : paramData["rule_value_1"],
                'rule_value_2' : paramData["rule_value_2"],
                'rule_value_3' : paramData["rule_value_3"],
                'rule_value_4' : paramData["rule_value_4"],
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'reg_user_seq': paramData["reg_user_seq"],
                'reg_ip': paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_DATA_VRFC (
                    VRFC_TP, VRFC_NM, RULE_VALUE_1, RULE_VALUE_2, RULE_VALUE_3, RULE_VALUE_4,
                    ORDBY, USE_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(vrfc_tp)s, %(vrfc_nm)s, %(rule_value_1)s, %(rule_value_2)s, %(rule_value_3)s, %(rule_value_4)s,
                    %(ordby)s, %(use_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            id = self.query.execute_return(queryData, queryParam) 
            
            if id:
                result = queryParam
                result["vrfc_seq"] = id
                
        except Exception as e:            
            raise e  
        
        return result
    
    def vrfcUpdate(self, paramData=None):
        '''
        데이터검증 수정
        Args:
            paramData(any): 데이터검증 정보
        Returns: 데이터검증 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'vrfc_seq': paramData["vrfc_seq"],
                'vrfc_tp': paramData["vrfc_tp"],
                'vrfc_nm' : paramData["vrfc_nm"],
                'rule_value_1' : paramData["rule_value_1"],
                'rule_value_2' : paramData["rule_value_2"],
                'rule_value_3' : paramData["rule_value_3"],
                'rule_value_4' : paramData["rule_value_4"],
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_DATA_VRFC SET 
                    VRFC_NM=%(vrfc_nm)s, RULE_VALUE_1=%(rule_value_1)s, RULE_VALUE_2=%(rule_value_2)s, RULE_VALUE_3=%(rule_value_3)s, RULE_VALUE_4=%(rule_value_4)s, 
                    ORDBY=%(ordby)s, USE_YN=%(use_yn)s, MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE VRFC_SEQ=%(vrfc_seq)s AND VRFC_TP=%(vrfc_tp)s
            '''

            self.query.execute(queryData, queryParam) 
            result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def vrfcRemove(self, paramData=None):
        '''
        데이터검증 삭제
        Args:
            paramData(any): 데이터검증 데이터
        Returns: 데이터검증 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'vrfc_seq': paramData["vrfc_seq"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_DATA_VRFC SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE vrfc_seq=%(vrfc_seq)s                
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    