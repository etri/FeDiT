from dt.models.sampleModel import sampleModel
from dt.serializers.sampleSerializer import sampleSerializer
from dt.sql.sampleSql import sampleQuery
from dt_data_api.model_x import regressionModel

from dt_data_api.common.lib_x import (
    DB_NAME, Page
)
import logging
import pandas as pd
from sklearn import linear_model


class sampleService(object):
    sql = sampleQuery(database=DB_NAME.DT_DATA_PLATFORM)


    def List(param=None):
        result = {'result': False, 'resultMessage':None}
       
        pagedata = Page.paging(param)
        #print(pagedata.get('offset'))

        #print(param.GET.get('page'))
        #print(param.GET['page_size'])

        data = sampleModel.objects.all()[pagedata.get('offset'):pagedata.get('limit')].values()
        serializer = sampleSerializer(data, many=True)
        #print(serializer.data)

        result['result'] = True
        result['resultMessage'] = serializer.data       
        
        return result

    def Save(param=None):
        result = {'result': False, 'resultMessage':None}
        serializer = sampleSerializer(data=param)
        if serializer.is_valid():
            serializer.save()            
            result['result'] = True
            result['resultMessage'] = serializer.data
        else:
            result['resultMessage'] = serializer.errors
        return result

    def Update(sampleSeq, param=None):
        result = {'result': False, 'resultMessage':None}
        try:
            model = sampleModel.objects.get(sample_seq=sampleSeq)
            
            #model = sample()
            model.sample_seq = sampleSeq

            serializer = sampleSerializer(model, data=param)
            
            if serializer.is_valid():
                serializer.save()            
                result['result'] = True
                result['resultMessage'] = serializer.data
            else:
                result['resultMessage'] = serializer.errors
        except Exception as ex_msg:
            result['resultMessage'] = str(ex_msg)

        return result

    def Delete(sampleSeq):
        model = sampleModel()
        model.sample_seq = sampleSeq

        result = {'result': False, 'resultMessage':None}

        if int(model.sample_seq) > 0:
            obj = sampleModel.objects.get(sample_seq=sampleSeq)
            obj.delete()
            result['result'] = True
        else:
            result['resultMessage'] = "존재하지 않는 키입니다."
        return result

    def View(sampleSeq):
        result = {'result': False, 'resultMessage':None}
        try:
            model = sampleModel.objects.get(sample_seq=sampleSeq)
            serializer = sampleSerializer(model)
            result['result'] = True
            result['resultMessage'] = serializer.data       
        except Exception as ex_msg:
            result['resultMessage'] = str(ex_msg)

        return result

    def getRowDataCount(sampleSeq):
        result = 0
        result = sampleModel.objects.all().filter(sample_seq__icontains=sampleSeq).count()
        return result


    def getQueryList(self, param=None):
        result = {'result': False, 'resultMessage':None}
        try:
            dt = self.sql.getQueryList(param)        
            result['result'] = True
            result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'GetDataQuery Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg            
        return result


    def updateQuery(self, param=None):
        result = {'result': False, 'resultMessage':None}
        try:
            if param is not None:
                dt = self.sql.updateQuery(param)    

                result['result'] = True
                result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'GetDataQuery Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg            
        return result        

    def deleteQuery(self, param=None):
        result = {'result': False, 'resultMessage':None}
        
        try:
            if param is not None:
                dt = self.sql.deleteQuery(param)    

                result['result'] = True
                result['resultMessage'] = dt
        except Exception as e:
            errorMsg = 'GetDataQuery Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg            
        return result            

    
    def SetLinearRegression(self):
        '''
        선형회귀 보간 : 한 컬럼의 NaN 값을 채우려면 비교하는 다른 대상 필드는 NaN값이 없어야 함
        비교대상 컬럼중 NaN 이 있으면 해당 필드는 제외하고 예측값을 출력하는 방향으로 가야함.
        다수 필드가 NaN이 존재하면 불가함
        '''
        result = {'result': False, 'resultMessage':None}

        file='dt_data_api/data/test_data_201901_201902_3.csv'
        #df=pd.read_csv(file, header=0, index_col=0, parse_dates=True)
        df=pd.read_csv(file)

        try:
            df = regressionModel.regression(df)

            #False: csv 로드시 헤더,인덱스지정안함
            df.linearRegression('m60', False)

            result['result'] = True
            result['resultMessage'] = '완료'
        except Exception as e:
            errorMsg = 'SetLinearRegression2 Error : ' + e.args[0] + ' - ' + e.args[1]
            logging.error(errorMsg)
            result['result'] = False
            result['resultMessage'] = errorMsg  

        return result
   