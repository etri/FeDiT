package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaRequestControlCommandInfo.java
 * @title : MSA 제어명령 요청 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaRequestControlCommandInfo {
	/**
	 * MSA 제어요청ID
	 */
	private int requestControlCommandId;

	/**
	 * 요청타입 RQ01 : 디바이스 등록 RQ02 : 제어요청
	 */
	private String reqCtrlCmdType;

	/**
	 * 요청일시
	 */
	private String reqCtrlCmdTime;

	/**
	 * 요청상태 CS01 : 실행준비 CS02 : 시퀀스 실행 중 CS03 : 제어명령 실행 완료
	 */
	private String reqCtrlCmdStatus;

	/**
	 * 요청처리 결과전송 URL
	 */
	private String resultCallBackUrl;

	/**
	 * 요청 제어명령 전문
	 */
	private String reqCtrlCmd;

	/**
	 * client 생성 식별자
	 */
	private String reqIdentifier;

	/**
	 * msa 요청 식별자
	 */
	private String msaIdentifier;

	/**
	 * 제어요청 최종 처리상태 반영일시
	 */
	private String reqStatusChangeTime;

	/*
	 * 요청 처리상태
	 */
	private String transmissionStatus;

	/*
	 * 요청처리 반영일시
	 */
	private String transmissionTime;

	

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public String getReqCtrlCmdType() {
		return reqCtrlCmdType;
	}

	public void setReqCtrlCmdType(String reqCtrlCmdType) {
		this.reqCtrlCmdType = reqCtrlCmdType;
	}

	public String getReqCtrlCmdTime() {
		return reqCtrlCmdTime;
	}

	public void setReqCtrlCmdTime(String reqCtrlCmdTime) {
		this.reqCtrlCmdTime = reqCtrlCmdTime;
	}

	public String getReqCtrlCmdStatus() {
		return reqCtrlCmdStatus;
	}

	public void setReqCtrlCmdStatus(String reqCtrlCmdStatus) {
		this.reqCtrlCmdStatus = reqCtrlCmdStatus;
	}

	public String getResultCallBackUrl() {
		return resultCallBackUrl;
	}

	public void setResultCallBackUrl(String resultCallBackUrl) {
		this.resultCallBackUrl = resultCallBackUrl;
	}

	public String getReqCtrlCmd() {
		return reqCtrlCmd;
	}

	public void setReqCtrlCmd(String reqCtrlCmd) {
		this.reqCtrlCmd = reqCtrlCmd;
	}

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}

	public String getMsaIdentifier() {
		return msaIdentifier;
	}

	public void setMsaIdentifier(String msaIdentifier) {
		this.msaIdentifier = msaIdentifier;
	}

	public String getReqStatusChangeTime() {
		return reqStatusChangeTime;
	}

	public void setReqStatusChangeTime(String reqStatusChangeTime) {
		this.reqStatusChangeTime = reqStatusChangeTime;
	}

	public String getTransmissionStatus() {
		return transmissionStatus;
	}

	public void setTransmissionStatus(String transmissionStatus) {
		this.transmissionStatus = transmissionStatus;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
	}
}
