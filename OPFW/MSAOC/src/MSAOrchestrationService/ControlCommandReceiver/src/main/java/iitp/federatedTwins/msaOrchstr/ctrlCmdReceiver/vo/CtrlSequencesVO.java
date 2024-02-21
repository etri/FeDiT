package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo;

/**
 * @파일명 : CtrlSequencesVO.java
 * @title : MSA 제어명령 요청 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class CtrlSequencesVO {

	private String actualTp;

	private String controlIdtifier;

	private String federatedTwinId;

	private String federatedDigitalObjectId;

	private String digitalTwinId;

	private String digitalObjId;

	private String digitalControlId;

	private String controlCommand;

	private String ctrlCondition;

	private String logicalExpression;

	private long start_interval = 0;

	private long end_interval = 0;

	private String nextSeqIdtifier;

	private String clientCtrlIdtifier;

	private String clientNextSeqIdtifier;

	public String getClientControlIdtifier() {
		return clientCtrlIdtifier;
	}

	public void setClientControlIdtifier(String clientCtrlIdtifier) {
		this.clientCtrlIdtifier = clientCtrlIdtifier;
	}

	public String getClientNextSeqIdtifier() {
		return clientNextSeqIdtifier;
	}

	public void setClientNextSeqIdtifier(String clientNextSeqIdtifier) {
		this.clientNextSeqIdtifier = clientNextSeqIdtifier;
	}

	/**
	 * 등록이후 생성되는 제어요청ID, 시퀀스 정보 등록에 사용하기 위하여 변수 생성
	 */
	private int requestControlCommandId;

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public String getActualTp() {
		return actualTp;
	}

	public void setActualTp(String actualTp) {
		this.actualTp = actualTp;
	}

	public String getControlIdtifier() {
		return controlIdtifier;
	}

	public void setControlIdtifier(String controlIdtifier) {
		this.controlIdtifier = controlIdtifier;
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

	public String getDigitalObjId() {
		return digitalObjId;
	}

	public void setDigitalObjId(String digitalObjId) {
		this.digitalObjId = digitalObjId;
	}

	public String getDigitalControlId() {
		return digitalControlId;
	}

	public void setDigitalControlId(String digitalControlId) {
		this.digitalControlId = digitalControlId;
	}

	public String getControlCommand() {
		return controlCommand;
	}

	public void setControlCommand(String controlCommand) {
		this.controlCommand = controlCommand;
	}

	public String getCtrlCondition() {
		return ctrlCondition;
	}

	public void setCtrlCondition(String ctrlCondition) {
		this.ctrlCondition = ctrlCondition;
	}

	public long getStart_interval() {
		return start_interval;
	}

	public void setStart_interval(long start_interval) {
		this.start_interval = start_interval;
	}

	public long getEnd_interval() {
		return end_interval;
	}

	public void setEnd_interval(long end_interval) {
		this.end_interval = end_interval;
	}

	public String getNextSeqIdtifier() {
		return nextSeqIdtifier;
	}

	public void setNextSeqIdtifier(String nextSeqIdtifier) {
		this.nextSeqIdtifier = nextSeqIdtifier;
	}

	public String getLogicalExpression() {
		return logicalExpression;
	}

	public void setLogicalExpression(String logicalExpression) {
		this.logicalExpression = logicalExpression;
	}

}
