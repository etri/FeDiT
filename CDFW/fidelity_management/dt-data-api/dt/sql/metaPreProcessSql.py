from django.db import transaction, IntegrityError
from dt_data_api.common.lib import (
    DB_NAME, ExecuteQuery
)
from dt_data_api.util.paging import Page
import os
import mimetypes
import pandas as pd
import logging
from datetime import date
import uuid
import shutil

class metaPreProcessQuery():

    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)
    
    def metaTestListQuery(self, pageParam=None, search=None, sort=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None

        try:
            queryData = '''
                        SELECT 
                            DATE_FORMAT(yyyymmdd, '%Y-%m-%d %H:%i:%s') yyyymmdd,
                            m00,m10,m20,m30
                        FROM TB_TWIN_001
                       WHERE 1=1
            '''            

            #queryData = str.format(queryData, ('' if search==None else search), ('' if sort==None else sort))            
            #pageData = Page.paging(pageParam)
            #queryData = Page.makeQuery(queryData, pageData)

            print(queryData)
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result  
    
    def firstColumnSetDataQuery(self, pageParam=None, search=None, sort=None):
        '''
        사용자가 선택한 인덱스컬럼과 기간값으로 파일생성
        '''
        result = None

        try:
            queryData = '''
                        SELECT 
                            DATE_FORMAT(yyyymmdd, '%Y-%m-%d %H:%i:%s') yyyymmdd,
                            m00,m10,m20,m30
                        FROM TB_TWIN_001
                       WHERE 1=1
                         {0}
                         {1}
            '''            

            queryData = str.format(queryData, ('' if search==None else search), ('' if sort==None else sort))            
            #pageData = Page.paging(pageParam)
            #queryData = Page.makeQuery(queryData, pageData)

            print(queryData)
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result
    
    def fitSave(self, modelID=None, data=None):
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
                dt.append((modelID, i+1, data.iloc[i]['loss'], data.iloc[i]['val_loss'], data.iloc[i]['mae'], data.iloc[i]['val_mae']))

            queryData = '''
                INSERT INTO TB_META_ETC_MODEL_LOSS(ETC_MODEL_SEQ, EPOCHS_CNT, LOSS, VRFC_LOSS, MAE, VRFC_MAE, USE_YN, DEL_YN) VALUES(
                    %s, %s, %s, %s, %s, %s, 'Y', 'N' 
                )
            '''

            self.query.execute_bulk(queryData, dt)
        except Exception as e:
            raise e            