from django.db import models

class responseData:
    code = None
    message = None
    data = None
    detail = None

    def __init__(self, code=None, message=None, data=None, detail='') -> None:
        self.code = code
        self.message = message
        self.detail = detail
        self.data = data        
    
    def getJson(self):
        return {'code': self.code, 'message':self.message, 'detail':self.detail, 'data': self.data}