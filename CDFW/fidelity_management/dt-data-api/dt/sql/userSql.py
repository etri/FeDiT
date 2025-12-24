from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class userQuery():
    '''
    사용자 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def userList(self, pageParam=None, search=None, sort=None):
        '''
        사용자 목록
        Args:
            pageParam(any): 페이지정보
            search(any): 검색 조건
            sort(any): 정렬 방식
        '''
        result = None

        try:                    
            queryData = '''
                SELECT USER_SEQ
                    , USER_ID
                    , USER_PW
                    , USER_NM
                    , USER_AUTH_CD
                    , UNIQ_IDN_KEY
                    , USER_EML
                    , USER_BIRTH_YMD
                    , USER_CONT_1
                    , USER_CONT_2
                    , USER_CONT_3
                    , USER_HP_1
                    , USER_HP_2
                    , USER_HP_3
                    , USER_ZIP
                    , USER_ROAD_NM_ADDR
                    , USER_LOTNO_ADDR
                    , USER_DTL_ADDR
                    , TNCND_AGRE_YN
                    , PRVC_AGRE_YN
                    , INFO_PVSN_AGRE_YN
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
                    , LAST_LGN_DT               
                FROM TB_USER
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

    def userRegistration(self, paramData=None):
        '''
        사용자 등록
        Args:
            paramData(any): 사용자 정보
        Returns: 사용자 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                "user_seq": None,
                "user_id": paramData["user_id"],
                "user_pw": paramData["user_pw"],
                "user_nm": paramData["user_nm"],
                "user_auth_cd": paramData["user_auth_cd"],
                "uniq_idn_key": paramData["uniq_idn_key"],
                "user_eml": paramData["user_eml"],
                "user_birth_ymd": paramData["user_birth_ymd"],
                "user_cont_1": paramData["user_cont_1"],
                "user_cont_2": paramData["user_cont_2"],
                "user_cont_3": paramData["user_cont_3"],
                "user_hp_1": paramData["user_hp_1"],
                "user_hp_2": paramData["user_hp_2"],
                "user_hp_3": paramData["user_hp_3"],
                "user_zip": paramData["user_zip"],
                "user_road_nm_addr": paramData["user_road_nm_addr"],
                "user_lotno_addr": paramData["user_lotno_addr"],
                "user_dtl_addr": paramData["user_dtl_addr"],
                "tncnd_agre_yn": paramData["tncnd_agre_yn"],
                "prvc_agre_yn": paramData["prvc_agre_yn"],
                "info_pvsn_agre_yn": paramData["info_pvsn_agre_yn"],
                'use_yn': 'Y',
                'del_yn': 'N',
                "reg_user_seq": paramData["reg_user_seq"],
                "reg_ip": paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_USER (
                    USER_ID, USER_PW, USER_NM, USER_AUTH_CD, UNIQ_IDN_KEY, USER_EML, USER_BIRTH_YMD, USER_CONT_1, USER_CONT_2, USER_CONT_3, 
                    USER_HP_1, USER_HP_2, USER_HP_3, USER_ZIP, USER_ROAD_NM_ADDR, USER_LOTNO_ADDR, USER_DTL_ADDR, TNCND_AGRE_YN, PRVC_AGRE_YN, 
                    INFO_PVSN_AGRE_YN, USE_YN, DEL_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(user_id)s, %(user_pw)s, %(user_nm)s, %(user_auth_cd)s, %(uniq_idn_key)s, %(user_eml)s, %(user_birth_ymd)s, %(user_cont_1)s, %(user_cont_2)s, %(user_cont_3)s, 
                    %(user_hp_1)s, %(user_hp_2)s, %(user_hp_3)s, %(user_zip)s, %(user_road_nm_addr)s, %(user_lotno_addr)s, %(user_dtl_addr)s, %(tncnd_agre_yn)s, %(prvc_agre_yn)s,
                    %(info_pvsn_agre_yn)s, %(use_yn)s, %(del_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            id = self.query.execute_return(queryData, queryParam) 
            
            if id:
                result = queryParam
                result["user_seq"] = id
                
        except Exception as e:            
            raise e  
        
        return result
    
    def userUpdate(self, paramData=None):
        '''
        사용자 수정
        Args:
            paramData(any): 사용자 정보
        Returns: 사용자 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                "user_seq": paramData["user_seq"],
                "user_id": paramData["user_id"],
                "user_pw": paramData["user_pw"],
                "user_nm": paramData["user_nm"],
                "user_auth_cd": paramData["user_auth_cd"],
                "uniq_idn_key": paramData["uniq_idn_key"],
                "user_eml": paramData["user_eml"],
                "user_birth_ymd": paramData["user_birth_ymd"],
                "user_cont_1": paramData["user_cont_1"],
                "user_cont_2": paramData["user_cont_2"],
                "user_cont_3": paramData["user_cont_3"],
                "user_hp_1": paramData["user_hp_1"],
                "user_hp_2": paramData["user_hp_2"],
                "user_hp_3": paramData["user_hp_3"],
                "user_zip": paramData["user_zip"],
                "user_road_nm_addr": paramData["user_road_nm_addr"],
                "user_lotno_addr": paramData["user_lotno_addr"],
                "user_dtl_addr": paramData["user_dtl_addr"],
                "tncnd_agre_yn": paramData["tncnd_agre_yn"],
                "prvc_agre_yn": paramData["prvc_agre_yn"],
                "info_pvsn_agre_yn": paramData["info_pvsn_agre_yn"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_USER SET
                    USER_NM=%(user_nm)s, USER_AUTH_CD=%(user_auth_cd)s, UNIQ_IDN_KEY=%(uniq_idn_key)s, USER_EML=%(user_eml)s, USER_BIRTH_YMD=%(user_birth_ymd)s,
                    USER_CONT_1=%(user_cont_1)s, USER_CONT_2=%(user_cont_2)s, USER_CONT_3=%(user_cont_3)s, USER_HP_1=%(user_hp_1)s, USER_HP_2=%(user_hp_2)s, USER_HP_3=%(user_hp_3)s,
                    USER_ZIP=%(user_zip)s, USER_ROAD_NM_ADDR=%(user_road_nm_addr)s, USER_LOTNO_ADDR=%(user_lotno_addr)s, USER_DTL_ADDR=%(user_dtl_addr)s,
                    USE_YN=%(use_yn)s, MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE USER_SEQ=%(user_seq)s AND USER_ID=%(user_id)s
            '''

            self.query.execute(queryData, queryParam) 
            result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def userRemove(self, paramData=None):
        '''
        사용자 삭제
        Args:
            paramData(any): 사용자 데이터
        Returns: 사용자 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'user_seq': paramData["user_seq"],
                'user_id': paramData["user_id"],
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_USER SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE USER_SEQ=%(user_seq)s AND USER_ID=%(user_id)s
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def userExist(self, paramData=None):
        '''
        사용자 확인
        Args:
            paramData(any): 사용자 데이터
        Returns: 사용자 확인 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'user_id': paramData["user_id"]                
            }
          
            queryData = '''
                SELECT * 
                FROM TB_USER    
                WHERE USER_ID=%(user_id)s
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
    
    def userLogin(self, paramData=None):
        '''
        사용자 로그인
        Args:
            paramData(any): 사용자 로그인 데이터
        Returns: 사용자 확인 정보
            result
        '''
        result = None

        try:    
            queryData = '''
                SELECT * 
                FROM TB_USER    
                WHERE USER_ID='{0}' AND USE_YN='Y' AND DEL_YN='N'
            '''
            
            queryData = str.format(queryData, paramData["user_id"])            
            r = self.query.select(queryData)
            if r:
                result = r
            
        except Exception as e:            
            raise e  
        
        return result

    def userLastLoginUpdate(self, paramData=None):
        '''
        사용자 마지막 로그인 시간 수정
        Args:
            paramData(any): 사용자 데이터
        Returns: 사용자 마지막 로그인 시간 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'user_id': paramData["user_id"]                
            }
            
            queryData = '''
                UPDATE TB_USER SET 
                    LAST_LGN_DT=now()
                WHERE USER_ID=%(user_id)s
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result