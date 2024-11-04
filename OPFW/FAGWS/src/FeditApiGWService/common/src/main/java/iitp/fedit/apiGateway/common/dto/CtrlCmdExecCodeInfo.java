package iitp.fedit.apiGateway.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @파일명 : CtrlDeviceInfo.java
 * @title : 게이트웨이 관리 장비 정보
 * @작성일 : 2024. 05. 23.
 * @작성자 : 오세광
 * @description :
 */
public class CtrlCmdExecCodeInfo {

	@Schema(hidden = true)
	private int ctrlCmdExecCodeId;
	private String ctrlCmdExecCodeName;
	private String ctrlKindCode;
	private String ctrlCmdCode;
	private String ctrlExecParam;
	private String ctrlExecDesc;

	public int getCtrlCmdExecCodeId() {
		return ctrlCmdExecCodeId;
	}

	public void setCtrlCmdExecCodeId(int ctrlCmdExecCodeId) {
		this.ctrlCmdExecCodeId = ctrlCmdExecCodeId;
	}

	public String getCtrlCmdExecCodeName() {
		return ctrlCmdExecCodeName;
	}

	public void setCtrlCmdExecCodeName(String ctrlCmdExecCodeName) {
		this.ctrlCmdExecCodeName = ctrlCmdExecCodeName;
	}

	public String getCtrlKindCode() {
		return ctrlKindCode;
	}

	public void setCtrlKindCode(String ctrlKindCode) {
		this.ctrlKindCode = ctrlKindCode;
	}

	public String getCtrlCmdCode() {
		return ctrlCmdCode;
	}

	public void setCtrlCmdCode(String ctrlCmdCode) {
		this.ctrlCmdCode = ctrlCmdCode;
	}

	public String getCtrlExecParam() {
		return ctrlExecParam;
	}

	public void setCtrlExecParam(String ctrlExecParam) {
		this.ctrlExecParam = ctrlExecParam;
	}

	public String getCtrlExecDesc() {
		return ctrlExecDesc;
	}

	public void setCtrlExecDesc(String ctrlExecDesc) {
		this.ctrlExecDesc = ctrlExecDesc;
	}
}
