package iitp.federatedTwins.DtEvtTracking.common.util;

import org.springframework.http.HttpStatus;

public class Constant {
	public static final HttpStatus HTTP_BAD_REQ_ERROR_STAT = HttpStatus.BAD_REQUEST;
	public static final int HTTP_BAD_REQ_ERROR_CODE = HTTP_BAD_REQ_ERROR_STAT.value();

	public static final HttpStatus HTTP_OK_STAT = HttpStatus.OK;
	public static final int HTTP_OK_CODE = HTTP_OK_STAT.value();

	public static final HttpStatus HTTP_CREATE_STAT = HttpStatus.CREATED;
	public static final int HTTP_CREATE_CODE = HTTP_CREATE_STAT.value();

	public static final HttpStatus HTTP_DELETE_STAT = HttpStatus.NO_CONTENT;
	public static final int HTTP_DELETE_CODE = HTTP_DELETE_STAT.value();

	public static final HttpStatus HTTP_AUTHORIZED_ERROR_STAT = HttpStatus.UNAUTHORIZED;
	public static final int HTTP_AUTHORIZED_ERROR_CODE = HTTP_AUTHORIZED_ERROR_STAT.value();

	public static final HttpStatus HTTP_NOT_FOUND_STAT = HttpStatus.NOT_FOUND;
	public static final int HTTP_NOT_FOUND_CODE = HTTP_NOT_FOUND_STAT.value();

	public static final HttpStatus HTTP_SERVER_ERROR_STAT = HttpStatus.INTERNAL_SERVER_ERROR;
	public static final int HTTP_SERVER_ERROR_CODE = HTTP_SERVER_ERROR_STAT.value();

	public static final String TRCK_CMD_TYPE_DATA  	= "DTP";
	public static final String RCK_CMD_TYPE_EVENT 	= "ETP";
	
	public static final String DATA_FILLTER_TYPE_MIN 	= "DF01";
	public static final String DATA_FILLTER_TYPE_MAX 	= "DF02";
	public static final String DATA_FILLTER_TYPE_AVER 	= "DF03";
	public static final String DATA_FILLTER_TYPE_SUM 	= "DF04";
	public static final String DATA_FILLTER_TYPE_STDEVP = "DF05";

	public static final String INTERVAL_DATE_SECONDS 	= "SECONDS"; 
	public static final String INTERVAL_DATE_MINUTES 	= "MINUTES";
	public static final String INTERVAL_DATE_HOURS 		= "HOURS"; 
	public static final String INTERVAL_DATE_DAYS 		= "DAYS"; 
	
	public static final String LOGICAL_OPERATOR_OR 		= "OR";
	public static final String LOGICAL_OPERATOR_AND 	= "AND";
	public static final String LOGICAL_OPERATOR_EQ 		= "EQ";
	public static final String LOGICAL_OPERATOR_NE 		= "NE";
	public static final String LOGICAL_OPERATOR_LT 		= "LT";
	public static final String LOGICAL_OPERATOR_LE 		= "LE";
	public static final String LOGICAL_OPERATOR_GT 		= "GT";
	public static final String LOGICAL_OPERATOR_GE 		= "GE";
	
	public static final String EVENT_CONDITION_TYPE_CLIENT = "CP"; 
	public static final String EVENT_CONDITION_TYPE_LOGIC = "CB"; 

	public static final String TRCK_CMD_STATUS_READY 		= "CS01";
	public static final String TRCK_CMD_STATUS_RUNNING 		= "CS02";
	public static final String TRCK_CMD_STATUS_COMPLETE 	= "CS03";
	public static final String TRCK_CMD_STATUS_KILLED 		= "CS66";
	public static final String TRCK_CMD_STATUS_ERROR 		= "CS99";

	public static final String TRCK_PROC_STATUS_REG 		= "TRS00";
	public static final String TRCK_PROC_STATUS_READY 		= "TRS01";
	public static final String TRCK_PROC_STATUS_WAIT 		= "TRS05";
	public static final String TRCK_PROC_STATUS_RUNNING 	= "TRS10";
	public static final String TRCK_PROC_STATUS_COMPLETE 	= "TRS20";
	public static final String TRCK_PROC_STATUS_TIMEOUT 	= "TRS44";
	public static final String TRCK_PROC_STATUS_TASKKILL 	= "TRS66";
	public static final String TRCK_PROC_STATUS_ERROR 		= "TRS99";

	public static final String DATA_LINK_TYPE_KAFKA 		= "DL01";
	public static final String DATA_LINK_TYPE_NGSILD 		= "DL02";

	public static final String TRCK_DECTOR_STATUS_READY 	= "DS01";
	public static final String TRCK_DECTOR_STATUS_RUNNING 	= "DS02";
	public static final String TRCK_DECTOR_STATUS_COMPLETE 	= "DS03";
	public static final String TRCK_DECTOR_STATUS_ERROR 	= "DS99";
	
	public static final String TRG_EVT_STATUS_READY 		= "TGS01";
	public static final String TRG_EVT_STATUS_RUNNING 		= "TGS02";
	public static final String TRG_EVT_STATUS_COMPLETE 		= "TGS03";
	public static final String TRG_EVT_STATUS_ERROR 		= "TGS99";

	public static final String CALLBACK_MSG_TYPE_EVENT 		= "EVENT";
	public static final String CALLBACK_MSG_TYPE_STATUS 	= "STATUS";

	public static final String TRCK_STATUS_NO_DATA 			= "NO_DATA";
	public static final String TRCK_STATUS_COLLECT_ERROR 	= "COLLECT_ERROR";

	public static final String TASK_SENDING_STATUS_REQ 		= "REQ";
	public static final String TASK_SENDING_STATUS_RES 		= "RES";

	public static final int SERVER_RECONNECT_CNT 		= 3;

	public static final String TWO_TH_CONN_BASE_URL 	= "http://localhost";
	public static final int TWO_TH_CONN_BASE_PORT 		= 23499;	
	
	public static final String EUREKA_GATEWAY_CONN_BASE_URL 	= "http://localhost";
	public static final int EUREKA_GATEWAY_CONN_BASE_PORT 		= 8000;

	public static void sleep(Thread thread, long sleep) {
		try {
			thread.sleep(sleep);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
