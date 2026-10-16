package iitp.federatedTwins.DtEvtTracking.trackDataSub.ngsi;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.locks.ReentrantLock;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingResponseRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Component
public class NgsiLdCollector {

	private final Logger logger = LoggerFactory.getLogger(NgsiLdCollector.class);

	private static final long DEFAULT_MAX_LOOKBACK_MS = 86400000L;

	public static final long DEFAULT_COLLECT_INTERVAL_MS = 60000L;

	private static final int MIN_PAGE_LIMIT = 50;

	private static final int MAX_PAGE_LIMIT = 2000;

	private static final DateTimeFormatter KST = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

	@Value("${ngsi.min-collect-gap-ms:10000}")
	private long minCollectGapMs;

	@Value("${ngsi.max-refs-per-collect:200}")
	private int maxRefsPerCollect;

	@Autowired
	@Qualifier("ngsiDetailFetchExecutor")
	private ExecutorService detailFetchExecutor;

	@Autowired
	private NdxproClient ndxpro;

	@Autowired
	private TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	private TrackingResponseRecordMapper trackingResponseRecordMapper;

	@Autowired
	private TrackingDataSubscriberService trackingDataSubscriberService;

	private final ConcurrentHashMap<String, ReentrantLock> entityLocks = new ConcurrentHashMap<>();

	private final ConcurrentHashMap<String, Long> lastCollectedAt = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Set<Integer>> lastCollectedProcs = new ConcurrentHashMap<>();

	private final ConcurrentHashMap<String, Outcome> lastOutcome = new ConcurrentHashMap<>();

	public enum Outcome {
		COLLECTED,
		NO_NEW_DATA,
		FAILED
	}

	public Outcome collect(String entityId) {
		if (isBlank(entityId)) {
			return Outcome.NO_NEW_DATA;
		}

		ReentrantLock lock = entityLocks.computeIfAbsent(entityId, k -> new ReentrantLock());
		if (!lock.tryLock()) {
			return lastOutcome.getOrDefault(entityId, Outcome.NO_NEW_DATA);
		}
		try {
			List<TrackingProcessInfo> procs = pollingTargets(entityId);
			if (procs == null || procs.isEmpty()) {
				return Outcome.NO_NEW_DATA;
			}

			Set<Integer> ids = new HashSet<>();
			for (TrackingProcessInfo p : procs) {
				ids.add(p.getTrackingProcessId());
			}
			Long last = lastCollectedAt.get(entityId);
			Set<Integer> lastProcs = lastCollectedProcs.get(entityId);
			if (last != null && System.currentTimeMillis() - last < minCollectGapMs
					&& lastProcs != null && lastProcs.containsAll(ids)) {
				return lastOutcome.getOrDefault(entityId, Outcome.NO_NEW_DATA);
			}

			lastCollectedAt.put(entityId, System.currentTimeMillis());
			lastCollectedProcs.put(entityId, ids);

			Outcome outcome = collectOnce(entityId, procs);
			lastOutcome.put(entityId, outcome);
			return outcome;
		} catch (Exception e) {
			logger.error("NGSI-LD collect failed. entityId={}", entityId, e);
			lastOutcome.put(entityId, Outcome.FAILED);
			return Outcome.FAILED;
		} finally {
			lock.unlock();
		}
	}

	private Outcome collectOnce(String entityId, List<TrackingProcessInfo> procs) throws Exception {
		TrackingProcessInfo head = procs.get(0);

		LocalDateTime from = windowStart(procs);
		LocalDateTime to = LocalDateTime.now();

		List<Map<String, Object>> refs = historyRefs(entityId, head, KST.format(from), KST.format(to),
				pageLimit(procs));
		if (refs.isEmpty()) {
			return Outcome.NO_NEW_DATA;
		}

		if (refs.size() > maxRefsPerCollect) {
			logger.info("NGSI-LD carry over. entityId={} total={} thisTime={}", entityId, refs.size(),
					maxRefsPerCollect);
			refs = refs.subList(0, maxRefsPerCollect);
		}

		List<Future<JSONObject>> bodies = new ArrayList<>(refs.size());
		for (Map<String, Object> ref : refs) {
			String historyId = str(ref.get("historyId"));
			bodies.add(isBlank(historyId) ? null
					: detailFetchExecutor.submit(() -> ndxpro.historyEntity(historyId, head.getTimeproperty())));
		}

		List<TrackingResponseRecord> records = new ArrayList<>();
		Map<Integer, String> movedWatermark = new HashMap<>();

		Map<Integer, Set<String>> stored = storedKeys(procs, KST.format(from));

		boolean fetchFailed = false;
		for (int i = 0; i < refs.size(); i++) {
			Map<String, Object> ref = refs.get(i);
			if (bodies.get(i) == null) {
				continue;
			}

			JSONObject entity = bodies.get(i).get();
			if (entity == null) {
				logger.warn("NGSI-LD history fetch failed. stop here and retry next time. entityId={} historyId={}",
						entityId, ref.get("historyId"));
				for (int j = i + 1; j < bodies.size(); j++) {
					if (bodies.get(j) != null) {
						bodies.get(j).cancel(true);
					}
				}
				fetchFailed = true;
				break;
			}

			for (TrackingProcessInfo p : procs) {
				String path = valueExtractOf(p.getTrackingValueInfo(), entityId);
				if (isBlank(path)) {
					continue;
				}

				String ts = NdxproClient.observedAtOf(entity, path);
				if (isBlank(ts)) {
					ts = str(ref.get("observedAt"));
				}
				if (isBlank(ts)) {
					continue;
				}

				String mark = movedWatermark.containsKey(p.getTrackingProcessId())
						? movedWatermark.get(p.getTrackingProcessId())
						: p.getLastObservedAt();
				if (isBlank(mark)) {
					if (ts.compareTo(KST.format(requestStart(p))) < 0) {
						continue;
					}
				} else if (ts.compareTo(mark) <= 0) {
					continue;
				}

				Object value = NdxproClient.extractValue(entity, path);
				if (value == null) {
					continue;
				}

				String key = ts + "|" + value;
				Set<String> seen = stored.get(p.getTrackingProcessId());
				if (seen != null && seen.contains(key)) {
					movedWatermark.put(p.getTrackingProcessId(), ts);
					continue;
				}
				if (seen != null) {
					seen.add(key);
				}

				records.add(toRecord(p, value, ts, entity));
				movedWatermark.put(p.getTrackingProcessId(), ts);
			}
		}

		if (!records.isEmpty()) {
			trackingDataSubscriberService.insertResponseRecordList(records);
		}

		for (Map.Entry<Integer, String> e : movedWatermark.entrySet()) {
			HashMap<String, Object> wm = new HashMap<>();
			wm.put("trackingProcessId", e.getKey());
			wm.put("requestTrackingId", requestIdOf(procs, e.getKey()));
			wm.put("lastObservedAt", e.getValue());
			trackingProcessInfoMapper.updateLastObservedAt(wm);
		}

		logger.info("NGSI-LD collected {} record(s). entityId={} procs={} refs={}", records.size(), entityId,
				procs.size(), refs.size());

		if (!records.isEmpty()) {
			return Outcome.COLLECTED;
		}
		return fetchFailed ? Outcome.FAILED : Outcome.NO_NEW_DATA;
	}

	private List<Map<String, Object>> historyRefs(String entityId, TrackingProcessInfo head, String from,
			String to, int limit) throws Exception {
		while (true) {
			JSONObject listRes = ndxpro.getHistories(entityId, head.getContextUrl(), head.getNgsiType(),
					head.getTimeproperty(), from, to, limit);
			List<Map<String, Object>> refs = NdxproClient.historyRefs(listRes);
			if (refs.size() < limit) {
				return refs;
			}
			if (limit >= MAX_PAGE_LIMIT) {
				logger.warn("NGSI-LD history list may be truncated. entityId={} limit={} from={}", entityId,
						limit, from);
				return refs;
			}
			limit = Math.min(limit * 2, MAX_PAGE_LIMIT);
		}
	}

	private List<TrackingProcessInfo> pollingTargets(String entityId) throws Exception {
		HashMap<String, Object> param = new HashMap<>();
		param.put("entityId", entityId);
		param.put("trackingProcessType", Constant.TRCK_CMD_TYPE_DATA);
		param.put("dataLinkType", Constant.DATA_LINK_TYPE_NGSILD);
		param.put("trackingStatus", Constant.TRCK_PROC_STATUS_RUNNING);
		return trackingProcessInfoMapper.getNgsiPollingTargets(param);
	}

	private LocalDateTime windowStart(List<TrackingProcessInfo> procs) {
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime floor = now.minusNanos(lookbackMs(procs) * 1_000_000L);

		LocalDateTime start = null;
		for (TrackingProcessInfo p : procs) {
			LocalDateTime w = isBlank(p.getLastObservedAt()) ? requestStart(p)
					: parse(p.getLastObservedAt(), floor);
			if (start == null || w.isBefore(start)) {
				start = w;
			}
		}

		if (start == null) {
			return floor;
		}
		return start.isBefore(floor) ? floor : start;
	}

	private long lookbackMs(List<TrackingProcessInfo> procs) {
		long configured = 0L;
		long interval = 0L;
		for (TrackingProcessInfo p : procs) {
			configured = Math.max(configured, longFromCommand(p.getTrackingCommand(), "maxLookbackMs"));
			interval = Math.max(interval, p.getEventDelay() > 0 ? p.getEventDelay() : DEFAULT_COLLECT_INTERVAL_MS);
		}
		long base = configured > 0 ? configured : DEFAULT_MAX_LOOKBACK_MS;
		return Math.max(base, interval * 2);
	}

	private long longFromCommand(String trackingCommand, String key) {
		if (isBlank(trackingCommand)) {
			return 0L;
		}
		try {
			JSONObject cmd = (JSONObject) new JSONParser().parse(trackingCommand);
			Object v = cmd.get(key);
			return v == null ? 0L : Long.parseLong(String.valueOf(v));
		} catch (Exception e) {
			return 0L;
		}
	}

	private LocalDateTime requestStart(TrackingProcessInfo p) {
		LocalDateTime now = LocalDateTime.now();
		return parse(p.getCreateTime(), parse(p.getTrackingStatusChangeTime(), now));
	}

	private LocalDateTime parse(String v, LocalDateTime fallback) {
		if (isBlank(v)) {
			return fallback;
		}
		String s = v.trim().replace(' ', 'T');
		try {
			if (s.length() == 19) {
				s = s + ".000";
			}
			return LocalDateTime.parse(s.substring(0, Math.min(23, s.length())));
		} catch (Exception e) {
			return fallback;
		}
	}

	private int pageLimit(List<TrackingProcessInfo> procs) {
		int max = MIN_PAGE_LIMIT;
		for (TrackingProcessInfo p : procs) {
			if (p.getBufferSize() > max) {
				max = p.getBufferSize();
			}
		}
		return Math.min(max, MAX_PAGE_LIMIT);
	}

	private int requestIdOf(List<TrackingProcessInfo> procs, int processId) {
		for (TrackingProcessInfo p : procs) {
			if (p.getTrackingProcessId() == processId) {
				return p.getRequestTrackingId();
			}
		}
		return 0;
	}

	@SuppressWarnings("unchecked")
	private TrackingResponseRecord toRecord(TrackingProcessInfo p, Object value, String observedAt,
			JSONObject entity) {

		TrackingResponseRecord rd = new TrackingResponseRecord();
		rd.setRequestTrackingId(p.getRequestTrackingId());
		rd.setTrackingProcessId(p.getTrackingProcessId());
		rd.setReceiveStatus(Constant.TASK_SENDING_STATUS_RES);
		rd.setReceiveVal(String.valueOf(value));

		JSONObject one = new JSONObject();
		one.put("measurement_date", observedAt);
		one.put("secondary_value", value);

		JSONArray arr = new JSONArray();
		arr.add(one);
		rd.setReceiveMsg(arr.toJSONString());

		String raw = entity.toJSONString();
		rd.setReceivePayload(raw.substring(0, Math.min(50, raw.length())));
		return rd;
	}

	private String valueExtractOf(String trckValInfo, String entityId) {
		if (isBlank(trckValInfo)) {
			return null;
		}
		try {
			JSONObject json = (JSONObject) new JSONParser().parse(trckValInfo);
			return str(json.get("digitalObjectPath"));
		} catch (Exception e) {
			logger.warn("trckValInfo parse failed. entityId={}", entityId);
			return null;
		}
	}

	private Map<Integer, Set<String>> storedKeys(List<TrackingProcessInfo> procs, String from) {
		Map<Integer, Set<String>> out = new HashMap<>();
		for (TrackingProcessInfo p : procs) {
			Set<String> keys = new HashSet<>();
			try {
				HashMap<String, Object> param = new HashMap<>();
				param.put("trackingProcessId", p.getTrackingProcessId());
				param.put("fromObservedAt", from);
				List<String> rows = trackingResponseRecordMapper.getStoredObservations(param);
				if (rows != null) {
					keys.addAll(rows);
				}
			} catch (Exception e) {
				logger.warn("stored observation lookup failed. pro={}", p.getTrackingProcessId());
			}
			out.put(p.getTrackingProcessId(), keys);
		}
		return out;
	}

	private static String str(Object o) {
		return o == null ? null : o.toString();
	}

	private static boolean isBlank(String s) {
		return s == null || s.trim().isEmpty();
	}
}
