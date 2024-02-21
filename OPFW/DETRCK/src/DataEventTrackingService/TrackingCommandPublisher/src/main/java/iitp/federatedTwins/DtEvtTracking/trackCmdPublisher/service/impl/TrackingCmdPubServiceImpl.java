package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.impl;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.net.URIBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskProcessingInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTaskProcessingInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.config.KafkaProducer;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.mapper.TrackingCommandTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.HttpTaskService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.TrackingCmdPrdService;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task.RunningSequenceTask;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task.SingleSequenceTask;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.task.StartSequenceTask;

@Service
public class TrackingCmdPubServiceImpl implements TrackingCmdPrdService{	

	@Autowired
	ApplicationContext ctx;
	
	@Autowired
	private KafkaProducer kafkaProducer;
	
	@Autowired
	@Qualifier("distribTaskExecutor")
	private ThreadPoolTaskExecutor executor;

	@Autowired
	@Qualifier("httpTaskExecutor")
	private ThreadPoolTaskExecutor httpExecutor;
	
	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;
	
	@Autowired(required=false)
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;

	private final TrackingCommandTaskInfoMapper taskMapper;
	private final TrackingTaskProcessingInfoMapper trackingTaskProcessingInfoMapper;	
	private final HttpTaskService httpTaskService;
	
	private final Logger logger = LoggerFactory.getLogger(TrackingCmdPubServiceImpl.class);


	public TrackingCmdPubServiceImpl(TrackingCommandTaskInfoMapper taskMapper, TrackingTaskProcessingInfoMapper trackingTaskProcessingInfoMapper
								, HttpTaskService httpTaskService) {
		this.taskMapper = taskMapper;
		this.trackingTaskProcessingInfoMapper = trackingTaskProcessingInfoMapper;
		this.httpTaskService = httpTaskService;		
	}
	
	
	public void executeTaskProc(HashMap<String, Object> map) throws Exception {
		HashMap<String, Object> pMap = null;

		List<TrackingProcessInfo> trck = taskMapper.getTrackCmdTaskInfoList(map);
		for (int i = 0; i < trck.size(); i++) {
			map.put("trackingProcessId", trck.get(i).getTrackingProcessId());
			map.put("federatedTwinId", trck.get(i).getFederatedTwinId());
			map.put("trackingProcessIdentifier", trck.get(i).getTrackingProcessIdentifier());
		   String status = null;
		   try {
				pMap = insertTaskProc(map);
				kafkaProducer.send((String)map.get("federatedTwinId"), (String)map.get("trackingProcessIdentifier"));
				status = Constant.CTRL_SEQ_TASK_STATUS_COMPLETE;
			}catch (Exception e) {
				try {
					kafkaProducer.send((String)map.get("federatedTwinId"), (String)map.get("trackingProcessIdentifier"));
					status = Constant.CTRL_SEQ_TASK_STATUS_COMPLETE;
				}catch (Exception ex) {
					status = Constant.CTRL_SEQ_TASK_STATUS_ERROR;
				}
			}finally {
				TrackingTaskProcessingInfo prc = trackingTaskProcessingInfoMapper.getTaskProcessingInfo(map);
				prc.setTaskProcessingStatus(status);
				prc.setTaskProcessingResultMsg("COMPLETE");
				trackingTaskProcessingInfoMapper.updateTaskProcessing(prc);
			}
		}
		
		sendConsumer(map);
		sendDetector(map);
		
	}

	
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public HashMap<String, Object> insertTaskProc(HashMap<String, Object> map) throws Exception {
		TrackingTaskProcessingInfo trackingTaskProcessingInfo = new TrackingTaskProcessingInfo();
		
		HashMap<String, Object> pMap = null;
		HashMap<String, Object> procMap = new HashMap<String, Object>();
		
		int requestTrackingId = Integer.parseInt((String)map.get("requestTrackingId")) ;

		pMap = new HashMap<>();
		pMap.put("isProcTaskExists", "TASK");
		pMap.put("trackingStatus", Constant.CTRL_SEQUENCE_STATUS_WAIT);
		pMap.put("trackingProcessId", (int)map.get("trackingProcessId"));
		pMap.put("statusResultMsg", "Sequence Task Proc Update Success");

		int proCnt = updateWithHisAndCtrlCmdSeqInfoTaskProc(pMap);	
		
		
		TrackingProcessInfo trackingSequences = httpTaskService.getControlCommandSequenceInfo(pMap);
		
		trackingTaskProcessingInfo.setTrackingProcessId((int)map.get("trackingProcessId"));
		trackingTaskProcessingInfo.setRequestTrackingId(requestTrackingId);
		trackingTaskProcessingInfo.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_READY);

		int	count = httpTaskService.insertTaskProcessing(trackingTaskProcessingInfo);
			
		if(count > 0) {
			procMap.put("trackingSequences", trackingSequences);
			procMap.put("trackingTaskProcessingInfo", trackingTaskProcessingInfo);									
		} else {
			throw new RuntimeException("****************  Tracking Sequence Task Insert Processing Runtime Error *******************");
		}	
	
		return procMap;
	}
	
	
	private void executeActTypeSequencialProc(TrackingProcessInfo trackingSequenceInfo, TrackingTaskProcessingInfo trackingTaskProcessingInfo) {

		int taskProcessingId = trackingTaskProcessingInfo.getTaskProcessingId();
		String federatedTwinId = trackingSequenceInfo.getFederatedTwinId();
		String federatedDigitalObjectId = trackingSequenceInfo.getFederatedDigitalObjectId();
		String digitalTwinId = trackingSequenceInfo.getDigitalTwinId();
		String digitalObjectId = trackingSequenceInfo.getDigitalObjectId();
		String trackingCommand = trackingSequenceInfo.getTrackingCommand();
		String trackingParam = trackingSequenceInfo.getTrackingKafkaGroup();
		int trackingProcessId = trackingSequenceInfo.getTrackingProcessId();
		int requestTrackingId = trackingSequenceInfo.getRequestTrackingId();

		try {

			HashMap<String, Object> map = new HashMap<>();    	
			map.put("federatedTwinId", federatedTwinId);
			map.put("federatedDigitalObjectId", federatedDigitalObjectId);

			map.put("digitalTwinId", digitalTwinId);
			map.put("digitalObjectId", digitalObjectId);

			map.put("trackingCommand", trackingCommand);
			map.put("trackingParam", trackingParam);
			map.put("taskProcessingId", taskProcessingId);
			map.put("trackingProcessId", trackingProcessId);
			map.put("requestTrackingId", requestTrackingId);


			ControlCommandSequenceTask ctrlCmdSeqTask = null;

			if(Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(trackingSequenceInfo.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(SingleSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_START.equals(trackingSequenceInfo.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(StartSequenceTask.class);
			else if(Constant.CTRL_CMD_SEQUENCE_RUNNING.equals(trackingSequenceInfo.getTrackingProcessType()))
				ctrlCmdSeqTask = ctx.getBean(RunningSequenceTask.class);

			ctrlCmdSeqTask.setTaskParameter(map);

			long strInterval = trackingSequenceInfo.getEventOccurredCount();

			if(strInterval < 1) {
				executor.execute(ctrlCmdSeqTask);			
			} else {
				interValScheduler.schedule(ctrlCmdSeqTask, strInterval, TimeUnit.MILLISECONDS);
			}

		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
			try {				
				HashMap<String, Object> seqMap = new HashMap<String, Object>();
				seqMap.put("trackingStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
				seqMap.put("trackingProcessId", trackingProcessId);
				seqMap.put("statusResultMsg", "Sequence Task Proc Update Error ==> Distribute Task ==> SendingTask");

				this.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);


				TrackingTaskProcessingInfo mtpsi = new TrackingTaskProcessingInfo();
				mtpsi.setTrackingProcessId(trackingProcessId);
				mtpsi.setRequestTrackingId(requestTrackingId);
				mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_ERROR);
				mtpsi.setTaskProcessingId(taskProcessingId);
				trackingTaskProcessingInfoMapper.updateTaskProcessing(mtpsi);

			} catch(Exception ex) {
				logger.error("Error Message : {}" , ex);
			}
			
			throw new RuntimeException("****************  Msa Act Type Sequence Running Processing Runtime Error *******************");
		}
	}
		
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		int proCnt = this.taskMapper.updateTrackingCmdSeqInfoTaskProc(map);

		if(proCnt > 0) {
			this.taskMapper.insertTrackingCmdSeqChangeHisMultiProcInfo(map);			
		}

		return proCnt;
	}
	
	
	
	
	public void sendConsumer(HashMap<String, Object> map) {
		try {
			
			HttpClientBuilder clientbuilder = HttpClients.custom().setConnectionManager(connManager);
			CloseableHttpClient httpClient = clientbuilder.build();
			
			String baseUrl = Constant.TWO_TH_CONN_BASE_URL + ":" + Constant.EUREKA_GATEWAY_CONN_BASE_PORT + "/fdt/detrck/sub/getTopic/" + map.get("requestTrackingId");
			HttpGet httpGet = new HttpGet(baseUrl);
			
			List<NameValuePair> nvps = new ArrayList<>();


			
			URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
			httpGet.setUri(uri);

			httpClient.execute(httpGet, response -> {
				int statusCode = response.getCode();
				HttpEntity entity = response.getEntity();
				if (entity != null) {
					String responseBody = EntityUtils.toString(entity);
				}
				EntityUtils.consume(entity);

				return null;
			});
			
			
		} catch(Exception e ) {
			throw new RuntimeException(e);
		}
		
	}
	
	
	public void sendDetector(HashMap<String, Object> map) {
		try {
			
			HttpClientBuilder clientbuilder = HttpClients.custom().setConnectionManager(connManager);
			CloseableHttpClient httpClient = clientbuilder.build();
			
			String baseUrl = Constant.TWO_TH_CONN_BASE_URL + ":" + Constant.EUREKA_GATEWAY_CONN_BASE_PORT + "/fdt/detrck/det/getTopic/" + map.get("requestTrackingId");
			HttpGet httpGet = new HttpGet(baseUrl);
			
			List<NameValuePair> nvps = new ArrayList<>();


			
			URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
			httpGet.setUri(uri);

			httpClient.execute(httpGet, response -> {
				int statusCode = response.getCode();
				HttpEntity entity = response.getEntity();
				if (entity != null) {
					String responseBody = EntityUtils.toString(entity);
				}
				EntityUtils.consume(entity);

				return null;
			});
			
			
		} catch(Exception e ) {
			throw new RuntimeException(e);
		}
		
	}
	

}
