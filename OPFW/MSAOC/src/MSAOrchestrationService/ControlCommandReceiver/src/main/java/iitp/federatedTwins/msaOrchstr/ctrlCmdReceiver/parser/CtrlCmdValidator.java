package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.ControlCommandVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.CtrlSequencesVO;

@Component
public class CtrlCmdValidator {
	
	
	@Autowired
	CtrlCmdValidatorParser ctrlCmdValidatorParser;
	
	

	public boolean valideteDefalutCtrlCmd(ControlCommandVO controlCommand) throws Exception {

		if (controlCommand == null) {
			throw new Exception("========= validetedDefalutInfo Exception ControlCommandVO is Null ========= ");
		}

		if (controlCommand.getCallBackURL() == null || "".equals(controlCommand.getCallBackURL())) {
			throw new Exception(
					"========= validetedDefalutInfo Exception ControlCommandVO CallBackURL Empty ========= ");
		}

		if (controlCommand.getRequestIdtifier() == null || "".equals(controlCommand.getRequestIdtifier())) {
			throw new Exception(
					"========= validetedDefalutInfo Exception ControlCommandVO RequestIdentifier Empty ========= ");
		}

		return true;
	}

	public boolean valideteDefalutCtrlSequence(CtrlSequencesVO ctrlSequence) throws Exception {

		// 시퀀스정보 유효성 검증
		if (ctrlSequence == null) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO is Null ========= ");
		}

		if (ctrlSequence.getFederatedTwinId() == null || "".equals(ctrlSequence.getFederatedTwinId())) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO FederatedTwinId Empty ========= ");
		}

		if (ctrlSequence.getFederatedDigitalObjectId() == null
				|| "".equals(ctrlSequence.getFederatedDigitalObjectId())) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO FederatedDigitalObjectId Empty ========= ");
		}

		if (ctrlSequence.getDigitalTwinId() == null || "".equals(ctrlSequence.getDigitalTwinId())) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO DigitalTwinId Empty ========= ");
		}

		if (ctrlSequence.getDigitalObjId() == null || "".equals(ctrlSequence.getDigitalObjId())) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO DigitalObjId Empty ========= ");
		}

		if (ctrlSequence.getDigitalControlId() == null || "".equals(ctrlSequence.getDigitalControlId())) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO DigitalControlId Empty ========= ");
		}

		if (ctrlSequence.getControlCommand() == null || "".equals(ctrlSequence.getControlCommand())) {
			throw new Exception(
					"========= valideteRegCtrlSequenceFdtObjData Exception CtrlSequencesVO ControlCommand Empty ========= ");
		}

		return true;
	}

	public ControlCommandVO valideteControlCommands(ControlCommandVO controlCommand) throws Exception {
		// 기본 정보 데이터 유효성검증
		valideteDefalutCtrlCmd(controlCommand);

		// 시퀀스정보 유효성 검증
		if (controlCommand.getCtrlSequences() == null || controlCommand.getCtrlSequences().length < 1) {
			throw new Exception(
					"========= valideteControlCommands ControlCommandVO In CtrlSequences Exception is Null Or Empty ========= ");
		}

		// 시퀀스 별 정보 유효성 체크
		int sstCnt = 0, stsCnt = 0, etsCnt = 0, rtsCnt = 0;
		ArrayList<CtrlSequencesVO> sstList = new ArrayList<CtrlSequencesVO>();
		ArrayList<CtrlSequencesVO> stsList = new ArrayList<CtrlSequencesVO>();
		ArrayList<CtrlSequencesVO> etsList = new ArrayList<CtrlSequencesVO>();
		ArrayList<CtrlSequencesVO> rtsList = new ArrayList<CtrlSequencesVO>();
		HashMap<String, Object> ctrlConditionData = new HashMap<>();

		for (CtrlSequencesVO ctrlSequence : controlCommand.getCtrlSequences()) {

			// ctrlConditionData validation
			
			if(ctrlSequence.getActualTp() != null && ctrlSequence.getActualTp().equals(Constant.CTRL_CMD_SEQUENCE_RUNNING)) {
				ctrlCmdValidatorParser.ctrlCommandValidator(ctrlSequence.getControlCommand());
				
				ctrlConditionData = ctrlCmdValidatorParser.ctrlConditionValidator(ctrlSequence.getCtrlCondition());
			
				if (ctrlConditionData != null) {
					if ((boolean) ctrlConditionData.get("res") == true) {
						ctrlSequence.setLogicalExpression((String) ctrlConditionData.get("data"));
					}					
				}
			}

			// 제어시퀀스 동작 타입 확인
			if (!Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(ctrlSequence.getActualTp())
					&& !Constant.CTRL_CMD_SEQUENCE_START.equals(ctrlSequence.getActualTp())
					&& !Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(ctrlSequence.getActualTp())
					&& !Constant.CTRL_CMD_SEQUENCE_END.equals(ctrlSequence.getActualTp())) {
				throw new Exception(
						"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Don't Use Type ========= "
								+ ctrlSequence.getActualTp());
			}

			// 제어시퀀스 단위 요청식별자 확인
			if (ctrlSequence.getControlIdtifier() == null || "".equals(ctrlSequence.getControlIdtifier())) {
				throw new Exception(
						"========= valideteControlCommands CtrlSequencesVO Exception ControlIdtifier is Null Or Empty ========= ");
			}

			// 제어시퀀스 다음 실행 요청식별자(nextSeqIdtifier) 정보 확인
			if (Constant.CTRL_CMD_SEQUENCE_START.equals(ctrlSequence.getActualTp())
					|| Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(ctrlSequence.getActualTp())) {
				if (ctrlSequence.getNextSeqIdtifier() == null || "".equals(ctrlSequence.getNextSeqIdtifier())) {
					throw new Exception(
							"========= valideteControlCommands CtrlSequencesVO Exception NextSeqIdtifier is Null Or Empty ========= ");
				}
			}

			// 제어시퀀스 동작 기본정보 확인
			if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(ctrlSequence.getActualTp())
					|| Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(ctrlSequence.getActualTp())) {
				valideteDefalutCtrlSequence(ctrlSequence);
			}

			if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(ctrlSequence.getActualTp())) {
				sstCnt++;
				sstList.add(ctrlSequence);
			} else if (Constant.CTRL_CMD_SEQUENCE_START.equals(ctrlSequence.getActualTp())) {
				stsCnt++;
				stsList.add(ctrlSequence);
			} else if (Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(ctrlSequence.getActualTp())) {
				rtsCnt++;
				rtsList.add(ctrlSequence);
			} else if (Constant.CTRL_CMD_SEQUENCE_END.equals(ctrlSequence.getActualTp())) {
				etsCnt++;
				etsList.add(ctrlSequence);
			}
		}

		// 두가시 시퀀스 타입이 섞여있는지 확인
		if (sstCnt > 0 && stsCnt + etsCnt + rtsCnt > 0) {
			throw new Exception(
					"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Consist Of SST Or STS=>[RTS]=>ETS ========= ");
		}

		// 싱클시퀀스 타입일때 싱글이 1이상이면 에러
		if (sstCnt > 1 && stsCnt + etsCnt + rtsCnt == 0) {
			throw new Exception(
					"========= valideteControlCommands CtrlSequencesVO Exception ActualTp SST Consist Of Only One SST ========= ");
		}

		// 제어시퀀스 체크
		if (sstCnt == 0 && stsCnt + etsCnt + rtsCnt > 0) {
			// 제어시퀀스에서는 시작과 종료시퀀스는 무조건 1개씩 나와야 한다.
			if (stsCnt != 1 || etsCnt != 1) {
				throw new Exception(
						"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Should Have One STS And One ETS. ========= ");
			}

			if (stsCnt == 1 && etsCnt == 1 && rtsCnt < 1) {
				throw new Exception(
						"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Must Contains At Least One RTS. ========= ");
			}

			if (stsCnt + etsCnt + rtsCnt != controlCommand.getCtrlSequences().length) {
				throw new Exception(
						"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Sequence Length Non Equels. ========= ");
			}
		}

		CtrlSequencesVO[] cpSeqArr = null;
		if (sstCnt > 0) {
			cpSeqArr = sstList.toArray(new CtrlSequencesVO[sstList.size()]);
		} else {
			LinkedList<CtrlSequencesVO> linkedSeq = new LinkedList<CtrlSequencesVO>();

			// Seq Linked List 첫번째에 STS정보를 추가
			linkedSeq.addFirst(stsList.get(0));

			// 시퀀스의 Linked 체크를 위한 정보 셋팅
			boolean rtsChk = false;
			CtrlSequencesVO chkSeq = stsList.get(0);
			CtrlSequencesVO etsSeq = etsList.get(0);

			// 확인 후 Running 중인 목록에서 삭제하기 위한 Idx
			int rtsIdx = -1;

			while (true) {
				if (chkSeq.getNextSeqIdtifier().equals(etsSeq.getControlIdtifier())) {
					break;
				}

				// 연결 시퀀스 확인 작업
				rtsChk = false;
				rtsIdx = -1;
				for (int a = 0; a < rtsList.size(); a++) {
					CtrlSequencesVO rtsSeq = rtsList.get(a);

					if (chkSeq.getNextSeqIdtifier().equals(rtsSeq.getControlIdtifier())) {
						chkSeq = rtsList.get(a);
						rtsChk = true;
						rtsIdx = a;
						break;
					}
				}

				// Running 시퀀스확인해보고 찾지 못하면 에러 찾으면 연결시퀀스에 정보를 넣고 추가한 정보는 rtsList에서 삭제
				if (rtsChk) {
					linkedSeq.add(chkSeq);
					rtsList.remove(rtsIdx);
				} else {
					throw new Exception(
							"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Sequence ControlIdentifier Don't Search to Running Task. ========= ");
				}
			}

			// Seq Linked List에 마지막 ETS정보를 추가
			linkedSeq.addLast(etsList.get(0));

			// 최종 생성된 목록정보를 조사한다.
			if (linkedSeq.size() != stsCnt + etsCnt + rtsCnt) {
				throw new Exception(
						"========= valideteControlCommands CtrlSequencesVO Exception ActualTp Sequence ReLinked Length Non Equels. ========= ");
			}

			// 생성된 목록정보를 시퀀스 목록으로 재 셋팅해준다.
			cpSeqArr = linkedSeq.toArray(new CtrlSequencesVO[linkedSeq.size()]);

		}

		// 새로 만들어진 시퀀스 목록에 서버에서 사용할 Unique한 Identifier 값을 셋팅
		String ctrlIdtf = "";
		for (int u = 0; u < cpSeqArr.length; u++) {

			// 요청한 식별자와 서버에서 사용할 식별자를 생성/복사한다.
			cpSeqArr[u].setClientControlIdtifier(cpSeqArr[u].getControlIdtifier());
			if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(cpSeqArr[u].getActualTp())
					|| Constant.CTRL_CMD_SEQUENCE_START.equals(cpSeqArr[u].getActualTp())) {
				// 서버 용 Unique용 Identifier 값을 셋팅
				cpSeqArr[u].setCtrlIdtifier(cpSeqArr[u].getControlIdtifier());
				cpSeqArr[u].setControlIdtifier(UUID.randomUUID().toString());
			} else {
				// 연결 Identifier 값을 셋팅
				cpSeqArr[u].setCtrlIdtifier(cpSeqArr[u].getControlIdtifier());
				cpSeqArr[u].setControlIdtifier(ctrlIdtf);
			}

			// 다음 식별자 정보를 생성/복사한다.
			if (Constant.CTRL_CMD_SEQUENCE_START.equals(cpSeqArr[u].getActualTp())
					|| Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(cpSeqArr[u].getActualTp())) {
				cpSeqArr[u].setClientNextSeqIdtifier(cpSeqArr[u].getNextSeqIdtifier());

				ctrlIdtf = UUID.randomUUID().toString();
				cpSeqArr[u].setNextSeqIdtifier(ctrlIdtf);
			}

		}

		// 새로 정렬된 시퀀스 정보목록 셋팅
		controlCommand.setCtrlSequences(cpSeqArr);

		return controlCommand;
	}

}
