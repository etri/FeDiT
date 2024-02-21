package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResultDataTransmissionInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingResultDataTransmissionInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.mapper.TrackingControlTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.service.DataEventTrackingRequestService;
import iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo.TrackingTransmissionVO;

@Service
public class DataEventTrackingRequestServiceImpl implements DataEventTrackingRequestService {

	private final Logger logger = LoggerFactory.getLogger(DataEventTrackingRequestServiceImpl.class);

	@Autowired
	public DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	public TrackingControlTaskInfoMapper trackingControlTaskInfoMapper;

	@Autowired
	public TrackingResultDataTransmissionInfoMapper trackingResultDataTransmissionInfoMapper;

	@Transactional
	public List<DataEventTrackingRequestInfo> getTrackingControlTaskInfo(HashMap<String, Object> paramMap) {
		return trackingControlTaskInfoMapper.getTrackingControlTaskInfo(paramMap);
	}

	@Transactional
	public DataEventTrackingRequestInfo getDataEventTrackingControlTaskInfo(HashMap<String, Object> paramMap) {
		return trackingControlTaskInfoMapper.getDataEventTrackingControlTaskInfo(paramMap);
	}

	@Transactional
	public Map<String, Integer> InsertTransmission(TrackingTransmissionVO msa, Map<String, String> mapped) throws Exception {

		Map<String, Integer> rsltMap =  new HashMap<String, Integer>(); 
		
		int result;
		try {
			TrackingResultDataTransmissionInfo mti = new TrackingResultDataTransmissionInfo();
			mti.setRequestTrackingId(msa.getRequestTrackingId());
			mti.setTransmissionCode(200);
			mti.setTransmissionMsg("OK");
			mti.setTransmissionUrl(msa.getResultCallbackUrl());
			mti.setTransmissionResultData(msa.getTransmissionResultData());
			mti.setTransmissionParam(mapped.toString()); 
			
			logger.debug("Insert reqTrkId >>>>>>>>> " + mti.getRequestTrackingId());

			int res = trackingResultDataTransmissionInfoMapper.insertTrackingResultDataTransmission(mti);  
			if (res < 1) 
				throw new Exception("******* CtrCommand Update Error *******");

			rsltMap.put("transmissionId", mti.getTransmissionId());
			
			result = 1;

		} catch (Exception e) {
			logger.error("Error Message : {} "+ e);
			result = 0;
		}

		return rsltMap;
		
	}
	
	@Transactional
	public int UpdateTransmission(TrackingTransmissionVO msa) throws Exception {

		int result;
		try {
				DataEventTrackingRequestInfo mcc = new DataEventTrackingRequestInfo();
				mcc.setRequestTrackingId(msa.getRequestTrackingId());
				
				TrackingResultDataTransmissionInfo mti = new TrackingResultDataTransmissionInfo();
				mti.setRequestTrackingId(msa.getRequestTrackingId());
				mti.setTransmissionId(msa.getTransmissionId());
				mti.setTransmissionResultData(msa.getTransmissionResultData());
				
				mti.setRespCtrlCmdCode(msa.getHttpCode());
				mti.setRespCtrlCmdMsg(msa.getHttpResult());
				

				int upd = dataEventTrackingRequestInfoMapper.updateDataEventTrackingRequest(mcc); 
				if (upd < 1)
					throw new Exception("******* CtrCommand Update Error *******");
				
				int tup = trackingResultDataTransmissionInfoMapper.updateTrackingResultDataTransmission(mti);

				if(tup < 1)
					throw new Exception("******* Transmission Update Error ********");

			result = 1;

		} catch (Exception e) {
			logger.error("Error Message : {} "+ e);
			result = 0;
		}

		return result;
	}

	

}
