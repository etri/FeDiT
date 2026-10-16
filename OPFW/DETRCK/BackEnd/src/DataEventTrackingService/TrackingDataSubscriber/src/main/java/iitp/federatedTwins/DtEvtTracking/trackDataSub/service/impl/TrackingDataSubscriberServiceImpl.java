package iitp.federatedTwins.DtEvtTracking.trackDataSub.service.impl;

import java.util.HashMap;
import java.util.List;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventOccuredInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingDectorProcInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingResponseRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTaskProcessingInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTopicMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.mapper.TrackingTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Service
public class TrackingDataSubscriberServiceImpl implements TrackingDataSubscriberService {

	private final Logger logger = LoggerFactory.getLogger(TrackingDataSubscriberService.class);

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@Autowired
	public TrackingResponseRecordMapper trackingResponseRecordMapper;

	@Autowired
	public TrackingTaskProcessingInfoMapper trackingTaskProcessingInfoMapper;

	@Autowired
	public TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	public DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	public TrackingProcessStatusChangeRecordMapper trackingSequenceStatusChangeRecordMapper;

	@Autowired
	private TrackingDectorProcInfoMapper trackingDectorProcInfoMapper;

	@Autowired
	private TrackingTaskInfoMapper trackingTaskInfoMapper;

	@Autowired
	private EventOccuredInfoMapper eventOccuredInfoMapper;

	@Autowired
	private TrackingTopicMapper trackingTopicMapper;

	@Autowired
	private TrackingStatusChangeRecordMapper trackingStatusChangeRecordMapper;

	@Transactional(readOnly = true)
	public TrackingProcessInfo getTrackingProcessInfo(HashMap<String, Object> param) throws Exception {
		return loadWithDetectWindow(param);
	}

	@Transactional(readOnly = true)
	public TrackingProcessInfo getDataTrackingDelayProcessInfo(HashMap<String, Object> param) throws Exception {
		return loadWithDetectWindow(param);
	}

	private TrackingProcessInfo loadWithDetectWindow(HashMap<String, Object> param) throws Exception {
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("requestTrackingId", param.get("requestTrackingId"));
		map.put("trackingProcessId", param.get("trackingProcessId"));

		TrackingProcessInfo trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		if (trackingProcessInfo == null) {
			return null;
		}

		if (trackingProcessInfo.getEventOccurredCount() > 0) {
			int eCnt = eventOccuredInfoMapper.getEventOccuredCnt(map);

			if (eCnt > 0) {
				trackingProcessInfo.setEventTotalCnt(eCnt);
			}
		}

		map.clear();
		map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
		map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
		map.put("orderByDesc", "orderByDesc");
		map.put("limitOne", "limitOne");
		TrackingDetectorProcInfo detectInfo = trackingDectorProcInfoMapper.getTrackingDectorProcInfo(map);

		int startProcId;
		if (detectInfo != null) {
			startProcId = detectInfo.getDetectRecordEndId() + 1;
		} else {
			map.clear();
			map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
			map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
			map.put("limitBufferSize", 1);

			List<TrackingResponseRecord> responseInfoList = trackingResponseRecordMapper.getResponseRecord(map);

			if (responseInfoList != null && responseInfoList.size() > 0) {
				startProcId = responseInfoList.get(0).getTrackingResponseId();
			} else {
				map.clear();
				map.put("orderByDesc", "orderByDesc");
				map.put("limitBufferSize", 1);
				List<TrackingResponseRecord> responseMaxRecordInfo = trackingResponseRecordMapper
						.getResponseRecord(map);

				startProcId = responseMaxRecordInfo != null && responseMaxRecordInfo.size() > 0
						? responseMaxRecordInfo.get(0).getTrackingResponseId()
						: 0;
			}
		}

		map.clear();
		map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
		map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
		map.put("startProcId", startProcId);

		int cnt = trackingResponseRecordMapper.getResponseRecordCnt(map);

		int endProcId = startProcId - 1;
		if (cnt > 0) {
			map.put("limitBufferSize", cnt);
			TrackingResponseRecord last = trackingResponseRecordMapper.getResponseRecordMaxIdInfo(map);
			if (last != null) {
				endProcId = last.getTrackingResponseId();

				int bufferSize = trackingProcessInfo.getBufferSize();
				if (bufferSize > 0 && cnt > bufferSize) {
					map.put("limitBufferSize", cnt - bufferSize + 1);
					TrackingResponseRecord first = trackingResponseRecordMapper.getResponseRecordMaxIdInfo(map);
					if (first != null) {
						logger.info("bufferSize 초과로 최근 {}건만 집계, 오래된 {}건 제외. req={} pro={}", bufferSize,
								cnt - bufferSize, trackingProcessInfo.getRequestTrackingId(),
								trackingProcessInfo.getTrackingProcessId());
						startProcId = first.getTrackingResponseId();
					}
				}
			}
		}

		trackingProcessInfo.setDetectRecordStartId(startProcId);
		trackingProcessInfo.setDetectRecordEndId(endProcId);

		return trackingProcessInfo;
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int deleteTopic(HashMap<String, Object> map) throws Exception {
		logger.info("deleteTopic : {}" ,  map.toString());
		return trackingTopicMapper.deleteTopic(map);
	}

	@Transactional
	public int updateTaskProcessing(TrackingTaskProcessingInfo msa) throws Exception {
		return trackingTaskProcessingInfoMapper.updateTaskProcessing(msa);
	}

	@Transactional
	public int insertResponseRecordList(List<TrackingResponseRecord> rd) throws Exception {
		return trackingResponseRecordMapper.insertResponseRecordList(rd);
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateWithHisAndTrackingProcInfo(HashMap<String, Object> map) throws Exception {
		int proCnt = this.trackingProcessInfoMapper.updateTrackingProcessByParam(map);

		if (proCnt > 0) {
			this.trackingTaskInfoMapper.insertTrackingProcChangeHisMultiList(map);
			if (map.get("trackingStatus").equals(Constant.TRCK_PROC_STATUS_COMPLETE)
					|| map.get("trackingStatus").equals(Constant.TRCK_PROC_STATUS_ERROR)) {
				HashMap<String, Object> paramId = new HashMap<>();
				HashMap<String, Object> paramStatus = new HashMap<>();

				paramId.put("requestTrackingId", map.get("requestTrackingId"));
				paramStatus.put("requestTrackingId", map.get("requestTrackingId"));
				paramStatus.put("trackingStatus", map.get("trackingStatus"));

				List<TrackingProcessInfo> prcList = trackingProcessInfoMapper.getTrackingProcessList(paramId);
				List<TrackingProcessInfo> statusList = trackingProcessInfoMapper.getTrackingProcessList(paramStatus);

				if (prcList.size() == statusList.size()) {
					this.updateWithHisAndTrackingReqInfo(map);
				}
			}
		}

		return proCnt;
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateWithHisAndTrackingReqInfo(HashMap<String, Object> map) throws Exception {

		DataEventTrackingRequestInfo dataEventTrackingRequestInfo = new DataEventTrackingRequestInfo();
		dataEventTrackingRequestInfo
		.setRequestTrackingId(Integer.parseInt(String.valueOf(map.get("requestTrackingId"))));
		dataEventTrackingRequestInfo.setReqTrckCmdStatus(map.get("reqTrckCmdStatus").toString());
		int recCnt = dataEventTrackingRequestInfoMapper.updateDataEventTrackingRequest(dataEventTrackingRequestInfo);

		map.put("changeStatus", map.get("reqTrckCmdStatus").toString());
		TrackingStatusChangeRecord trackStsChangeRecInfo = trackingStatusChangeRecordMapper
				.getTrackingStatusChangeHistoryInfo(map);
		if (recCnt > 0 && trackStsChangeRecInfo == null) {
			TrackingStatusChangeRecord trackingStatusChangeRecord = new TrackingStatusChangeRecord();
			trackingStatusChangeRecord
			.setRequestTrackingId(Integer.parseInt(String.valueOf(map.get("requestTrackingId"))));
			trackingStatusChangeRecord.setChangeStatus(map.get("reqTrckCmdStatus").toString());
			trackingStatusChangeRecord.setStatusResultMsg(map.get("statusResultMsg").toString());
			trackingStatusChangeRecordMapper.insertTrackingStatusChangeHistory(trackingStatusChangeRecord);
		}

		return recCnt;
	}
}
