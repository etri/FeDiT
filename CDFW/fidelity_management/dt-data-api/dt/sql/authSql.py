from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class authQuery():
    '''
    권한 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def authList(self):
        '''
        권한 목록
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
                    , DATE_FORMAT(REG_DT, '%Y-%m-%d %H:%i') AS REG_DT
                    , REG_IP
                    , MDFCN_USER_SEQ
                    , DATE_FORMAT(MDFCN_DT, '%Y-%m-%d %H:%i') AS MDFCN_DT
                    , MDFCN_IP
                    , DEL_USER_SEQ
                    , DEL_DT
                    , DEL_IP     
                FROM TB_CODE_DTL
                WHERE GRP_CD='AUTH'
                AND USE_YN='Y' 
                AND DEL_YN='N'
                ORDER BY ORDBY ASC
            '''
            
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result

    def authMenuList(self, search=None):
        '''
        메뉴권한 목록
        Args:
            search(any): 검색 조건            
        '''
        result = None

        try:                    
            queryData = '''
                SELECT AUTH_CD
                    , MENU_CD
                    , INQ_AUTH_YN
                    , WRT_AUTH_YN
                    , MDFCN_AUTH_YN
                    , DEL_AUTH_YN
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
                FROM TB_MENU_AUTH
                WHERE DEL_YN='N'
                {0}
            '''
            
            queryData = str.format(queryData, ('' if search==None else search))            
            
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result
    
    def authMenuRegistration(self, paramData=None):
        '''
        메뉴권한 등록
        Args:
            paramData(any): 메뉴권한 정보
        Returns: 메뉴 등록 정보
            result
        '''
        result = None
        r = 0

        try:    
            for item in paramData:
                queryParam = {
                    'auth_cd': item['auth_cd'],
                    'menu_cd': item['menu_cd'],
                    "inq_auth_yn": item['inq_auth_yn'],
                    "wrt_auth_yn": item['wrt_auth_yn'],
                    "mdfcn_auth_yn": item['mdfcn_auth_yn'],
                    "del_auth_yn": item['del_auth_yn'],
                    'reg_user_seq': item['reg_user_seq'],
                    'reg_ip': item['reg_ip']
                }

                queryData = '''
                    INSERT INTO TB_MENU_AUTH(
                        AUTH_CD, MENU_CD, INQ_AUTH_YN, WRT_AUTH_YN, MDFCN_AUTH_YN, DEL_AUTH_YN, REG_USER_SEQ, REG_IP
                    ) VALUES (
                        %(auth_cd)s, %(menu_cd)s, %(inq_auth_yn)s, %(wrt_auth_yn)s, %(mdfcn_auth_yn)s, %(del_auth_yn)s, %(reg_user_seq)s, %(reg_ip)s
                    )
                '''
                
                r = r + self.query.execute(queryData, queryParam)
                
            if r > 0:
                result = paramData

        except Exception as e:            
            raise e  
        
        return result
    
    def authMenuRemove(self, paramData=None):
        '''
        메뉴권한 삭제
        Args:
            paramData(any): 메뉴권한 데이터
        Returns: 메뉴권한 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'auth_cd': paramData["auth_cd"]
            }
            
            queryData = '''
                DELETE FROM TB_MENU_AUTH 
                WHERE AUTH_CD=%(auth_cd)s
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    