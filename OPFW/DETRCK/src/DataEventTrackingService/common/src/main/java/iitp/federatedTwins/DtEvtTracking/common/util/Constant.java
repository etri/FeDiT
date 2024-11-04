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

	// 트래킹 요청타입
	public static final String TRCK_CMD_TYPE_DATA  	= "DTP"; // 데이터트래킹
	public static final String RCK_CMD_TYPE_EVENT 	= "ETP"; // 이벤트 트래킹
	
	// 트래킹 데이터 필터 타입
	public static final String DATA_FILLTER_TYPE_MIN 	= "DF01"; // min
	public static final String DATA_FILLTER_TYPE_MAX 	= "DF02"; // max
	public static final String DATA_FILLTER_TYPE_AVER 	= "DF03"; // average
	public static final String DATA_FILLTER_TYPE_SUM 	= "DF04"; // sum
	public static final String DATA_FILLTER_TYPE_STDEVP = "DF05"; // stdevp

	// INTERVAL DATE
	public static final String INTERVAL_DATE_SECONDS 	= "SECONDS"; 
	public static final String INTERVAL_DATE_MINUTES 	= "MINUTES";
	public static final String INTERVAL_DATE_HOURS 		= "HOURS"; 
	public static final String INTERVAL_DATE_DAYS 		= "DAYS"; 
	
	// 연산자
	public static final String LOGICAL_OPERATOR_OR 		= "OR"; // or ( || )
	public static final String LOGICAL_OPERATOR_AND 	= "AND"; // and ( &&)
	public static final String LOGICAL_OPERATOR_EQ 		= "EQ";  // equal ( = )
	public static final String LOGICAL_OPERATOR_NE 		= "NE"; // not equal ( <> )
	public static final String LOGICAL_OPERATOR_LT 		= "LT"; // ittle ( < )
	public static final String LOGICAL_OPERATOR_LE 		= "LE"; // little or equal ( <= )
	public static final String LOGICAL_OPERATOR_GT 		= "GT"; // greater ( > )
	public static final String LOGICAL_OPERATOR_GE 		= "GE"; // greater or equal ( >= )
	
	// evntCondition type
	public static final String EVENT_CONDITION_TYPE_CLIENT = "CP"; 
	public static final String EVENT_CONDITION_TYPE_LOGIC = "CB"; 

	// 트래킹 명령 요청상태
	public static final String TRCK_CMD_STATUS_READY 		= "CS01"; // 실행준비
	public static final String TRCK_CMD_STATUS_RUNNING 		= "CS02"; // 명령 실행 중
	public static final String TRCK_CMD_STATUS_COMPLETE 	= "CS03"; // 명령 실행 완료
	public static final String TRCK_CMD_STATUS_KILLED 		= "CS66"; // 명령 강제 종료
	public static final String TRCK_CMD_STATUS_ERROR 		= "CS99"; // 명령 처리 오류

	/** TODO 
	 *  실행 상태		=> 최종 처리 결과 판단기준
	 *  처리 운영상태 	=> 현재 프로세스 동작 진행상태
	 *  두가지의 상태정보로 구분하여 상태정보를 관리
	 * **/
	
	//트래킹 프로세스 동작상태
	public static final String TRCK_PROC_STATUS_REG 		= "TRS00"; // 트래킹 프로세스 정보생성/등록
	public static final String TRCK_PROC_STATUS_READY 		= "TRS01"; // 트래킹 프로세스 실행준비
	public static final String TRCK_PROC_STATUS_WAIT 		= "TRS05"; // 트래킹 프로세스 실행대기
	public static final String TRCK_PROC_STATUS_RUNNING 	= "TRS10"; // 트래킹 프로세스 실행 중
	public static final String TRCK_PROC_STATUS_COMPLETE 	= "TRS20"; // 트래킹 프로세스 실행 완료
	public static final String TRCK_PROC_STATUS_TIMEOUT 	= "TRS44"; // 트래킹 프로세스 타임아웃
	public static final String TRCK_PROC_STATUS_TASKKILL 	= "TRS66"; // 트래킹 프로세스 강제 종료
	public static final String TRCK_PROC_STATUS_ERROR 		= "TRS99"; // 트래킹 프로세스 에러발생
	
	

	// 트래킹 디텍토 동작상태
	public static final String TRCK_DECTOR_STATUS_READY 	= "DS01"; // 트래킹 디텍토 실행준비
	public static final String TRCK_DECTOR_STATUS_RUNNING 	= "DS02"; // 트래킹 디텍토 실행 중
	public static final String TRCK_DECTOR_STATUS_COMPLETE 	= "DS03"; // 트래킹 디텍토 실행 완료
	public static final String TRCK_DECTOR_STATUS_ERROR 	= "DS99"; // 트래킹 디텍토 에러발생
	
	// 트리거 이벤트 전송 상태
	public static final String TRG_EVT_STATUS_READY 		= "TGS01"; // 전송준비
	public static final String TRG_EVT_STATUS_RUNNING 		= "TGS02"; // 전송 실패 재 전송 준비 
	public static final String TRG_EVT_STATUS_COMPLETE 		= "TGS03"; // 전송 완료
	public static final String TRG_EVT_STATUS_ERROR 		= "TGS99"; // 최종 전송 실패

	// 트래킹 프로세스 요청 전송 상태
	public static final String TASK_SENDING_STATUS_REQ 		= "REQ"; // 트래킹 프로세스 요청 전송 실행 중
	public static final String TASK_SENDING_STATUS_RES 		= "RES"; // 트래킹 프로세스 요청 전송 실행 완료

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
