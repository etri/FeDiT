package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.util.ConditionExpression;
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

		ArrayList<String> idtfStr = new ArrayList<String>();
		for (TrackingProcessVO trckProcInfo : trackingCommand.getTrckProcInfo()) {

			if (trckProcInfo.getTrckTp() == null || "".equals(trckProcInfo.getTrckTp())) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In TrckTp Exception is Null Or Empty ========= ");
			} else {
				if (!Constant.TRCK_CMD_TYPE_DATA.equals(trckProcInfo.getTrckTp())
						&& !"ETP".equals(trckProcInfo.getTrckTp())) {
					throw new Exception(
							"========= validetetrackingCommands trckProcInfosVO Exception TrckTp Don't Use Type ========= "
									+ trckProcInfo.getTrckTp());
				}
			}

			if (trckProcInfo.getTrckPrcIdtifier() == null || "".equals(trckProcInfo.getTrckPrcIdtifier())) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In TrckPrcIdtifier Exception is Null Or Empty ========= ");
			} else {
				idtfStr.add(trckProcInfo.getTrckPrcIdtifier());
			}

			if (Constant.RCK_CMD_TYPE_EVENT.equals(trckProcInfo.getTrckTp()) && trckProcInfo.getEvntDelay() <= 0) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In EvntDelay Exception ETP requires EvntDelay > 0 ========= ");
			}

			if (trckProcInfo.getEvntCondition() == null || "".equals(trckProcInfo.getEvntCondition())) {
				throw new Exception(
						"========= valideteTrackingCommands TrackingCommandVO In EvntCondition Exception is Null Or Empty ========= ");
			}

			if ((trckProcInfo.getEvntOccrCnt() <= 0)
					&& (trckProcInfo.getEvntEndDt() == null || "".equals(trckProcInfo.getEvntEndDt()))) {
				trckProcInfo.setEvntOccrCnt(100);

				JSONObject evntEndDt = new JSONObject();
				evntEndDt.put("INTERVAL", Constant.INTERVAL_DATE_HOURS);
				evntEndDt.put("VALUE", 1);

				trckProcInfo.setEvntEndDt(evntEndDt.toJSONString());
			}

			if (trckProcInfo.getEvntEndDt() != null && !"".equals(trckProcInfo.getEvntEndDt())) {

				JSONObject evntEndDt = new JSONObject();
				JSONParser jsonParser = new JSONParser();

				evntEndDt = (JSONObject) jsonParser.parse(trckProcInfo.getEvntEndDt());

				if (!Constant.INTERVAL_DATE_SECONDS.equals(evntEndDt.get("INTERVAL"))
						&& !Constant.INTERVAL_DATE_HOURS.equals(evntEndDt.get("INTERVAL"))
						&& !Constant.INTERVAL_DATE_DAYS.equals(evntEndDt.get("INTERVAL"))
						&& !Constant.INTERVAL_DATE_MINUTES.equals(evntEndDt.get("INTERVAL"))) {
					throw new Exception(
							"========= validetetrackingCommands trckProcInfosVO Exception evntEndDt Don't Use Type ========= "
									+ evntEndDt.get("INTERVAL"));
				}

				if (evntEndDt.get("VALUE").getClass().getName().equals("java.lang.Double")
						|| evntEndDt.get("VALUE").getClass().getName().equals("java.lang.String")) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In EvntEndDt VALUE Exception is not a Integer ");

				}
			}

			if (Constant.TRCK_CMD_TYPE_DATA.equals(trckProcInfo.getTrckTp())) {

				if (trckProcInfo.getFederatedTwinId() == null || "".equals(trckProcInfo.getFederatedTwinId())) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In FederatedTwinId Exception is Null Or Empty ========= ");
				}

				if (trckProcInfo.getFederatedDigitalObjectId() == null
						|| "".equals(trckProcInfo.getFederatedDigitalObjectId())) {
					throw new Exception(
							"========= valideteTrackingCommands TrackingCommandVO In federatedDigitalObjectId Exception is Null Or Empty ========= ");
				}

				if (trckProcInfo.getDigitalObjId() == null || "".equals(trckProcInfo.getDigitalObjId())) {
					throw new Exception(
							"========= validetetrackingCommands TrackingCommandVO In DigitalObjId Exception is Null Or Empty ========= ");
				}

				if (trckProcInfo.getTrckTopic() == null || "".equals(trckProcInfo.getTrckTopic())) {
					trckProcInfo.setTrckTopic(trckProcInfo.getFederatedTwinId());
				}

				if (trckProcInfo.getBufferSize() == 0) {
					throw new Exception(
							"========= validetetrackingCommands TrackingCommandVO In BufferSize Exception is 0 ========= ");
				}

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

			if (Constant.RCK_CMD_TYPE_EVENT.equals(trckProcInfo.getTrckTp())) {
				HashMap<String, Object> map = evntConditionValidator(trckProcInfo.getEvntCondition());
			}
		}

		idtfStr = (ArrayList<String>) idtfStr.stream().distinct().collect(Collectors.toList());
		if (idtfStr.size() != trackingCommand.getTrckProcInfo().length) {
			throw new Exception(
					"========= valideteTrackingCommands TrackingCommandVO In TrckPrcIdtifier Duplication Exception ========= ");
		} else {
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

	public HashMap<String, Object> evntConditionValidator(String evntCondition) throws Exception {

		HashMap<String, Object> resultData = new HashMap<>();
		String ctrlStatement = "";

		JSONParser jsonParser = new JSONParser();
		JSONObject jsonObject = new JSONObject();
		JSONObject expression = new JSONObject();
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
														try {
															ConditionExpression.validate(ctrlStatement);
														} catch (IllegalArgumentException e) {
															throw new Exception("========= ctrlStatement invalid : " + e.getMessage() + " =========");
														}
														resultData.put("data", ctrlStatement);														

													} else {
														throw new Exception(
																"========= ctrlStatement is Empty ========= ");
													}

												} else {
													throw new Exception("========= ctrlStatement is Null ========= ");
												}

											} else {
												throw new Exception("========= type is not supported (CP only) ========= ");
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
