package iitp.fedit.apiGateway.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @파일명 : CtrlDeviceRoutingServiceInfo.java
 * @title : 게이트웨이 관리 장비 정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
public class CtrlDeviceRoutingServiceInfo {

	@Schema(hidden = true)
	private int ctrlDeviceId;
	@Schema(hidden = true)
	private int ctrlCmdExecCodeId;
	@JsonProperty(required = true)
	private String requestRouting;
	private String requestParam;
	@Schema(hidden = true)
	private String routingStatus;
	private String responseRouting;
	private String responseParam;
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

	public String getRequestRouting() {
		return requestRouting;
	}

	public void setRequestRouting(String requestRouting) {
		this.requestRouting = requestRouting;
	}

	public String getRequestParam() {
		return requestParam;
	}

	public void setRequestParam(String requestParam) {
		this.requestParam = requestParam;
	}

	public String getRoutingStatus() {
		return routingStatus;
	}

	public void setRoutingStatus(String routingStatus) {
		this.routingStatus = routingStatus;
	}

	public String getResponseRouting() {
		return responseRouting;
	}

	public void setResponseRouting(String responseRouting) {
		this.responseRouting = responseRouting;
	}

	public String getResponseParam() {
		return responseParam;
	}

	public void setResponseParam(String responseParam) {
		this.responseParam = responseParam;
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

}
