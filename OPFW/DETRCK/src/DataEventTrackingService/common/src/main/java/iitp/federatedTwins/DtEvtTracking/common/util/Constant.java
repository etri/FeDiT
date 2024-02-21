package iitp.federatedTwins.DtEvtTracking.common.util;

import org.springframework.http.HttpStatus;

public class Constant {
	
	// 400 에러
	public static final HttpStatus HTTP_BAD_REQ_ERROR_STAT = HttpStatus.BAD_REQUEST;
	public static final int HTTP_BAD_REQ_ERROR_CODE = HTTP_BAD_REQ_ERROR_STAT.value();

	// 200 성공
	public static final HttpStatus HTTP_OK_STAT = HttpStatus.OK;
	public static final int HTTP_OK_CODE = HTTP_OK_STAT.value();

	// 201 성공
	public static final HttpStatus HTTP_CREATE_STAT = HttpStatus.CREATED;
	public static final int HTTP_CREATE_CODE = HTTP_CREATE_STAT.value();

	// 204 성공
	public static final HttpStatus HTTP_DELETE_STAT = HttpStatus.NO_CONTENT;
	public static final int HTTP_DELETE_CODE = HTTP_DELETE_STAT.value();

	// 401 인증 에러
	public static final HttpStatus HTTP_AUTHORIZED_ERROR_STAT = HttpStatus.UNAUTHORIZED;
	public static final int HTTP_AUTHORIZED_ERROR_CODE = HTTP_AUTHORIZED_ERROR_STAT.value();

	// 404 인증 에러
	public static final HttpStatus HTTP_NOT_FOUND_STAT = HttpStatus.NOT_FOUND;
	public static final int HTTP_NOT_FOUND_CODE = HTTP_NOT_FOUND_STAT.value();

	// 500 에러
	public static final HttpStatus HTTP_SERVER_ERROR_STAT = HttpStatus.INTERNAL_SERVER_ERROR;
	public static final int HTTP_SERVER_ERROR_CODE = HTTP_SERVER_ERROR_STAT.value();

	// TRACKING 제어명령 요청타입
	public static final String MSA_SEQ_REQ_CALLBACK_URL = "http://localhost:13479/msa/digital-twins/"; // 디바이스 등록

	// TRACKING 제어명령 요청타입
	public static final String CTRL_CMD_REQ_TYPE_REG_DV = "RQ01"; // 디바이스 등록
	public static final String CTRL_CMD_REQ_TYPE_CTRL_DV = "RQ02"; // 제어요청

	// TRACKING 제어명령 요청상태
	public static final String CTRL_CMD_STATUS_READY = "CS01"; // 실행준비
	public static final String CTRL_CMD_STATUS_SEQ_RUNNING = "CS02"; // 명령 실행 중
	public static final String CTRL_CMD_STATUS_COMPLETE = "CS03"; // 명령 실행 완료
	public static final String CTRL_CMD_STATUS_ERROR = "CS99"; // 명령 처리 오류

	// TRACKING 제어명령 시퀀스 동작타입
	public static final String CTRL_CMD_SEQUENCE_SINGLE = "SST"; // Single Sequence Task
	public static final String CTRL_CMD_SEQUENCE_START = "STS"; // Start Task of Sequences STS -> [RTS] -> ETS
	public static final String CTRL_CMD_SEQUENCE_RUNNING = "RTS"; // Running Task of Sequential
	public static final String CTRL_CMD_SEQUENCE_END = "ETS"; // End Task of Sequences

	// TRACKING 제어시퀀스 단위시퀀스 동작상태
	public static final String CTRL_SEQUENCE_STATUS_REG = "SS00"; // 시퀀스 정보생성/등록
	public static final String CTRL_SEQUENCE_STATUS_READY = "SS01"; // 시퀀스 실행준비
	public static final String CTRL_SEQUENCE_STATUS_WAIT = "SS05"; // 시퀀스 실행대기
	public static final String CTRL_SEQUENCE_STATUS_RUNNING = "SS10"; // 시퀀스 실행 중
	public static final String CTRL_SEQUENCE_STATUS_COMPLETE = "SS20"; // 시퀀스 실행 완료
	public static final String CTRL_SEQUENCE_STATUS_ERROR = "SS99"; // 시퀀스 에러발생

	// TRACKING 제어시퀀스 단위시퀀스 Task Proc 동작상태
	public static final String CTRL_SEQ_TASK_STATUS_READY = "TS01"; // 제어 시퀀스 Proc 실행준비
	public static final String CTRL_SEQ_TASK_STATUS_RUNNING = "TS02"; // 제어 시퀀스 Proc 실행 중
	public static final String CTRL_SEQ_TASK_STATUS_COMPLETE = "TS03"; // 제어 시퀀스 Proc 실행 완료
	public static final String CTRL_SEQ_TASK_STATUS_ERROR = "TS99"; // 제어 시퀀스 Proc 에러발생

	// 제어시퀀스 요청 전송 상태
	public static final String TASK_SENDING_STATUS_REQ = "REQ"; // 제어 시퀀스 요청 전송 실행 중
	public static final String TASK_SENDING_STATUS_RES = "RES"; // 제어 시퀀스 요청 전송 실행 완료

	// 제어시퀀스 요청 결과 수신상태
	public static final String CTRL_SEQ_RES_RECIEVE_STS_CMP = "CMP"; // 제어 시퀀스 요청 전송 실행 중

	public static final int SERVER_RECONNECT_CNT = 3;

	public static final String TWO_TH_CONN_BASE_URL = "http://localhost";
	public static final int TWO_TH_CONN_BASE_PORT = 23499;
	
	
	public static final String EUREKA_GATEWAY_CONN_BASE_URL = "http://192.168.2.91";
	public static final int EUREKA_GATEWAY_CONN_BASE_PORT = 8000;
	

	public static void sleep(Thread thread, long sleep) {
		try {
			thread.sleep(sleep);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
