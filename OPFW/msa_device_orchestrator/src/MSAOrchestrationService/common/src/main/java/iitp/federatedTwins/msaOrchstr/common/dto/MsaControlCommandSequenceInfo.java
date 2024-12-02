package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaControlCommandSequenceInfo.java
 * @title : 제어 시퀀스 단위 실행 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaControlCommandSequenceInfo {

	/**
	 * 
	 * 제어 시퀀스 단위 실행 ID
	 */
	private int ctrlCmdSequenceId;
	/**
	 * 
	 * MSA 제어요청 ID
	 */
	private int requestControlCommandId;
	/**
	 * 
	 * 생성 ID
	 */
	private int createId;
	/**
	 * 
	 * 시퀀스 동작 타입 SST : Single Sequence Task STS : Start of Task Sequence STS ->
	 * [RTS] -> ETS RTS : Running Task of Sequential ETS : End of Task Sequence
	 */
	private String sequenceActType;
	/**
	 * 
	 * 연합 디지털트윈 ID
	 */
	private String federatedTwinId;
	/**
	 * 
	 * 연합 디지털 객체 ID
	 */
	private String federatedDigitalObjectId;

	/**
	 * 
	 * 단위 디지털트윈 ID
	 */
	private String digitalTwinId;
	/**
	 * 
	 * 시퀀스 처리 디지털 객체 ID
	 */
	private String digitalObjectId;
	/**
	 * 
	 * 시작처리 Interval
	 */
	private long startInterval;
	/**
	 * 
	 * 제어 시퀀스 명령
	 */
	private String controlCommand;
	/**
	 * 
	 * 다음 제어 시퀀스 ID
	 */
	private String nextSequenceIdentifier;
	/**
	 * 
	 * 생성일
	 */
	private String createTime;
	/**
	 * 
	 * 제어 시퀀스 다음 수행 조건
	 */
	private String nextSequenceCondition;
	/**
	 * 
	 * 명령 종료 후 다음 명령수행 간 지연시간
	 */
	private long nextInterval;
	/**
	 * 
	 * 제어처리 파라메터 설정 값
	 */
	private String conditionParam;
	/**
	 * 
	 * 시퀀스 실행 상태
	 */
	private String sequenceStatus;
	/**
	 * 
	 * 시퀀스 실행 상태 변경일시
	 */
	private String seqeunceStatusChangeTime;

	/**
	 * 
	 * 제어시퀀스 식별자
	 */
	private String sequenceIdentifier;
	private String controlIdtifier;
	/**
	 * 
	 * 제어 명령처리할 제어기ID
	 */
	private String digitalControlId;

	
	private String logicalExpression;
	
	//재 전송 횟수
	private int retrySendingCount;
	

	public int getRetrySendingCount() {
		return retrySendingCount;
	}

	public void setRetrySendingCount(int retrySendingCount) {
		this.retrySendingCount = retrySendingCount;
	}

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

	public String getControlIdtifier() {
		return controlIdtifier;
	}

	public void setControlIdtifier(String controlIdtifier) {
		this.controlIdtifier = controlIdtifier;
	}

	
}
