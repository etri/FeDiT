#from dt_data_api.db.query import ExecuteQuery
#from dt_data_api.common.enum import DB_NAME
from dt_data_api.common.lib_x import (
    DB_NAME, ExecuteQuery
)

class augment1Query():
    query = ExecuteQuery

    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.query = ExecuteQuery(database.value)
        
    def getTestData(self):
        '''
        테스트용 데이터 로드
        '''
        try:
            data = self.query.select("select * from test")
        except Exception as e:
            raise e
        return data
    
    def getTestDataSave(self, data:None):
        '''
        단일 데이터 저장
        '''
        try:
            #param = {}
            #for dt in data:
            #    for key, value in dt.items():
            #        param.setdefault(key, value)
            #        print(key, value)
            #print(param)

            queryParam = {
                'name' : data['name']
            }
            queryData = '''
                INSERT INTO test(name) VALUES(
                    %(name)s
                )
            '''
            
            self.query.execute(queryData, queryParam)
        except Exception as e:
            raise e

    def getTestDataSaveBulk(self, data=None):
        '''
        대용량 데이터 저장
        '''
        try:
            dt = []
            for d in data:
                dt.append(str(d['name']))
            
            dt.append(str('a1'))
            dt.append(str('a2'))
            dt.append(str('a3'))

            queryData = '''
                INSERT INTO test(name) VALUES(
                    %s
                )
            '''
            self.query.execute_bulk(queryData, dt)
        except Exception as e:
            raise e


    '''
    def setTestData(self, param=None):
        queryParam = {
            'sample_seq' : param.get('sample_seq'),
            'sample_id' : param.get('sample_id'),
            'sample_name' : param.get('sample_name'),
            'sample_bgng_ymd' : param.get('sample_bgng_ymd'),
            'sample_end_ymd' : param.get('sample_end_ymd'),
            'sample_status' : param.get('sample_status')
        }

        query_data = '
            UPDATE TB_DJANGO_SAMPLE_TABLE
                SET SAMPLE_ID = %(sample_id)s,
                    SAMPLE_NAME = %(sample_name)s,
                    SAMPLE_BGNG_YMD = %(sample_bgng_ymd)s,
                    SAMPLE_END_YMD = %(sample_end_ymd)s,
                    SAMPLE_STATUS = %(sample_status)s
            WHERE SAMPLE_SEQ = %(sample_seq)s 
        '

        return SQLBuilder(self.database).execute(query_data, queryParam)
    '''
