package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser;

import java.util.UUID;

import org.json.simple.JSONObject;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingSequencesVO;

@Component
public class TrackingCmdFactory {

	public DataEventTrackingRequestInfo makeDefaultTrackingCmdInfo(TrackingCommandVO trckVo) throws Exception {

		DataEventTrackingRequestInfo mrcc = new DataEventTrackingRequestInfo();

		ObjectMapper objectMapper = new ObjectMapper();

		String trckVoJson = objectMapper.writeValueAsString(trckVo.getTrckProcInfo());
		mrcc.setReqTrackingCmd(trckVoJson);

		mrcc.setReqTrckCmdStatus(Constant.CTRL_CMD_STATUS_READY);
		mrcc.setResultCallbackUrl(trckVo.getCallBackURL());
		mrcc.setReqIdentifier(trckVo.getReqIdentifier());
		mrcc.setTrackingIdentifier(UUID.randomUUID().toString());

		return mrcc;
	}

	public TrackingProcessInfo makeDefaultTrackingCmdSequenceInfo(String ctrlCmdTp, TrackingSequencesVO trckSequence)
			throws Exception {

		StringBuilder urlStb = new StringBuilder();
		urlStb.setLength(0);
		urlStb.append(Constant.MSA_SEQ_REQ_CALLBACK_URL);
		urlStb.append(trckSequence.getFederatedTwinId());
		urlStb.append("/control-results/");
		urlStb.append(trckSequence.getFederatedDigitalObjectId());

		JSONObject json = new JSONObject();
		json.put("metricsIdentifier", "CDS001MT01");
		json.put("callBackUrl", urlStb.toString());

		TrackingProcessInfo seqInfo = new TrackingProcessInfo();
		seqInfo.setRequestTrackingId(trckSequence.getRequestTrackingId());

		if (Constant.CTRL_CMD_REQ_TYPE_REG_DV.equals(ctrlCmdTp)) {
			seqInfo.setTrackingProcessType(Constant.CTRL_CMD_SEQUENCE_SINGLE);

			seqInfo.setTrackingProcessIdentifier(UUID.randomUUID().toString());
		} else {
			seqInfo.setTrackingProcessType(trckSequence.getTrckTp());

			seqInfo.setTrackingProcessIdentifier(trckSequence.getTrckPrcIdtifier());
		}
		seqInfo.setTrackingKafkaTopic(trckSequence.getTrckTopic());

		seqInfo.setFederatedTwinId(trckSequence.getFederatedTwinId());
		seqInfo.setFederatedDigitalObjectId(trckSequence.getFederatedDigitalObjectId());
		seqInfo.setDigitalTwinId(trckSequence.getDigitalTwinId());
		seqInfo.setDigitalObjectId(trckSequence.getDigitalObjId());
		
		
		
		JSONObject trckCmd = new JSONObject();
		trckCmd.put("evntDelay", trckSequence.getEvntDelay());
		seqInfo.setTrackingCommand(trckCmd.toJSONString());

		seqInfo.setTrackingKafkaGroup(json.toString());
		

		seqInfo.setEventCondition(trckSequence.getEvntCondition());
		seqInfo.setEventOccurredCount(trckSequence.getEvntOccrCnt());

		
		
		if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(seqInfo.getTrackingProcessType())
				|| Constant.CTRL_CMD_SEQUENCE_START.equals(seqInfo.getTrackingProcessType())) {
			seqInfo.setTrackingStatus(Constant.CTRL_SEQUENCE_STATUS_READY);
		} else {
			seqInfo.setTrackingStatus(Constant.CTRL_SEQUENCE_STATUS_REG);
		}

		return seqInfo;
	}
}
