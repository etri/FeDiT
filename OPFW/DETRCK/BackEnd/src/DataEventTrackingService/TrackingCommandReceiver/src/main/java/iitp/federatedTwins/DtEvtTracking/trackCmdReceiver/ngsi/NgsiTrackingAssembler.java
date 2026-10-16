package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.ngsi;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.util.ConditionExpression;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.ngsi.NgsiTrackingRequestVO.NgsiProcessVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingProcessVO;

@Component
public class NgsiTrackingAssembler {

	private static final Logger logger = LoggerFactory.getLogger(NgsiTrackingAssembler.class);

	private static final int MIN_RECOMMENDED_EVENT_DELAY_MS = 600000;

	private static final Pattern REF_PATTERN = Pattern.compile("#\\{([^}]*)\\}");

	private final NdxproClient ndxpro;

	public NgsiTrackingAssembler(NdxproClient ndxpro) {
		this.ndxpro = ndxpro;
	}

	public static class Assembled {
		public TrackingCommandVO command;
		public List<Map<String, Object>> processes = new ArrayList<>();
	}

	public Assembled assemble(NgsiTrackingRequestVO request) throws Exception {
		if (request.getProcesses() == null || request.getProcesses().length == 0) {
			throw new IllegalArgumentException("400 processes is empty");
		}

		List<String> contexts = ndxpro.getContexts();
		Assembled out = new Assembled();

		TrackingCommandVO command = new TrackingCommandVO();

		if (isBlank(request.getReqIdentifier())) {
			throw new IllegalArgumentException("400 reqIdentifier is empty");
		}
		command.setReqIdentifier(request.getReqIdentifier().trim());

		if (isBlank(request.getCallBackURL())) {
			throw new IllegalArgumentException("400 callBackURL is empty");
		}
		command.setCallBackURL(request.getCallBackURL().trim());

		TrackingProcessVO[] procs = new TrackingProcessVO[request.getProcesses().length];

		List<String> procIds = new ArrayList<>();
		for (int i = 0; i < request.getProcesses().length; i++) {
			NgsiProcessVO p = request.getProcesses()[i];
			if (!isBlank(p.getTrackingProcessIdentifier())) {
				procIds.add(p.getTrackingProcessIdentifier());
				continue;
			}
			String type = isBlank(p.getTrackingType()) ? request.getTrackingType() : p.getTrackingType();
			String prefix = Constant.RCK_CMD_TYPE_EVENT.equals(type) ? "ET" : "DT";
			procIds.add(String.format("%s-%02d", prefix, i + 1));
		}

		List<String> procUuids = new ArrayList<>();
		Map<String, String> idToUuid = new LinkedHashMap<>();
		for (int i = 0; i < procIds.size(); i++) {
			String uuid = UUID.randomUUID().toString();
			procUuids.add(uuid);
			idToUuid.put(procIds.get(i), uuid);
		}

		for (int i = 0; i < request.getProcesses().length; i++) {
			NgsiProcessVO p = request.getProcesses()[i];
			List<String> warnings = new ArrayList<>();

			String procType = isBlank(p.getTrackingType())
					? request.getTrackingType()
					: p.getTrackingType();

			if (!Constant.TRCK_CMD_TYPE_DATA.equals(procType)
					&& !Constant.RCK_CMD_TYPE_EVENT.equals(procType)) {
				throw new IllegalArgumentException("400 unknown trackingType: " + procType);
			}

			boolean isEvent = Constant.RCK_CMD_TYPE_EVENT.equals(procType);

			normalizeExecutionParams(p, isEvent, warnings);

			if (isEvent) {
				if (isBlank(p.getControlStatement())) {
					throw new IllegalArgumentException("400 ETP requires controlStatement");
				}
				if (!isBlank(p.getEventConditionType())
						&& !Constant.EVENT_CONDITION_TYPE_CLIENT.equals(p.getEventConditionType())) {
					throw new IllegalArgumentException("400 unsupported eventConditionType: "
							+ p.getEventConditionType() + " (CP only)");
				}
				try {
					ConditionExpression.validate(p.getControlStatement());
				} catch (IllegalArgumentException e) {
					throw new IllegalArgumentException("400 invalid controlStatement: " + e.getMessage());
				}
				procs[i] = toProcessVO(procType, procIds.get(i), procUuids.get(i), p,
						null, null, "", null, idToUuid);

				for (String ref : referencedIds(p.getControlStatement())) {
					if (!procIds.contains(ref)) {
						warnings.add("조건식이 이 요청에 없는 " + ref + " 을(를) 참조합니다. "
								+ "사용 가능한 식별자: " + String.join(", ", procIds));
					}
				}

				Map<String, Object> evt = new LinkedHashMap<>();
				evt.put("trackingProcessIdentifier", procIds.get(i));
				evt.put("trackingProcessUuid", procs[i].getTrckPrcIdtifier());
				evt.put("trackingType", procType);
				evt.put("warnings", warnings);
				out.processes.add(evt);
				continue;
			}

			verify(p, contexts);

			JSONObject entity = ndxpro.getEntity(p.getEntityId(), p.getContextUrl());
			if (entity == null) {
				throw new IllegalArgumentException("400 entity not reachable: " + p.getEntityId());
			}
			if (NdxproClient.extractValue(entity, p.getValueExtract()) == null) {
				throw new IllegalArgumentException("400 path not found: " + p.getValueExtract());
			}
			if (NdxproClient.observedAtOf(entity, p.getValueExtract()) == null) {
				throw new IllegalArgumentException("400 no observedAt: " + p.getTimeproperty());
			}

			String twinId = valueOf(entity, "federatedDigitalTwinId");
			String fdoId = valueOf(entity, "federatedDigitalObjectId");
			if (twinId == null) {
				warnings.add("연합 트윈 식별자가 없는 엔티티입니다.");
			}

			String trackTopic;
			if (fdoId != null) {
				trackTopic = "FDO_" + fdoId;
			} else {
				String[] seg = p.getEntityId().split(":");
				trackTopic = "ENT_" + seg[seg.length - 1];
				warnings.add("연합 식별자가 없어 Track Topic 을 entityId 기반으로 생성했습니다.");
			}

			JSONObject schema = ndxpro.getDataModel(p.getType());
			String valueType = schemaValueType(schema, p.getValueExtract());
			String valueTypeSource = "schema";
			if (valueType == null) {
				valueType = inferType(NdxproClient.extractValue(entity, p.getValueExtract()));
				valueTypeSource = "inferred";
			}

			if (p.getEventDelay() != null && p.getEventDelay() > 0
					&& p.getEventDelay() < MIN_RECOMMENDED_EVENT_DELAY_MS) {
				warnings.add("이벤트 딜레이가 " + (p.getEventDelay() / 1000)
						+ "초입니다. 관측 주기보다 짧으면 값 없는 집계가 반복됩니다.");
			}

			String procId = procIds.get(i);

			for (String ref : referencedIds(p.getControlStatement())) {
				if (!procIds.contains(ref)) {
					warnings.add("조건식이 이 요청에 없는 " + ref + " 을(를) 참조합니다. "
							+ "사용 가능한 식별자: " + String.join(", ", procIds));
				}
			}

			String procUuid = procUuids.get(i);

			procs[i] = toProcessVO(procType, procId, procUuid, p, twinId, fdoId,
					trackTopic, valueType, idToUuid);

			Map<String, Object> confirmed = new LinkedHashMap<>();
			confirmed.put("trackingProcessIdentifier", procId);
			confirmed.put("trackingProcessUuid", procUuid);
			confirmed.put("trackingType", procType);
			confirmed.put("trackTopic", trackTopic);
			confirmed.put("objectValueType", valueType);
			confirmed.put("objectValueTypeSource", valueTypeSource);
			confirmed.put("federatedTwinId", twinId);
			confirmed.put("federatedDigitalObjectId", fdoId);
			confirmed.put("warnings", warnings);
			out.processes.add(confirmed);
		}

		command.setTrckProcInfo(procs);
		out.command = command;
		return out;
	}

	private void verify(NgsiProcessVO p, List<String> contexts) {
		if (isBlank(p.getContextUrl()) || isBlank(p.getEntityId()) || isBlank(p.getType())
				|| isBlank(p.getTimeproperty()) || isBlank(p.getValueExtract())) {
			throw new IllegalArgumentException("400 incomplete tuple");
		}

		String[] seg = p.getEntityId().split(":");
		if (seg.length < 3 || !seg[2].equals(p.getType())) {
			throw new IllegalArgumentException("400 type mismatch");
		}

		String head = p.getValueExtract().split("\\.\\.")[0];
		if (!(head + ".observedAt").equals(p.getTimeproperty())) {
			throw new IllegalArgumentException("400 timeproperty mismatch");
		}

		if (contexts != null && !contexts.contains(p.getContextUrl())) {
			throw new IllegalArgumentException("400 unknown context");
		}
	}

	private TrackingProcessVO toProcessVO(String trackingType, String procId, String procUuid,
			NgsiProcessVO p, String twinId, String fdoId, String trackTopic, String valueType) {
		return toProcessVO(trackingType, procId, procUuid, p, twinId, fdoId, trackTopic, valueType, null);
	}

	private TrackingProcessVO toProcessVO(String trackingType, String procId, String procUuid,
			NgsiProcessVO p, String twinId, String fdoId, String trackTopic, String valueType,
			Map<String, String> idToUuid) {

		TrackingProcessVO vo = new TrackingProcessVO();
		vo.setTrckTp(trackingType);
		vo.setTrckPrcIdtifierBF(procId);
		vo.setTrckPrcIdtifier(procUuid);
		vo.setFederatedTwinId(twinId == null ? "" : twinId);
		vo.setFederatedDigitalObjectId(fdoId == null ? "" : fdoId);
		vo.setDigitalObjId(fdoId == null ? "" : fdoId);
		vo.setTrckTopic(trackTopic);

		JSONObject valInfo = new JSONObject();
		valInfo.put("digitalObjectPath", p.getValueExtract());
		valInfo.put("objValType", valueType);
		vo.setTrckValInfo(valInfo.toJSONString());

		vo.setContextUrl(p.getContextUrl());
		vo.setEntityId(p.getEntityId());
		vo.setNgsiType(p.getType());
		vo.setTimeproperty(p.getTimeproperty());

		if (!isBlank(p.getEntityId())) {
			vo.setDataLinkType(Constant.DATA_LINK_TYPE_NGSILD);
		}

		vo.setEvntDelay(p.getEventDelay() == null ? 0 : p.getEventDelay());
		int bufferSize = p.getBufferSize() == null ? 0 : p.getBufferSize();
		vo.setBufferSize(bufferSize > 0 ? bufferSize : 1);
		vo.setDtFltTp(p.getDataFilterType());

		JSONObject cond = new JSONObject();
		cond.put("checkable", Boolean.TRUE.equals(p.getEventConditionCheckable()));

		if (Constant.RCK_CMD_TYPE_EVENT.equals(trackingType)) {
			JSONObject expression = new JSONObject();
			expression.put("ctrlStatement", substituteUuid(p.getControlStatement(), idToUuid));
			cond.put("expression", expression);
			cond.put("type", Constant.EVENT_CONDITION_TYPE_CLIENT);
		} else {
			cond.put("ctrlStatement", substituteUuid(p.getControlStatement(), idToUuid));
			cond.put("conditionType", p.getEventConditionType());
		}
		vo.setEvntCondition(cond.toJSONString());

		vo.setEvntOccrCnt(p.getEventOccurCount() == null ? 0 : p.getEventOccurCount());
		vo.setEvntEndDt(p.getEventEndDate() == null ? "" : p.getEventEndDate());
		return vo;
	}

	@SuppressWarnings("unchecked")
	private String valueOf(JSONObject entity, String key) {
		Object node = entity.get(key);
		if (!(node instanceof Map)) {
			return null;
		}
		Object value = ((Map<String, Object>) node).get("value");
		return value == null ? null : value.toString();
	}

	@SuppressWarnings("unchecked")
	private String schemaValueType(JSONObject schema, String valueExtract) {
		if (schema == null) {
			return null;
		}
		Object attrs = schema.get("attributes");
		if (!(attrs instanceof Map)) {
			return null;
		}
		Object attr = ((Map<String, Object>) attrs).get(valueExtract.split("\\.\\.")[0]);
		if (!(attr instanceof Map)) {
			return null;
		}
		Object valueType = ((Map<String, Object>) attr).get("valueType");
		if (valueType == null || "Object".equals(valueType.toString())) {
			return null;
		}
		return valueType.toString();
	}

	private String inferType(Object value) {
		if (value instanceof Number) {
			return "Double";
		}
		if (value instanceof Boolean) {
			return "Boolean";
		}
		return "String";
	}

	private boolean isBlank(String s) {
		return s == null || s.trim().isEmpty();
	}

	private void normalizeExecutionParams(NgsiProcessVO p, boolean isEvent, List<String> warnings) {
		Integer delay = p.getEventDelay();
		if (isEvent) {
			if (delay == null || delay <= 0) {
				throw new IllegalArgumentException("400 ETP requires eventDelay > 0");
			}
		} else if (delay != null && delay < 0) {
			throw new IllegalArgumentException("400 eventDelay must be >= 0");
		}

		if (!isEvent) {
			String flt = p.getDataFilterType();
			if (!Constant.DATA_FILLTER_TYPE_MIN.equals(flt)
					&& !Constant.DATA_FILLTER_TYPE_MAX.equals(flt)
					&& !Constant.DATA_FILLTER_TYPE_AVER.equals(flt)
					&& !Constant.DATA_FILLTER_TYPE_SUM.equals(flt)
					&& !Constant.DATA_FILLTER_TYPE_STDEVP.equals(flt)) {
				throw new IllegalArgumentException("400 invalid dataFilterType: " + flt);
			}
		}

		String endDate = p.getEventEndDate();
		if (!isBlank(endDate)) {
			JSONObject end;
			try {
				end = (JSONObject) new JSONParser().parse(endDate);
			} catch (Exception e) {
				throw new IllegalArgumentException("400 invalid eventEndDate: " + endDate);
			}
			Object interval = end.get("INTERVAL");
			if (!Constant.INTERVAL_DATE_SECONDS.equals(interval)
					&& !Constant.INTERVAL_DATE_MINUTES.equals(interval)
					&& !Constant.INTERVAL_DATE_HOURS.equals(interval)
					&& !Constant.INTERVAL_DATE_DAYS.equals(interval)) {
				throw new IllegalArgumentException("400 invalid eventEndDate INTERVAL: " + interval);
			}
			Object value = end.get("VALUE");
			if (!(value instanceof Long) || (Long) value <= 0) {
				throw new IllegalArgumentException("400 eventEndDate VALUE must be a positive integer: " + value);
			}
		}

		Integer occur = p.getEventOccurCount();
		if ((occur == null || occur <= 0) && isBlank(endDate)) {
			p.setEventOccurCount(100);

			JSONObject defaultEnd = new JSONObject();
			defaultEnd.put("INTERVAL", Constant.INTERVAL_DATE_HOURS);
			defaultEnd.put("VALUE", 1);
			p.setEventEndDate(defaultEnd.toJSONString());

			warnings.add("발생수량과 종료시간이 없어 기본 종료 조건(100건, 1시간)을 적용했습니다.");
		}
	}

	private List<String> referencedIds(String controlStatement) {
		List<String> out = new ArrayList<>();
		if (isBlank(controlStatement)) {
			return out;
		}
		Matcher m = REF_PATTERN.matcher(controlStatement);
		while (m.find()) {
			String ref = m.group(1).trim();
			if (!ref.isEmpty() && !out.contains(ref)) {
				out.add(ref);
			}
		}
		return out;
	}

	private String substituteUuid(String controlStatement, Map<String, String> idToUuid) {
		if (isBlank(controlStatement) || idToUuid == null) {
			return controlStatement;
		}
		String out = controlStatement;
		for (Map.Entry<String, String> e : idToUuid.entrySet()) {
			out = out.replace("#{" + e.getKey() + "}", "#{" + e.getValue() + "}");
		}
		return out;
	}
}
