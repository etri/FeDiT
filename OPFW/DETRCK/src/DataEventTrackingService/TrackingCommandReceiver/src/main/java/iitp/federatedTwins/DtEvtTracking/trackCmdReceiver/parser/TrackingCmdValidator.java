package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingProcessVO;

@Component
public class TrackingCmdValidator {

	public boolean valideteDefalutTrackingCmd(TrackingCommandVO trackingCommand) throws Exception {

		if (trackingCommand == null) {
			throw new Exception("========= validetedDefalutInfo Exception trackingCommandVO is Null ========= ");
		}

		if (trackingCommand.getCallBackURL() == null || "".equals(trackingCommand.getCallBackURL())) {
			throw new Exception(
					"========= validetedDefalutInfo Exception trackingCommandVO CallBackURL Empty ========= ");
		}

		if (trackingCommand.getReqIdentifier() == null || "".equals(trackingCommand.getReqIdentifier())) {
			throw new Exception(
					"========= validetedDefalutInfo Exception trackingCommandVO ReqIdentifier Empty ========= ");
		}

		return true;
	}

	public TrackingCommandVO valideteTrackingCommands(TrackingCommandVO trackingCommand) throws Exception {
		valideteDefalutTrackingCmd(trackingCommand);

		if (trackingCommand.getTrckProcInfo() == null || trackingCommand.getTrckProcInfo().length < 1) {
			throw new Exception(
					"========= validetetrackingCommands trackingCommandVO In trckProcInfos Exception is Null Or Empty ========= ");
		}

		// trckProcInfo 에서 식별자가 Unique인지 체크
		ArrayList<String> idtfStr = new ArrayList<String>();
		for (TrackingProcessVO trckProcInfo : trackingCommand.getTrckProcInfo()) {

			// 필수조건 확인
			if (trckProcInfo.getTrckTp() == null || "".equals(trckProcInfo.getTrckTp())) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In TrckTp Exception is Null Or Empty ========= ");
			} else {
				// 타입 확인
				if (!Constant.TRCK_CMD_TYPE_DATA.equals(trckProcInfo.getTrckTp())
						&& !"ETP".equals(trckProcInfo.getTrckTp())) {
					throw new Exception(
							"========= validetetrackingCommands trckProcInfosVO Exception TrckTp Don't Use Type ========= "
									+ trckProcInfo.getTrckTp());
				}
			}

			// trckPrcIdtifier
			if (trckProcInfo.getTrckPrcIdtifier() == null || "".equals(trckProcInfo.getTrckPrcIdtifier())) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In TrckPrcIdtifier Exception is Null Or Empty ========= ");
			} else {
				// 중복체크를 위한 데이터
				idtfStr.add(trckProcInfo.getTrckPrcIdtifier());
			}

			// evntDelay
//			if(trckProcInfo.getEvntDelay() == 0) {
//				throw new Exception(
//						"========= valideteTrackingCommands TrackingCommandVO In EvntDelay Exception is 0 Or Empty ========= ");
//			}

			// evntCondition
			if (trckProcInfo.getEvntCondition() == null || "".equals(trckProcInfo.getEvntCondition())) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In EvntCondition Exception is Null Or Empty ========= ");
			}

			// 종료조건 확인, Default 조건 셋팅
			if ((trckProcInfo.getEvntOccrCnt() <= 0)
					&& (trckProcInfo.getEvntEndDt() == null || "".equals(trckProcInfo.getEvntEndDt()))) {
				trckProcInfo.setEvntOccrCnt(100);

				JSONObject evntEndDt = new JSONObject();
				evntEndDt.put("INTERVAL", Constant.INTERVAL_DATE_HOURS);
				evntEndDt.put("VALUE", 1);

				trckProcInfo.setEvntEndDt(evntEndDt.toJSONString());
			}

			// evntEndDt
			if (trckProcInfo.getEvntEndDt() != null && !"".equals(trckProcInfo.getEvntEndDt())) {

				JSONObject evntEndDt = new JSONObject();
				JSONParser jsonParser = new JSONParser();

				evntEndDt = (JSONObject) jsonParser.parse(trckProcInfo.getEvntEndDt());

				// INTERVAL 체크
				if (!Constant.INTERVAL_DATE_SECONDS.equals(evntEndDt.get("INTERVAL"))
						&& !Constant.INTERVAL_DATE_HOURS.equals(evntEndDt.get("INTERVAL"))
						&& !Constant.INTERVAL_DATE_DAYS.equals(evntEndDt.get("INTERVAL"))
						&& !Constant.INTERVAL_DATE_MINUTES.equals(evntEndDt.get("INTERVAL"))) {
					throw new Exception(
							"========= validetetrackingCommands trckProcInfosVO Exception evntEndDt Don't Use Type ========= "
									+ evntEndDt.get("INTERVAL"));
				}

				// VALUE 체크,/ 정수형 체크
				if (evntEndDt.get("VALUE").getClass().getName().equals("java.lang.Double")
						|| evntEndDt.get("VALUE").getClass().getName().equals("java.lang.String")) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In EvntEndDt VALUE Exception is not a Integer ");

				}
			}

			// 데이터 트래킹인 경우
			if (Constant.TRCK_CMD_TYPE_DATA.equals(trckProcInfo.getTrckTp())) {

				// FederatedTwinId
				if (trckProcInfo.getFederatedTwinId() == null || "".equals(trckProcInfo.getFederatedTwinId())) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In FederatedTwinId Exception is Null Or Empty ========= ");
				}

				// federatedDigitalObjectId
				if (trckProcInfo.getFederatedDigitalObjectId() == null
						|| "".equals(trckProcInfo.getFederatedDigitalObjectId())) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In federatedDigitalObjectId Exception is Null Or Empty ========= ");
				}

				// digitalTwinId
				if (trckProcInfo.getDigitalTwinId() == null || "".equals(trckProcInfo.getDigitalTwinId())) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In DigitalTwinId Exception is Null Or Empty ========= ");
				}

				// digitalObjId
				if (trckProcInfo.getDigitalObjId() == null || "".equals(trckProcInfo.getDigitalObjId())) {
					throw new Exception(
							"========= validetetrackingCommands TrackingCommandVO In DigitalObjId Exception is Null Or Empty ========= ");
				}

				// trckTopic
				if (trckProcInfo.getTrckTopic() == null || "".equals(trckProcInfo.getTrckTopic())) {
//					throw new Exception(
//							"========= validetetrackingCommands TrackingCommandVO In TrckTopic Exception is Null Or Empty ========= ");
					trckProcInfo.setTrckTopic(trckProcInfo.getFederatedTwinId());
				}

				// bufferSize
				if (trckProcInfo.getBufferSize() == 0) {
					throw new Exception(
							"========= validetetrackingCommands TrackingCommandVO In BufferSize Exception is 0 ========= ");
				}

				// dtFltTp
				if (trckProcInfo.getDtFltTp() == null || "".equals(trckProcInfo.getDtFltTp())) {
					throw new Exception(
							"========= validetetrackingCommands TrackingCommandVO In DtFltTp Exception is Null Or Empty ========= ");
				}

				if (!Constant.DATA_FILLTER_TYPE_MIN.equals(trckProcInfo.getDtFltTp())
						&& !Constant.DATA_FILLTER_TYPE_MAX.equals(trckProcInfo.getDtFltTp())
						&& !Constant.DATA_FILLTER_TYPE_AVER.equals(trckProcInfo.getDtFltTp())
						&& !Constant.DATA_FILLTER_TYPE_SUM.equals(trckProcInfo.getDtFltTp())
						&& !Constant.DATA_FILLTER_TYPE_STDEVP.equals(trckProcInfo.getDtFltTp())) {
					throw new Exception(
							"========= validetetrackingCommands trckProcInfosVO Exception DtFltTp Don't Use Type ========= "
									+ trckProcInfo.getDtFltTp());
				}
			}

			// 이벤트 트래킹인 경우
			if (Constant.RCK_CMD_TYPE_EVENT.equals(trckProcInfo.getTrckTp())) {
				HashMap<String, Object> map = evntConditionValidator(trckProcInfo.getEvntCondition());
			}
		}

		// 중복된 식별자 여부 확인
		idtfStr = (ArrayList<String>) idtfStr.stream().distinct().collect(Collectors.toList());
		if (idtfStr.size() != trackingCommand.getTrckProcInfo().length) {
			throw new Exception(
					"========= valideteTrackingCommands TrackingCommandVO In TrckPrcIdtifier Duplication Exception ========= ");
		} else {
			// 서버에서 사용할 Unique한 식별자 생성
			ArrayList<String> idList = new ArrayList<>();
			for (TrackingProcessVO trckProcInfo : trackingCommand.getTrckProcInfo()) {
				trckProcInfo.setTrckPrcIdtifierBF(trckProcInfo.getTrckPrcIdtifier());
				trckProcInfo.setTrckPrcIdtifier(UUID.randomUUID().toString());
				idList.add(trckProcInfo.getTrckPrcIdtifier());
			}
			HashMap<String, String> paramMap = new HashMap<>();
			for (int i = 0; i < idtfStr.size(); i++) {
				paramMap.put(idtfStr.get(i), idList.get(i));
			}

			for (TrackingProcessVO trckProcInfo : trackingCommand.getTrckProcInfo()) {
				paramMap.put("rtnVal", trckProcInfo.getTrckPrcIdtifier());
				trckProcInfo.setEvntCondition(this.madeToContentsValidParam(trckProcInfo.getEvntCondition(), paramMap));
			}

		}

		return trackingCommand;
	}

	public String madeToContentsValidParam(String content, HashMap<String, String> param) {
		try {
			if (param != null && param.size() > 0) {
				Iterator<String> it = param.keySet().iterator();
				while (it.hasNext()) {
					String key = it.next();
					if (key != null && !"".equals(key)) {
						String value = param.get(key);
						if (value != null && !"".equals(value)) {
							content = content.replaceAll(key, value);
						}
					}
				}
			}

		} catch (Exception e) {
			e.printStackTrace();
		}

		return content;
	}

	public ArrayList<String> getContentsParamNm(String contents) {
		ArrayList<String> paramArray = new ArrayList<String>();

		try {
			String regEx = "#\\{[^\\}]+\\}";
			Pattern pat = Pattern.compile(regEx);
			Matcher match = pat.matcher(contents);

			while (match.find()) {
				String groupParam = match.group();
				groupParam = groupParam.replaceAll("#\\{", "").replaceAll("\\}", "");
				paramArray.add(groupParam);
			}
		} catch (Exception e) {
			e.printStackTrace();

			paramArray = null;
		}

		return paramArray;
	}

	// conditon paramiter validator
	public HashMap<String, Object> evntConditionValidator(String evntCondition) throws Exception {

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
		System.out.println("evntConditionValidator >>>>>>>>>>>>>>>>>>>>>>>>>>" + evntCondition);

		if (evntCondition != null && !evntCondition.equals("")) {
			jsonObject = (JSONObject) jsonParser.parse(evntCondition);
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

											if (type.equals(Constant.EVENT_CONDITION_TYPE_CLIENT)) {

												if (expression.get("ctrlStatement") != null) {
													if (!expression.get("ctrlStatement").equals("")) {

														ctrlStatement = (String) expression.get("ctrlStatement");
														resultData.put("data", ctrlStatement);														

													} else {
														throw new Exception(
																"========= ctrlStatement is Empty ========= ");
													}

												} else {
													throw new Exception("========= ctrlStatement is Null ========= ");
												}

											} else if (type.equals(Constant.EVENT_CONDITION_TYPE_LOGIC)) {

												if (expression.get("LogicalOpt") != null) {
													if (!expression.get("LogicalOpt").equals("")) {

														String LogicalOpt = (String) expression.get("LogicalOpt");

														if (LogicalOpt.equals(Constant.LOGICAL_OPERATOR_OR)
																|| LogicalOpt.equals(Constant.LOGICAL_OPERATOR_AND)) {
															if (LogicalOpt.equals(Constant.LOGICAL_OPERATOR_OR))
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
																					if (LogicalOpt2.equals(
																							Constant.LOGICAL_OPERATOR_AND)
																							|| LogicalOpt2.equals(
																									Constant.LOGICAL_OPERATOR_OR)) {
																						if (LogicalOpt2.equals(
																								Constant.LOGICAL_OPERATOR_OR))
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
																											Constant.LOGICAL_OPERATOR_EQ))
																										AssgnOpt = "==";
																									else if (AssgnOpt
																											.equals(Constant.LOGICAL_OPERATOR_NE))
																										AssgnOpt = "<>";
																									else if (AssgnOpt
																											.equals(Constant.LOGICAL_OPERATOR_LT))
																										AssgnOpt = "<";
																									else if (AssgnOpt
																											.equals(Constant.LOGICAL_OPERATOR_LE))
																										AssgnOpt = ">=";
																									else if (AssgnOpt
																											.equals(Constant.LOGICAL_OPERATOR_GT))
																										AssgnOpt = ">";
																									else if (AssgnOpt
																											.equals(Constant.LOGICAL_OPERATOR_GE))
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

}
