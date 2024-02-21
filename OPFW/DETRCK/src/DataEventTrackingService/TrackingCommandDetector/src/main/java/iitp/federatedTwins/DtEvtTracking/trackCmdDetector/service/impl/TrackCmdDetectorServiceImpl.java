package iitp.federatedTwins.DtEvtTracking.trackCmdDetector.service.impl;

import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;
import iitp.federatedTwins.DtEvtTracking.trackCmdDetector.mapper.TrackCmdDetectorMapper;
import iitp.federatedTwins.DtEvtTracking.trackCmdDetector.service.TrackCmdDetectorService;

@Service
public class TrackCmdDetectorServiceImpl implements TrackCmdDetectorService {

	private final Logger logger = LoggerFactory.getLogger(TrackCmdDetectorService.class);

	@Autowired
	public TrackCmdDetectorMapper trackCmdDetectorMapper;

	@Transactional(readOnly = true)
	public TrackingTaskSendingInfo getTrackCmdDetector(HashMap<String, Object> map) throws Exception {
		return trackCmdDetectorMapper.getTrackCmdDetector(map);
	}

	@Transactional
	public int insertTrackCmdDetector(TrackingResponseRecord rd) throws Exception {
		return trackCmdDetectorMapper.insertTrackCmdDetector(rd);
	}

	@Transactional
	public int updateTrackCmdDetector(TrackingTaskProcessingInfo msa) throws Exception {
		return trackCmdDetectorMapper.updateTrackCmdDetector(msa);
	}

	@Transactional
	public int deleteTrackCmdDetector(HashMap<String, Object> map) throws Exception {
		return trackCmdDetectorMapper.deleteTrackCmdDetector(map);
	}

}
