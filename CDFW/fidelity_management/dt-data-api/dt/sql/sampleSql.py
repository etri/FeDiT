from dt_data_api.common.lib_x import (
    DB_NAME, ExecuteQuery, Page
)

class sampleQuery():
    query = ExecuteQuery

    def __init__(self, database=DB_NAME.DT_DATA_PLATFORM) -> None:
        if database:
            self.query = ExecuteQuery(database.value)
        
    def getQueryList(self, param=None):
        try:
            if not param.GET.get('sample_seq'):
                query_data = "SELECT * FROM TB_DJANGO_SAMPLE_TABLE"
            else:
                query_data = "SELECT * FROM TB_DJANGO_SAMPLE_TABLE WHERE sample_seq=" + param.GET.get('sample_seq')

            pagedata = Page.paging(param)
            sql = Page.makeQuery(query_data, pagedata)

            data = self.query.select(sql)

        except Exception as e:
            raise e
        return data
    
    def updateQuery(self, param=None):
        try:
            if param.get('sample_seq'):
                queryParam = {
                    'sample_seq' : param.get('sample_seq'),
                    'sample_id' : param.get('sample_id'),
                    'sample_name' : param.get('sample_name'),
                    'sample_bgng_ymd' : param.get('sample_bgng_ymd'),
                    'sample_end_ymd' : param.get('sample_end_ymd'),
                    'sample_status' : param.get('sample_status')
                }

                query_data = '''
                                UPDATE TB_DJANGO_SAMPLE_TABLE
                                    SET SAMPLE_ID = %(sample_id)s,
                                        SAMPLE_NAME = %(sample_name)s,
                                        SAMPLE_BGNG_YMD = %(sample_bgng_ymd)s,
                                        SAMPLE_END_YMD = %(sample_end_ymd)s,
                                        SAMPLE_STATUS = %(sample_status)s
                                WHERE SAMPLE_SEQ = %(sample_seq)s 
                '''

                self.query.execute(query_data, queryParam)
        except Exception as e:
            raise e

    def deleteQuery(self, param=None):
        try:
            if param.get('sample_seq'):
                query_data = "DELETE FROM TB_DJANGO_SAMPLE_TABLE WHERE SAMPLE_SEQ = " + param.get('sample_seq')
                self.query.execute(query_data)
        except Exception as e:
            raise e


