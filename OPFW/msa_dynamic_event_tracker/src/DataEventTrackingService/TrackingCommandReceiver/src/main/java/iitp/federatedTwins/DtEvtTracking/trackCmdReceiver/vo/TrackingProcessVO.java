package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo;

/**
 * @파일명 : TrackingSequencesVO.java
 * @title :제어명령 요청 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingProcessVO {
	/**
	 *  
	 */
	private String trckTp;
	private String trckPrcIdtifier;
	private String trckPrcIdtifierBF;
	private String federatedTwinId;
	private String federatedDigitalObjectId;
	private String digitalTwinId;
	private String digitalObjId;
	private String digitalControlId;
	private String trckGroup;
	private String trckTopic;
	private String trckValInfo;
	
	private int evntDelay;
	private int bufferSize;
	private int requestTrackingId;

	private String dtFltTp;

	private String evntCondition;
	private int evntOccrCnt;
	
	private String evntEndDt;
	private String trackingCommand;


	public String getTrckTp() {
		return trckTp;
	}

	public void setTrckTp(String trckTp) {
		this.trckTp = trckTp;
	}

	public String getTrckPrcIdtifier() {
		return trckPrcIdtifier;
	}

	public void setTrckPrcIdtifier(String trckPrcIdtifier) {
		this.trckPrcIdtifier = trckPrcIdtifier;
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

	public String getTrckGroup() {
		return trckGroup;
	}

	public void setTrckGroup(String trckGroup) {
		this.trckGroup = trckGroup;
	}

	public String getTrckTopic() {
		return trckTopic;
	}

	public void setTrckTopic(String trckTopic) {
		this.trckTopic = trckTopic;
	}
	
	public String getTrckValInfo() {
		return trckValInfo;
	}

	public void setTrckValInfo(String trckValInfo) {
		this.trckValInfo = trckValInfo;
	}
	

	public int getEvntDelay() {
		return evntDelay;
	}

	public void setEvntDelay(int evntDelay) {
		this.evntDelay = evntDelay;
	}

	public int getBufferSize() {
		return bufferSize;
	}

	public void setBufferSize(int bufferSize) {
		this.bufferSize = bufferSize;
	}

	public String getDtFltTp() {
		return dtFltTp;
	}

	public void setDtFltTp(String dtFltTp) {
		this.dtFltTp = dtFltTp;
	}

	public String getEvntCondition() {
		return evntCondition;
	}

	public void setEvntCondition(String evntCondition) {
		this.evntCondition = evntCondition;
	}



	public String getEvntEndDt() {
		return evntEndDt;
	}

	public void setEvntEndDt(String evntEndDt) {
		this.evntEndDt = evntEndDt;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public String getTrackingCommand() {
		return trackingCommand;
	}

	public void setTrackingCommand(String trackingCommand) {
		this.trackingCommand = trackingCommand;
	}

	public int getEvntOccrCnt() {
		return evntOccrCnt;
	}

	public void setEvntOccrCnt(int evntOccrCnt) {
		this.evntOccrCnt = evntOccrCnt;
	}

	public String getTrckPrcIdtifierBF() {
		return trckPrcIdtifierBF;
	}

	public void setTrckPrcIdtifierBF(String trckPrcIdtifierBF) {
		this.trckPrcIdtifierBF = trckPrcIdtifierBF;
	}


	


}
