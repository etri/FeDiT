package iitp.federatedTwins.DtEvtTracking.common.dto;

import java.util.List;

public class TrackingTopicInfo {

	private int topicId;
	private int requestTrackingId;
	private int trackingProcessId;
	private String groupName;
	private String topicName;
	private String topicCreateTime;
	private String topicUpdateTime;
	private List<String> topicNameList;

	public String getGroupName() {
		return groupName;
	}
	public void setGroupName(String groupName) {
		this.groupName = groupName;
	}
	public String getTopicName() {
		return topicName;
	}
	public void setTopicName(String topicName) {
		this.topicName = topicName;
	}
	public String getTopicCreateTime() {
		return topicCreateTime;
	}
	public void setTopicCreateTime(String topicCreateTime) {
		this.topicCreateTime = topicCreateTime;
	}
	public String getTopicUpdateTime() {
		return topicUpdateTime;
	}
	public void setTopicUpdateTime(String topicUpdateTime) {
		this.topicUpdateTime = topicUpdateTime;
	}
	public int getRequestTrackingId() {
		return requestTrackingId;
	}
	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}
	public List<String> getTopicNameList() {
		return topicNameList;
	}
	public void setTopicNameList(List<String> topicNameList) {
		this.topicNameList = topicNameList;
	}
	public int getTopicId() {
		return topicId;
	}
	public void setTopicId(int topicId) {
		this.topicId = topicId;
	}
	public int getTrackingProcessId() {
		return trackingProcessId;
	}
	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

}
