package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.ngsi;

public class NgsiTrackingRequestVO {

	private String trackingType;

	private String reqIdentifier;

	private String callBackURL;

	private NgsiProcessVO[] processes;

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}

	public String getCallBackURL() {
		return callBackURL;
	}

	public void setCallBackURL(String callBackURL) {
		this.callBackURL = callBackURL;
	}

	public String getTrackingType() {
		return trackingType;
	}

	public void setTrackingType(String trackingType) {
		this.trackingType = trackingType;
	}

	public NgsiProcessVO[] getProcesses() {
		return processes;
	}

	public void setProcesses(NgsiProcessVO[] processes) {
		this.processes = processes;
	}

	public static class NgsiProcessVO {

		private String contextUrl;
		private String entityId;
		private String type;
		private String timeproperty;
		private String valueExtract;

		private Integer eventDelay;
		private Integer bufferSize;
		private String dataFilterType;
		private Boolean eventConditionCheckable;
		private String controlStatement;
		private Integer eventOccurCount;
		private String eventEndDate;
		private String eventConditionType;
		private String trackingProcessIdentifier;

		private String trackingType;

		public String getTrackingType() {
			return trackingType;
		}

		public void setTrackingType(String trackingType) {
			this.trackingType = trackingType;
		}

		public String getContextUrl() {
			return contextUrl;
		}

		public void setContextUrl(String contextUrl) {
			this.contextUrl = contextUrl;
		}

		public String getEntityId() {
			return entityId;
		}

		public void setEntityId(String entityId) {
			this.entityId = entityId;
		}

		public String getType() {
			return type;
		}

		public void setType(String type) {
			this.type = type;
		}

		public String getTimeproperty() {
			return timeproperty;
		}

		public void setTimeproperty(String timeproperty) {
			this.timeproperty = timeproperty;
		}

		public String getValueExtract() {
			return valueExtract;
		}

		public void setValueExtract(String valueExtract) {
			this.valueExtract = valueExtract;
		}

		public Integer getEventDelay() {
			return eventDelay;
		}

		public void setEventDelay(Integer eventDelay) {
			this.eventDelay = eventDelay;
		}

		public Integer getBufferSize() {
			return bufferSize;
		}

		public void setBufferSize(Integer bufferSize) {
			this.bufferSize = bufferSize;
		}

		public String getDataFilterType() {
			return dataFilterType;
		}

		public void setDataFilterType(String dataFilterType) {
			this.dataFilterType = dataFilterType;
		}

		public Boolean getEventConditionCheckable() {
			return eventConditionCheckable;
		}

		public void setEventConditionCheckable(Boolean eventConditionCheckable) {
			this.eventConditionCheckable = eventConditionCheckable;
		}

		public String getControlStatement() {
			return controlStatement;
		}

		public void setControlStatement(String controlStatement) {
			this.controlStatement = controlStatement;
		}

		public Integer getEventOccurCount() {
			return eventOccurCount;
		}

		public void setEventOccurCount(Integer eventOccurCount) {
			this.eventOccurCount = eventOccurCount;
		}

		public String getEventEndDate() {
			return eventEndDate;
		}

		public void setEventEndDate(String eventEndDate) {
			this.eventEndDate = eventEndDate;
		}

		public String getEventConditionType() {
			return eventConditionType;
		}

		public void setEventConditionType(String eventConditionType) {
			this.eventConditionType = eventConditionType;
		}

		public String getTrackingProcessIdentifier() {
			return trackingProcessIdentifier;
		}

		public void setTrackingProcessIdentifier(String trackingProcessIdentifier) {
			this.trackingProcessIdentifier = trackingProcessIdentifier;
		}
	}
}
