import sys, traceback
import logging 
logging = logging.getLogger('dt')

def infoMessage(message=None):
    logging.info(message)
    
def debugMessage(message=None):
    logging.debug(message)

def errorMessage(message=None):
    logging.error(message)

def exceptionMessage(e=None, errorCode=None, func=None):
    e_type, e_value, e_traceback = sys.exc_info()
    errorType = str(e_type)[8:-2]
    errorValue = e_value
    
    message = f'{errorCode}-{func} : [{errorType} : {errorValue}]'
    logging.error(message + '\r\n' + traceback.format_exc())

    return message
