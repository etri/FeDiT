package iitp.federatedTwins.msaOrchstr.rsDtConsumer.task;

import java.util.HashMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;

import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.common.abstractclass.ControlCommandSequenceTask;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.service.RsDtConsumerService;

/**
 * @파일명 : DataValidationTask.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */

@Component
@Scope(value = "prototype")
public class DataValidationTask extends ControlCommandSequenceTask {

	private final Logger logger = LoggerFactory.getLogger(DataValidationTask.class);

	@Autowired
	@Qualifier("poolHttpClientConnManager")
	private PoolingHttpClientConnectionManager connManager;

	@Autowired
	@Qualifier("scheduleHttpTaskExecutor")
	private ScheduledThreadPoolExecutor interValScheduler;

	@Autowired
	public RsDtConsumerService rsDtConsumerService;

	@Override
	public void run() {
	}

	@Override
	protected void executeNextSequenceProc(MsaControlCommandSequenceInfo msaSeqInfo) {

	}

	protected String statusCode;

	protected boolean executeHttpConnection(MsaControlCommandSequenceInfo msaSeqInfo, String baseUrl,
			HashMap<String, Object> ParamData) {

		return returnBool;
	}

	protected boolean checkNextStepFilter(MsaControlCommandSequenceInfo msaSeqInfo) {
		return true;
	}

	protected boolean executeHttpConnection(MsaControlCommandSequenceInfo msaSeqInfo) {
		return true;
	}
}
