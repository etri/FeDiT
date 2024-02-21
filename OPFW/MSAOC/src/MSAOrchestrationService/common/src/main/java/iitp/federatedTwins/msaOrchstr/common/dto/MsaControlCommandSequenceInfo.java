package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaControlCommandSequenceInfo.java
 * @title : 제어 시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaControlCommandSequenceInfo {


	private int ctrlCmdSequenceId;

	private int requestControlCommandId;

	private int createId;

	private String sequenceActType;

	private String federatedTwinId;

	private String federatedDigitalObjectId;

	private String digitalTwinId;

	private String digitalObjectId;

	private long startInterval;

	private String controlCommand;

	private String nextSequenceIdentifier;

	private String createTime;

	private String nextSequenceCondition;

	private long nextInterval;

	private String conditionParam;

	private String sequenceStatus;

	private String seqeunceStatusChangeTime;

	private String sequenceIdentifier;

	private String digitalControlId;

	private String logicalExpression;

	public int getCtrlCmdSequenceId() {
		return ctrlCmdSequenceId;
	}

	public void setCtrlCmdSequenceId(int ctrlCmdSequenceId) {
		this.ctrlCmdSequenceId = ctrlCmdSequenceId;
	}

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public String getSequenceActType() {
		return sequenceActType;
	}

	public void setSequenceActType(String sequenceActType) {
		this.sequenceActType = sequenceActType;
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

	public String getDigitalObjectId() {
		return digitalObjectId;
	}

	public void setDigitalObjectId(String digitalObjectId) {
		this.digitalObjectId = digitalObjectId;
	}

	public long getStartInterval() {
		return startInterval;
	}

	public void setStartInterval(long l) {
		this.startInterval = l;
	}

	public String getControlCommand() {
		return controlCommand;
	}

	public void setControlCommand(String controlCommand) {
		this.controlCommand = controlCommand;
	}

	public String getNextSequenceIdentifier() {
		return nextSequenceIdentifier;
	}

	public void setNextSequenceIdentifier(String nextSequenceIdentifier) {
		this.nextSequenceIdentifier = nextSequenceIdentifier;
	}

	public String getCreateTime() {
		return createTime;
	}

	public void setCreateTime(String createTime) {
		this.createTime = createTime;
	}

	public String getNextSequenceCondition() {
		return nextSequenceCondition;
	}

	public void setNextSequenceCondition(String nextSequenceCondition) {
		this.nextSequenceCondition = nextSequenceCondition;
	}

	public long getNextInterval() {
		return nextInterval;
	}

	public void setNextInterval(long nextInterval) {
		this.nextInterval = nextInterval;
	}

	public String getConditionParam() {
		return conditionParam;
	}

	public void setConditionParam(String conditionParam) {
		this.conditionParam = conditionParam;
	}

	public String getSequenceStatus() {
		return sequenceStatus;
	}

	public void setSequenceStatus(String sequenceStatus) {
		this.sequenceStatus = sequenceStatus;
	}

	public String getSeqeunceStatusChangeTime() {
		return seqeunceStatusChangeTime;
	}

	public void setSeqeunceStatusChangeTime(String seqeunceStatusChangeTime) {
		this.seqeunceStatusChangeTime = seqeunceStatusChangeTime;
	}

	public String getSequenceIdentifier() {
		return sequenceIdentifier;
	}

	public void setSequenceIdentifier(String sequenceIdentifier) {
		this.sequenceIdentifier = sequenceIdentifier;
	}

	public String getDigitalControlId() {
		return digitalControlId;
	}

	public void setDigitalControlId(String digitalControlId) {
		this.digitalControlId = digitalControlId;
	}

	public int getCreateId() {
		return createId;
	}

	public void setCreateId(int createId) {
		this.createId = createId;
	}

	public String getLogicalExpression() {
		return logicalExpression;
	}

	public void setLogicalExpression(String logicalExpression) {
		this.logicalExpression = logicalExpression;
	}

}
