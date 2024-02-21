package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser;

import java.util.UUID;

import org.json.simple.JSONObject;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.ControlCommandVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.CtrlSequencesVO;

@Component
public class CtrlCmdFactory {

	public MsaRequestControlCommandInfo makeDefaultCtrlCmdInfo(ControlCommandVO ctrlVo) throws Exception {

		// 요청정보 객체생성(준비상태)
		MsaRequestControlCommandInfo mrcc = new MsaRequestControlCommandInfo();

		// jackson objectmapper 객체 생성
		ObjectMapper objectMapper = new ObjectMapper();

		// ControlCommandVO 객체 -> Json 문자열
		String ctrlVoJson = objectMapper.writeValueAsString(ctrlVo.getCtrlSequences());
		mrcc.setReqCtrlCmd(ctrlVoJson);

		mrcc.setReqCtrlCmdType(ctrlVo.getReqCtrlCmdType());
		mrcc.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_READY);
		mrcc.setResultCallBackUrl(ctrlVo.getCallBackURL());
		// * 주의 DB와 인터페이스 변수명이 다름
		mrcc.setReqIdentifier(ctrlVo.getRequestIdtifier());
		mrcc.setMsaIdentifier(UUID.randomUUID().toString());

		return mrcc;
	}

	public MsaControlCommandSequenceInfo makeDefaultCtrlCmdSequenceInfo(String ctrlCmdTp, CtrlSequencesVO ctrlSequence)
			throws Exception {
		MsaControlCommandSequenceInfo seqInfo = new MsaControlCommandSequenceInfo();
		// 명령id 셋팅
		seqInfo.setRequestControlCommandId(ctrlSequence.getRequestControlCommandId());

		// 단일 장비상태정보 확인용 명령 생성/추가
		if (Constant.CTRL_CMD_REQ_TYPE_REG_DV.equals(ctrlCmdTp)) {
			// 시퀀스 동작 타입 설정, 등록 시 단일 시퀀스 작업(SST)
			seqInfo.setSequenceActType(Constant.CTRL_CMD_SEQUENCE_SINGLE);

			seqInfo.setSequenceIdentifier(UUID.randomUUID().toString());
		} else {
			seqInfo.setSequenceActType(ctrlSequence.getActualTp());

			seqInfo.setSequenceIdentifier(ctrlSequence.getControlIdtifier());
		}
		seqInfo.setNextSequenceIdentifier(ctrlSequence.getNextSeqIdtifier());

		seqInfo.setFederatedTwinId(ctrlSequence.getFederatedTwinId());
		seqInfo.setFederatedDigitalObjectId(ctrlSequence.getFederatedDigitalObjectId());
		seqInfo.setDigitalTwinId(ctrlSequence.getDigitalTwinId());
		seqInfo.setDigitalObjectId(ctrlSequence.getDigitalObjId());
		seqInfo.setDigitalControlId(ctrlSequence.getDigitalControlId());
		seqInfo.setControlCommand(ctrlSequence.getControlCommand());

		seqInfo.setNextSequenceCondition(ctrlSequence.getCtrlCondition());
		seqInfo.setLogicalExpression(ctrlSequence.getLogicalExpression());
		seqInfo.setStartInterval(ctrlSequence.getStart_interval());
		seqInfo.setNextInterval(ctrlSequence.getEnd_interval());

		// 시퀀스의 상태정보가 싱글과 시작일 경우에는 스케줄러가 실행할 수 있는 상태인 READY로 만들어 주고 그외에는 정보생성단계로 만들어서
		// 대기로
		if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(seqInfo.getSequenceActType())
				|| Constant.CTRL_CMD_SEQUENCE_START.equals(seqInfo.getSequenceActType())) {
			seqInfo.setSequenceStatus(Constant.CTRL_SEQUENCE_STATUS_READY);
		} else {
			seqInfo.setSequenceStatus(Constant.CTRL_SEQUENCE_STATUS_REG);
		}

		return seqInfo;
	}
}
