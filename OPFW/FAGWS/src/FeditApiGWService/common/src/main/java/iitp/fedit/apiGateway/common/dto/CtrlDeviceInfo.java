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
public class CtrlDeviceInfo {

	@Schema(hidden = true)
	private int ctrlDeviceId;
	@JsonProperty(required = true)
	private String deviceIdentifier;
	@JsonProperty(required = true)
	private String deviceType;
	private String digitalTwinId;
	private String digitalObjectId;
	@JsonProperty(required = true)
	private String protocolType;
	private String ipAddr;
	private int port;
	@Schema(hidden = true)
	private String deviceStatus;

	public int getCtrlDeviceId() {
		return ctrlDeviceId;
	}

	public void setCtrlDeviceId(int ctrlDeviceId) {
		this.ctrlDeviceId = ctrlDeviceId;
	}

	public String getDeviceIdentifier() {
		return deviceIdentifier;
	}

	public void setDeviceIdentifier(String deviceIdentifier) {
		this.deviceIdentifier = deviceIdentifier;
	}

	public String getDeviceType() {
		return deviceType;
	}

	public void setDeviceType(String deviceType) {
		this.deviceType = deviceType;
	}

	public String getDigitalTwinId() {
		return digitalTwinId;
	}

	public void setDigitalTwinId(String digitalTwinId) {
		this.digitalTwinId = digitalTwinId;
	}

	public String getDigitalObjectId() {
		return digitalObjectId;
	}

	public void setDigitalObjectId(String digitalObjectId) {
		this.digitalObjectId = digitalObjectId;
	}

	public String getProtocolType() {
		return protocolType;
	}

	public void setProtocolType(String protocolType) {
		this.protocolType = protocolType;
	}

	public String getIpAddr() {
		return ipAddr;
	}

	public void setIpAddr(String ipAddr) {
		this.ipAddr = ipAddr;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}

	public String getDeviceStatus() {
		return deviceStatus;
	}

	public void setDeviceStatus(String deviceStatus) {
		this.deviceStatus = deviceStatus;
	}
}
