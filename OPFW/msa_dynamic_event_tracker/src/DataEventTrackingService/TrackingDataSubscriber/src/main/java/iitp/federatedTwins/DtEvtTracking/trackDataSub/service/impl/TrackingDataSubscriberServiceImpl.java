package iitp.federatedTwins.DtEvtTracking.trackDataSub.service.impl;

import java.util.HashMap;
import java.util.List;

import javax.script.ScriptEngine;

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

	@Autowired(required = false)
	private ScriptEngine scriptEngine;

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
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("requestTrackingId", param.get("requestTrackingId"));
		map.put("trackingProcessId", param.get("trackingProcessId"));

		TrackingProcessInfo trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		int startProcId = 0, endProcId = 0;
		if (trackingProcessInfo != null) {
			if (trackingProcessInfo.getEventOccurredCount() > 0) {
				int eCnt = eventOccuredInfoMapper.getEventOccuredCnt(map);

				if (eCnt > 0) {
					trackingProcessInfo.setEventTotalCnt(eCnt);
				}
			}

			// processID에 해당하는 마지막 TrackingDetectorProcInfo 정보를 가지고 온다.
			map.clear();
			map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
			map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
			map.put("orderByDesc", "orderByDesc");
			map.put("limitOne", "limitOne");
			TrackingDetectorProcInfo detectInfo = trackingDectorProcInfoMapper.getTrackingDectorProcInfo(map);

			// startId 셋팅
			if (detectInfo != null) {
				// 마지막 정보의 실행정보 셋팅
				startProcId = detectInfo.getDetectRecordEndId();				
			} else {
				// 첫번째 레코드 정보 조회
				map.clear();
				map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
				map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
				map.put("limitBufferSize", 1);

				List<TrackingResponseRecord> responseInfoList = trackingResponseRecordMapper.getResponseRecord(map);

				if (responseInfoList != null && responseInfoList.size() > 0) {
					startProcId = responseInfoList.get(0).getTrackingResponseId();
				} else {
					// 정보가 없으면 현재 맨 마지막 번호조회
					map.clear();
					map.put("orderByDesc", "orderByDesc");
					map.put("limitBufferSize", 1);
					List<TrackingResponseRecord> responseMaxRecordInfo = trackingResponseRecordMapper
							.getResponseRecord(map);

					if (responseMaxRecordInfo != null && responseMaxRecordInfo.size() > 0) {
						startProcId = responseMaxRecordInfo.get(0).getTrackingResponseId();
					} else {
						startProcId = 0;
					}
				}
			}

			trackingProcessInfo.setDetectRecordStartId(startProcId);

			// endProcId 셋팅
			map.clear();
			map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
			map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
			map.put("startProcId", startProcId);			

			int cnt = trackingResponseRecordMapper.getResponseRecordCnt(map);

			if (cnt >= trackingProcessInfo.getBufferSize()) {
				map.put("limitBufferSize", trackingProcessInfo.getBufferSize());
			} else {
				map.put("limitBufferSize", cnt);
			} 

			TrackingResponseRecord responseInfo = trackingResponseRecordMapper.getResponseRecordMaxIdInfo(map);

			if (responseInfo != null) {
				trackingProcessInfo.setDetectRecordStartId(startProcId);
				trackingProcessInfo.setDetectRecordEndId(responseInfo.getTrackingResponseId());
			} else {
				// 정보가 없으면 실행시키지 않는다.
				endProcId = startProcId;

				trackingProcessInfo.setDetectRecordEndId(endProcId);
			}
		}

		return trackingProcessInfo;
	}

	@Transactional(readOnly = true)
	public TrackingProcessInfo getDataTrackingDelayProcessInfo(HashMap<String, Object> param) throws Exception {
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("requestTrackingId", param.get("requestTrackingId"));
		map.put("trackingProcessId", param.get("trackingProcessId"));

		TrackingProcessInfo trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		int startProcId = 0, endProcId = 0;
		if (trackingProcessInfo != null) {

			if (trackingProcessInfo.getEventOccurredCount() > 0) {
				int eCnt = eventOccuredInfoMapper.getEventOccuredCnt(map);

				if (eCnt > 0) {
					trackingProcessInfo.setEventTotalCnt(eCnt);
				}
			}

			// processID에 해당하는 마지막 TrackingDetectorProcInfo 정보를 가지고 온다.
			map.clear();
			map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
			map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
			map.put("orderByDesc", "orderByDesc");
			map.put("limitOne", "limitOne");
			TrackingDetectorProcInfo detectInfo = trackingDectorProcInfoMapper.getTrackingDectorProcInfo(map);

			// startId 셋팅
			if (detectInfo != null) {
				// 마지막 정보의 마지막 레코드 정보 셋팅
				startProcId = detectInfo.getDetectRecordEndId();
			} else {
				// 첫번째 레코드 정보 조회
				map.clear();
				map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
				map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());
				map.put("limitBufferSize", 1);

				List<TrackingResponseRecord> responseInfoList = trackingResponseRecordMapper.getResponseRecord(map);

				if (responseInfoList != null && responseInfoList.size() > 0) {
					startProcId = responseInfoList.get(0).getTrackingResponseId();
				} else {
					// 정보가 없으면 현재 맨 마지막 번호조회
					map.clear();
					map.put("orderByDesc", "orderByDesc");
					map.put("limitBufferSize", 1);
					List<TrackingResponseRecord> responseMaxRecordInfo = trackingResponseRecordMapper.getResponseRecord(map);

					if (responseMaxRecordInfo != null && responseMaxRecordInfo.size() > 0) {
						startProcId = responseMaxRecordInfo.get(0).getTrackingResponseId();
					} else {												
						startProcId = 0;
					}
				}
			}

			trackingProcessInfo.setDetectRecordStartId(startProcId);

			// endProcId 셋팅
			map.clear();
			map.put("requestTrackingId", trackingProcessInfo.getRequestTrackingId());
			map.put("trackingProcessId", trackingProcessInfo.getTrackingProcessId());

			// 첫번째 레코드 이후 레코드 데이터 카운트 조회
			map.put("startProcId", startProcId);

			int cnt = trackingResponseRecordMapper.getResponseRecordCnt(map);

			if (cnt >= trackingProcessInfo.getBufferSize()) {
				map.put("limitBufferSize", trackingProcessInfo.getBufferSize());
			} else {
				map.put("limitBufferSize", cnt);
			}

			// 조회해야 할 마지막 레코드 값을 가지고 온다.
			TrackingResponseRecord responseInfo = trackingResponseRecordMapper.getResponseRecordMaxIdInfo(map);

			if (responseInfo != null) {
				endProcId = responseInfo.getTrackingResponseId();
			} else {
				// 정보가 없으면 현재 맨 마지막 번호조회
				map.clear();
				map.put("orderByDesc", "orderByDesc");
				map.put("limitBufferSize", 1);

				List<TrackingResponseRecord> responseMaxRecordInfo = trackingResponseRecordMapper.getResponseRecord(map);

				if (responseMaxRecordInfo != null && responseMaxRecordInfo.size() > 0) {
					endProcId = responseMaxRecordInfo.get(0).getTrackingResponseId();
				} else {
					endProcId = 0;
				}
			}

			trackingProcessInfo.setDetectRecordEndId(endProcId);
		}

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
		// 시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
		int proCnt = this.trackingProcessInfoMapper.updateTrackingProcessByParam(map);

		// 상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
		if (proCnt > 0) {
			// 변경된 시퀀스 정보의 이력을 남기는 쿼리
			this.trackingTaskInfoMapper.insertTrackingProcChangeHisMultiList(map);
			// 최종 결과값 저장
			if (map.get("trackingStatus").equals(Constant.TRCK_PROC_STATUS_COMPLETE) || map.get("trackingStatus").equals(Constant.TRCK_PROC_STATUS_ERROR)) {
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
		dataEventTrackingRequestInfo.setRequestTrackingId(Integer.parseInt(String.valueOf(map.get("requestTrackingId"))));
		dataEventTrackingRequestInfo.setReqTrckCmdStatus(map.get("reqTrckCmdStatus").toString());
		int recCnt = dataEventTrackingRequestInfoMapper.updateDataEventTrackingRequest(dataEventTrackingRequestInfo);

		map.put("changeStatus", map.get("reqTrckCmdStatus").toString());
		TrackingStatusChangeRecord trackStsChangeRecInfo = trackingStatusChangeRecordMapper.getTrackingStatusChangeHistoryInfo(map);
		if (recCnt > 0 && trackStsChangeRecInfo == null) {
			TrackingStatusChangeRecord trackingStatusChangeRecord = new TrackingStatusChangeRecord();
			trackingStatusChangeRecord.setRequestTrackingId(Integer.parseInt(String.valueOf(map.get("requestTrackingId"))));
			trackingStatusChangeRecord.setChangeStatus(map.get("reqTrckCmdStatus").toString());
			trackingStatusChangeRecord.setStatusResultMsg(map.get("statusResultMsg").toString());
			trackingStatusChangeRecordMapper.insertTrackingStatusChangeHistory(trackingStatusChangeRecord);
		}

		return recCnt;
	}
}
