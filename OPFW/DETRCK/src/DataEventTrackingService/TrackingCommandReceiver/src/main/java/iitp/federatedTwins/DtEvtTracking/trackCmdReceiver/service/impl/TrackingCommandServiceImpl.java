package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.impl;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.URIBuilder;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingSequenceStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingSequenceInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingSequenceStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.parser.TrackingCmdFactory;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.service.TrackingCommandService;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingCommandVO;
import iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo.TrackingSequencesVO;

@Service
public class TrackingCommandServiceImpl implements TrackingCommandService {
	@Autowired
	private TrackingCmdFactory ctrlCmdFactory;

	private final DataEventTrackingRequestInfoMapper dtEvTrckReqInfoMapper;
	private final TrackingSequenceInfoMapper trackingSequenceMapper;
	private final TrackingSequenceStatusChangeRecordMapper trackingSeqStatusChangeHisMapper;

	@Autowired(required = false)
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;
	
	@Autowired
	private TrackingStatusChangeRecordMapper statusChangeHisMapper;

	private final Logger logger = LoggerFactory.getLogger(TrackingCommandServiceImpl.class);

	public TrackingCommandServiceImpl(DataEventTrackingRequestInfoMapper dtEvTrckReqInfoMapper,
			TrackingSequenceInfoMapper trackingSequenceMapper,
			TrackingSequenceStatusChangeRecordMapper trackingSeqStatusChangeHisMapper) {
		this.dtEvTrckReqInfoMapper = dtEvTrckReqInfoMapper;
		this.trackingSequenceMapper = trackingSequenceMapper;
		this.trackingSeqStatusChangeHisMapper = trackingSeqStatusChangeHisMapper;
	}

	@Value("${CTRL_CMD_REQ_RECORDING_TYPE}")
	public boolean CTRL_CMD_REQ_RECORDING_TYPE = false;

	
	public HttpStatus procRequestTrackingCommand(TrackingCommandVO trackingCommand) throws Exception {
		HashMap<String, Object> data = insertRequesttrackingCommand(trackingCommand);
		
		try {
			//***********************************************************************//			
			String url = Constant.EUREKA_GATEWAY_CONN_BASE_URL+":"+Constant.EUREKA_GATEWAY_CONN_BASE_PORT
					+ "/fdt/detrck/pub/ctrlCmd/taskProc";
			
			logger.debug("requestTrackingId : {} " + data.get("requestTrackingId"));
			logger.debug("trackingProcessId : {} " + data.get("trackingProcessId"));
			
			HashMap<String, String> param = new HashMap<String, String>();
			param.put("requestTrackingId", String.valueOf(data.get("requestTrackingId")));
			param.put("trackingProcessId", String.valueOf(data.get("trackingProcessId")));

			if(httpGetConnection(url, param)) {
				return Constant.HTTP_CREATE_STAT;	
			} else {
				updateStatusCtrlSeqCmdData(param);
				
				return Constant.HTTP_SERVER_ERROR_STAT;
			}
		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
		}
		
		return Constant.HTTP_CREATE_STAT;		
	}
	
	public HttpStatus procRequestRegisteFdtObjData(TrackingCommandVO trackingCommand) throws Exception {
		HashMap<String, Object> data = insertRequestRegisteFdtObjData(trackingCommand);
			
		try {
			String url = Constant.EUREKA_GATEWAY_CONN_BASE_URL+":"+Constant.EUREKA_GATEWAY_CONN_BASE_PORT
					+ "/fdt/detrck/pub/ctrlCmd/taskProc";
			HashMap<String, String> param = new HashMap<String, String>();
			param.put("requestTrackingId", String.valueOf(data.get("requestTrackingId")));
			param.put("trackingProcessId", String.valueOf(data.get("trackingProcessId")));

			if(httpGetConnection(url, param)) {
				return Constant.HTTP_CREATE_STAT;	
			} else {
				updateStatusCtrlSeqCmdData(param);
				
				return Constant.HTTP_SERVER_ERROR_STAT;
			}
		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
		}
		
		return Constant.HTTP_CREATE_STAT;
	}
	
	
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public HashMap<String, Object> insertRequesttrackingCommand(TrackingCommandVO trackingCommand) throws Exception {
		int requestTrackingId = -1, regCnt = 0, trackingProcessId = -1, regSeqCnt = 0, stsCtrlCmdSeq = -1;

		HashMap<String, Object> data = new HashMap<String, Object>();

		DataEventTrackingRequestInfo mrcc = ctrlCmdFactory.makeDefaultTrackingCmdInfo(trackingCommand);

		
		
		regCnt = this.dtEvTrckReqInfoMapper.insertDataEventTrackingRequest(mrcc);
		if (regCnt > 0) {
			requestTrackingId = mrcc.getRequestTrackingId();

			if (requestTrackingId > -1) {
				data.put("requestTrackingId", requestTrackingId);
				if(CTRL_CMD_REQ_RECORDING_TYPE) {
					TrackingStatusChangeRecord msaCh = new TrackingStatusChangeRecord();
					msaCh.setRequestTrackingId(requestTrackingId);
					msaCh.setChangeStatus(mrcc.getReqTrckCmdStatus());
					msaCh.setStatusResultMsg("Request Command Insert Success");

					statusChangeHisMapper.insertTrackingStatusChangeHistory(msaCh);
				}

				for (TrackingSequencesVO trackingSequence : trackingCommand.getTrckProcInfo()) {
					trackingProcessId = -1;
					regSeqCnt = 0;
					trackingSequence.setRequestTrackingId(requestTrackingId);
					TrackingProcessInfo seqInfo = ctrlCmdFactory
							.makeDefaultTrackingCmdSequenceInfo(Constant.CTRL_CMD_REQ_TYPE_CTRL_DV, trackingSequence);

					regSeqCnt = trackingSequenceMapper.insertTrackingSequence(seqInfo);

					if (regSeqCnt > 0)
						trackingProcessId = seqInfo.getTrackingProcessId();

					if (trackingProcessId > -1) {
						if(Constant.CTRL_CMD_SEQUENCE_START.equals(seqInfo.getTrackingProcessType())) {
							stsCtrlCmdSeq = trackingProcessId;
							data.put("trackingProcessId", trackingProcessId);						
						}

						if(CTRL_CMD_REQ_RECORDING_TYPE) {
							TrackingSequenceStatusChangeRecord mssh = new TrackingSequenceStatusChangeRecord();

							mssh.setTrackingProcessId(trackingProcessId);
							mssh.setRequestTrackingId(requestTrackingId);
							mssh.setChangeStatus(seqInfo.getTrackingStatus());
							mssh.setStatusResultMsg("Request Command Sequence Insert Success");

							trackingSeqStatusChangeHisMapper.insertSequenceStatusChangeHistory(mssh);
						}
					} else {
						throw new RuntimeException(
								"****************  Request Sequence Command Insert Processing Runtime Error *******************");
					}
				}
			} else {
				throw new RuntimeException(
						"****************  Request Command Insert Processing Runtime Error *******************");
			}
		} else {

		}

		data.put("regCnt", String.valueOf(regCnt));

		return data;
	}

	protected String statusCode;
	public boolean httpGetConnection(String baseUrl, HashMap<String, String> ParamData) throws Exception {
		boolean returnBool = false;
		String errorStr = "";
		try {
			HttpGet httpGet = new HttpGet(baseUrl);
			
			List<NameValuePair> nvps = new ArrayList<>();
			
			for (Entry<String, String> entrySet : ParamData.entrySet()) {
				nvps.add(new BasicNameValuePair(entrySet.getKey(), entrySet.getValue()));
				
				logger.debug(" >>>>>>>>>> " + entrySet.getKey() + " : " + entrySet.getValue());
			}
			
			URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
			httpGet.setUri(uri);
			
			try(CloseableHttpClient httpClient = HttpClients.createDefault()) {
				try (CloseableHttpResponse response = httpClient.execute(httpGet)) {
					
					statusCode = String.valueOf(response.getCode());
					logger.info(Thread.currentThread().getName() + " - status code: " + statusCode);

					HttpEntity entity = response.getEntity();
					if (entity != null) {				
						try {
							String responseBody = EntityUtils.toString(entity);
							logger.info(Thread.currentThread().getName() + "- responseBody: " + responseBody);

							if(!"".equals(responseBody)) {
								JSONParser parser = new JSONParser();							
								JSONObject json = (JSONObject) parser.parse(responseBody);

								StringBuilder sb = new StringBuilder();
								sb.append("status : "+json.get("statusCode"));
								sb.append("  |  error : "+json.get("httpStatus"));
								statusCode = sb.toString();								
							}							
						} catch(Exception e) {
							logger.error("Error Message : {}" , e);
							statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
						}
					}
					EntityUtils.consume(entity);
				} 				
			} catch (Exception e) {				
				logger.error("Error Message : {}" , e);
				
				returnBool = false;
				errorStr = e.getMessage().toString();
				statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
			} 
		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
			returnBool = false;
			errorStr = e.getMessage().toString();
			statusCode = errorStr.substring(0, errorStr.length()<180?errorStr.length():180);
		}	
		
		return returnBool;
	}	
	
	
	
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public void updateStatusCtrlSeqCmdData(HashMap<String, String> param) throws Exception {
		DataEventTrackingRequestInfo trackingCommand = new DataEventTrackingRequestInfo();
		trackingCommand.setRequestTrackingId(Integer.valueOf((String)param.get("requestTrackingId")).intValue());
		trackingCommand.setReqTrckCmdStatus(Constant.CTRL_CMD_STATUS_ERROR);
		this.dtEvTrckReqInfoMapper.updateDataEventTrackingRequest(trackingCommand);
		
		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("requestTrackingId", Integer.valueOf((String)param.get("requestTrackingId")));
		data.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
		
		trackingSequenceMapper.updateTrackingSequenceByParam(data);
		
	}
	
	
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public HashMap<String, Object> insertRequestRegisteFdtObjData(TrackingCommandVO trackingCommand) throws Exception {
		int requestTrackingId = -1, regCnt = 0, trackingProcessId = -1, regSeqCnt = 0;

		HashMap<String, Object> data = new HashMap<String, Object>();
		
		DataEventTrackingRequestInfo mrcc = ctrlCmdFactory.makeDefaultTrackingCmdInfo(trackingCommand);

		regCnt = this.dtEvTrckReqInfoMapper.insertDataEventTrackingRequest(mrcc);

		if (regCnt > 0) {
			requestTrackingId = mrcc.getRequestTrackingId();

		if (requestTrackingId > -1) {
			
			
			data.put("requestTrackingId", requestTrackingId);
			
			if(CTRL_CMD_REQ_RECORDING_TYPE)	{
				TrackingStatusChangeRecord msaCh = new TrackingStatusChangeRecord();
				msaCh.setRequestTrackingId(requestTrackingId);
				msaCh.setChangeStatus(mrcc.getReqTrckCmdStatus());
				msaCh.setStatusResultMsg("Request Command Insert Success");

				statusChangeHisMapper.insertTrackingStatusChangeHistory(msaCh);
			}

			TrackingSequencesVO ctrlSequence = trackingCommand.getTrckProcInfo()[0];
			ctrlSequence.setRequestTrackingId(requestTrackingId);
			TrackingProcessInfo seqInfo = ctrlCmdFactory
					.makeDefaultTrackingCmdSequenceInfo(Constant.CTRL_CMD_REQ_TYPE_REG_DV, ctrlSequence);

			regSeqCnt = trackingSequenceMapper.insertTrackingSequence(seqInfo);

			if (regSeqCnt > 0)
				trackingProcessId = seqInfo.getTrackingProcessId();

			if (trackingProcessId > -1) {
				data.put("trackingProcessId", trackingProcessId);
				
				if(CTRL_CMD_REQ_RECORDING_TYPE)	{
					TrackingSequenceStatusChangeRecord mssh = new TrackingSequenceStatusChangeRecord();

					logger.debug("trackingProcessId : {} " + trackingProcessId);
					
					mssh.setTrackingProcessId(trackingProcessId);
					mssh.setRequestTrackingId(requestTrackingId);
					mssh.setChangeStatus(seqInfo.getTrackingStatus());
					mssh.setStatusResultMsg("Request Command Sequence Insert Success");

					trackingSeqStatusChangeHisMapper.insertSequenceStatusChangeHistory(mssh);
				}
			} else {
				throw new RuntimeException(
						"****************  Request Sequence Command Insert Processing Runtime Error *******************");
			}
		} else {
			throw new RuntimeException(
					"****************  Request Command Insert Processing Runtime Error *******************");
			}
		} else {
			throw new RuntimeException(
					"****************  Request Command Insert Processing Runtime Error *******************");
		}
		

		data.put("regCnt", String.valueOf(regCnt));
		return data;
	}

	@Transactional(rollbackFor = Exception.class)
	public int insertRequestTrackingCommand(TrackingCommandVO trackingCommand) throws Exception {
		int requestTrackingId = -1, regCnt = 0, trackingProcessId = -1, regSeqCnt = 0;

		DataEventTrackingRequestInfo mrcc = ctrlCmdFactory.makeDefaultTrackingCmdInfo(trackingCommand);

		regCnt = this.dtEvTrckReqInfoMapper.insertDataEventTrackingRequest(mrcc);

		if (regCnt > 0)
			requestTrackingId = mrcc.getRequestTrackingId();

		if (requestTrackingId > -1) {
			if(CTRL_CMD_REQ_RECORDING_TYPE)	{
				TrackingStatusChangeRecord msaCh = new TrackingStatusChangeRecord();
				msaCh.setRequestTrackingId(requestTrackingId);
				msaCh.setChangeStatus(mrcc.getReqTrckCmdStatus());
				msaCh.setStatusResultMsg("Request Command Insert Success");

				statusChangeHisMapper.insertTrackingStatusChangeHistory(msaCh);
			}

			for (TrackingSequencesVO ctrlSequence : trackingCommand.getTrckProcInfo()) {
				trackingProcessId = -1;
				regSeqCnt = 0;
				ctrlSequence.setRequestTrackingId(requestTrackingId);
				TrackingProcessInfo seqInfo = ctrlCmdFactory
						.makeDefaultTrackingCmdSequenceInfo(Constant.CTRL_CMD_REQ_TYPE_CTRL_DV, ctrlSequence);

				regSeqCnt = trackingSequenceMapper.insertTrackingSequence(seqInfo);

				if (regSeqCnt > 0)
					trackingProcessId = seqInfo.getTrackingProcessId();

				if (trackingProcessId > -1) {
					if(CTRL_CMD_REQ_RECORDING_TYPE)	{
						TrackingSequenceStatusChangeRecord mssh = new TrackingSequenceStatusChangeRecord();

						mssh.setTrackingProcessId(trackingProcessId);
						mssh.setRequestTrackingId(requestTrackingId);
						mssh.setChangeStatus(seqInfo.getTrackingStatus());
						mssh.setStatusResultMsg("Request Command Sequence Insert Success");

						trackingSeqStatusChangeHisMapper.insertSequenceStatusChangeHistory(mssh);
					}
				} else {
					throw new RuntimeException(
							"****************  Request Sequence Command Insert Processing Runtime Error *******************");
				}

			}

		} else {
			throw new RuntimeException(
					"****************  Request Command Insert Processing Runtime Error *******************");
		}

		return regCnt;
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int insertMultiRegTrackingCommandSeq(TrackingCommandVO trackingCommand) throws Exception {
		int requestTrackingId = -1, regCnt = 0, trackingProcessId = -1, regSeqCnt = 0;

		DataEventTrackingRequestInfo mrcc = ctrlCmdFactory.makeDefaultTrackingCmdInfo(trackingCommand);

		regCnt = this.dtEvTrckReqInfoMapper.insertDataEventTrackingRequest(mrcc);

		if (regCnt > 0)
			requestTrackingId = mrcc.getRequestTrackingId();

		if (requestTrackingId > -1) {
			if(CTRL_CMD_REQ_RECORDING_TYPE)	{
				TrackingStatusChangeRecord msaCh = new TrackingStatusChangeRecord();
				msaCh.setRequestTrackingId(requestTrackingId);
				msaCh.setChangeStatus(mrcc.getReqTrckCmdStatus());
				msaCh.setStatusResultMsg("Request Command Insert Success");

				statusChangeHisMapper.insertTrackingStatusChangeHistory(msaCh);
			}

			TrackingSequencesVO ctrlSequence = trackingCommand.getTrckProcInfo()[0];
			ctrlSequence.setRequestTrackingId(requestTrackingId);
			for (int a = 0; a < 1000; a++) {
				TrackingProcessInfo seqInfo = ctrlCmdFactory
						.makeDefaultTrackingCmdSequenceInfo(Constant.CTRL_CMD_REQ_TYPE_REG_DV, ctrlSequence);

				seqInfo.setEventOccurredCount(seqInfo.getEventOccurredCount() * (a / 10));

				regSeqCnt = trackingSequenceMapper.insertTrackingSequence(seqInfo);

				if (regSeqCnt > 0)
					requestTrackingId = seqInfo.getTrackingProcessId();

				if (requestTrackingId > -1) {
					if(CTRL_CMD_REQ_RECORDING_TYPE)	{
						TrackingSequenceStatusChangeRecord mssh = new TrackingSequenceStatusChangeRecord();

						mssh.setTrackingProcessId(trackingProcessId);
						mssh.setRequestTrackingId(requestTrackingId);
						mssh.setChangeStatus(seqInfo.getTrackingStatus());
						mssh.setStatusResultMsg("Request Command Sequence Insert Success");

						trackingSeqStatusChangeHisMapper.insertSequenceStatusChangeHistory(mssh);
					}
				} else {
					throw new RuntimeException(
							"****************  Request Sequence Command Insert Processing Runtime Error *******************");
				}
			}
		} else {
			throw new RuntimeException(
					"****************  Request Command Insert Processing Runtime Error *******************");
		}

		return regCnt;
	}

	public int insertTrackingCommandSequence(HashMap<String, Object> map) throws Exception {

		return 1;
	}


}
