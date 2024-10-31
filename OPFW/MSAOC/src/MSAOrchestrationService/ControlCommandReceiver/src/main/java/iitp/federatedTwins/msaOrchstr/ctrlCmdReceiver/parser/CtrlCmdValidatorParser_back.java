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
public class CtrlCmdValidatorParser_back {

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

		if (ctrlCondition != null && !ctrlCondition.equals("")) {
			jsonObject = (JSONObject) jsonParser.parse(ctrlCondition);
			if (jsonObject.get("checkable") != null) {
				if (!jsonObject.get("checkable").equals("")) {
					if (Boolean.class.isInstance(jsonObject.get("checkable")) == true) {

						boolean checkable = (boolean) jsonObject.get("checkable");

						if (checkable == true) {
							// type 구분 해제
							jsonObject.put("type", "CP");
							
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

		public void ctrlCommandValidator(String ctrlCommand) throws Exception {
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
	
//		return cmdData; 
	}

}
