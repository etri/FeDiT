package iitp.federatedTwins.DtEvtTracking.common.dto;

import java.util.List;

/**
 * @파일명 : TrackingSequenceInfo.java
 * @title : 트래킹 요청 실행 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingProcessInfo {

	/**
	 * 
	 * 트래킹 요청 실행 ID
	 */
	private int trackingProcessId;
	/**
	 * 
	 * 동적 데이터/이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;
	/**
	 * 
	 * 트래킹 요청 식별자
	 */
	private String trackingProcessIdentifier;
	
	/**
	 * 
	 * 트래킹 요청 식별자
	 */
	private String trckPrcIdtifier;
	/**
	 * 
	 * 트래킹 동작 타입 SST : Single Sequence Task STS : Start of Task Sequence STS ->
	 * [RTS] -> ETS RTS : Running Task of Sequential ETS : End of Task Sequence
	 */
	private String trackingProcessType;
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
	 * 트래킹 요청 디지털 객체 ID
	 */
	private String digitalObjectId;
	/**
	 * 
	 * 트래킹 요청 명령
	 */
	private String trackingCommand;
	/**
	 * 
	 * 요청처리 파라메터 설정값
	 */
	private String trackingKafkaGroup;
	/**
	 * 다음 제어 시퀀스 식별자
	 * 
	 */
	private String trackingKafkaTopic;
	
	private String trackingValueInfo;
	
	private int bufferSize;

	private String dataFilterType;
	
	/**
	 * 
	 * 트래킹/이벤트 발생 조건
	 */
	private String eventCondition;
	/**
	 * 
	 * 명령 종료 후 다음 명령수행 간 지연시간
	 */
	private int eventOccurredCount;
	/**
	 * 
	 * 시퀀스 실행 상태
	 */
	private String trackingStatus;

	private String createTime;
	
	private String logicalExpression;
	
	
	private String eventEndDate;
	
	private int eventDelay;
	
	private int eventTotalCnt;

	private List<String> topicList;
	
	private List<Integer> proIdList;
	
	private List<Integer> reqTrkList;
	
	private String reqIdentifier;
	
	private int detectRecordStartId;
	
	private int detectRecordEndId;
	
	private String trackingStatusChangeTime;
	


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

	public String getCreateTime() {
		return createTime;
	}

	public void setCreateTime(String createTime) {
		this.createTime = createTime;
	}

	public String getEventCondition() {
		return eventCondition;
	}

	public void setEventCondition(String eventCondition) {
		this.eventCondition = eventCondition;
	}

	public String getTrackingStatus() {
		return trackingStatus;
	}

	public void setTrackingStatus(String trackingStatus) {
		this.trackingStatus = trackingStatus;
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

	public String getTrackingCommand() {
		return trackingCommand;
	}

	public void setTrackingCommand(String trackingCommand) {
		this.trackingCommand = trackingCommand;
	}

	public String getTrackingKafkaGroup() {
		return trackingKafkaGroup;
	}

	public void setTrackingKafkaGroup(String trackingKafkaGroup) {
		this.trackingKafkaGroup = trackingKafkaGroup;
	}

	public String getTrackingKafkaTopic() {
		return trackingKafkaTopic;
	}

	public void setTrackingKafkaTopic(String trackingKafkaTopic) {
		this.trackingKafkaTopic = trackingKafkaTopic;
	}
	
	public String getTrackingValueInfo() {
		return trackingValueInfo;
	}

	public void setTrackingValueInfo(String trackingValueInfo) {
		this.trackingValueInfo = trackingValueInfo;
	}
	
	public int getEventOccurredCount() {
		return eventOccurredCount;
	}

	public void setEventOccurredCount(int eventOccurredCount) {
		this.eventOccurredCount = eventOccurredCount;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public String getLogicalExpression() {
		return logicalExpression;
	}

	public void setLogicalExpression(String logicalExpression) {
		this.logicalExpression = logicalExpression;
	}

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	public String getTrackingProcessIdentifier() {
		return trackingProcessIdentifier;
	}

	public void setTrackingProcessIdentifier(String trackingProcessIdentifier) {
		this.trackingProcessIdentifier = trackingProcessIdentifier;
	}

	public String getTrackingProcessType() {
		return trackingProcessType;
	}

	public void setTrackingProcessType(String trackingProcessType) {
		this.trackingProcessType = trackingProcessType;
	}

	public String getDataFilterType() {
		return dataFilterType;
	}

	public void setDataFilterType(String dataFilterType) {
		this.dataFilterType = dataFilterType;
	}

	public String getEventEndDate() {
		return eventEndDate;
	}

	public void setEventEndDate(String eventEndDate) {
		this.eventEndDate = eventEndDate;
	}

	public int getEventDelay() {
		return eventDelay;
	}

	public void setEventDelay(int eventDelay) {
		this.eventDelay = eventDelay;
	}

	public List<String> getTopicList() {
		return topicList;
	}

	public void setTopicList(List<String> topicList) {
		this.topicList = topicList;
	}

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}

	public List<Integer> getProIdList() {
		return proIdList;
	}

	public void setProIdList(List<Integer> proIdList) {
		this.proIdList = proIdList;
	}

	public List<Integer> getReqTrkList() {
		return reqTrkList;
	}

	public void setReqTrkList(List<Integer> reqTrkList) {
		this.reqTrkList = reqTrkList;
	}

	public int getBufferSize() {
		return bufferSize;
	}

	public void setBufferSize(int bufferSize) {
		this.bufferSize = bufferSize;
	}

	public int getEventTotalCnt() {
		return eventTotalCnt;
	}

	public void setEventTotalCnt(int eventTotalCnt) {
		this.eventTotalCnt = eventTotalCnt;
	}

	public int getDetectRecordStartId() {
		return detectRecordStartId;
	}

	public void setDetectRecordStartId(int detectRecordStartId) {
		this.detectRecordStartId = detectRecordStartId;
	}

	public int getDetectRecordEndId() {
		return detectRecordEndId;
	}

	public void setDetectRecordEndId(int detectRecordEndId) {
		this.detectRecordEndId = detectRecordEndId;
	}

	public String getTrckPrcIdtifier() {
		return trckPrcIdtifier;
	}

	public void setTrckPrcIdtifier(String trckPrcIdtifier) {
		this.trckPrcIdtifier = trckPrcIdtifier;
	}


	public String getTrackingStatusChangeTime() {
		return trackingStatusChangeTime;
	}

	public void setTrackingStatusChangeTime(String trackingStatusChangeTime) {
		this.trackingStatusChangeTime = trackingStatusChangeTime;
	}
	
	

}
