from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page

class menuQuery():
    '''
    메뉴 데이터
    '''
    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def menuList(self, pageParam=None, search=None, sort=None):
        '''
        메뉴 목록
        Args:
            pageParam(any): 페이지정보
            search(any): 검색 조건
            sort(any): 정렬 방식
        '''
        result = None

        try:                    
            queryData = '''
                SELECT MENU_CD
                    , MENU_NM
                    , UP_MENU_CD
                    , MENU_URL
                    , MENU_ICON
                    , MENU_CLASS
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
                FROM TB_MENU
                WHERE 1=1 AND USE_YN='Y' AND DEL_YN='N'
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

    def menuRegistration(self, paramData=None):
        '''
        메뉴 등록
        Args:
            paramData(any): 메뉴 정보
        Returns: 메뉴 등록 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                "menu_cd": paramData["menu_cd"],
                "menu_nm": paramData["menu_nm"],
                "up_menu_cd": paramData["up_menu_cd"],
                "menu_url": paramData["menu_url"],
                "menu_icon": paramData["menu_icon"],
                "menu_class": paramData["menu_class"],                
                "ordby": paramData["ordby"],
                'use_yn': 'Y',
                'del_yn': 'N',
                "reg_user_seq": paramData["reg_user_seq"],
                "reg_ip": paramData["reg_ip"]
            }

            queryData = '''
                INSERT INTO TB_MENU (
                    MENU_CD, MENU_NM, UP_MENU_CD, MENU_URL, MENU_ICON, MENU_CLASS,
                    ORDBY, USE_YN, DEL_YN, REG_USER_SEQ, REG_IP
                ) VALUES (
                    %(menu_cd)s, %(menu_nm)s, %(up_menu_cd)s, %(menu_url)s, %(menu_icon)s, %(menu_class)s, 
                    %(ordby)s, %(use_yn)s, %(del_yn)s, %(reg_user_seq)s, %(reg_ip)s
                )
            '''
            r = self.query.execute(queryData, queryParam) 
            if r > 0:
                result = queryParam
        except Exception as e:            
            raise e  
        
        return result
    
    def menuUpdate(self, paramData=None):
        '''
        메뉴 수정
        Args:
            paramData(any): 메뉴 정보
        Returns: 메뉴 수정 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                "menu_cd": paramData["menu_cd"],
                "menu_nm": paramData["menu_nm"],
                "up_menu_cd": paramData["up_menu_cd"],
                "menu_url": paramData["menu_url"],
                "menu_icon": paramData["menu_icon"],
                "menu_class": paramData["menu_class"],                
                "ordby": paramData["ordby"],
                'use_yn': paramData["use_yn"],
                'mdfcn_user_seq': paramData["mdfcn_user_seq"],
                'mdfcn_ip': paramData["mdfcn_ip"]
            }

            queryData = '''
                UPDATE TB_MENU SET
                    MENU_NM=%(menu_nm)s, UP_MENU_CD=%(up_menu_cd)s, MENU_URL=%(menu_url)s, MENU_ICON=%(menu_icon)s, MENU_CLASS=%(menu_class)s, 
                    ORDBY=%(ordby)s, USE_YN=%(use_yn)s, MDFCN_DT=now(), MDFCN_USER_SEQ=%(mdfcn_user_seq)s, MDFCN_IP=%(mdfcn_ip)s
                WHERE MENU_CD=%(menu_cd)s
            '''

            self.query.execute(queryData, queryParam) 
            result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def menuRemove(self, paramData=None):
        '''
        메뉴 삭제
        Args:
            paramData(any): 메뉴 데이터
        Returns: 메뉴 삭제 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'menu_cd': paramData["menu_cd"],                
                'del_yn': 'Y',
                'del_user_seq': paramData["del_user_seq"],
                'del_ip': paramData["del_ip"]
            }
            
            queryData = '''
                UPDATE TB_MENU SET 
                    DEL_YN=%(del_yn)s, DEL_DT=now(), DEL_USER_SEQ=%(del_user_seq)s, DEL_IP=%(del_ip)s
                WHERE MENU_CD=%(menu_cd)s
            '''

            r = self.query.execute(queryData, queryParam)
            if r > 0:
                result = queryParam

        except Exception as e:            
            raise e  
        
        return result
    
    def menuExist(self, paramData=None):
        '''
        메뉴 확인
        Args:
            paramData(any): 메뉴 데이터
        Returns: 메뉴 확인 정보
            result
        '''
        result = None

        try:    
            queryParam = {
                'menu_cd': paramData["menu_cd"]                
            }
          
            queryData = '''
                SELECT * 
                FROM TB_MENU    
                WHERE MENU_CD=%(menu_cd)s
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
    