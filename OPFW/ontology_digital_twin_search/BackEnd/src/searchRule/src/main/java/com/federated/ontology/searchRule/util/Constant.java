package com.federated.ontology.searchRule.util;

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

	public static final String CTRL_CMD_REQ_TYPE_REG_DV = "RQ01";
	public static final String CTRL_CMD_REQ_TYPE_CTRL_DV = "RQ02";

	public static final String CTRL_CMD_STATUS_READY = "CS01";
	public static final String CTRL_CMD_STATUS_SEQ_RUNNING = "CS02";
	public static final String CTRL_CMD_STATUS_COMPLETE = "CS03";
	public static final String CTRL_CMD_STATUS_TIMEOUT = "CS44";
	public static final String CTRL_CMD_STATUS_ERROR = "CS99";

	public static final String CTRL_CMD_SEQUENCE_SINGLE = "SST";
	public static final String CTRL_CMD_STATUS_CHECKER = "SCT";
	
	public static final String CTRL_CMD_SEQUENCE_START = "STS";
	public static final String CTRL_CMD_SEQUENCE_RUNNING = "RTS";
	public static final String CTRL_CMD_SEQUENCE_END = "ETS";

	public static final String CTRL_SEQUENCE_STATUS_REG = "SS00";
	public static final String CTRL_SEQUENCE_STATUS_READY = "SS01";
	public static final String CTRL_SEQUENCE_STATUS_WAIT = "SS05";
	public static final String CTRL_SEQUENCE_STATUS_RUNNING = "SS10";
	public static final String CTRL_SEQUENCE_STATUS_COMPLETE = "SS20";
	public static final String CTRL_SEQUENCE_STATUS_TIMEOUT = "SS44";
	public static final String CTRL_SEQUENCE_STATUS_ERROR = "SS99";

	public static final String CTRL_SEQ_TASK_STATUS_READY = "TS01";
	public static final String CTRL_SEQ_TASK_STATUS_RUNNING = "TS02";
	public static final String CTRL_SEQ_TASK_STATUS_COMPLETE = "TS03";
	public static final String CTRL_SEQ_TASK_STATUS_ERROR = "TS99";

	public static final String TASK_SENDING_STATUS_REQ = "REQ";
	public static final String TASK_SENDING_STATUS_RES = "RES";

	public static final String CTRL_SEQ_RES_RECIEVE_STS_CMP = "CMP";

	public static final int SERVER_RECONNECT_CNT = 3;

	public static void sleep(Thread thread, long sleep) {
		try {
			thread.sleep(sleep);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
