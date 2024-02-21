package iitp.federatedTwins.msaOrchstr.rsDtConsumer.service.impl;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

import iitp.federatedTwins.msaOrchstr.common.config.MSAConfigurationProperties;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskProcessingInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskResponseRecord;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandSequenceInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaTaskProcessingInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaTaskResponseRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaTaskSendingInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.mapper.MsaControlCommandTaskInfoMapper;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.service.RsDtConsumerService;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.vo.CtrlCmdSeqTaskProcVO;

@Service
public class RsDtConsumerServiceImpl implements RsDtConsumerService {
	private final Logger logger = LoggerFactory.getLogger(RsDtConsumerService.class);

	@Autowired
	private ScriptEngine scriptEngine;

	@Autowired
	MSAConfigurationProperties msaConfigProp;

	@Autowired
	@Qualifier("poolHttpClient")
	private CloseableHttpClient poolHttpClient;

	@Autowired
	public MsaTaskSendingInfoMapper msaTaskSendingInfoMapper;

	@Autowired
	public MsaTaskResponseRecordMapper msaReceiveResultDataInfoMapper;

	@Autowired
	public MsaTaskProcessingInfoMapper msaTaskProcessingInfoMapper;

	@Autowired
	public MsaControlCommandSequenceInfoMapper msaControlCommandSequenceInfoMapper;

	@Autowired
	public MsaRequestControlCommandInfoMapper msaRequestControlCommandInfoMapper;

	@Autowired
	public MsaControlCommandTaskInfoMapper msaControlCommandTaskInfoMapper;

	@Transactional(readOnly = true)
	public MsaTaskSendingInfo getTaskSendingInfo(HashMap<String, Object> map) throws Exception {
		return msaTaskSendingInfoMapper.getTaskSendingInfo(map);
	}

	@Transactional(readOnly = true)
	public MsaControlCommandSequenceInfo getControlCommandSequenceInfo(HashMap<String, Object> map) throws Exception {
		return msaControlCommandSequenceInfoMapper.getControlCommandSequenceInfo(map);
	}

	@Transactional
	public int insertMsaReceiveResultData(MsaTaskResponseRecord rd) throws Exception {
		return msaReceiveResultDataInfoMapper.insertReceiveResultData(rd);
	}

	@Transactional
	public int updateTaskProcessing(MsaTaskProcessingInfo msa) throws Exception {
		return msaTaskProcessingInfoMapper.updateTaskProcessing(msa);
	}

	@Transactional
	public int updateControlCommandSequence(MsaControlCommandSequenceInfo csi) throws Exception {
		return msaControlCommandSequenceInfoMapper.updateControlCommandSequence(csi);
	}

	public CtrlCmdSeqTaskProcVO getControlCommandSequenceTaskProcInfo(HashMap<String, Object> map) throws Exception {
		return msaControlCommandTaskInfoMapper.getControlCommandSequenceTaskProcInfo(map);
	}

	public HttpStatus procReceiveResultData(HashMap<String, Object> param) throws Exception {
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;
		HashMap<String, Object> data = null;

		try {
			data = regReceiveResultData(param);

			executeActTypeVailidProc(data);

			procStat = Constant.HTTP_OK_STAT;
		} catch (Exception e) {
			e.printStackTrace();
		}

		return procStat;
	}

	private boolean procLogicalExpression(String logicalExpr, Object rtnVal) {
		Boolean procBool = false;

		StringBuilder sb = new StringBuilder();
		try {
			logger.debug(">>>>>>>>>>>  procLogicalExpression logicalExpr  >>>>>>>>>>> " + logicalExpr);
			logger.debug(">>>>>>>>>>>  procLogicalExpression rtnVal  >>>>>>>>>>> " + rtnVal);

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

			logger.debug(">>>>>>>>>>>  procLogicalExpression procBool  >>>>>>>>>>> " + procBool);
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println(String.format("ScriptException while running js code: {}", ""));
		}

		return procBool;
	}

	// 수신한 정보를 저장하고 실행중인 타스크, 시퀀스 상태를 업데이트
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public HashMap<String, Object> regReceiveResultData(HashMap<String, Object> param) throws Exception {
		logger.debug("Start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
				+ param.get("ctrlIdentifier"));

		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("taskSendingIdentifiier", param.get("ctrlIdentifier"));

		// 들어온 데이터 저장하는 부분
		// 데이터 파싱/벨리데이션 추가
		HashMap<String, Object> map = new HashMap<>();
		map.put("taskSendingIdentifiier", param.get("ctrlIdentifier"));

		MsaTaskSendingInfo si = msaTaskSendingInfoMapper.getTaskSendingInfo(map);
		if (si == null) {
			throw new RuntimeException("**************** MsaTaskSendingInfo Null or Empty Error *******************");
		}

		String controlResult = null, recieveVal = null;
		try {
			JSONParser parser = new JSONParser();
			JSONObject json = (JSONObject) parser.parse((String) param.get("controlResult"));

			controlResult = (String) param.get("controlResult");
			recieveVal = "" + json.get("status_code");
		} catch (Exception e) {
			e.printStackTrace();
		}

		MsaTaskResponseRecord rd = new MsaTaskResponseRecord();
		rd.setTaskSendingId(si.getTaskSendingId());
		rd.setTaskProcessingId(si.getTaskProcessingId());
		rd.setCtrlCmdSequenceId(si.getCtrlCmdSequenceId());
		rd.setRequestControlCommandId(si.getRequestControlCommandId());
		rd.setReceiveStatus(Constant.CTRL_SEQ_RES_RECIEVE_STS_CMP);
		rd.setReceiveVal(recieveVal);
		rd.setReceiveMsg(controlResult);

		int res = msaReceiveResultDataInfoMapper.insertReceiveResultData(rd);

		logger.debug("center >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

		// 데이터 상태변경 처리 부분
		// 향후 상태변경부분만 발췌하여 메소드화 작업 진행
		if (res > 0) {
			data.put("MsaTaskResponseRecord", rd);

			MsaTaskProcessingInfo msa = new MsaTaskProcessingInfo();
			msa.setTaskProcessingId(si.getTaskProcessingId());
			msa.setCtrlCmdSequenceId(si.getCtrlCmdSequenceId());
			msa.setRequestControlCommandId(si.getRequestControlCommandId());
			msa.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);
			msa.setTaskProcessingResultMsg("CMP");

			MsaTaskSendingInfo mts = new MsaTaskSendingInfo();
			mts.setTaskSendingId(si.getTaskSendingId());
			mts.setTaskProcessingId(si.getTaskProcessingId());
			mts.setCtrlCmdSequenceId(si.getCtrlCmdSequenceId());
			mts.setRequestControlCommandId(si.getRequestControlCommandId());
			mts.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_RES);
			mts.setTaskReceiveResultMsg("OK");

			// 2세부에 전송한 정보에 수신한 정보 업데이트
			int updTs = msaTaskSendingInfoMapper.updateTaskSending(mts);
			// 전송한 타스크에 대한 완료 상태 변경처리
			int updTp = msaTaskProcessingInfoMapper.updateTaskProcessing(msa);
		} else {
			throw new RuntimeException(
					"**************** MsaTaskResponseRecord Insert Processing Runtime Error *******************");
		}

		logger.debug("End >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
				+ map.get("taskSendingIdentifiier"));

		return data;
	}

	/*
	 * 1. 시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리 2. 변경된 시퀀스 정보의 이력을 남기는 쿼리
	 */
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		// 시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
		int proCnt = this.msaControlCommandTaskInfoMapper.updateCtrlCmdSeqInfoTaskProc(map);

		// 상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
		if (proCnt > 0) {
			// 변경된 시퀀스 정보의 이력을 남기는 쿼리
			this.msaControlCommandTaskInfoMapper.insertCtrlCmdSeqChangeHisMultiProcInfo(map);
		}

		return proCnt;
	}

	// 데이터 저장/상태변경 처리 후 다음시퀀스/연결시퀀스 동작을 위한 준비/확인 및 필터링 조건처리작업을 진행
	private void executeActTypeVailidProc(HashMap<String, Object> map) {
		try {
			MsaTaskResponseRecord rd = (MsaTaskResponseRecord) map.get("MsaTaskResponseRecord");

			HashMap<String, Object> data = new HashMap<String, Object>();
			HashMap<String, Object> param = new HashMap<>();
			param.put("requestControlCommandId", rd.getRequestControlCommandId());
			param.put("ctrlCmdSequenceId", rd.getCtrlCmdSequenceId());

			MsaControlCommandSequenceInfo mccs = msaControlCommandSequenceInfoMapper
					.getControlCommandSequenceInfo(param);

			if (mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_SINGLE)) {
				MsaRequestControlCommandInfo tt = new MsaRequestControlCommandInfo();
				tt.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_COMPLETE);
				tt.setRequestControlCommandId(mccs.getRequestControlCommandId());

				int upd3 = msaRequestControlCommandInfoMapper.updateMsaRequestControlCommandInfo(tt);

				data.put("sequenceActType", mccs.getSequenceActType());
				data.put("requestControlCommandId", mccs.getRequestControlCommandId());
				data.put("ctrlCmdSequenceId", mccs.getCtrlCmdSequenceId());
			} else if (mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_RUNNING)) {

				String logicalExpr = mccs.getLogicalExpression(); // "((rtnVal > 100 && rtnVal < 1000) || ( rtnVal ==
																	// \"ON\"))";
				boolean checkExpr = true;

				if (!"".equals(logicalExpr)) {
					checkExpr = procLogicalExpression(logicalExpr, rd.getReceiveVal());
				}

				if (!checkExpr) {
					// 종료조건에 만족하지 못했을 경우 현재 실행중인 시퀀스를 재 전송을 위
					data.put("sequenceActType", mccs.getSequenceActType());
					data.put("requestControlCommandId", mccs.getRequestControlCommandId());
					data.put("ctrlCmdSequenceId", mccs.getCtrlCmdSequenceId());
				} else {
					// 종료조건에 만족했기때문에 연결시퀀스 작업을 진행하면서 현재 동작중인 시퀀스를 종료처리한다.
					// 시퀀스 상태를 에러 상태로 업데이트
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
					seqMap.put("ctrlCmdSequenceId", rd.getCtrlCmdSequenceId());
					seqMap.put("statusResultMsg", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);

					this.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);

					// 연결시퀀스를 확인하는 부분
					param.clear();
					param.put("sequenceIdentifier", mccs.getNextSequenceIdentifier());

					MsaControlCommandSequenceInfo nxtSeq = msaControlCommandSequenceInfoMapper
							.getControlCommandSequenceInfo(param);

					data.put("sequenceActType", nxtSeq.getSequenceActType());
					data.put("requestControlCommandId", nxtSeq.getRequestControlCommandId());
					data.put("ctrlCmdSequenceId", nxtSeq.getCtrlCmdSequenceId());
				}
			}

			sendProducerCmd(data);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void sendProducerCmd(HashMap<String, Object> data) throws Exception {

		String url = msaConfigProp.getEurekaGatewayConnBaseUrl() + ":" + msaConfigProp.getEurekaGatewayConnBasePort()
				+ "/fdt/msaoc";

		HashMap<String, Object> param = new HashMap<String, Object>();

		if (Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(data.get("sequenceActType"))
				|| Constant.CTRL_CMD_SEQUENCE_END.equals(data.get("sequenceActType"))) {
			url += "/tsm/transmitter/" + String.valueOf(data.get("requestControlCommandId"));
		} else {
			url += "/prd/ctrlCmd/taskProc";
			param.put("requestControlCommandId", String.valueOf(data.get("requestControlCommandId")));
			param.put("ctrlCmdSequenceId", String.valueOf(data.get("ctrlCmdSequenceId")));
		}

		// 메소드 호출 실시
		try {
			httpGetConnection(url, param);
		} catch (Exception e) {
			e.printStackTrace();
		}

		if (Constant.CTRL_CMD_SEQUENCE_END.equals(data.get("sequenceActType"))) {
			// 시퀀스 상태를 에러 상태로 업데이트
			HashMap<String, Object> seqMap = new HashMap<String, Object>();
			seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
			seqMap.put("ctrlCmdSequenceId", String.valueOf(data.get("ctrlCmdSequenceId")));
			seqMap.put("statusResultMsg", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);

			this.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
		}

	}

	protected String statusCode;

	public void httpGetConnection(String baseUrl, HashMap<String, Object> ParamData) throws URISyntaxException {

		HttpGet httpGet = new HttpGet(baseUrl);

		List<NameValuePair> nvps = new ArrayList<>();

		for (Entry<String, Object> entrySet : ParamData.entrySet()) {
			nvps.add(new BasicNameValuePair(entrySet.getKey(), (String) entrySet.getValue()));

			System.out.println(entrySet.getKey() + " : " + entrySet.getValue());
		}

		URI uri = new URIBuilder(new URI(baseUrl)).addParameters(nvps).build();
		httpGet.setUri(uri);

		logger.info("http GetConnection Url ===> " + httpGet.getPath());

		try {
			try (CloseableHttpResponse response = poolHttpClient.execute(httpGet)) {
				statusCode = String.valueOf(response.getCode());
				logger.info(Thread.currentThread().getName() + " - status code: " + statusCode);

				HttpEntity entity = response.getEntity();
				if (entity != null) {
					try {
						String responseBody = EntityUtils.toString(entity);
						logger.info(Thread.currentThread().getName() + "- responseBody: " + responseBody);

						if (!"".equals(responseBody)) {
							JSONParser parser = new JSONParser();
							JSONObject json = (JSONObject) parser.parse(responseBody);

							StringBuilder sb = new StringBuilder();
							sb.append("status : " + json.get("statusCode"));
							sb.append("  |  error : " + json.get("httpStatus"));
							statusCode = sb.toString();
						}
					} catch (Exception e) {
						e.printStackTrace();
						statusCode = String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value());
					}
				}
				EntityUtils.consume(entity);
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
