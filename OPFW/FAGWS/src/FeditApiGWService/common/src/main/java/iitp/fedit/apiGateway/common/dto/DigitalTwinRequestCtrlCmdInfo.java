package iitp.fedit.apiGateway.common.dto;

import java.util.ArrayList;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @파일명 : DgtwReqCtrlCmdInfo.java
 * @title : 단일 제어 실행 명령정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
public class DigitalTwinRequestCtrlCmdInfo {

	@Schema(hidden = true)
	private int dgtwReqCtrlCmdId;
	private String respIdentifier;
	private String digitalObjectId;
	private String federatedTwinId;
	private String federatedDigitalObjectId;
	private String digitalTwinId;
	private String reqCtrlCommand;
	@Schema(hidden = true)
	private String reqDate;
	@Schema(hidden = true)
	private String reqCtrlCmdStatus;
	private ArrayList<Integer> dgtwReqCtrlCmdIdList;

	public int getDgtwReqCtrlCmdId() {
		return dgtwReqCtrlCmdId;
	}

	public void setDgtwReqCtrlCmdId(int dgtwReqCtrlCmdId) {
		this.dgtwReqCtrlCmdId = dgtwReqCtrlCmdId;
	}

	public String getRespIdentifier() {
		return respIdentifier;
	}

	public void setRespIdentifier(String respIdentifier) {
		this.respIdentifier = respIdentifier;
	}

	public String getDigitalObjectId() {
		return digitalObjectId;
	}

	public void setDigitalObjectId(String digitalObjectId) {
		this.digitalObjectId = digitalObjectId;
	}

	public String getFederatedTwinId() {
		return federatedTwinId;
	}

	public void setFederatedTwinId(String federatedTwinId) {
		this.federatedTwinId = federatedTwinId;
	}

	public String getFederatedDigitalObjectId() {
		return federatedDigitalObjectId;
	}

	public void setFederatedDigitalObjectId(String federatedDigitalObjectId) {
		this.federatedDigitalObjectId = federatedDigitalObjectId;
	}

	public String getDigitalTwinId() {
		return digitalTwinId;
	}

	public void setDigitalTwinId(String digitalTwinId) {
		this.digitalTwinId = digitalTwinId;
	}

	public String getReqCtrlCommand() {
		return reqCtrlCommand;
	}

	public void setReqCtrlCommand(String reqCtrlCommand) {
		this.reqCtrlCommand = reqCtrlCommand;
	}

	public String getReqDate() {
		return reqDate;
	}

	public void setReqDate(String reqDate) {
		this.reqDate = reqDate;
	}

	public String getReqCtrlCmdStatus() {
		return reqCtrlCmdStatus;
	}

	public void setReqCtrlCmdStatus(String reqCtrlCmdStatus) {
		this.reqCtrlCmdStatus = reqCtrlCmdStatus;
	}

	public ArrayList<Integer> getDgtwReqCtrlCmdIdList() {
		return dgtwReqCtrlCmdIdList;
	}

	public void setDgtwReqCtrlCmdIdList(ArrayList<Integer> dgtwReqCtrlCmdIdList) {
		this.dgtwReqCtrlCmdIdList = dgtwReqCtrlCmdIdList;
	}

}
