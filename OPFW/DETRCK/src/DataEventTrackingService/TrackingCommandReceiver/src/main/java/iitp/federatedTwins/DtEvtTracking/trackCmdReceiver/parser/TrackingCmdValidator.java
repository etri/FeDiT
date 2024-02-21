package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser;

import java.util.ArrayList;
import java.util.HashMap;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingSequencesVO;

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

	public boolean valideteDefalutTrackingSequence(TrackingSequencesVO trckProcInfo) throws Exception {

		if (trckProcInfo == null) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO is Null ========= ");
		}

		if (trckProcInfo.getFederatedTwinId() == null || "".equals(trckProcInfo.getFederatedTwinId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO FederatedTwinId Empty ========= ");
		}

		if (trckProcInfo.getFederatedDigitalObjectId() == null
				|| "".equals(trckProcInfo.getFederatedDigitalObjectId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO FederatedDigitalObjectId Empty ========= ");
		}

		if (trckProcInfo.getDigitalTwinId() == null || "".equals(trckProcInfo.getDigitalTwinId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO DigitalTwinId Empty ========= ");
		}

		if (trckProcInfo.getDigitalObjId() == null || "".equals(trckProcInfo.getDigitalObjId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO DigitalObjId Empty ========= ");
		}

		if (trckProcInfo.getDigitalControlId() == null || "".equals(trckProcInfo.getDigitalControlId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO DigitalControlId Empty ========= ");
		}


		return true;
	}
	
	
	public boolean valideteDefalutTrackingSequence2(TrackingSequencesVO trckProcInfo) throws Exception {

		if (trckProcInfo == null) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO is Null ========= ");
		}

		if (trckProcInfo.getFederatedTwinId() == null || "".equals(trckProcInfo.getFederatedTwinId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO FederatedTwinId Empty ========= ");
		}

		if (trckProcInfo.getFederatedDigitalObjectId() == null
				|| "".equals(trckProcInfo.getFederatedDigitalObjectId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO FederatedDigitalObjectId Empty ========= ");
		}

		if (trckProcInfo.getDigitalTwinId() == null || "".equals(trckProcInfo.getDigitalTwinId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO DigitalTwinId Empty ========= ");
		}

		if (trckProcInfo.getDigitalObjId() == null || "".equals(trckProcInfo.getDigitalObjId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO DigitalObjId Empty ========= ");
		}

		if (trckProcInfo.getDigitalControlId() == null || "".equals(trckProcInfo.getDigitalControlId())) {
			throw new Exception(
					"========= valideteRegtrckProcInfoFdtObjData Exception trckProcInfosVO DigitalControlId Empty ========= ");
		}


		return true;
	}

	public TrackingCommandVO valideteTrackingCommands(TrackingCommandVO trackingCommand) throws Exception {
		valideteDefalutTrackingCmd(trackingCommand);
		
		if (trackingCommand.getTrckProcInfo() == null || trackingCommand.getTrckProcInfo().length < 1) {
			throw new Exception(
					"========= validetetrackingCommands trackingCommandVO In trckProcInfos Exception is Null Or Empty ========= ");
		}
		

		for (TrackingSequencesVO trckProcInfo : trackingCommand.getTrckProcInfo()) {
			
			if(trckProcInfo.getTrckTp() == null || "".equals(trckProcInfo.getTrckTp()) ) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In TrckTp Exception is Null Or Empty ========= ");
			}else {
				if (!"DTP".equals(trckProcInfo.getTrckTp())
						&& !"ETP".equals(trckProcInfo.getTrckTp())) {
					throw new Exception(
							"========= validetetrackingCommands trckProcInfosVO Exception TrckTp Don't Use Type ========= "
									+ trckProcInfo.getTrckTp());
				}
			}
			
			if(trckProcInfo.getTrckPrcIdtifier() == null || "".equals(trckProcInfo.getTrckPrcIdtifier()) ) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In TrckPrcIdtifier Exception is Null Or Empty ========= ");
			}
			
			if(trckProcInfo.getEvntDelay() == 0) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In EvntDelay Exception is 0 Or Empty ========= ");
			}
			
			if(trckProcInfo.getEvntCondition() == null || "".equals(trckProcInfo.getEvntCondition()) ) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In EvntCondition Exception is Null Or Empty ========= ");
			}
			
			
			if(trckProcInfo.getEvntOccrCnt() == 0  || trckProcInfo.getEvntOccrCnt() == -1) {
				trckProcInfo.setEvntOccrCnt(100);
			}
				
			
			if(trckProcInfo.getEvntEndDt() != null || !"".equals(trckProcInfo.getEvntEndDt()) ) {
				
				JSONObject evntEndDt = new JSONObject();
				JSONParser jsonParser = new JSONParser();
				
				evntEndDt = (JSONObject) jsonParser.parse(trckProcInfo.getEvntEndDt());
				
				if(evntEndDt.get("INTERVAL") == null || "".equals(evntEndDt.get("INTERVAL")) ) {
					evntEndDt.put("INTERVAL", "HOUR");
				}else {
					if(!"SECOND".equals(evntEndDt.get("INTERVAL")) &&
					   !"HOUR".equals(evntEndDt.get("INTERVAL")) &&
						!"DAY".equals(evntEndDt.get("INTERVAL"))) {
						throw new Exception(
								"========= validetetrackingCommands trckProcInfosVO Exception evntEndDt Don't Use Type ========= "
										+ evntEndDt.get("INTERVAL"));
					}
				}
				
				if(evntEndDt.get("VALUE") == null || "".equals(evntEndDt.get("VALUE")) ) {
					evntEndDt.put("VALUE", 1);
				}else {
					if(evntEndDt.get("VALUE").getClass().getName().equals("java.lang.Double")
					   || evntEndDt.get("VALUE").getClass().getName().equals("java.lang.String")) {
						throw new Exception(
								"========= valideteTrackingCommands TrackingCommandVO In EvntEndDt VALUE Exception is not a Integer ");
					}
				}
				
				
			}else {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In evntEndDt Exception is Null Or Empty ========= ");
			}
			
				if("DTP".equals(trckProcInfo.getTrckTp())) {
					
					if(trckProcInfo.getFederatedTwinId() == null || "".equals(trckProcInfo.getFederatedTwinId())) {
						throw new Exception(
								"========= valideteTrackingCommands TrackingCommandVO In FederatedTwinId Exception is Null Or Empty ========= ");
					}
					
					if(trckProcInfo.getFederatedDigitalObjectId() == null || "".equals(trckProcInfo.getFederatedDigitalObjectId())) {
						throw new Exception(
								"========= valideteTrackingCommands TrackingCommandVO In federatedDigitalObjectId Exception is Null Or Empty ========= ");
					}
					
					if(trckProcInfo.getDigitalTwinId() == null || "".equals(trckProcInfo.getDigitalTwinId())) {
						throw new Exception(
								"========= valideteTrackingCommands TrackingCommandVO In DigitalTwinId Exception is Null Or Empty ========= ");
					}
					
					if(trckProcInfo.getDigitalObjId() == null || "".equals(trckProcInfo.getDigitalObjId())) {
						throw new Exception(
								"========= validetetrackingCommands TrackingCommandVO In DigitalObjId Exception is Null Or Empty ========= ");
					}
					
					if(trckProcInfo.getTrckTopic() == null || "".equals(trckProcInfo.getTrckTopic())) {
						throw new Exception(
								"========= validetetrackingCommands TrackingCommandVO In TrckTopic Exception is Null Or Empty ========= ");
					}
					
					if(trckProcInfo.getBufferSize() == 0) {
						throw new Exception(
								"========= validetetrackingCommands TrackingCommandVO In TrckTopic Exception is Null Or Empty ========= ");
					}
					
					if(trckProcInfo.getDtFltTp() == null || "".equals(trckProcInfo.getDtFltTp())) {
						throw new Exception(
								"========= validetetrackingCommands TrackingCommandVO In DtFltTp Exception is Null Or Empty ========= ");
					}
					
					if (!"DF01".equals(trckProcInfo.getDtFltTp())
							&& !"DF02".equals(trckProcInfo.getDtFltTp())
							&& !"DF03".equals(trckProcInfo.getDtFltTp())
							&& !"DF04".equals(trckProcInfo.getDtFltTp())
							&& !"DF05".equals(trckProcInfo.getDtFltTp())
							) {
						throw new Exception(
								"========= validetetrackingCommands trckProcInfosVO Exception DtFltTp Don't Use Type ========= "
										+ trckProcInfo.getDtFltTp());
					}
				}
				
				if("ETP".equals(trckProcInfo.getTrckTp())) {
					HashMap<String, Object> map = evntConditionValidator(trckProcInfo.getEvntCondition());
					System.out.println("map >>>>>>>>>>>>>>>>>>>>>>>>>" + map);
				}
			}


		return trackingCommand;
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
	
	
	
}
