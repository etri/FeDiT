package iitp.federatedTwins.DtEvtTracking.common.dto;

import java.util.List;

public class TrackingProcessInfo {

	private int trackingProcessId;
	private int requestTrackingId;
	private String trackingProcessIdentifier;
	private String trackingProcessType;
	private String federatedTwinId;
	private String federatedDigitalObjectId;
	private String digitalTwinId;
	private String digitalObjectId;
	private String trackingCommand;
	private String trackingKafkaGroup;
	private String trackingKafkaTopic;
	private String dataFilterType;
	private String eventCondition;
	private int eventOccurredCount;
	private String trackingStatus;
	private String seqeunceStatusChangeTime;
	private String createTime;
	private String logicalExpression;
	private String eventEndDate;
	private int eventDelay;
	private List<String> topicList;
	private List<Integer> proIdList;
	private List<Integer> reqTrkList;
	private String reqIdentifier;
	

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

	public String getSeqeunceStatusChangeTime() {
		return seqeunceStatusChangeTime;
	}

	public void setSeqeunceStatusChangeTime(String seqeunceStatusChangeTime) {
		this.seqeunceStatusChangeTime = seqeunceStatusChangeTime;
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

	
	

}
