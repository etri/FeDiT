package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser;

import java.util.UUID;

import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingProcessVO;

@Component
public class TrackingCmdFactory {

	@Value("${ngsi.max-lookback-ms:86400000}")
	private long ngsiMaxLookbackMs;

	public DataEventTrackingRequestInfo makeDefaultTrackingCmdInfo(TrackingCommandVO trckVo) throws Exception {

		DataEventTrackingRequestInfo mrcc = new DataEventTrackingRequestInfo();

		ObjectMapper objectMapper = new ObjectMapper();

		String trckVoJson = objectMapper.writeValueAsString(trckVo.getTrckProcInfo());
		mrcc.setReqTrackingCmd(trckVoJson);

		mrcc.setReqTrckCmdStatus(Constant.TRCK_CMD_STATUS_READY);
		mrcc.setResultCallbackUrl(trckVo.getCallBackURL());
		mrcc.setReqIdentifier(trckVo.getReqIdentifier());
		mrcc.setTrackingIdentifier(UUID.randomUUID().toString());

		return mrcc;
	}

	public TrackingProcessInfo makeDefaultTrackingCmdProcessInfo(TrackingProcessVO trckProcess)
			throws Exception {

		TrackingProcessInfo procInfo = new TrackingProcessInfo();
		procInfo.setRequestTrackingId(trckProcess.getRequestTrackingId());

		procInfo.setTrackingProcessType(trckProcess.getTrckTp());

		procInfo.setTrackingProcessIdentifier(trckProcess.getTrckPrcIdtifier());
		procInfo.setTrckPrcIdtifier(trckProcess.getTrckPrcIdtifierBF());
		
		procInfo.setTrackingKafkaTopic(trckProcess.getTrckTopic());
		
		procInfo.setTrackingValueInfo(trckProcess.getTrckValInfo());

		procInfo.setContextUrl(trckProcess.getContextUrl());
		procInfo.setEntityId(trckProcess.getEntityId());
		procInfo.setNgsiType(trckProcess.getNgsiType());
		procInfo.setTimeproperty(trckProcess.getTimeproperty());
		
		procInfo.setBufferSize(trckProcess.getBufferSize());
		procInfo.setDataFilterType(trckProcess.getDtFltTp());
		procInfo.setEventDelay(trckProcess.getEvntDelay());

		procInfo.setFederatedTwinId(trckProcess.getFederatedTwinId());
		procInfo.setFederatedDigitalObjectId(trckProcess.getFederatedDigitalObjectId());
		procInfo.setDigitalObjectId(trckProcess.getDigitalObjId());

		String linkType = trckProcess.getDataLinkType() == null
				|| "".equals(trckProcess.getDataLinkType())
				? Constant.DATA_LINK_TYPE_KAFKA
				: trckProcess.getDataLinkType();
		procInfo.setDataLinkType(linkType);

		JSONObject trckCmd = new JSONObject();
		trckCmd.put("evntDelay", trckProcess.getEvntDelay());
		trckCmd.put("linkType", linkType);
		if (Constant.DATA_LINK_TYPE_NGSILD.equals(linkType)) {
			trckCmd.put("maxLookbackMs", ngsiMaxLookbackMs);
		}
		procInfo.setTrackingCommand(trckCmd.toJSONString());

		procInfo.setEventCondition(trckProcess.getEvntCondition());
		procInfo.setEventOccurredCount(trckProcess.getEvntOccrCnt());
		procInfo.setEventEndDate(trckProcess.getEvntEndDt());

		procInfo.setTrackingStatus(Constant.TRCK_PROC_STATUS_REG);

		return procInfo;
	}
}
