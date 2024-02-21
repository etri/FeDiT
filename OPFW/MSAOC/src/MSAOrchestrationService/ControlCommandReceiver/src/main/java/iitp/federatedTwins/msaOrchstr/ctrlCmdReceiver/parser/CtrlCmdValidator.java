package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;
import java.util.UUID;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.ControlCommandVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.CtrlSequencesVO;

@Component
public class CtrlCmdValidator {

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
			ctrlConditionData = ctrlConditionValidator(ctrlSequence.getCtrlCondition());

			if (ctrlConditionData != null) {
				if ((boolean) ctrlConditionData.get("res") == true) {
					ctrlSequence.setLogicalExpression((String) ctrlConditionData.get("data"));
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
				cpSeqArr[u].setControlIdtifier(UUID.randomUUID().toString());
			} else {
				// 연결 Identifier 값을 셋팅
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

	// conditon paramiter validator
	public HashMap<String, Object> ctrlConditionValidator(String ctrlCondition) throws Exception {

		HashMap<String, Object> resultData = new HashMap<>();
		String ctrlStatement = "";
		String rtrnVal = "";
		String AssgnOpt = "";
		ArrayList<String> logicalPro = new ArrayList<>();

		JSONParser jsonParser = new JSONParser();
		JSONObject jsonObject = new JSONObject();
		JSONObject expression = new JSONObject();
		JSONObject statements2 = new JSONObject();
		JSONArray statements = new JSONArray();
		JSONArray condition = new JSONArray();
		System.out.println("ctrlConditionValidator >>>>>>>>>>>>>>>>>>>>>>>>>>" + ctrlCondition);

		if (ctrlCondition != null && !ctrlCondition.equals("")) {
			jsonObject = (JSONObject) jsonParser.parse(ctrlCondition);
			if (jsonObject.get("checkable") != null) {
				if (!jsonObject.get("checkable").equals("")) {
					if (Boolean.class.isInstance(jsonObject.get("checkable")) == true) {

						boolean checkable = (boolean) jsonObject.get("checkable");

						if (checkable == true) {

							if (jsonObject.get("type") != null) {
								if (!jsonObject.get("type").equals("")) {
									String type = (String) jsonObject.get("type");

									if (jsonObject.get("expression") != null) {
										if (!jsonObject.get("expression").equals("")) {
											expression = (JSONObject) jsonObject.get("expression");

											if (type.equals("CP")) {

												if (expression.get("ctrlStatement") != null) {
													if (!expression.get("ctrlStatement").equals("")) {

														ctrlStatement = (String) expression.get("ctrlStatement");
														resultData.put("data", ctrlStatement);
														System.out.println(
																"ctrlStatement >>>>>>>>>>>>>>>>>>>>" + ctrlStatement);

													} else {
														throw new Exception(
																"========= ctrlStatement is Empty ========= ");
													}

												} else {
													throw new Exception("========= ctrlStatement is Null ========= ");
												}

											} else if (type.equals("CB")) {

												if (expression.get("LogicalOpt") != null) {
													if (!expression.get("LogicalOpt").equals("")) {

														String LogicalOpt = (String) expression.get("LogicalOpt");

														if (LogicalOpt.equals("OR") || LogicalOpt.equals("AND")) {
															if (LogicalOpt.equals("OR"))
																LogicalOpt = "||";
															else
																LogicalOpt = "&&";

															if (expression.get("ctrlStatement") != null) {
																if (!expression.get("ctrlStatement").equals("")) {
																	statements = (JSONArray) expression
																			.get("ctrlStatement");

																	if (statements != null && statements.size() > 0) {
																		for (int i = 0; i < statements.size(); i++) {
																			statements2 = (JSONObject) statements
																					.get(i);
																			String LogicalOpt2 = "";

																			// statements 안에 연산자가 있는지 체크
																			if (statements2.get("LogicalOpt") != null) {
																				if (statements2
																						.get("LogicalOpt") != null) {
																					LogicalOpt2 = (String) statements2
																							.get("LogicalOpt");
																					if (LogicalOpt2.equals("AND")
																							|| LogicalOpt2
																									.equals("OR")) {
																						if (LogicalOpt2.equals("OR"))
																							LogicalOpt2 = "||";
																						else
																							LogicalOpt2 = "&&";
																					} else {
																						throw new Exception(
																								"========= LogicalOpt2 is not defined ========= ");
																					}
																				} else {
																					throw new Exception(
																							"========= LogicalOpt2 is Empty ========= ");
																				}
																			}

																			ArrayList<Object> param = new ArrayList<>();
																			ArrayList<Object> param2 = new ArrayList<>();
																			// condition null 체크
																			if (statements2.get("condition") != null) {
																				if (!statements2.get("condition")
																						.equals("")) {
																					condition = (JSONArray) statements2
																							.get("condition");

																					if (condition != null
																							&& condition.size() > 0) {

																						// condition 연산자 없는 경우 예외 처리
																						if (condition.size() > 1
																								&& statements2.get(
																										"LogicalOpt") == null) {
																							throw new Exception(
																									"========= condition LogicalOpt2 is Null ========= ");
																						}

																						// condition data 담기
																						for (int j = 0; j < condition
																								.size(); j++) {
																							JSONObject conditionParam = (JSONObject) condition
																									.get(j);

																							if (conditionParam.get(
																									"rtrnVal") != null) {
																								if (!conditionParam
																										.get("rtrnVal")
																										.equals("")) {

																									Object conObj = conditionParam
																											.get("rtrnVal");

																									if (conObj instanceof String) {
																										rtrnVal = "'"
																												+ (String) conditionParam
																														.get("rtrnVal")
																												+ "'";
																										param.add(
																												rtrnVal);
																									} else {
																										param.add(
																												conObj);
																									}
																								} else {
																									throw new Exception(
																											"========= rtrnVal is Empty ========= ");
																								}
																							} else {
																								throw new Exception(
																										"========= rtrnVal is Null ========= ");
																							}

																							if (conditionParam.get(
																									"AssgnOpt") != null) {
																								if (!conditionParam
																										.get("AssgnOpt")
																										.equals("")) {

																									AssgnOpt = (String) conditionParam
																											.get("AssgnOpt");
																									if (AssgnOpt.equals(
																											"EQ"))
																										AssgnOpt = "==";
																									else if (AssgnOpt
																											.equals("NE"))
																										AssgnOpt = "<>";
																									else if (AssgnOpt
																											.equals("LT"))
																										AssgnOpt = "<";
																									else if (AssgnOpt
																											.equals("LE"))
																										AssgnOpt = ">=";
																									else if (AssgnOpt
																											.equals("GT"))
																										AssgnOpt = ">";
																									else if (AssgnOpt
																											.equals("GE"))
																										AssgnOpt = "<=";
																									else
																										throw new Exception(
																												"========= AssgnOpt is not defined ========= ");
																									param2.add(
																											AssgnOpt);
																								} else {
																									throw new Exception(
																											"========= AssgnOpt is Empty ========= ");
																								}
																							} else {
																								throw new Exception(
																										"========= AssgnOpt is Null ========= ");
																							}

																						}

																						String logicalL = "rtnVal";
																						StringBuffer sb = new StringBuffer();
																						if (param != null
																								&& param.size() > 0) {
																							for (int k = 0; k < param
																									.size(); k++) {
																								if (k > 0)
																									sb.append(" ");
																								sb.append(logicalL);
																								sb.append(" ");
																								sb.append(
																										param2.get(k));
																								sb.append(" ");
																								sb.append(param.get(k));
																								sb.append(" ");
																								if (k < param.size()
																										- 1)
																									sb.append(
																											LogicalOpt2);
																							}
																						}
																						sb.insert(0, "(");
																						String logicalsub = sb
																								.insert(sb.length() - 1,
																										")")
																								.toString();
																						logicalPro.add(logicalsub);
																					} else {
																						throw new Exception(
																								"========= condition size 0 ========= ");
																					}

																				} else {
																					throw new Exception(
																							"========= condition Empty ========= ");
																				}
																			} else {
																				throw new Exception(
																						"========= statements is Null ========= ");
																			}

																		}

																		StringBuffer sb2 = new StringBuffer();
																		if (logicalPro != null
																				&& logicalPro.size() > 0) {
																			for (int m = 0; m < logicalPro
																					.size(); m++) {
																				sb2.append(logicalPro.get(m));
																				if (m < logicalPro.size() - 1) {
																					sb2.append(LogicalOpt);
																					sb2.append(" ");
																				}
																			}
																			sb2.insert(0, "(");
																			sb2.insert(sb2.length() - 1, ")")
																					.toString();
																			ctrlStatement = sb2.toString();
																			resultData.put("data", ctrlStatement);
																			System.out.println(
																					"ctrlStatement >>>>>>>>>>>>>>>>>>>>"
																							+ ctrlStatement);

																		} else {
																			throw new Exception(
																					"========= logicalPro size 0 ========= ");
																		}

																	} else {
																		throw new Exception(
																				"========= ctrlStatement size 0 ========= ");
																	}

																} else {
																	throw new Exception(
																			"========= ctrlStatement Empty ========= ");
																}
															} else {
																throw new Exception(
																		"========= ctrlStatement is Null ========= ");
															}

														} else {
															throw new Exception(
																	"========= LogicalOpt is not defiend ========= ");
														}

													} else {
														throw new Exception("========= LogicalOpt is Empty ========= ");
													}
												} else {
													throw new Exception("========= LogicalOpt is Null ========= ");
												}

											} else {
												throw new Exception("========= type is not defined ========= ");
											}
										} else {
											throw new Exception("========= expression is Empty ========= ");
										}
									} else {
										throw new Exception("========= expression is Null ========= ");
									}
								} else {
									throw new Exception("========= type is Empty ========= ");
								}
							}

							else {
								throw new Exception("========= type is Null  ========= ");
							}

						} else if (checkable == false) {
							resultData.put("res", true);
							return resultData;
						}
					} else {
						throw new Exception("========= checkable is not defiend ========= ");
					}
				} else {
					throw new Exception("========= checkable is Empty ========= ");
				}

			} else {
				throw new Exception("========= checkable is Null ========= ");
			}
		} else {
			throw new Exception("========= ctrlCondition is Null or Empty ========= ");
		}

		resultData.put("res", true);
		return resultData;

	}

//	public HashMap<String, Object> ctrlCommandValidator(String ctrlCommand) throws Exception {
		public void ctrlCommandValidator(String ctrlCommand) throws Exception {

		System.out.println("ctrlCommand >>>>>>>>>>>>>>>>>>>" + ctrlCommand);
		HashMap<String, Object> cmdData = new HashMap<>();
		JSONParser jsonParser = new JSONParser();
		JSONObject ctrlCommandJson = new JSONObject();
		JSONArray commandArr = new JSONArray();
		JSONObject commandObj = new JSONObject();
		

		// 파라미터 null / 공백 체크
		if (ctrlCommand != null && !ctrlCommand.equals("")) {
			ctrlCommandJson = (JSONObject) jsonParser.parse(ctrlCommand);
			// name 체크
			if (ctrlCommandJson.get("name") != null) {
				if (!ctrlCommandJson.get("name").equals("")) {
					if (ctrlCommandJson.get("commands") != null) {
						if (!ctrlCommandJson.get("commands").equals("")) {
							commandArr = (JSONArray) ctrlCommandJson.get("commands");
							if (commandArr != null && commandArr.size() > 0) {
								for (int i = 0; i < commandArr.size(); i++) {
									commandObj = (JSONObject) commandArr.get(i);
									if (commandObj.get("control_type") != null) {
										if (!commandObj.get("control_type").equals("")) {
											if (commandObj.get("command_list") != null) {
												if (!commandObj.get("command_list").equals("")) {
													if (commandObj.get("control_value") != null) {
														System.out.println(
																"******************* SUCCESS *******************");
													} else {
														throw new Exception(
																"========= Control_value is Null ========= ");
													}
												} else {
													throw new Exception("========= Command_list is Empty ========= ");
												}
											} else {
												throw new Exception("========= Command_list is Null ========= ");
											}
										} else {
											throw new Exception("========= Control_type is Empty ========= ");
										}
									} else {
										throw new Exception("========= Control_type is Null ========= ");
									}
								}
							} else {
								throw new Exception("========= Commands Size is 0 ========= ");
							}
						} else {
							throw new Exception("========= Commands is Empty ========= ");
						}
					} else {
						throw new Exception("========= Commands is Null ========= ");
					}
				} else {
					throw new Exception("========= Name is Empty ========= ");
				}
			} else {
				throw new Exception("========= Name is Null ========= ");
			}
		} else {
			throw new Exception("========= CtrlCommand is Null or Empty ========= ");
		}
	
	}

}
