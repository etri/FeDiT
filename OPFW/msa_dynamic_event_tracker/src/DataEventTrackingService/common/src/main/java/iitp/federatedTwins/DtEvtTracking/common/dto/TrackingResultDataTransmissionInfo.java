package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : TrackingStatusChangeRecord.java
 * @title : 트래킹 요청 처리결과 전송 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingResultDataTransmissionInfo {

	/**
	 * 
	 * 트래킹 요청 처리결과 전송 ID
	 */
	private int transmissionId;
	/**
	 * 
	 * 동적 데이터 이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;
	/**
	 * 
	 * 결과 전송처리 코드
	 */
	private int transmissionCode;
	/**
	 * 
	 * 결과 전송처리 결과 MSG
	 */
	private String transmissionMsg;
	/**
	 * 
	 * 결과 전송처리 일시
	 */
	private String transmissionTime;
	/**
	 * 
	 * 결과 전송처리 URL
	 */
	private String transmissionUrl;
	/**
	 * 
	 * 결과 전송처리 파라메터
	 */
	private String transmissionParam;
	/**
	 * 
	 * 결과 전송처리 값
	 */
	private String transmissionResultData;
	/**
	 * 
	 * 요청 응답 처리코드
	 */
	private String respCtrlCmdCode;
	/**
	 * 
	 * 요청 응답 결과 MSG
	 */
	private String respCtrlCmdMsg;
	/**
	 * 
	 * 요청 응답 처리일시
	 */
	private String respCtrlCmdTime;

	public int getTransmissionId() {
		return transmissionId;
	}

	public void setTransmissionId(int transmissionId) {
		this.transmissionId = transmissionId;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public int getTransmissionCode() {
		return transmissionCode;
	}

	public void setTransmissionCode(int transmissionCode) {
		this.transmissionCode = transmissionCode;
	}

	public String getTransmissionMsg() {
		return transmissionMsg;
	}

	public void setTransmissionMsg(String transmissionMsg) {
		this.transmissionMsg = transmissionMsg;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
	}

	public String getTransmissionUrl() {
		return transmissionUrl;
	}

	public void setTransmissionUrl(String transmissionUrl) {
		this.transmissionUrl = transmissionUrl;
	}

	public String getTransmissionParam() {
		return transmissionParam;
	}

	public void setTransmissionParam(String transmissionParam) {
		this.transmissionParam = transmissionParam;
	}

	public String getTransmissionResultData() {
		return transmissionResultData;
	}

	public void setTransmissionResultData(String transmissionResultData) {
		this.transmissionResultData = transmissionResultData;
	}

	public String getRespCtrlCmdCode() {
		return respCtrlCmdCode;
	}

	public void setRespCtrlCmdCode(String respCtrlCmdCode) {
		this.respCtrlCmdCode = respCtrlCmdCode;
	}

	public String getRespCtrlCmdMsg() {
		return respCtrlCmdMsg;
	}

	public void setRespCtrlCmdMsg(String respCtrlCmdMsg) {
		this.respCtrlCmdMsg = respCtrlCmdMsg;
	}

	public String getRespCtrlCmdTime() {
		return respCtrlCmdTime;
	}

	public void setRespCtrlCmdTime(String respCtrlCmdTime) {
		this.respCtrlCmdTime = respCtrlCmdTime;
	}

}
