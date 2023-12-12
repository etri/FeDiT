from django.db import connections, connection, transaction
from multipledispatch import dispatch

class ExecuteQuery():
    databases: str

    def __init__(self, databases=None) -> None:
        self.databases = databases

    @dispatch(str)
    def select(self, query):
        result = None
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                cursor.execute(query)
                result = self.dictfetchall(cursor)                
                #result = cursor.fetchall()                
        except Exception as e:
            raise e
        return result

    @dispatch(str)
    def execute(self, query):
        result=None
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                result = cursor.execute(query)
                connections[self.databases].commit()
        except Exception as e:
            connections[self.databases].rollback()
            raise e        
        return result
    
    @dispatch(str, object)
    def execute(self, query, param):
        result=None
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                result = cursor.execute(query, param)
                connections[self.databases].commit()
        except Exception as e:
            connections[self.databases].rollback()
            raise e                
        return result
        
    @dispatch(str, object)
    def execute_return(self, query, param):
        result=None
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                cursor.execute(query, param)
                cursor.execute("SELECT LAST_INSERT_ID()")
                connections[self.databases].commit()
                row = cursor.fetchone()
                if row:
                    result = row[0]                
        except Exception as e:
            connections[self.databases].rollback()
            raise e                
        return result
    
    @dispatch(str, object)
    def execute_bulk(self, query, param):
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                cursor.executemany(query, param)
                connections[self.databases].commit()
        except Exception as e:
            connections[self.databases].rollback()
            raise e                

    def dictfetchall(self, cursor): 
        desc = cursor.description 
        return [
                dict(zip([col[0] for col in desc], row)) 
                for row in cursor.fetchall() 
        ]

    @dispatch(str, object)
    def execute_t_return(self, query, param):
        result=None
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                cursor.execute(query, param)
                cursor.execute("SELECT LAST_INSERT_ID()")
                row = cursor.fetchone()
                if row:
                    result = row[0]                
        except Exception as e:            
            raise e                
        return result
    
    @dispatch(str, object)
    def execute_t(self, query, param):
        result=None
        try:
            cursor = (connection.cursor() if self.databases==None else connections[self.databases].cursor())
            with cursor:
                result = cursor.execute(query, param)                
        except Exception as e:            
            raise e                
        return result

    '''
    @dispatch(str)
    def execute(self, query):
        #with self.cursor:
        self.cursor.execute(query)
        data = self.cursor.fetchall()        
        return data
    
    @dispatch(str, object)
    def execute(self, query, param):
        #with self.cursor:
        self.cursor.execute(query, param)
        data = self.cursor.fetchall()
        return data
    '''

    '''    
    @dispatch(str)
    def execute1(self, query):
        try:
            cursor = connections[self.databases].cursor()
            with cursor:
                cursor.execute(query)
                data = cursor.fetchall()        
        except Exception as e:
            connections[self.databases].rollback()
            raise e
        return data

    @dispatch(str, object)
    def execute1(self, query, param):
        cursor = connections[self.databases].cursor()
        with cursor:
            cursor.execute(query, param)
            data = cursor.fetchall()
        return data
    '''
    