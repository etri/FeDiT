package iitp.fedit.apiGateway.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @파일명 : CtrlDeviceInfo.java
 * @title : 게이트웨이 관리 장비 정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
public class CtrlDeviceCmdExecReqResp {

	@Schema(hidden = true)
	private int ctrlDeviceId;
	@Schema(hidden = true)
	private int ctrlCmdExecCodeId;
	@JsonProperty(required = true)
	private String execRequestUrl;
	private String execParam;
	@Schema(hidden = true)
	private String execStatus;
	private String resultResponseUrl;
	private String resultResponseParam;
	private String description;

	// 테이블 확장
	private String deviceIdentifier;
	private String ctrlCmdExecCodeName;

	public int getCtrlDeviceId() {
		return ctrlDeviceId;
	}

	public void setCtrlDeviceId(int ctrlDeviceId) {
		this.ctrlDeviceId = ctrlDeviceId;
	}

	public int getCtrlCmdExecCodeId() {
		return ctrlCmdExecCodeId;
	}

	public void setCtrlCmdExecCodeId(int ctrlCmdExecCodeId) {
		this.ctrlCmdExecCodeId = ctrlCmdExecCodeId;
	}

	public String getExecRequestUrl() {
		return execRequestUrl;
	}

	public void setExecRequestUrl(String execRequestUrl) {
		this.execRequestUrl = execRequestUrl;
	}

	public String getExecParam() {
		return execParam;
	}

	public void setExecParam(String execParam) {
		this.execParam = execParam;
	}

	public String getResultResponseUrl() {
		return resultResponseUrl;
	}

	public void setResultResponseUrl(String resultResponseUrl) {
		this.resultResponseUrl = resultResponseUrl;
	}

	public String getResultResponseParam() {
		return resultResponseParam;
	}

	public void setResultResponseParam(String resultResponseParam) {
		this.resultResponseParam = resultResponseParam;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getDeviceIdentifier() {
		return deviceIdentifier;
	}

	public void setDeviceIdentifier(String deviceIdentifier) {
		this.deviceIdentifier = deviceIdentifier;
	}

	public String getCtrlCmdExecCodeName() {
		return ctrlCmdExecCodeName;
	}

	public void setCtrlCmdExecCodeName(String ctrlCmdExecCodeName) {
		this.ctrlCmdExecCodeName = ctrlCmdExecCodeName;
	}

	public String getExecStatus() {
		return execStatus;
	}

	public void setExecStatus(String execStatus) {
		this.execStatus = execStatus;
	}
}
