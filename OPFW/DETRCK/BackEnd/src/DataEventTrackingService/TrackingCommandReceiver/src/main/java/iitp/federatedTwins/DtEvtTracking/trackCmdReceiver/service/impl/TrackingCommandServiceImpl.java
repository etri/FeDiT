package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.google.gson.Gson;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventTransmissionResultInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusTransmissionInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.component.RabbitMQComponent;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser.TrackingCmdFactory;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.TrackingCommandService;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingProcessVO;

@Service
public class TrackingCommandServiceImpl implements TrackingCommandService {
	@Autowired
	private TrackingCmdFactory ctrlCmdFactory;

	private final DataEventTrackingRequestInfoMapper dtEvTrckReqInfoMapper;
	private final TrackingProcessInfoMapper trackingProcessInfoMapper;
	private final TrackingProcessStatusChangeRecordMapper trackingProcStatusChangeHisMapper;

	@Lazy
	@Autowired
	private TrackingCommandServiceImpl self;

	@Autowired
	RabbitMQComponent rabbitMqComponent;

	@Autowired
	ApplicationContext ctx;

	@Autowired
	private TrackingStatusChangeRecordMapper statusChangeHisMapper;

	@Autowired
	private EventTransmissionResultInfoMapper eventTransmissionResultInfoMapper;

	@Autowired
	private TrackingStatusTransmissionInfoMapper statusTransmissionInfoMapper;

	private final Logger logger = LoggerFactory.getLogger(TrackingCommandServiceImpl.class);

	public TrackingCommandServiceImpl(DataEventTrackingRequestInfoMapper dtEvTrckReqInfoMapper,
			TrackingProcessInfoMapper trackingProcessInfoMapper,
			TrackingProcessStatusChangeRecordMapper trackingProcStatusChangeHisMapper) {
		this.dtEvTrckReqInfoMapper = dtEvTrckReqInfoMapper;
		this.trackingProcessInfoMapper = trackingProcessInfoMapper;
		this.trackingProcStatusChangeHisMapper = trackingProcStatusChangeHisMapper;
	}

	@Value("${CTRL_CMD_REQ_RECORDING_TYPE}")
	public boolean CTRL_CMD_REQ_RECORDING_TYPE = false;

	public LinkedHashMap<String, Object> findTrckProcList(String trackingIdentifier) throws Exception{

		logger.info("uuid-reqIdentifier : {}" , trackingIdentifier);

		LinkedHashMap<String, Object> param = new LinkedHashMap<String, Object>();
		param.put("trackingIdentifier", trackingIdentifier);

		DataEventTrackingRequestInfo dataEventTrackingRequestInfo = dtEvTrckReqInfoMapper.getDataEventTrackingRequestInfoParam(param);

		JSONObject request = new JSONObject();
		List<JSONObject> addList= new ArrayList<>();
		if(dataEventTrackingRequestInfo != null) {
			request.put("req_identifier", dataEventTrackingRequestInfo.getReqIdentifier());
			request.put("uuid-reqIdentifier", dataEventTrackingRequestInfo.getTrackingIdentifier());
			request.put("reqTrckCmdStatus", dataEventTrackingRequestInfo.getReqTrckCmdStatus());
			request.put("reqTrckCmdTime", dataEventTrackingRequestInfo.getReqTrckCmdTime());
			request.put("reqStatusChangeTime", dataEventTrackingRequestInfo.getReqStatusChangeTime());

			param.put("requestTrackingId", dataEventTrackingRequestInfo.getRequestTrackingId());
			List<TrackingProcessInfo> procList = trackingProcessInfoMapper.getTrackingProcessList(param);

			if(procList != null && !procList.isEmpty()) {
				for (int i = 0; i < procList.size(); i++) {
					JSONObject process = new JSONObject();
					process.put("trckPrcIdtifier", procList.get(i).getTrckPrcIdtifier());
					process.put("trackingProcessIdentifier", procList.get(i).getTrackingProcessIdentifier());
					process.put("trackingProcessType", procList.get(i).getTrackingProcessType());
					process.put("createTime", procList.get(i).getCreateTime());
					process.put("trackingStatusChangeTime", procList.get(i).getTrackingStatusChangeTime());
					process.put("trackingStatus", procList.get(i).getTrackingStatus());
					addList.add(process);
				}
			}else {
				throw new Exception("***** procList is null or Empty *****");
			}

		}else {
			throw new Exception("***** dataEventTrackingRequestInfo is null or Empty *****");
		}
		param.clear();
		param.put("trckReqInfo", request);
		param.put("trckProcInfoList", addList);

		return param;
	}

	public LinkedHashMap<String, Object> findTrckReqList() throws Exception{

		LinkedHashMap<String, Object> param = new LinkedHashMap<String, Object>();

		List<JSONObject> dataList= new ArrayList<>();
		List<DataEventTrackingRequestInfo> dtEtTrckReqList = dtEvTrckReqInfoMapper.getDataEventTrackingRequestList(param);

		if(dtEtTrckReqList != null && !dtEtTrckReqList.isEmpty()) {
			for (int i = 0; i < dtEtTrckReqList.size(); i++) {
				param.put("requestTrackingId", dtEtTrckReqList.get(i).getRequestTrackingId());
				List<TrackingProcessInfo> pList  = trackingProcessInfoMapper.getTrackingProcessList(param);
				JSONObject request = new JSONObject();
				request.put("reqIdentifier", dtEtTrckReqList.get(i).getReqIdentifier());
				request.put("uuid-reqIdentifier", dtEtTrckReqList.get(i).getTrackingIdentifier());
				request.put("reqTrckCmdStatus", dtEtTrckReqList.get(i).getReqTrckCmdStatus());
				request.put("reqTrckCmdTime", dtEtTrckReqList.get(i).getReqTrckCmdTime());
				request.put("reqStatusChangeTime", dtEtTrckReqList.get(i).getReqStatusChangeTime());
				request.put("processCnt", pList.size());

				List<String> trckPrcIdtifierList = new ArrayList<String>();
				if (pList != null) {
					for (TrackingProcessInfo tp : pList) {
						trckPrcIdtifierList.add(tp.getTrckPrcIdtifier());
					}
				}
				request.put("trckPrcIdtifierList", trckPrcIdtifierList);

				dataList.add(request);
			}
		}else {
			throw new Exception("***** dtEtTrckReqList is null  or Empty *****");
		}

		param.clear();
		param.put("totalCnt", dataList.size());
		param.put("trckReqInfoList", dataList);

		return param;
	}

	public LinkedHashMap<String, Object> findTrckStatusHistory(String trackingIdentifier) throws Exception {

		logger.info("uuid-reqIdentifier : {}", trackingIdentifier);

		LinkedHashMap<String, Object> param = new LinkedHashMap<String, Object>();
		param.put("trackingIdentifier", trackingIdentifier);

		DataEventTrackingRequestInfo reqInfo = dtEvTrckReqInfoMapper.getDataEventTrackingRequestInfoParam(param);

		if (reqInfo == null)
			throw new Exception("***** dataEventTrackingRequestInfo is null or Empty *****");

		HashMap<String, Object> hParam = new HashMap<String, Object>();
		hParam.put("requestTrackingId", reqInfo.getRequestTrackingId());

		List<TrackingStatusChangeRecord> reqHisList = statusChangeHisMapper.getTrackingStatusChangeHistoryList(hParam);

		List<Map<String, Object>> procHisList = trackingProcStatusChangeHisMapper
				.getProcessStatusChangeHistoryByRequest(hParam);

		List<Map<String, Object>> eventTransList = eventTransmissionResultInfoMapper
				.getEventTransmissionResultByRequest(hParam);

		List<Map<String, Object>> statusTransList = statusTransmissionInfoMapper
				.getStatusTransmissionByRequest(hParam);

		LinkedHashMap<String, Object> result = new LinkedHashMap<String, Object>();
		result.put("reqStatusChangeList", reqHisList != null ? reqHisList : new ArrayList<>());
		result.put("procStatusChangeList", procHisList != null ? procHisList : new ArrayList<>());
		result.put("eventTransmissionList", eventTransList != null ? eventTransList : new ArrayList<>());
		result.put("statusTransmissionList", statusTransList != null ? statusTransList : new ArrayList<>());

		return result;
	}

	public HttpStatus procDeleteTrackingCommand(HashMap<String, String> map) throws Exception {
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;
		HashMap<String, Object> param = new HashMap<String, Object>();
		HashMap<String, String> stsParam = new HashMap<String, String>();

		try {
			param.put("trackingIdentifier", map.get("trackingIdentifier"));

			ArrayList<String> stsList = new ArrayList<String>();

			if(!"AD".equals(map.get("opType"))) {
				stsList.add(Constant.TRCK_CMD_STATUS_READY);
				stsList.add(Constant.TRCK_CMD_STATUS_RUNNING);
				param.put("reqTrckCmdStatusList", stsList);
			}

			List<DataEventTrackingRequestInfo> reqInfoList = this.dtEvTrckReqInfoMapper.getDataEventTrackingRequestList(param);

			if(reqInfoList == null || reqInfoList.size() < 1)
				throw new Exception("***** uuid-reqIdentifier is unprocessible status or not searched *****");

			DataEventTrackingRequestInfo trckInfo = reqInfoList.get(0);

			if(map.get("trckPrcIdtifier") != null && !"".equals(map.get("trckPrcIdtifier"))) {
				param.put("trckPrcIdtifier", map.get("trckPrcIdtifier"));
			}

			param.put("requestTrackingId", trckInfo.getRequestTrackingId());

			if(!"AD".equals(map.get("opType"))) {
				stsList = new ArrayList<String>();
				stsList.add(Constant.TRCK_PROC_STATUS_REG);
				stsList.add(Constant.TRCK_PROC_STATUS_READY);
				stsList.add(Constant.TRCK_PROC_STATUS_WAIT);
				stsList.add(Constant.TRCK_PROC_STATUS_RUNNING);

				param.put("trackingStatusList", stsList);
			}			

			List<TrackingProcessInfo> trckList = trackingProcessInfoMapper.getTrackingProcessList(param);

			if(trckList == null || trckList.size() < 1)
				throw new Exception("***** reqIdentifier || uuid-trckPrcIdtifier is unprocessible status or not searched *****");

			ArrayList<Integer> trackingProcessIdList = new ArrayList<Integer>();
			for(TrackingProcessInfo tpInfo:trckList) {
				trackingProcessIdList.add(tpInfo.getTrackingProcessId());
			}

			param.clear();

			param.put("requestTrackingId", trckInfo.getRequestTrackingId());
			param.put("trackingProcessIdList", trackingProcessIdList);
			param.put("trackingStatus", Constant.TRCK_PROC_STATUS_TASKKILL);

			trackingProcessInfoMapper.updateTrackingProcessByParam(param);

			if(CTRL_CMD_REQ_RECORDING_TYPE) {
				param.put("statusResultMsg", "********  Force Tracking Process Killed *********");

				trackingProcStatusChangeHisMapper.insertTrackingProcChangeHisMultiList(param);
			}

			if("A".equals(map.get("mode"))) {
				DataEventTrackingRequestInfo dataEventTrackingRequestInfo = new DataEventTrackingRequestInfo();
				dataEventTrackingRequestInfo.setRequestTrackingId(trckInfo.getRequestTrackingId());
				dataEventTrackingRequestInfo.setReqTrckCmdStatus(Constant.TRCK_CMD_STATUS_KILLED);

				int recCnt = dtEvTrckReqInfoMapper.updateDataEventTrackingRequest(dataEventTrackingRequestInfo);

				if(CTRL_CMD_REQ_RECORDING_TYPE) {
					TrackingStatusChangeRecord trackingStatusChangeRecord = new TrackingStatusChangeRecord();
					trackingStatusChangeRecord.setRequestTrackingId(trckInfo.getRequestTrackingId());
					trackingStatusChangeRecord.setChangeStatus(Constant.TRCK_CMD_STATUS_KILLED);
					trackingStatusChangeRecord.setStatusResultMsg("********  Force Request Tracking Info Killed  *********");
					statusChangeHisMapper.insertTrackingStatusChangeHistory(trackingStatusChangeRecord);
				}
			}

			procStat = Constant.HTTP_OK_STAT;
		} catch(Exception e) {			
			logger.error("Error Message : {}" , e);
			procStat = Constant.HTTP_SERVER_ERROR_STAT;

		} finally {
			try {
			} catch(Exception e) {
				e.printStackTrace();
				procStat = Constant.HTTP_SERVER_ERROR_STAT;
			}
		}

		return procStat;	
	}

	public LinkedHashMap<String, Object> procRequestTrackingCommand(TrackingCommandVO trackingCommand) throws Exception {
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;
		HashMap<String, String> param = new HashMap<String, String>();
		LinkedHashMap<String, Object> map = new LinkedHashMap<String, Object>();

		try {
			HashMap<String, Object> data = self.insertRequesttrackingCommand(trackingCommand);

			map.put("reqIdentifier", data.get("reqIdentifier").toString());
			map.put("uuid-reqIdentifier", data.get("trackingIdentifier").toString());
			map.put("trckProcInfo", data.get("trckProcInfo").toString());

			logger.info("procRequestTrackingCommand requestTrackingId : {}", data.get("requestTrackingId"));

			param.put("requestTrackingId", String.valueOf(data.get("requestTrackingId")));

			JSONObject json = new JSONObject();
			json.put("requestTrackingId", String.valueOf(data.get("requestTrackingId")));

			rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TRACKING_COMMAND_SEND);

			procStat = Constant.HTTP_CREATE_STAT;
		} catch(Exception e) {			
			logger.error("Error Message : {}" , e);
			procStat = Constant.HTTP_SERVER_ERROR_STAT;

		} finally {
			try {
				if(procStat == Constant.HTTP_SERVER_ERROR_STAT)
					updateStatusCtrlProcCmdData(param);
			} catch(Exception e) {
				e.printStackTrace();
				procStat = Constant.HTTP_SERVER_ERROR_STAT;
			}

		}

		return map;		
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public HashMap<String, Object> insertRequesttrackingCommand(TrackingCommandVO trackingCommand) throws Exception {
		int requestTrackingId = -1, regCnt = 0, trackingProcessId = -1, regSeqCnt = 0 , i = 0;
		HashMap<String, Object> data = new HashMap<String, Object>();
		LinkedHashMap<String, Object> info = new LinkedHashMap<>();
		String trckProcInfo[] = new String[trackingCommand.getTrckProcInfo().length];

		Gson gson = new Gson();
		DataEventTrackingRequestInfo trckcc = ctrlCmdFactory.makeDefaultTrackingCmdInfo(trackingCommand);

		data.put("trackingIdentifier", trckcc.getTrackingIdentifier());
		data.put("reqIdentifier", trckcc.getReqIdentifier());

		regCnt = this.dtEvTrckReqInfoMapper.insertDataEventTrackingRequest(trckcc);
		if (regCnt > 0) {
			requestTrackingId = trckcc.getRequestTrackingId();

			if (requestTrackingId > -1) {
				data.put("requestTrackingId", requestTrackingId);
				if(CTRL_CMD_REQ_RECORDING_TYPE) {
					TrackingStatusChangeRecord trckCh = new TrackingStatusChangeRecord();
					trckCh.setRequestTrackingId(requestTrackingId);
					trckCh.setChangeStatus(trckcc.getReqTrckCmdStatus());
					trckCh.setStatusResultMsg("Request Command Insert Success");

					statusChangeHisMapper.insertTrackingStatusChangeHistory(trckCh);
				}

				for (TrackingProcessVO trackingProcess : trackingCommand.getTrckProcInfo()) {
					trackingProcessId = -1;
					regSeqCnt = 0;
					trackingProcess.setRequestTrackingId(requestTrackingId);
					TrackingProcessInfo procInfo = ctrlCmdFactory.makeDefaultTrackingCmdProcessInfo(trackingProcess);

					info.put("trckTp", procInfo.getTrackingProcessType());
					info.put("trckPrcIdtifier", procInfo.getTrckPrcIdtifier());
					info.put("uuid-trckPrcIdtifier", procInfo.getTrackingProcessIdentifier());
					trckProcInfo[i] = gson.toJson(info); 
					i++;

					regSeqCnt = trackingProcessInfoMapper.insertTrackingProcess(procInfo);

					if (regSeqCnt > 0)
						trackingProcessId = procInfo.getTrackingProcessId();

					if (trackingProcessId > -1) {						
						if(CTRL_CMD_REQ_RECORDING_TYPE) {
							TrackingProcessStatusChangeRecord trcksh = new TrackingProcessStatusChangeRecord();

							trcksh.setTrackingProcessId(trackingProcessId);
							trcksh.setRequestTrackingId(requestTrackingId);
							trcksh.setChangeStatus(procInfo.getTrackingStatus());
							trcksh.setStatusResultMsg("Request Command Process Insert Success");

							trackingProcStatusChangeHisMapper.insertProcessStatusChangeHistory(trcksh);
						}
					} else {
						throw new RuntimeException(
								"****************  Request Tracking Command Insert Processing Runtime Error *******************");
					}
				}
			} else {
				throw new RuntimeException(
						"****************  TRACKING PROCESS Command Insert Processing Runtime Error *******************");
			}
		} else {
			throw new RuntimeException(
					"****************  Request Command Insert Processing Runtime Error *******************");
		}

		data.put("trckProcInfo", Arrays.toString(trckProcInfo));
		return data;
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public void updateStatusCtrlProcCmdData(HashMap<String, String> param) throws Exception {
		DataEventTrackingRequestInfo trackingCommand = new DataEventTrackingRequestInfo();
		trackingCommand.setRequestTrackingId(Integer.valueOf((String)param.get("requestTrackingId")).intValue());
		trackingCommand.setReqTrckCmdStatus(Constant.TRCK_CMD_STATUS_ERROR);
		this.dtEvTrckReqInfoMapper.updateDataEventTrackingRequest(trackingCommand);

		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("requestTrackingId", Integer.valueOf((String)param.get("requestTrackingId")));
		data.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);

		trackingProcessInfoMapper.updateTrackingProcessByParam(data);

	}

}
