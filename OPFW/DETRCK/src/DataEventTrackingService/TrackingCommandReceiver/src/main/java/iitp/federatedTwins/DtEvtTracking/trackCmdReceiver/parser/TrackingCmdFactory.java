package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser;

import java.util.UUID;

import org.json.simple.JSONObject;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingProcessVO;

@Component
public class TrackingCmdFactory {

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
		
		procInfo.setBufferSize(trckProcess.getBufferSize());
		procInfo.setDataFilterType(trckProcess.getDtFltTp());
		procInfo.setEventDelay(trckProcess.getEvntDelay());

		procInfo.setFederatedTwinId(trckProcess.getFederatedTwinId());
		procInfo.setFederatedDigitalObjectId(trckProcess.getFederatedDigitalObjectId());
		procInfo.setDigitalTwinId(trckProcess.getDigitalTwinId());
		procInfo.setDigitalObjectId(trckProcess.getDigitalObjId());
		
				
		JSONObject trckCmd = new JSONObject();
		trckCmd.put("evntDelay", trckProcess.getEvntDelay());
		procInfo.setTrackingCommand(trckCmd.toJSONString());

//		procInfo.setTrackingKafkaGroup(trckProcess.getTrckPrcIdtifier());
		

		procInfo.setEventCondition(trckProcess.getEvntCondition());
		procInfo.setEventOccurredCount(trckProcess.getEvntOccrCnt());
		procInfo.setEventEndDate(trckProcess.getEvntEndDt());

		
		procInfo.setTrackingStatus(Constant.TRCK_PROC_STATUS_REG);

		return procInfo;
	}
}
