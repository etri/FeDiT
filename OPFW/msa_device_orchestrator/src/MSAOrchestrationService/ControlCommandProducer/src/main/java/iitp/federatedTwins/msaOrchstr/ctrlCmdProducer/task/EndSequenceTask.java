package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.task;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.net.URIBuilder;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.msaOrchstr.common.config.MSAConfigurationProperties;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandStatusChangeRecord;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.common.util.RabbitMQConstant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.component.RabbitMQComponent;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.CtrlCmdTaskInfoService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.service.HttpTaskService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdProducer.vo.CtrlCmdSeqTaskProcVO;


/**
 * @파일명 : EndSequenceTask.java	
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 : 
 * @description :
 */

@Component
@Scope(value = "prototype")
public class EndSequenceTask extends ControlCommandSequenceTask {

	private final HttpTaskService httpTaskService;

	private final CtrlCmdTaskInfoService ctrlCmdTaskInfoService;

	@Autowired
	MSAConfigurationProperties msaConfigProp;

	@Autowired
	RabbitMQComponent rabbitMqComponent;

	private final Logger logger = LoggerFactory.getLogger(EndSequenceTask.class);

	@Autowired
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	@Autowired
	private MsaControlCommandStatusChangeRecordMapper statusChangeHisMapper;

	@Autowired
	public MsaRequestControlCommandInfoMapper msaRequestControlCommandInfoMapper;


	public EndSequenceTask(HttpTaskService httpTaskService, CtrlCmdTaskInfoService ctrlCmdTaskInfoService) {
		this.httpTaskService = httpTaskService;
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;		
	}


	@Override
	public void run() {
		logger.info(Thread.currentThread().getName() + " - Start run() ==> "+TASK_PROC_STEP);

		try {
			CtrlCmdSeqTaskProcVO ctrSeqTaskProcInfo = null;
			//실행할 시퀀스 정보를 조회해와서 실행조건에 맞게 실행시킨다.
			HashMap<String, Object> pMap = new HashMap<String, Object>();
			pMap.put("ctrlCmdSequenceId", taskParam.get("ctrlCmdSequenceId"));
			pMap.put("taskProcessingId", taskParam.get("taskProcessingId"));

			ctrSeqTaskProcInfo = ctrlCmdTaskInfoService.getControlCommandSequenceTaskProcInfo(pMap);

			if(!Constant.CTRL_CMD_STATUS_COMPLETE.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus()) 
					&& !Constant.CTRL_CMD_STATUS_ERROR.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus())
					&& !Constant.CTRL_CMD_STATUS_TIMEOUT.equals(ctrSeqTaskProcInfo.getReqCtrlCmdStatus())
					&& !Constant.CTRL_SEQUENCE_STATUS_COMPLETE.equals(ctrSeqTaskProcInfo.getSequenceStatus()) 
					&& !Constant.CTRL_SEQUENCE_STATUS_ERROR.equals(ctrSeqTaskProcInfo.getSequenceStatus())
					) {
				if("RUNNING".equals(TASK_PROC_STEP)) {
					//한개의 시퀀스만 조회되어야 한다. 
					if(ctrSeqTaskProcInfo == null ) {
						throw new RuntimeException("**************** Error Occured which Failed to retrieve registered MSA data *******************");
					} else {
						//MsaTaskProcessingInfo Running 상태로 업데이트
						MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
						mtpsi.setCtrlCmdSequenceId(ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
						mtpsi.setRequestControlCommandId(ctrSeqTaskProcInfo.getRequestControlCommandId());
						mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_RUNNING);
						mtpsi.setTaskProcessingId(ctrSeqTaskProcInfo.getTaskProcessingId());
						httpTaskService.updateTaskProcessing(mtpsi);

						//Thread Pool Execute 하면 시퀀스 정보 Running 상태로 업데이트					
						HashMap<String, Object> seqMap = new HashMap<String, Object>();
						seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_RUNNING);
						seqMap.put("ctrlCmdSequenceId", ctrSeqTaskProcInfo.getCtrlCmdSequenceId());
						seqMap.put("statusResultMsg", "Sequence Task Proc Update Success");

						this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
					}

					//종료 인터벌이 있으면 인터벌 적용
					long nextInterval = ctrSeqTaskProcInfo.getNextInterval();
					if(nextInterval > 0) {
						try {
							logger.debug("*************  Next Interval Start Thread Sleep ==> "+nextInterval);
							TASK_PROC_STEP = "NEXT_INTERVAL_STEP";
							interValScheduler.schedule(this, nextInterval, TimeUnit.MILLISECONDS);			
						} catch (RejectedExecutionException ex) {
							logger.error("Error Message : {}" , ex);
							throw new TaskRejectedException("Executor [" + interValScheduler + "] did not accept task: " + this, ex);
						}catch(Exception e) {
							logger.error("Error Message : {}" , e);
						}
					}else {
						executeNextSequenceProc(ctrSeqTaskProcInfo);
					}
				} else {
					executeNextSequenceProc(ctrSeqTaskProcInfo);
				}
			}
		}catch(Exception e) {
			logger.error("Error Message : {}" , e);
		}
	}

	protected boolean checkNextStepFilter(MsaControlCommandSequenceInfo msaSeqInfo) {		
		return true;
	}


	@Override
	protected void executeNextSequenceProc(MsaControlCommandSequenceInfo msaSeqInfo) {
		CtrlCmdSeqTaskProcVO msaCtrlCmdSeqTaskProc = (CtrlCmdSeqTaskProcVO)msaSeqInfo;
		try {			
			//실행된 Process Task 정보 업데이트				
			MsaTaskProcessingInfo mtpsi = new MsaTaskProcessingInfo();
			mtpsi.setCtrlCmdSequenceId(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			mtpsi.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			mtpsi.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);
			mtpsi.setTaskProcessingId(msaCtrlCmdSeqTaskProc.getTaskProcessingId());

			httpTaskService.updateTaskProcessing(mtpsi);

			//시퀀스 정보 성공 업데이트 
			HashMap<String, Object> seqMap = new HashMap<String, Object>();
			seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
			seqMap.put("ctrlCmdSequenceId", msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId());
			seqMap.put("statusResultMsg", "=== Sequence Task Proc Update Success ===");
			this.ctrlCmdTaskInfoService.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);


			MsaControlCommandStatusChangeRecord msaCh = new MsaControlCommandStatusChangeRecord();
			msaCh.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			msaCh.setChangeStatus(Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
			msaCh.setStatusResultMsg("End Task Process Success");

			statusChangeHisMapper.insertControlCommandStatusChangeHistory(msaCh);

			HashMap<String, Object> pMap = new HashMap<String, Object>();
			JSONObject json = new JSONObject();
			pMap.put("requestControlCommandId", String.valueOf(msaCtrlCmdSeqTaskProc.getRequestControlCommandId()));
			pMap.put("ctrlCmdSequenceId", String.valueOf(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId()));
			json.put("requestControlCommandId", String.valueOf(msaCtrlCmdSeqTaskProc.getRequestControlCommandId()));
			json.put("ctrlCmdSequenceId", String.valueOf(msaCtrlCmdSeqTaskProc.getCtrlCmdSequenceId()));
			
			//메소드 호출 실시
			rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);
			
			//여기까지 왔다는건 정상적으로 처리가된 상태... 완료상태로 업데이트
			MsaRequestControlCommandInfo tt = new MsaRequestControlCommandInfo();
			tt.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_COMPLETE);
			tt.setRequestControlCommandId(msaCtrlCmdSeqTaskProc.getRequestControlCommandId());
			int upd3 = msaRequestControlCommandInfoMapper.updateMsaRequestControlCommandInfo(tt);

		} catch (Exception e) {
			logger.error("Error Message : {}" , e);
		}	
	}

	protected boolean executeHttpConnection(MsaControlCommandSequenceInfo msaSeqInfo) {
		return returnBool;
	}


	protected String statusCode;
	public void httpGetConnection(String baseUrl) {		
		try {
			HttpClientBuilder clientbuilder = HttpClients.custom().setConnectionManager(connManager);

			CloseableHttpClient httpClient = clientbuilder.build();

			HttpGet httpGet = new HttpGet(baseUrl);


			URI uri = new URIBuilder(new URI(baseUrl)).build();
			httpGet.setUri(uri);

			httpClient.execute(httpGet, response -> {

				int statusCode = response.getCode();
				logger.info(Thread.currentThread().getName() + " Status code: " + statusCode);

				HttpEntity entity = response.getEntity();
				if (entity != null) {
					String responseBody = EntityUtils.toString(entity);
					logger.info(Thread.currentThread().getName() + " | responseBody: " + responseBody);
				}
				EntityUtils.consume(entity);

				return null;
			});
		} catch (URISyntaxException e) {
			throw new RuntimeException(e);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}		
	}

}
