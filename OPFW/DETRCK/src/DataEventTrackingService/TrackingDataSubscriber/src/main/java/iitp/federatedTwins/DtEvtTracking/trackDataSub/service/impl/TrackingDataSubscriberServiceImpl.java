package iitp.federatedTwins.DtEvtTracking.trackDataSub.service.impl;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import javax.script.ScriptContext;
import javax.script.ScriptEngine;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingResponseRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingSequenceInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingSequenceStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTaskProcessingInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTaskSendingInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.mapper.TrackingTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Service
public class TrackingDataSubscriberServiceImpl implements TrackingDataSubscriberService {
	
	private final Logger logger = LoggerFactory.getLogger(TrackingDataSubscriberService.class);

	@Autowired
	private ScriptEngine scriptEngine;
	
	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;
	
	@Autowired
	public TrackingTaskSendingInfoMapper trackingTaskSendingInfoMapper;

	@Autowired
	public TrackingResponseRecordMapper trackingResponseRecordMapper;

	@Autowired
	public TrackingTaskProcessingInfoMapper trackingTaskProcessingInfoMapper;

	@Autowired
	public TrackingSequenceInfoMapper trackingSequenceInfoMapper;

	@Autowired
	public DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	public TrackingSequenceStatusChangeRecordMapper trackingSequenceStatusChangeRecordMapper;
	
	@Autowired
	public TrackingTaskInfoMapper trackingTaskInfoMapper;
	

	@Transactional(readOnly = true)
	public TrackingTaskSendingInfo getTaskSendingInfo(HashMap<String, Object> map) throws Exception {
		return trackingTaskSendingInfoMapper.getTaskSendingInfo(map);
	}

	@Transactional
	public int insertMsaReceiveResultData(TrackingResponseRecord rd) throws Exception {
		return trackingResponseRecordMapper.insertResponseRecord(rd);
	}

	@Transactional
	public int updateTaskProcessing(TrackingTaskProcessingInfo msa) throws Exception {
		return trackingTaskProcessingInfoMapper.updateTaskProcessing(msa);
	}

	@Transactional
	public int updateControlCommandSequence(TrackingProcessInfo csi) throws Exception {
		return trackingSequenceInfoMapper.updateTrackingSequence(csi);
	}
	
	public TrackingProcessInfo getTopics(String param) throws Exception{

		List<String> results = new ArrayList<>();
		List<Integer> pro = new ArrayList<>();
		List<Integer> trak = new ArrayList<>();
		
		TrackingProcessInfo trackingProcessInfo = new TrackingProcessInfo();
		
		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("requestTrackingId", param);
		List<TrackingProcessInfo> list = trackingTaskInfoMapper.getTrackCmdTaskInfoList(data);
		
		for (int i = 0; i < list.size(); i++) {
			results.add(list.get(i).getFederatedTwinId());
			pro.add(list.get(i).getTrackingProcessId());
			trak.add(list.get(i).getRequestTrackingId());
		}
		trackingProcessInfo.setTopicList(results);
		trackingProcessInfo.setProIdList(pro);
		trackingProcessInfo.setReqTrkList(trak);
		
		return trackingProcessInfo;
	}
	
	public  Map<String, Integer> getInsertTopic(String param, int proId, int trakId) throws Exception {
		Map<String, Integer> rsltMap =  new HashMap<String, Integer>(); 
		try {
				TrackingResponseRecord record = new TrackingResponseRecord();
				
				record.setReceiveVal(param);
				record.setReceiveStatus(Constant.CTRL_SEQ_RES_RECIEVE_STS_CMP);
				record.setReceiveMsg(param);
				record.setTrackingProcessId(proId);
				record.setReceivePayload(param);
				record.setRequestTrackingId(trakId);
				
				trackingResponseRecordMapper.insertResponseRecord(record);
					
				rsltMap.put("trackingResponseId", record.getTrackingResponseId());
		} 
		catch(Exception e) {
			logger.error("Error Message : {} "+ e);
		}
		return rsltMap;
	}
	
	public int getUpdateTopic(String param, int resId, int proId) throws Exception{
		
		int cnt = 0; 
		TrackingResponseRecord record = new TrackingResponseRecord();
		
		record.setTrackingResponseId(resId);
		record.setReceiveVal(param);
		record.setReceiveStatus(Constant.CTRL_SEQ_RES_RECIEVE_STS_CMP);
		record.setReceiveMsg(param);
		record.setTrackingProcessId(proId);
		record.setReceivePayload(param);	

		cnt = trackingResponseRecordMapper.updateResponseRecord(record);
		
		return cnt;
	}
	
	public HttpStatus procReceiveResultData(HashMap<String, Object> param) throws Exception {
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;
		HashMap<String, Object> data = null;
		
		try {
			data = regReceiveResultData(param);	
			
			executeActTypeVailidProc(data);
			
			procStat = Constant.HTTP_OK_STAT;	
		} 
		catch(Exception e) {
			logger.error("Error Message : {} "+ e);
		}
		
		return procStat;
	}
	
	private boolean procLogicalExpression(String logicalExpr, Object rtnVal) {
		Boolean procBool = false;
		
		StringBuilder sb = new StringBuilder();
		try{
			
    		sb.append("var rtnVal=variables.get('rtnVal'); ");
    		sb.append("if( ");
    		sb.append(logicalExpr);
    		sb.append(" ) ");
    		sb.append(" true; ");
    		sb.append(" else ");
    		sb.append(" false; ");
    		String expression = sb.toString();
    				
    		ScriptContext context = scriptEngine.getContext();		  
    		HashMap<String, Object> variableMap = new HashMap<String, Object>();
            variableMap.put("rtnVal", rtnVal);
      
            context.setAttribute("variables", variableMap, ScriptContext.ENGINE_SCOPE);
    		
            procBool = (Boolean) scriptEngine.eval(expression);
        	
        }
		catch(Exception e){
        	e.printStackTrace();
            System.out.println(String.format("ScriptException while running js code: {}", ""));
        }
				
		return procBool;
	}
	
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public HashMap<String, Object> regReceiveResultData(HashMap<String, Object> param) throws Exception {
		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("taskSendingIdentifiier", param.get("ctrlIdentifier"));
		
		
		HashMap<String, Object> map = new HashMap<>();
		map.put("taskSendingIdentifiier", param.get("ctrlIdentifier"));
		
		TrackingTaskSendingInfo si = trackingTaskSendingInfoMapper.getTaskSendingInfo(map);
		if(si == null) {
			throw new RuntimeException("**************** TrackingTaskSendingInfo Null or Empty Error *******************");
		}
		
		String controlResult = null, recieveVal = null;
		try {
			JSONParser parser = new JSONParser(); 
			JSONObject json = (JSONObject) parser.parse((String)param.get("controlResult"));
			
			controlResult = (String)param.get("controlResult");			
			recieveVal = ""+json.get("status_code");
		} 
		catch(Exception e) {
			logger.error("Error Message : {} "+ e);
		}
		
		TrackingResponseRecord rd = new TrackingResponseRecord();
		rd.setTrackingProcessId(si.getTrackingProcessId());
		rd.setRequestTrackingId(si.getRequestTrackingId());
		rd.setReceiveStatus(Constant.CTRL_SEQ_RES_RECIEVE_STS_CMP);
		rd.setReceiveVal(recieveVal);
		rd.setReceiveMsg(controlResult);

		int res = trackingResponseRecordMapper.insertResponseRecord(rd);
		
		
		if (res > 0) {
			data.put("TrackingResponseRecord", rd);
			
			TrackingTaskProcessingInfo msa = new TrackingTaskProcessingInfo();
			msa.setTaskProcessingId(si.getTaskProcessingId());
			msa.setTrackingProcessId(si.getTrackingProcessId());
			msa.setRequestTrackingId(si.getRequestTrackingId());
			msa.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);
			msa.setTaskProcessingResultMsg("CMP");

			TrackingTaskSendingInfo mts = new TrackingTaskSendingInfo();
			mts.setTaskSendingId(si.getTaskSendingId());
			mts.setTaskProcessingId(si.getTaskProcessingId());
			mts.setTrackingProcessId(si.getTrackingProcessId());
			mts.setRequestTrackingId(si.getRequestTrackingId());
			mts.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_RES);
			mts.setTaskReceiveResultMsg("OK");

			int updTs = trackingTaskSendingInfoMapper.updateTaskSending(mts);
			int updTp = trackingTaskProcessingInfoMapper.updateTaskProcessing(msa);									
		} 
		else {
			throw new RuntimeException("**************** MsaTaskResponseRecord Insert Processing Runtime Error *******************");
		}

		logger.debug("End >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
				+ map.get("taskSendingIdentifiier"));

		
		return data;
	}

	//데이터 저장/상태변경 처리 후 연결시퀀스 동작을 확인 및 필터링 조건처리작업을 진행 
	private void executeActTypeVailidProc(HashMap<String, Object> map) {
		try {
			TrackingResponseRecord rd = (TrackingResponseRecord)map.get("TrackingResponseRecord");
			
			HashMap<String, Object> data = new HashMap<String, Object>();
			HashMap<String, Object> param = new HashMap<>();
			param.put("requestTrackingId", rd.getRequestTrackingId());
			param.put("trackingProcessId", rd.getTrackingProcessId());
			
			TrackingProcessInfo mccs = trackingSequenceInfoMapper.getTrackingSequenceInfo(param);		

			if (mccs.getTrackingProcessType().equals(Constant.CTRL_CMD_SEQUENCE_SINGLE)) {
				DataEventTrackingRequestInfo tt = new DataEventTrackingRequestInfo();
				tt.setReqTrckCmdStatus(Constant.CTRL_CMD_STATUS_COMPLETE);
				tt.setRequestTrackingId(mccs.getRequestTrackingId());
				int upd3 = dataEventTrackingRequestInfoMapper.updateDataEventTrackingRequest(tt);

				data.put("sequenceActType", mccs.getTrackingProcessType());
				data.put("requestTrackingId", mccs.getRequestTrackingId());
				data.put("trackingProcessId", mccs.getTrackingProcessId());
			} else if (mccs.getTrackingProcessType().equals(Constant.CTRL_CMD_SEQUENCE_RUNNING)) {
					//연결시퀀스를 확인하는 부분 
					param.clear();
					param.put("sequenceIdentifier", mccs.getTrackingKafkaTopic());
					TrackingProcessInfo nxtSeq = trackingSequenceInfoMapper.getTrackingSequenceInfo(param);

					data.put("sequenceActType", nxtSeq.getTrackingProcessType());
					data.put("requestTrackingId", nxtSeq.getRequestTrackingId());
					data.put("trackingProcessId", nxtSeq.getTrackingProcessId());
				
			}

			sendProducerCmd(data);
		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
		}
		
	}
		
		

	public void sendProducerCmd(HashMap<String, Object> data) throws Exception {
		String url = Constant.EUREKA_GATEWAY_CONN_BASE_URL+":"+Constant.EUREKA_GATEWAY_CONN_BASE_PORT
				+ "/fdt/detrck";
		HashMap<String, Object> param = new HashMap<String, Object>();
				
		if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(data.get("sequenceActType"))
				|| Constant.CTRL_CMD_SEQUENCE_END.equals(data.get("sequenceActType"))) {
			url += "/tsm/transmitter/"+String.valueOf(data.get("requestTrackingId"));
		} else {
			url += "/pub/ctrlCmd/taskProc";
			
			param.put("requestTrackingId", String.valueOf(data.get("requestTrackingId")));		
			param.put("trackingProcessId", String.valueOf(data.get("trackingProcessId")));
		}
		
		try {
			httpGetConnection(url, param);
		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
		}

	}
	
	
	protected String statusCode;
	public void httpGetConnection(String baseUrl, HashMap<String, Object> ParamData) throws URISyntaxException{		

		HttpGet httpGet = new HttpGet(baseUrl);
		
		List<NameValuePair> nvps = new ArrayList<>();
		
		for (Entry<String, Object> entrySet : ParamData.entrySet()) {
			nvps.add(new BasicNameValuePair(entrySet.getKey(), (String) entrySet.getValue()));
			
		}
		
		URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
		httpGet.setUri(uri);
	
		logger.info("http GetConnection Url ===> " + httpGet.getPath());
		
		try{
			try (CloseableHttpResponse response = poolHttpClient.execute(httpGet)) {
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
					} 
					catch(Exception e) {
						e.printStackTrace();	
						statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
					}
				}
				EntityUtils.consume(entity);
			} 				
		} 
		catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
