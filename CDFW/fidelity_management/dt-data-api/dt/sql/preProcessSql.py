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

class preProcessQuery():

    databases = None
    query = ExecuteQuery
    
    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.databases = database.value
            self.query = ExecuteQuery(database.value)

    def processorList(self, pageParam=None, search=None, sort=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None

        try:
            queryData = '''
                        SELECT 
                            PPRCS_SEQ,
                            PPRCS_NM,
                            PPRCS_DERPN,
                            TWIN_TP,
                            INTERPL_TP,
                            RESMPL_TP,
                            RESMPL_INTVL_TP,
                            RESMPL_INTVL_VALUE,
                            INDEX_CRTR_COL,
                            PPRCS_STATUS,
                            USE_YN,
                            DEL_YN,
                            REG_USER_SEQ,
                            REG_DT,
                            REG_IP,
                            MDFCN_USER_SEQ,
                            MDFCN_DT,
                            MDFCN_IP,
                            DEL_USER_SEQ,
                            DEL_DT,
                            DEL_IP
                        FROM TB_PREPROCESS
                       WHERE 1=1
                         AND USE_YN = 'Y' AND DEL_YN = 'N'
                         {0}
                         {1}
            '''            

            queryData = str.format(queryData, ('' if search==None else search), ('' if sort==None else sort))            
            pageData = Page.paging(pageParam)
            queryData = Page.makeQuery(queryData, pageData)

            print(queryData)
            result = self.query.select(queryData)
        except Exception as e:
            raise e  
        
        return result
    
    def processorRegistration(self, paramData=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None
        
        try:
            pprcsSet = paramData['pprcs_set']

            queryParam = {
                'pprcs_nm' : pprcsSet['pprcs_nm'],
                'pprcs_derpn' : pprcsSet['pprcs_derpn'],
                'twin_tp' : pprcsSet['twin_tp'],
                'index_crtr_col' : pprcsSet['index_crtr_col'],
                'reg_user_seq' : pprcsSet['reg_user_seq'],
                'pprcs_seq' : pprcsSet.get('pprcs_seq')
            }
            
            query = '''
                INSERT INTO TB_PREPROCESS (PPRCS_NM, PPRCS_DERPN, TWIN_TP, INDEX_CRTR_COL, PPRCS_STATUS, REG_USER_SEQ, USE_YN, DEL_YN) VALUES (
                    %(pprcs_nm)s, %(pprcs_derpn)s, %(twin_tp)s, %(index_crtr_col)s, 'R' ,%(reg_user_seq)s, 'Y', 'N' 
                )
            '''

            id = None
            file_info = None
            file_name = None
            file_dir = None
                        
            #임시폴더용 유니크키
            unique_key = str(uuid.uuid1())
            df = pd.DataFrame(paramData['pprcs_twin_set'])
            df['group_alias'] = df.groupby('twin_tbl_nm').ngroup() + 1
            df.loc[df['index_crtr_yn'] == 'Y', 'group_alias'] = 1
            df = df.sort_values('group_alias', ascending=True)

            data = self.processorRegistrationMakeFileJsonParam(pprcsSeq=id, isPreProc=False, data=result, df=df)
            tmp_make_file = self.processorRegistrationMakeFileCsv(paramData=paramData, data=data, pprcsSeq=unique_key, pprcsTp='ORIGIN', refTp='PREPROCESS')

            with transaction.atomic(using=self.databases):
                id = self.query.execute_t_return(query, queryParam)
                self.pprcsTwinSet(paramData=paramData['pprcs_twin_set'], pprcsSeq=id, userSeq=pprcsSet['reg_user_seq'])
                file_info = self.processorRegistrationMakeFileCsvSaveInfo(pprcsSeq=id, makeFile=tmp_make_file, pprcsTp='ORIGIN', refTp='PREPROCESS', userSeq=pprcsSet['reg_user_seq'])
                #atomic_block.commit()
                
            file_name = os.path.basename(file_info)
            file_dir = os.path.dirname(file_info)  

            # 원본 파일 경로
            source_dir = tmp_make_file['file_dir']
            source_filename = tmp_make_file['file_name']
            source_path = os.path.join(source_dir, source_filename)

            # 새로운 디렉토리 및 파일명
            destination_dir = tmp_make_file['file_dir'].replace(tmp_make_file['tmp_key'], str(id))
            destination_filename = tmp_make_file['file_name'].replace(tmp_make_file['tmp_key'], str(id))
            destination_path = os.path.join(destination_dir, destination_filename)

            # 파일 디렉토리와 파일명 변경
            self.rename_file(source_path, destination_path)

            if id:
                result = queryParam
                result["pprcs_seq"] = id
                result["file_path"] = file_info
                result["file_name"] = file_name
                result["file_dir"] = file_dir

        except Exception as e:
            raise e
        return result

    def processorUpdate(self, paramData=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None
        
        try:
            pprcsSet = paramData['pprcs_set']
            queryParam = {
                'pprcs_nm' : pprcsSet['pprcs_nm'],
                'pprcs_derpn' : pprcsSet['pprcs_derpn'],
                'twin_tp' : pprcsSet['twin_tp'],
                'index_crtr_col' : pprcsSet['index_crtr_col'],
                'reg_user_seq' : pprcsSet['reg_user_seq'],
                'pprcs_seq' : pprcsSet.get('pprcs_seq')
            }

            query = '''
                UPDATE TB_PREPROCESS
                    SET PPRCS_NM = %(pprcs_nm)s,
                        PPRCS_DERPN = %(pprcs_derpn)s,
                        INDEX_CRTR_COL = %(index_crtr_col)s,
                        INTERPL_TP = NULL,
                        RESMPL_TP = NULL,
                        RESMPL_INTVL_TP = NULL,
                        RESMPL_INTVL_VALUE = NULL,
                        PPRCS_STATUS = 'R'
                    WHERE PPRCS_SEQ = %(pprcs_seq)s
            '''
            
            id = pprcsSet.get('pprcs_seq')
            file_info = None
            file_name = None
            file_dir = None

            #임시폴더용 유니크키
            unique_key = str(uuid.uuid1())
            df = pd.DataFrame(paramData['pprcs_twin_set'])
            df['group_alias'] = df.groupby('twin_tbl_nm').ngroup() + 1
            df.loc[df['index_crtr_yn'] == 'Y', 'group_alias'] = 1
            df = df.sort_values('group_alias', ascending=True)

            data = self.processorRegistrationMakeFileJsonParam(pprcsSeq=id, isPreProc=False, data=result, df=df)
            tmp_make_file = self.processorRegistrationMakeFileCsv(paramData=paramData, data=data, pprcsSeq=unique_key, pprcsTp='ORIGIN', refTp='PREPROCESS')

            with transaction.atomic(using=self.databases):
                self.processorTwinSetDel(pprcsSeq=pprcsSet.get('pprcs_seq'))
                self.processorFilesDel(pprcsSeq=pprcsSet.get('pprcs_seq'))

                self.query.execute_t_return(query, queryParam)
                self.pprcsTwinSet(paramData=paramData['pprcs_twin_set'], pprcsSeq=id, userSeq=pprcsSet['reg_user_seq'])
                file_info = self.processorRegistrationMakeFileCsvSaveInfo(pprcsSeq=id, makeFile=tmp_make_file, pprcsTp='ORIGIN', refTp='PREPROCESS', userSeq=pprcsSet['reg_user_seq'])

            file_name = os.path.basename(file_info)
            file_dir = os.path.dirname(file_info)  

            # 트랜잭션 전에 임시폴더에 만든 파일 이동
            # 원본 파일 경로
            source_dir = tmp_make_file['file_dir']
            source_filename = tmp_make_file['file_name']
            source_path = os.path.join(source_dir, source_filename)

            # 새로운 디렉토리 및 파일명
            destination_dir = tmp_make_file['file_dir'].replace(tmp_make_file['tmp_key'], str(id))
            destination_filename = tmp_make_file['file_name'].replace(tmp_make_file['tmp_key'], str(id))
            destination_path = os.path.join(destination_dir, destination_filename)

            # 파일 디렉토리와 파일명 변경
            self.rename_file(source_path, destination_path)
            
            if id:
                result = queryParam
                result["pprcs_seq"] = id
                result["file_path"] = file_info
                result["file_name"] = file_name
                result["file_dir"] = file_dir

        except Exception as e:
            raise e
        return result

    def processorRegistrationFile(self, paramData=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None
        
        try:
            pprcsSet = paramData['pprcs_set']

            queryParam = {
                'pprcs_nm' : pprcsSet['pprcs_nm'],
                'pprcs_derpn' : pprcsSet['pprcs_derpn'],
                'twin_tp' : pprcsSet['twin_tp'],
                'index_crtr_col' : pprcsSet['index_crtr_col'],
                'reg_user_seq' : pprcsSet['reg_user_seq'],
                'pprcs_seq' : pprcsSet.get('pprcs_seq')
            }
            
            query = '''
                INSERT INTO TB_PREPROCESS (PPRCS_NM, PPRCS_DERPN, TWIN_TP, INDEX_CRTR_COL, PPRCS_STATUS, REG_USER_SEQ, USE_YN, DEL_YN) VALUES (
                    %(pprcs_nm)s, %(pprcs_derpn)s, %(twin_tp)s, %(index_crtr_col)s, 'R' ,%(reg_user_seq)s, 'Y', 'N' 
                )
            '''

            id = None
            with transaction.atomic(using=self.databases):
                id = self.query.execute_t_return(query, queryParam)
                self.pprcsUserFileSet(paramData=paramData['pprcs_file_set'], pprcsSeq=id, userSeq=pprcsSet['reg_user_seq'])

            data = None
            make_file = None
            file_info = None
            file_name = None
            file_dir = None

            try:
                data = self.processorRegistrationMakeUserFileSql(pprcsSeq=id, isPreProc=False)
                make_file = self.processorRegistrationMakeUserFileCsv(paramData=paramData, data=data, pprcsSeq=id, pprcsTp='ORIGIN', refTp='PREPROCESS')
                
                file_info = self.processorRegistrationMakeFileCsvSaveInfo(pprcsSeq=id, makeFile=make_file, pprcsTp='ORIGIN', refTp='PREPROCESS', userSeq=pprcsSet['reg_user_seq'])
                file_name = os.path.basename(file_info)
                file_dir = os.path.dirname(file_info)   
            except Exception as f:
                print('파일생성오류')
                if file_info == None:
                    self.processorFilesDelete(pprcsSeq=id, makeFile=make_file)
                    file_info = str(f)
            
            if id:
                result = queryParam
                result["pprcs_seq"] = id
                result["file_path"] = file_info
                result["file_name"] = file_name
                result["file_dir"] = file_dir

        except Exception as e:
            '''
            if id > 0:
                self.processorMainSetDbDelete(pprcsSeq=id)
                self.processorTwinSetDbDelete(pprcsSeq=id)
                self.processorFilesDbDelete(pprcsSeq=id)

                if make_file != None:
                    self.processorFilesDelete(pprcsSeq=id, makeFile=make_file)
            '''
            raise e
        return result

    def processorUpdateFile(self, paramData=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None
        
        try:
            pprcsSet = paramData['pprcs_set']

            queryParam = {
                'pprcs_nm' : pprcsSet['pprcs_nm'],
                'pprcs_derpn' : pprcsSet['pprcs_derpn'],
                'twin_tp' : pprcsSet['twin_tp'],
                'index_crtr_col' : pprcsSet['index_crtr_col'],
                'reg_user_seq' : pprcsSet['reg_user_seq'],
                'pprcs_seq' : pprcsSet.get('pprcs_seq')
            }

            query = '''
                UPDATE TB_PREPROCESS
                    SET PPRCS_NM = %(pprcs_nm)s,
                        PPRCS_DERPN = %(pprcs_derpn)s,
                        INDEX_CRTR_COL = %(index_crtr_col)s,
                        TWIN_TP = %(twin_tp)s,
                        INTERPL_TP = NULL,
                        RESMPL_TP = NULL,
                        RESMPL_INTVL_TP = NULL,
                        RESMPL_INTVL_VALUE = NULL,
                        PPRCS_STATUS = 'R'
                    WHERE PPRCS_SEQ = %(pprcs_seq)s
            '''
            
            id = pprcsSet.get('pprcs_seq')
            file_info = None
            file_name = None
            file_dir = None            
            
            unique_key = str(uuid.uuid1())
            data = self.processorRegistrationMakeUserFileSql(pprcsSeq=id, isPreProc=False)
            tmp_make_file = self.processorRegistrationMakeUserFileCsv(paramData=paramData, data=data, pprcsSeq=unique_key, pprcsTp='ORIGIN', refTp='PREPROCESS')                
            
            with transaction.atomic(using=self.databases):
                self.processorTwinSetDel(pprcsSeq=pprcsSet.get('pprcs_seq'))
                self.processorFilesDel(pprcsSeq=pprcsSet.get('pprcs_seq'))

                self.query.execute_t_return(query, queryParam)
                self.pprcsUserFileSet(paramData=paramData['pprcs_file_set'], pprcsSeq=id, userSeq=pprcsSet['reg_user_seq'])
                file_info = self.processorRegistrationMakeFileCsvSaveInfo(pprcsSeq=id, makeFile=tmp_make_file, pprcsTp='ORIGIN', refTp='PREPROCESS', userSeq=pprcsSet['reg_user_seq'])
                

            print('-----------3333333333333333------------')
            file_name = os.path.basename(file_info)
            file_dir = os.path.dirname(file_info)   

            # 트랜잭션 전에 임시폴더에 만든 파일 이동
            # 원본 파일 경로
            source_dir = tmp_make_file['file_dir']
            source_filename = tmp_make_file['file_name']
            source_path = os.path.join(source_dir, source_filename)

            # 새로운 디렉토리 및 파일명
            destination_dir = tmp_make_file['file_dir'].replace(unique_key, str(id))
            destination_filename = tmp_make_file['file_name'].replace(unique_key, str(id))
            destination_path = os.path.join(destination_dir, destination_filename)

            # 파일 디렉토리와 파일명 변경
            self.rename_file(source_path, destination_path)
            
            if id:
                result = queryParam
                result["pprcs_seq"] = id
                result["file_path"] = file_info
                result["file_name"] = file_name
                result["file_dir"] = file_dir

        except Exception as e:
            '''
            if id > 0:
                self.processorMainSetDbDelete(pprcsSeq=id)
                self.processorTwinSetDbDelete(pprcsSeq=id)
                self.processorFilesDbDelete(pprcsSeq=id)

                if make_file != None:
                    self.processorFilesDelete(pprcsSeq=id, makeFile=make_file)
            '''
            raise e
        return result

    def processorUpdateFile2(self, paramData=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None
        
        try:
            pprcsSet = paramData['pprcs_set']
            print('--------pprcsSet--------')
            print(pprcsSet)
            queryParam = {
                'pprcs_nm' : pprcsSet['pprcs_nm'],
                'pprcs_derpn' : pprcsSet['pprcs_derpn'],
                'twin_tp' : pprcsSet['twin_tp'],
                'index_crtr_col' : pprcsSet['index_crtr_col'],
                'reg_user_seq' : pprcsSet['reg_user_seq'],
                'pprcs_seq' : pprcsSet.get('pprcs_seq')
            }

            query = '''
                UPDATE TB_PREPROCESS
                    SET PPRCS_NM = %(pprcs_nm)s,
                        PPRCS_DERPN = %(pprcs_derpn)s,
                        INDEX_CRTR_COL = %(index_crtr_col)s,
                        TWIN_TP = %(twin_tp)s,
                        INTERPL_TP = NULL,
                        RESMPL_TP = NULL,
                        RESMPL_INTVL_TP = NULL,
                        RESMPL_INTVL_VALUE = NULL,
                        PPRCS_STATUS = 'R'
                    WHERE PPRCS_SEQ = %(pprcs_seq)s
            '''
            
            id = pprcsSet.get('pprcs_seq')
            
            with transaction.atomic(using=self.databases):
                self.query.execute_t(query, queryParam)

                self.processorTwinSetDel(pprcsSeq=pprcsSet.get('pprcs_seq'))
                self.processorFilesDel(pprcsSeq=pprcsSet.get('pprcs_seq'))

                self.query.execute_t_return(query, queryParam)
                self.pprcsUserFileSet(paramData=paramData['pprcs_file_set'], pprcsSeq=id, userSeq=pprcsSet['reg_user_seq'])

            data = None
            make_file = None
            file_info = None
            file_name = None
            file_dir = None

            try:
                data = self.processorRegistrationMakeUserFileSql(pprcsSeq=id, isPreProc=False)
                make_file = self.processorRegistrationMakeUserFileCsv(paramData=paramData, data=data, pprcsSeq=id, pprcsTp='ORIGIN', refTp='PREPROCESS')

                file_info = self.processorRegistrationMakeFileCsvSaveInfo(pprcsSeq=id, makeFile=make_file, pprcsTp='ORIGIN', refTp='PREPROCESS', userSeq=pprcsSet['reg_user_seq'])
                file_name = os.path.basename(file_info)
                file_dir = os.path.dirname(file_info)   
            except Exception as f:
                print('파일생성오류')
                if file_info == None:
                    self.processorFilesDelete(pprcsSeq=id, makeFile=make_file)
                    file_info = str(f)
            
            if id:
                result = queryParam
                result["pprcs_seq"] = id
                result["file_path"] = file_info
                result["file_name"] = file_name
                result["file_dir"] = file_dir

        except Exception as e:
            '''
            if id > 0:
                self.processorMainSetDbDelete(pprcsSeq=id)
                self.processorTwinSetDbDelete(pprcsSeq=id)
                self.processorFilesDbDelete(pprcsSeq=id)

                if make_file != None:
                    self.processorFilesDelete(pprcsSeq=id, makeFile=make_file)
            '''
            raise e
        return result

    def pprcsTwinSet(self, paramData=None, pprcsSeq=None, userSeq=None):
        '''
        검증 대상 트윈 테이블 / 컬럼 정보
        Args:
            paramData(any): 모델 변수 정보
        '''

        try:                    
            for item in paramData:
                queryParam = {
                    'pprcs_seq': pprcsSeq,
                    'twin_seq': item['twin_seq'],
                    'twin_tbl_nm': item['twin_tbl_nm'],
                    'pprcs_trgt_col': item['pprcs_trgt_col'],
                    'index_trgt_col': item['index_trgt_col'],
                    'index_crtr_yn': item['index_crtr_yn'],
                    'reg_user_seq': userSeq
                }

                queryData = '''
                    INSERT INTO TB_PREPROCESS_TWIN_MAP (PPRCS_SEQ, TWIN_SEQ, TWIN_TBL_NM, PPRCS_TRGT_COL, INDEX_TRGT_COL, INDEX_CRTR_YN, REG_USER_SEQ) 
                    VALUES (
                        %(pprcs_seq)s, %(twin_seq)s, %(twin_tbl_nm)s, %(pprcs_trgt_col)s, %(index_trgt_col)s, %(index_crtr_yn)s, %(reg_user_seq)s
                    )
                '''
                
                self.query.execute_t(queryData, queryParam)                                                        
        except Exception as e:            
            raise e

    def pprcsUserFileSet(self, paramData=None, pprcsSeq=None, userSeq=None):
        '''
        검증 대상 트윈 테이블 / 컬럼 정보
        Args:
            paramData(any): 모델 변수 정보
        '''
        try:                    
            for item in paramData:
                queryParam = {
                    'pprcs_seq': pprcsSeq,
                    'file_seq': item['file_seq'],
                    'pprcs_trgt_col': item['pprcs_trgt_col'],
                    'index_trgt_col': item['index_trgt_col'],
                    'index_crtr_yn': item['index_crtr_yn'],
                    'reg_user_seq': userSeq
                }

                queryData = '''
                    INSERT INTO TB_PREPROCESS_TWIN_MAP (PPRCS_SEQ, FILE_SEQ, PPRCS_TRGT_COL, INDEX_TRGT_COL, INDEX_CRTR_YN, REG_USER_SEQ) 
                    VALUES (
                        %(pprcs_seq)s, %(file_seq)s, %(pprcs_trgt_col)s, %(index_trgt_col)s, %(index_crtr_yn)s, %(reg_user_seq)s
                    )
                '''
                
                self.query.execute_t(queryData, queryParam)                                                        
        except Exception as e:            
            raise e


    def processorRegistrationMakeFileJsonParam(self, pprcsSeq=None, isPreProc=None, data=None, df=None):
        '''
        Args:
            paramData(any): 모델 변수 정보
        '''
        try:          
            base_query = df.to_dict(orient='records')     
    
            makeFileQuery = 'SELECT '
            makeFileQuery += 'cast('+ 't' + str(base_query[0]['group_alias'])+ '.' + base_query[0]['index_trgt_col'] + ' as char) ' + base_query[0]['index_trgt_col']
            for i in range(len(base_query)):
                #if (i == 0):
                #    makeFileQuery += 't' + str(base_query[i]['GROUP_ALIAS']) + '.' + base_query[i]['PPRCS_TRGT_COL']
                #else:
                makeFileQuery += ',' + 't' + str(base_query[i]['group_alias']) + '.' + base_query[i]['pprcs_trgt_col']
                
            makeFileQuery += '\n'
            makeFileQuery += ' FROM ' + base_query[0]['twin_tbl_nm'] + ' ' + 't' + str(base_query[0]['group_alias']) 

            previous_value = None
            next_value = None

            for i in range(len(base_query)):
                next_value = base_query[i]['twin_tbl_nm']
            
                if base_query[i]['twin_tbl_nm'] != base_query[0]['twin_tbl_nm']:
                    if next_value == previous_value:
                        continue  
                    
                    makeFileQuery += '\n'
                    makeFileQuery += '   left join ' + base_query[i]['twin_tbl_nm'] + ' ' + 't' + str(base_query[i]['group_alias']) 
                    makeFileQuery += ' on ' + 't' + str(base_query[i]['group_alias']) + '.' + base_query[i]['index_trgt_col'] + '=' + 't' + str(base_query[0]['group_alias']) + '.' + base_query[0]['index_trgt_col']
                
                    previous_value = next_value
                    
            if isPreProc==False:
                makeFileQuery += '\nlimit 100'

            data = self.query.select(makeFileQuery)
            #print(data)
        except Exception as e:
            raise e
        return data

    def processorRegistrationMakeFileSql(self, pprcsSeq=None, isPreProc=None):
        '''
        검증 대상 트윈 테이블 조합 파일 생성
        Args:
            paramData(any): 모델 변수 정보
        '''
        try:                    
            queryData = '''
                SELECT TWIN_TBL_NM, INDEX_TRGT_COL, INDEX_CRTR_YN, TWIN_SEQ, PPRCS_TRGT_COL, DENSE_RANK() OVER (ORDER BY TWIN_TBL_NM) AS GROUP_ALIAS
                  FROM TB_PREPROCESS_TWIN_MAP
                 WHERE PPRCS_SEQ = {0}
                   AND DEL_YN='N' AND USE_YN='Y'
                 ORDER BY FIELD(INDEX_CRTR_YN,'Y') DESC, PPRCS_TWIN_MAP_SEQ
            '''
            queryData = str.format(queryData, (0 if pprcsSeq==None else pprcsSeq))  
            print(queryData)
            base_query = self.query.select(queryData)

            makeFileQuery = 'SELECT '
            makeFileQuery += 'cast('+ 't' + str(base_query[0]['GROUP_ALIAS'])+ '.' + base_query[0]['INDEX_TRGT_COL'] + ' as char) ' + base_query[0]['INDEX_TRGT_COL']
            for i in range(len(base_query)):
                #if (i == 0):
                #    makeFileQuery += 't' + str(base_query[i]['GROUP_ALIAS']) + '.' + base_query[i]['PPRCS_TRGT_COL']
                #else:
                makeFileQuery += ',' + 't' + str(base_query[i]['GROUP_ALIAS']) + '.' + base_query[i]['PPRCS_TRGT_COL']
                
            makeFileQuery += '\n'
            makeFileQuery += ' FROM ' + base_query[0]['TWIN_TBL_NM'] + ' ' + 't' + str(base_query[0]['GROUP_ALIAS']) 

            previous_value = None
            next_value = None

            for i in range(len(base_query)):
                next_value = base_query[i]['TWIN_TBL_NM']
            
                if base_query[i]['TWIN_TBL_NM'] != base_query[0]['TWIN_TBL_NM']:
                    if next_value == previous_value:
                        continue  
                    
                    makeFileQuery += '\n'
                    makeFileQuery += '   left join ' + base_query[i]['TWIN_TBL_NM'] + ' ' + 't' + str(base_query[i]['GROUP_ALIAS']) 
                    makeFileQuery += ' on ' + 't' + str(base_query[i]['GROUP_ALIAS']) + '.' + base_query[i]['INDEX_TRGT_COL'] + '=' + 't' + str(base_query[0]['GROUP_ALIAS']) + '.' + base_query[0]['INDEX_TRGT_COL']
                
                    previous_value = next_value
                    
            if isPreProc==False:
                makeFileQuery += '\nlimit 100'
            
            print(makeFileQuery)
            data = self.query.select(makeFileQuery)
            #print(data)
        except Exception as e:
            raise e
        return data
        
    def processorRegistrationMakeUserFileSql(self, pprcsSeq=None, isPreProc=None):
        '''
        검증 대상 트윈 테이블 조합 파일 생성
        Args:
            paramData(any): 모델 변수 정보
        '''
        
        try:                    
            queryData = """
                SELECT A.INDEX_TRGT_COL, A.PPRCS_TRGT_COL,
                    (
                        SELECT CONCAT(T.FILE_PATH, '/' , T.FILE_NM)
                        FROM TB_AUGMENT_MODEL_FILES T
                        WHERE T.USE_YN = 'Y'
                        AND T.DEL_YN = 'N'	
                        AND T.FILE_SEQ = A.FILE_SEQ
                    ) FILE_PATH
                FROM TB_PREPROCESS_TWIN_MAP A
                WHERE PPRCS_SEQ  = {0}
                AND DEL_YN='N' AND USE_YN='Y'
                ORDER BY FIELD(INDEX_CRTR_YN,'Y') DESC, PPRCS_TWIN_MAP_SEQ
            """
            queryData = str.format(queryData, (0 if pprcsSeq==None else pprcsSeq))  
            data = self.query.select(queryData)
            #print(data)
            
        except Exception as e:
            raise e
        return data


    def processorRegistrationMakeFileCsv(self, filePath=None, fileName=None, targetFileName=None, paramData=None, data=None, pprcsSeq=None, pprcsTp=None, refTp=None):
        result = {'result': False, 'resultMessage':None}
        
        if targetFileName==None:
            targetFileName = str(pprcsSeq) + '_origin_sample.csv'

        if filePath==None:
            today = date.today()
            directory =  os.path.join('Z:\\DT\\storage\\preprocess', str(today.year), f'{today.month:02d}', str(pprcsSeq))
            os.makedirs(directory, exist_ok=True)

            makeFile = os.path.join('Z:\\DT\\storage\\preprocess', f'{today.year}', f'{today.month:02d}', str(pprcsSeq), targetFileName)
                     
        try:
            df = pd.DataFrame(data)
            df.to_csv(makeFile, index=False)
            #self.verifierInfoSetRegistrationMakeFileCsvInSertDb(pprcsSeq=pprcsSeq, makeFile=makeFile, pprcsTp=pprcsTp, refTp=refTp, userSeq=paramData['pprcs_set']['reg_user_seq'])

            file_info={}
            file_path = makeFile

            file_info['tmp_key'] = str(pprcsSeq)
            file_info['file_path'] = makeFile
            file_info['file_name'] = os.path.basename(file_path)
            file_info['file_dir'] = os.path.dirname(file_path)
            file_info['file_ext'] = os.path.splitext(file_path)[1][1:]

            file_info['file_size'] = os.path.getsize(file_path)
            file_info['content_type'] = mimetypes.guess_type(file_path)

        except Exception as e:
            raise e
        return file_info

    def processorRegistrationMakeUserFileCsv(self, filePath=None, fileName=None, targetFileName=None, paramData=None, data=None, pprcsSeq=None, pprcsTp=None, refTp=None):
        result = {'result': False, 'resultMessage':None}

        if targetFileName==None:
            targetFileName = str(pprcsSeq) + '_origin_sample.csv'

        if filePath==None:
            today = date.today()
            directory =  os.path.join('Z:\\DT\\storage\\preprocess', str(today.year), f'{today.month:02d}', str(pprcsSeq))
            os.makedirs(directory, exist_ok=True)

            makeFile = os.path.join('Z:\\DT\\storage\\preprocess', f'{today.year}', f'{today.month:02d}', str(pprcsSeq), targetFileName)
                     
        try:
            merged_df = pd.DataFrame()

            for item in data:
                print(item)
                file_path = item["FILE_PATH"]
                index_col = item["INDEX_TRGT_COL"]
                target_col = item["PPRCS_TRGT_COL"]
                
                df = pd.read_csv(file_path)
                df = df[[index_col, target_col]]
                
                if merged_df.empty:
                    merged_df = df
                else:
                    merged_df = pd.merge(merged_df, df, on=index_col, how="left")
                    #inner, outer, left, right, on=key

            df = pd.DataFrame(merged_df)
            df.to_csv(makeFile, index=False)

            file_info={}
            file_path = makeFile
            file_info['tmp_key'] = str(pprcsSeq)
            file_info['file_path'] = makeFile
            file_info['file_name'] = os.path.basename(file_path)
            file_info['file_dir'] = os.path.dirname(file_path)
            file_info['file_ext'] = os.path.splitext(file_path)[1][1:]

            file_info['file_size'] = os.path.getsize(file_path)
            file_info['content_type'] = mimetypes.guess_type(file_path)

        except Exception as e:
            raise e
        return file_info


    def processorRegistrationMakeFileCsvSaveInfo(self, pprcsSeq=None, makeFile=None, pprcsTp=None, refTp=None, userSeq=None):
        try:                    
            queryParam = {
                'ref_tp': refTp,
                'ref_seq': pprcsSeq,
                'pprcs_tp': pprcsTp,
                'file_nm': makeFile['file_name'].replace(makeFile['tmp_key'], str(pprcsSeq)),
                'file_dir': makeFile['file_dir'].replace(makeFile['tmp_key'], str(pprcsSeq)),
                'file_extn': makeFile['file_ext'],
                'file_sz': makeFile['file_size'],
                #'FILE_LEN': item['file_len'],
                'file_conts_tp': makeFile['content_type'][0],
                'reg_user_seq': userSeq
            }

            queryData = '''
                INSERT INTO TB_AUGMENT_MODEL_FILES (REF_TP,REF_SEQ,PPRCS_TP,FILE_NM,FILE_PATH,FILE_EXTN,FILE_SZ,FILE_CONTS_TP,REG_USER_SEQ) 
                VALUES (
                    %(ref_tp)s, %(ref_seq)s, %(pprcs_tp)s, %(file_nm)s, %(file_dir)s, %(file_extn)s, %(file_sz)s, %(file_conts_tp)s, %(reg_user_seq)s
                )
            '''
            self.query.execute_t(queryData, queryParam)                                                        
        except Exception as e:            
            raise e
        return makeFile['file_path'].replace(makeFile['tmp_key'], str(pprcsSeq))
        

    def processorRemove(self, paramData=None):
        '''
        검증 값 삭제
        '''
        result = None

        try:
            with transaction.atomic(using=self.databases):
                self.processorMainSetDel(pprcsSeq=paramData['pprcs_seq'])
                self.processorTwinSetDel(pprcsSeq=paramData['pprcs_seq'])
                self.processorFilesDel(pprcsSeq=paramData['pprcs_seq'])
        except Exception as e:
            
            raise e
        return result



    def processorMainSetDel(self, pprcsSeq=None, userSeq=None):
        '''
        검증 컬럼 대상 삭제
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }

            queryData = '''
                DELETE FROM TB_PREPROCESS 
                WHERE PPRCS_SEQ=%(pprcs_seq)s                    
            '''

            """
            queryData = '''
                UPDATE TB_PREPROCESS SET
                    DEL_YN='Y'
                WHERE PPRCS_SEQ=%(pprcs_seq)s                    
            '''
            """
            self.query.execute_t(queryData, queryParam)
        except Exception as e:            
            raise e

    def processorTwinSetDel(self, pprcsSeq=None):
        '''
        검증 컬럼 대상 삭제
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }

            queryData = '''
                DELETE FROM TB_PREPROCESS_TWIN_MAP
                WHERE PPRCS_SEQ=%(pprcs_seq)s                    
            '''

            """
            queryData = '''
                UPDATE TB_PREPROCESS_TWIN_MAP SET
                    DEL_YN='Y'
                WHERE PPRCS_SEQ=%(pprcs_seq)s                    
            '''
            """

            self.query.execute_t(queryData, queryParam)
        except Exception as e:            
            raise e
        
    def processorFilesDel(self, pprcsSeq=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }
            #업로드 한 파일이 있다는 가정으로 PPRCS_TP != 'UPLOAD' 임시 저장
            queryData = '''
                DELETE FROM TB_AUGMENT_MODEL_FILES 
                WHERE REF_SEQ=%(pprcs_seq)s AND REF_TP = 'PREPROCESS'  AND  PPRCS_TP != 'UPLOAD'           
            '''

            """
            queryData = '''
                UPDATE TB_AUGMENT_MODEL_FILES SET 
                    DEL_YN='Y'
                WHERE REF_SEQ=%(pprcs_seq)s AND REF_TP = 'PREPROCESS'             
            '''
            """

            self.query.execute_t(queryData, queryParam)
        except Exception as e:            
            raise e
        

    def processorMainSetDbDelete(self, pprcsSeq=None, userSeq=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }

            queryData = '''
                DELETE FROM TB_PREPROCESS WHERE PPRCS_SEQ=%(pprcs_seq)s                    
            '''
            
            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e

    def processorTwinSetDbDelete(self, pprcsSeq=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }

            queryData = '''
                DELETE FROM TB_PREPROCESS_TWIN_MAP WHERE PPRCS_SEQ=%(pprcs_seq)s                    
            '''
            
            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e


    def processorFilesDbDelete(self, pprcsSeq=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }
          
            delQueryData = '''
                DELETE FROM TB_AUGMENT_MODEL_FILES WHERE REF_SEQ=%(pprcs_seq)s AND REF_TP = 'PREPROCESS'             
            '''
            self.query.execute(delQueryData, queryParam)

        except Exception as e:            
            raise e


    def processorFilesDelete(self, pprcsSeq=None, makeFile=None):
        try:
            file = makeFile['file_path']

            if os.path.isfile(file):
                os.remove(file)

        except Exception as e:            
            raise e


    def processorStatus(self, paramData=None):
        result = None

        try:    
            queryData = '''
                SELECT PPRCS_SEQ
                    , PPRCS_NM
                    , PPRCS_DERPN
                    , INDEX_CRTR_COL
                    , PPRCS_STATUS
                    , (SELECT DTL_CD_NM FROM TB_CODE_DTL WHERE GRP_CD='PPRCS_STATUS' and DTL_CD=PPRCS_STATUS) AS PPRCS_STATUS_NAME
                    , USE_YN
                    , DEL_YN
                FROM TB_PREPROCESS
                WHERE PPRCS_SEQ={0}
                AND USE_YN='Y'
                AND DEL_YN='N'
            '''
            queryData = str.format(queryData, paramData['pprcs_seq'])            
            result = self.query.select(queryData)            
        except Exception as e:            
            raise e  
        
        return result
    
    def getFileDataPathLoad(self, paramData=None, refTp=None, pprcsTp=None):
        '''
        전처리 대상 파일 조회
        Args:
            paramData(any)
        Returns: 검증 설정 정보
            result
        '''
        result = None

        try:
            queryData = '''
                SELECT FILE_SEQ,REF_TP,REF_SEQ,PPRCS_TP,FILE_NM,FILE_PATH,
                      (SELECT INDEX_CRTR_COL FROM TB_PREPROCESS T WHERE T.PPRCS_SEQ = REF_SEQ) INDEX_CRTR_COL
                FROM TB_AUGMENT_MODEL_FILES
                WHERE REF_SEQ={0}
                  AND REF_TP = '{1}'
                  AND PPRCS_TP = '{2}'
                  AND USE_YN='Y'
                  AND DEL_YN='N'
            '''
            queryData = str.format(queryData, paramData['pprcs_seq'], refTp, pprcsTp)
            print(queryData)
            result = self.query.select(queryData)  
        except Exception as e:            
            raise e  
        
        return result
    
    def processorUpdatePprcsStatus(self, pprcsSeq=None, pprcsStatus=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq,
                'pprcs_status': pprcsStatus   
            }

            queryData = '''
                UPDATE TB_PREPROCESS SET
                    PPRCS_STATUS = %(pprcs_status)s
                WHERE PPRCS_SEQ=%(pprcs_seq)s AND USE_YN = 'Y' AND DEL_YN = 'N'
            '''
            
            self.query.execute_t(queryData, queryParam)
        except Exception as e:            
            raise e
        
    def getVrfcRuleValue(self, vrfcSeq=None):
        result = None

        try:
            queryData = '''
                SELECT VRFC_SEQ,VRFC_TP,VRFC_NM,RULE_VALUE_1,RULE_VALUE_2,RULE_VALUE_3,RULE_VALUE_4
                FROM TB_DATA_VRFC A
                WHERE A.DEL_YN = 'N'
                AND A.VRFC_SEQ = {0}
            '''
            queryData = str.format(queryData, vrfcSeq)
            #print(queryData)
            result = self.query.select(queryData)  
        except Exception as e:            
            raise e  
        
        return result
    
    def getUnitFormulaValue(self, unitSeq=None):
        '''
        전처리 단위변환 공식 조회
        Args:
            paramData(any)
        Returns: 검증 설정 정보
            result
        '''
        result = None

        try:
            queryData = '''
                SELECT UNIT_SEQ, UNIT_TP,UNIT_NM_1,UNIT_CD_1,UNIT_NM_2,UNIT_CD_2,UNIT_FORMULA,FORMULA_DERPN,ORDBY
                FROM TB_UNIT
                WHERE USE_YN = 'Y'
                AND DEL_YN = 'N'
                AND UNIT_SEQ = {0}
            '''
            queryData = str.format(queryData, unitSeq)
            #print(queryData)
            result = self.query.select(queryData)  
        except Exception as e:            
            raise e  
        
        return result


    def registProcessorFile(self, pprcsSeq=None, filePath=None, pprcsTp=None, refTp=None, userSeq=None):
        '''
        전처리 파일 존재 유무 인서트/업데이트
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:                    
            check = self.processorFileDbDupliteKeyCheck(pprcsSeq=pprcsSeq, pprcsTp=pprcsTp, refTp=refTp)

            if check > 0:
                self.processorFileDbUpdate(pprcsSeq=pprcsSeq, pprcsTp=pprcsTp, refTp=refTp, filePath=filePath, userSeq=userSeq)
            else:
                self.processorFileDbInsert(pprcsSeq=pprcsSeq, pprcsTp=pprcsTp, refTp=refTp, filePath=filePath, userSeq=userSeq)


        except Exception as e:  
            print('---------에러진입-----------')          
            raise e

    def processorFileDbDupliteKeyCheck(self, pprcsSeq=None, pprcsTp=None, refTp=None):
        try:                    
            queryData = '''
                SELECT *
                FROM TB_AUGMENT_MODEL_FILES
                WHERE USE_YN = 'Y'
                AND DEL_YN = 'N'
                AND REF_SEQ = {0}
                AND PPRCS_TP = '{1}'
                AND REF_TP = '{2}'
            '''
            queryData = str.format(queryData, pprcsSeq, pprcsTp, refTp)
            #print(queryData)
            result = self.query.select(queryData)  

            return len(result)

        except Exception as e:            
            raise e

    def processorFileDbInsert(self, pprcsSeq=None, pprcsTp=None, refTp=None, filePath=None, userSeq=None):
        try:
            file_info = self.getFileInfo(filePath=filePath)
            print('---------file_info---------')
            print(file_info)

            queryParam = {
                'ref_tp': refTp,
                'ref_seq': pprcsSeq,
                'pprcs_tp': pprcsTp,
                'file_nm': file_info['file_name'],
                'file_dir': file_info['file_dir'],
                'file_extn': file_info['file_ext'],
                'file_sz': file_info['file_size'],
                #'FILE_LEN': item['file_len'],
                'file_conts_tp': file_info['content_type'][0],
                'reg_user_seq': userSeq
            }

            queryData = '''
                INSERT INTO TB_AUGMENT_MODEL_FILES (REF_TP,REF_SEQ,PPRCS_TP,FILE_NM,FILE_PATH,FILE_EXTN,FILE_SZ,FILE_CONTS_TP,REG_USER_SEQ) 
                VALUES (
                    %(ref_tp)s, %(ref_seq)s, %(pprcs_tp)s, %(file_nm)s, %(file_dir)s, %(file_extn)s, %(file_sz)s, %(file_conts_tp)s, %(reg_user_seq)s
                )
            '''
            
            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e
    
    def processorFileDbUpdate(self, pprcsSeq=None, pprcsTp=None, refTp=None, filePath=None, userSeq=None):
        try:                    
            file_info = self.getFileInfo(filePath=filePath)

            queryParam = {
                'ref_tp': refTp,
                'ref_seq': pprcsSeq,
                'pprcs_tp': pprcsTp,
                'file_nm': file_info['file_name'],
                'file_dir': file_info['file_dir'],
                'file_extn': file_info['file_ext'],
                'file_sz': file_info['file_size'],
                #'FILE_LEN': item['file_len'],
                'file_conts_tp': file_info['content_type'][0],
                'reg_user_seq': userSeq
            }

            queryData = '''
                UPDATE TB_AUGMENT_MODEL_FILES
                   SET FILE_NM = %(file_nm)s,
                       FILE_PATH = %(file_dir)s,
                       FILE_EXTN = %(file_extn)s,
                       FILE_SZ = %(file_sz)s,
                       MDFCN_USER_SEQ = %(reg_user_seq)s,
                       MDFCN_DT = now()
                WHERE USE_YN = 'Y' AND DEL_YN = 'N'
                  AND REF_SEQ=%(ref_seq)s
                  AND PPRCS_TP=%(pprcs_tp)s
                  AND REF_TP=%(ref_tp)s
            '''
            
            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e
        
            
    def getFileInfo(self, filePath=None):       
        file_info = {}
       
        try:
            if filePath:
                file_info['file_path'] = filePath
                file_info['file_name'] = os.path.basename(filePath)
                file_info['file_dir'] = os.path.dirname(filePath)
                file_info['file_ext'] = os.path.splitext(filePath)[1][1:]
                file_info['file_size'] = os.path.getsize(filePath)
                file_info['content_type'] = mimetypes.guess_type(filePath)
        except Exception as e:            
            raise e  
    
        return file_info
    



    def registVrfcMapDB(self, pprcsSeq=None, vrfcSeq=None, dataVrfcItem=None, ordBy=None, userSeq=None):
        try:
            self.vrfcMapInsert(pprcsSeq=pprcsSeq, vrfcSeq=vrfcSeq, dataVrfcItem=dataVrfcItem, ordBy=ordBy, userSeq=userSeq)
        except Exception as e:            
            raise e

    def registUnitMapDB(self, pprcsSeq=None, unitSeq=None, unitItem=None, ordBy=None, userSeq=None):
        '''
        단위 생성 파일 정보 인서트
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:
            self.unitMapInsert(pprcsSeq=pprcsSeq, unitSeq=unitSeq, unitItem=unitItem, ordBy=ordBy, userSeq=userSeq)
        except Exception as e:            
            raise e

    def vrfcMapDel(self, pprcsSeq=None):
        '''
        검증 맵 테이블 삭제
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }

            """
            queryData = '''
                UPDATE TB_PREPROCESS_DATA_VRFC_MAP SET 
                    DEL_YN='Y'
                WHERE PPRCS_SEQ=%(pprcs_seq)s
            '''
            """
            queryData = '''
                DELETE FROM TB_PREPROCESS_DATA_VRFC_MAP 
                 WHERE PPRCS_SEQ=%(pprcs_seq)s
            '''

            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e
        
    def vrfcMapInsert(self, pprcsSeq=None, vrfcSeq=None, dataVrfcItem=None, ordBy=None, userSeq=None):
        '''
        검증 맵 테이블
        Args:
            paramData(any): 모델 변수 정보
        '''
        #self.sql.registVrfcMapDB(pprcsSeq=paramData.get('pprcs_seq'), vrfcSeq=item['vrfc_seq'], dataVrfcItem=item['vrfc_trgt_col'], ordBy=item['vrfc_order'], userSeq=paramData.get('reg_user_seq'))
        try:                    
        
            queryParam = {
                'pprcs_seq': pprcsSeq,
                'vrfc_seq': vrfcSeq,
                'data_vrfc_item': dataVrfcItem,
                'ordby': ordBy,
                'reg_user_seq': userSeq
            }

            queryData = '''
                INSERT INTO TB_PREPROCESS_DATA_VRFC_MAP (PPRCS_SEQ, VRFC_SEQ, DATA_VRFC_ITEM, ORDBY, REG_USER_SEQ) 
                VALUES (
                    %(pprcs_seq)s, %(vrfc_seq)s, %(data_vrfc_item)s, %(ordby)s, %(reg_user_seq)s
                )
            '''
                
            self.query.execute(queryData, queryParam)                                                        
        except Exception as e:            
            raise e


    def unitMapDel(self, pprcsSeq=None):
        '''
        단위 변환 맵 테이블 삭제
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq                    
            }

            """
            queryData = '''
                UPDATE TB_PREPROCESS_UNIT_MAP SET 
                    DEL_YN='Y'
                WHERE PPRCS_SEQ=%(pprcs_seq)s
            '''
            """
            queryData = '''
                DELETE FROM TB_PREPROCESS_UNIT_MAP 
                WHERE PPRCS_SEQ=%(pprcs_seq)s
            '''

            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e
        
    def unitMapInsert(self, pprcsSeq=None, unitSeq=None, unitItem=None, ordBy=None, userSeq=None):
        '''
        단위 변환 맵 테이블
        Args:
            paramData(any): 모델 변수 정보
        '''
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq,
                'unit_seq': unitSeq,
                'unit_item': unitItem,
                'ordby': ordBy,
                'reg_user_seq': userSeq
            }

            queryData = '''
                INSERT INTO TB_PREPROCESS_UNIT_MAP (PPRCS_SEQ, UNIT_SEQ, UNIT_ITEM, ORDBY, REG_USER_SEQ) 
                VALUES (
                    %(pprcs_seq)s, %(unit_seq)s, %(unit_item)s, %(ordby)s, %(reg_user_seq)s
                )
            '''

            self.query.execute(queryData, queryParam)                                                        
        except Exception as e:            
            raise e
        
    def interpolateMainDbUpdate(self, pprcsSeq=None, interplTp=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq,
                'interpl_tp': interplTp
            }

            queryData = '''
                UPDATE TB_PREPROCESS SET 
                    INTERPL_TP=%(interpl_tp)s
                WHERE PPRCS_SEQ=%(pprcs_seq)s
            '''

            self.query.execute(queryData, queryParam)  

        except Exception as e:            
            raise e
        
    def resampleMainDbUpdate(self, pprcsSeq=None, resmplTp=None, resmplIntvlTp=None, resmplIntvlValue=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq,
                'resmpl_tp': resmplTp,
                'resmpl_intvl_tp': resmplIntvlTp,
                'resmpl_intvl_value': resmplIntvlValue
            }

            queryData = '''
                UPDATE TB_PREPROCESS SET 
                    RESMPL_TP=%(resmpl_tp)s,
                    RESMPL_INTVL_TP=%(resmpl_intvl_tp)s,
                    RESMPL_INTVL_VALUE=%(resmpl_intvl_value)s
                WHERE PPRCS_SEQ=%(pprcs_seq)s
            '''
            self.query.execute(queryData, queryParam)                                                        
        except Exception as e:            
            raise e


    def processorFileDbDeletePprcsTp(self, pprcsSeq=None, pprcsTp=None, refTp=None):
        try:                    
            queryParam = {
                'pprcs_seq': pprcsSeq,
                'pprcs_tp': pprcsTp,
                'ref_tp': refTp
            }

            """
            queryData = '''
                UPDATE TB_AUGMENT_MODEL_FILES SET 
                    DEL_YN='Y'
                 WHERE REF_SEQ = %(pprcs_seq)s
                   AND REF_TP = %(ref_tp)s 
                   AND PPRCS_TP = %(pprcs_tp)s
            '''
            """
            queryData = '''
                DELETE FROM TB_AUGMENT_MODEL_FILES
                 WHERE REF_SEQ = %(pprcs_seq)s
                   AND REF_TP = %(ref_tp)s 
                   AND PPRCS_TP = %(pprcs_tp)s
            '''

            self.query.execute(queryData, queryParam)
        except Exception as e:            
            raise e

    def processorFileDbSelectPprcsTp(self, pprcsSeq=None, pprcsTp=None, refTp=None):
        try:                    
            queryData = '''
                SELECT *
                FROM TB_AUGMENT_MODEL_FILES
                WHERE USE_YN = 'Y'
                AND DEL_YN = 'N'
                AND REF_SEQ = {0}
                AND PPRCS_TP = '{1}'
                AND REF_TP = '{2}'
            '''
            queryData = str.format(queryData, pprcsSeq, pprcsTp, refTp)
            #print(queryData)
            result = self.query.select(queryData)  

            return result

        except Exception as e:            
            raise e

    def pprcsTpFilesDelete(self, pprcsSeq=None, filePath=None):
        '''
        파라미터 없을시 해당 파일이 기존에 있으면 삭제
        Args:            
            pprcsSeq(any): 검증 식별자
        '''
        try:
            if os.path.isfile(filePath):
                os.remove(filePath)

        except Exception as e:            
            raise e
        
    def rename_file(self, source_path=None, destination_path=None):
        try:
            #디렉토리 우선 생성
            os.makedirs(os.path.dirname(destination_path), exist_ok=True)
            shutil.move(source_path, destination_path)

            #소스디렉토리 삭제
            os.rmdir(os.path.dirname(source_path))
        except Exception as e:
            print(f"파일 이동 및 이름 변경 실패: {e}")



    def metaTestListQuery(self, pageParam=None, search=None, sort=None):
        '''
        검증 값 설정 정보목록
        '''
        result = None

        try:
            queryData = '''
                        SELECT 
                            DATE_FORMAT(yyyymmdd, '%Y-%m-%d %H:%i:%s') yyyymmdd,
                            m00,m10,m20,m30,m40,m50,m60,w00,w10,w20,w30,w40,w50,w60
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
                            m00,m10,m20,m30,m40,m50,m60,w00,w10,w20,w30,w40,w50,w60
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