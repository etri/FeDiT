package iitp.fedit.apiGateway.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @파일명 : DigitalTwinRequestCtrlCmdInfo.java
 * @title : 단일 제어시퀀스 요청정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
public class DigitalTwinExecCtrlCmdInfo {

	@Schema(hidden = true)
	private int dgtwExecCtrlCmdId;
	@Schema(hidden = true)
	private int dgtwReqCtrlCmdId;
	private String execCtrlCmdIdentifier;
	private String dgtwExecCtrlCmd;
	private String ctrlKindCode;
	private String execCmdCode;
	private String ctrlCmdParam;
	@Schema(hidden = true)
	private String execCmdStatus;
	@Schema(hidden = true)
	private String execCmdUpdateDate;
	private String resultMsg;

	public int getDgtwExecCtrlCmdId() {
		return dgtwExecCtrlCmdId;
	}

	public void setDgtwExecCtrlCmdId(int dgtwExecCtrlCmdId) {
		this.dgtwExecCtrlCmdId = dgtwExecCtrlCmdId;
	}

	public int getDgtwReqCtrlCmdId() {
		return dgtwReqCtrlCmdId;
	}

	public void setDgtwReqCtrlCmdId(int dgtwReqCtrlCmdId) {
		this.dgtwReqCtrlCmdId = dgtwReqCtrlCmdId;
	}

	public String getExecCtrlCmdIdentifier() {
		return execCtrlCmdIdentifier;
	}

	public void setExecCtrlCmdIdentifier(String execCtrlCmdIdentifier) {
		this.execCtrlCmdIdentifier = execCtrlCmdIdentifier;
	}

	public String getDgtwExecCtrlCmd() {
		return dgtwExecCtrlCmd;
	}

	public void setDgtwExecCtrlCmd(String dgtwExecCtrlCmd) {
		this.dgtwExecCtrlCmd = dgtwExecCtrlCmd;
	}

	public String getCtrlKindCode() {
		return ctrlKindCode;
	}

	public void setCtrlKindCode(String ctrlKindCode) {
		this.ctrlKindCode = ctrlKindCode;
	}

	public String getExecCmdCode() {
		return execCmdCode;
	}

	public void setExecCmdCode(String execCmdCode) {
		this.execCmdCode = execCmdCode;
	}

	public String getCtrlCmdParam() {
		return ctrlCmdParam;
	}

	public void setCtrlCmdParam(String ctrlCmdParam) {
		this.ctrlCmdParam = ctrlCmdParam;
	}

	public String getExecCmdStatus() {
		return execCmdStatus;
	}

	public void setExecCmdStatus(String execCmdStatus) {
		this.execCmdStatus = execCmdStatus;
	}

	public String getExecCmdUpdateDate() {
		return execCmdUpdateDate;
	}

	public void setExecCmdUpdateDate(String execCmdUpdateDate) {
		this.execCmdUpdateDate = execCmdUpdateDate;
	}

	public String getResultMsg() {
		return resultMsg;
	}

	public void setResultMsg(String resultMsg) {
		this.resultMsg = resultMsg;
	}

}
