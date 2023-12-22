from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class codeQuery():
    '''
    코드관리 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def codeMstList(self):
        '''
        메인코드 목록        
        '''
        result = None

        try:                    
            queryData = '''
                SELECT GRP_CD
                    , GRP_CD_NM
                    , RMRK
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
                FROM TB_CODE_MST
                ORDER BY GRP_CD_NM, ORDBY ASC
            '''
            
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result

    def codeMstRegistration(self, paramData=None):
        '''
        메인코드 등록
        Args:
            paramData(any): 메인코드 정보
        Returns: 메인코드 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'grp_cd_nm' : paramData["grp_cd_nm"],
                'rmrk' : paramData["rmrk"],                
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'reg_user_seq': paramData["reg_user_seq"],
                'reg_ip': paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_CODE_MST (
                    GRP_CD, GRP_CD_NM, RMRK,
                    ORDBY, USE_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(grp_cd)s, %(grp_cd_nm)s, %(rmrk)s,
                    %(ordby)s, %(use_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            r = self.query.execute(queryData, queryParam) 
            if r > 0:
                result = queryParam
        except Exception as e:            
            raise e  
        
        return result
    
    def codeMstUpdate(self, paramData=None):
        '''
        메인코드 수정
        Args:
            paramData(any): 메인코드 정보
        Returns: 메인코드 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'grp_cd_nm' : paramData["grp_cd_nm"],
                'rmrk' : paramData["rmrk"],                
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_CODE_MST SET 
                    GRP_CD_NM=%(grp_cd_nm)s, RMRK=%(rmrk)s,
                    ORDBY=%(ordby)s, USE_YN=%(use_yn)s, MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE GRP_CD=%(grp_cd)s
            '''
            
            r = self.query.execute(queryData, queryParam) 
            if r > 0:
                result = queryParam            
        except Exception as e:            
            raise e  
        
        return result
    
    def codeMstRemove(self, paramData=None):
        '''
        메인코드 삭제
        Args:
            paramData(any): 메인코드 데이터
        Returns: 메인코드 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_CODE_MST SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE grp_cd=%(grp_cd)s                
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def codeMstExist(self, paramData=None):
        '''
        메인코드 확인
        Args:
            paramData(any): 메인코드 데이터
        Returns: 메인코드 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"]                
            }
            
            queryData = '''
                SELECT * 
                FROM TB_CODE_MST    
                WHERE grp_cd=%(grp_cd)s                
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                queryParam['exist'] = True                
            else:
                queryParam['exist'] = False
            
            result = queryParam
        except Exception as e:            
            raise e  
        
        return result
    
    def codeDtlList(self, search=None):
        '''
        세부코드 목록
        Args:
            search(any): 검색정보            
        '''
        result = None

        try:                    
            queryData = '''
                SELECT GRP_CD
                    , DTL_CD
                    , DTL_CD_NM
                    , RMRK
                    , REF_CD
                    , REF_CLASS
                    , REF_VALUE
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
                FROM TB_CODE_DTL
                WHERE 1=1
                {0}
                ORDER BY ORDBY ASC
            '''
            
            queryData = str.format(queryData, ('' if search==None else search))                        
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result
    
    def codeDtlRegistration(self, paramData=None):
        '''
        세부코드 등록
        Args:
            paramData(any): 세부코드 정보
        Returns: 세부코드 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'dtl_cd': paramData["dtl_cd"],
                'dtl_cd_nm': paramData["dtl_cd_nm"],                
                'rmrk': paramData["rmrk"],                
                'ref_cd': paramData["ref_cd"],
                'ref_class': paramData["ref_class"],
                'ref_value': paramData["ref_value"],
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'reg_user_seq': paramData["reg_user_seq"],
                'reg_ip': paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_CODE_DTL (
                    GRP_CD, DTL_CD, DTL_CD_NM, RMRK, REF_CD, REF_CLASS, REF_VALUE,
                    ORDBY, USE_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(grp_cd)s, %(dtl_cd)s, %(dtl_cd_nm)s, %(rmrk)s, %(ref_cd)s, %(ref_class)s, %(ref_value)s,
                    %(ordby)s, %(use_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            r = self.query.execute(queryData, queryParam) 
            if r > 0:
                result = queryParam
        except Exception as e:            
            raise e  
        
        return result
    
    def codeDtlUpdate(self, paramData=None):
        '''
        세부코드 수정
        Args:
            paramData(any): 세부코드 정보
        Returns: 세부코드 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'dtl_cd' : paramData["dtl_cd"],
                'dtl_cd_nm' : paramData["dtl_cd_nm"],                
                'rmrk' : paramData["rmrk"],                
                'ref_cd' : paramData["ref_cd"],                
                'ref_class' : paramData["ref_class"],                
                'ref_value' : paramData["ref_value"],                
                'ordby': paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_CODE_DTL SET 
                    DTL_CD_NM=%(dtl_cd_nm)s, RMRK=%(rmrk)s, REF_CD=%(ref_cd)s, REF_CLASS=%(ref_class)s, REF_VALUE=%(ref_value)s,
                    ORDBY=%(ordby)s, USE_YN=%(use_yn)s, MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE GRP_CD=%(grp_cd)s AND DTL_CD=%(dtl_cd)s
            '''
            
            r = self.query.execute(queryData, queryParam) 
            if r > 0:
                result = queryParam            
        except Exception as e:            
            raise e  
        
        return result
    
    def codeDtlRemove(self, paramData=None):
        '''
        세부코드 삭제
        Args:
            paramData(any): 세부코드 데이터
        Returns: 세부코드 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'dtl_cd': paramData["dtl_cd"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_CODE_DTL SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE GRP_CD=%(grp_cd)s AND DTL_CD=%(dtl_cd)s
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def codeDtlExist(self, paramData=None):
        '''
        세부코드 확인
        Args:
            paramData(any): 세부코드 데이터
        Returns: 세부코드 확인 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'grp_cd': paramData["grp_cd"],
                'dtl_cd': paramData["dtl_cd"]                
            }
          
            queryData = '''
                SELECT * 
                FROM TB_CODE_DTL    
                WHERE GRP_CD=%(grp_cd)s AND DTL_CD=%(dtl_cd)s
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                queryParam['exist'] = True                
            else:
                queryParam['exist'] = False
            
            result = queryParam

        except Exception as e:            
            raise e  
        
        return result