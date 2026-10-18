package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingDetectorProcInfo {

	private int detectorProcId;
	private int trackingProcessId;
	private int requestTrackingId;
	private String detectedStatus;
	private String eventOccuredStatus;
	private int detectRecordStartId;
	private int detectRecordEndId;
	private String trackingStartDate;
	private String trackingEndDate;
	
	private String trackingResultValue;

	public int getDetectorProcId() {
		return detectorProcId;
	}

	public void setDetectorProcId(int detectorProcId) {
		this.detectorProcId = detectorProcId;
	}

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public String getDetectedStatus() {
		return detectedStatus;
	}

	public void setDetectedStatus(String detectedStatus) {
		this.detectedStatus = detectedStatus;
	}

	public String getEventOccuredStatus() {
		return eventOccuredStatus;
	}

	public void setEventOccuredStatus(String eventOccuredStatus) {
		this.eventOccuredStatus = eventOccuredStatus;
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

	public String getTrackingStartDate() {
		return trackingStartDate;
	}

	public void setTrackingStartDate(String trackingStartDate) {
		this.trackingStartDate = trackingStartDate;
	}

	public String getTrackingEndDate() {
		return trackingEndDate;
	}

	public void setTrackingEndDate(String trackingEndDate) {
		this.trackingEndDate = trackingEndDate;
	}

	public String getTrackingResultValue() {
		return trackingResultValue;
	}

	public void setTrackingResultValue(String trackingResultValue) {
		this.trackingResultValue = trackingResultValue;
	}

}
