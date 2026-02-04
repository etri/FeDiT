package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.service.impl;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.msaOrchstr.common.config.MSAConfigurationProperties;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandStatusChangeRecord;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaRequestControlCommandInfo;
import iitp.federatedTwins.msaOrchstr.common.dto.MsaSequenceStatusChangeRecord;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandSequenceInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaControlCommandStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaRequestControlCommandInfoMapper;
import iitp.federatedTwins.msaOrchstr.common.mapper.MsaSequenceStatusChangeRecordMapper;
import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.common.util.RabbitMQConstant;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.component.RabbitMQComponent;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.parser.CtrlCmdFactory;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.service.ControlCommandService;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.ControlCommandVO;
import iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo.CtrlSequencesVO;

/**
 * @파일명 : CtrlCmdRcvController.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */

@Service
public class ControlCommandServiceImpl implements ControlCommandService {
	@Autowired
	private CtrlCmdFactory ctrlCmdFactory;
	
	@Autowired
	MSAConfigurationProperties msaConfigProp;

	private final MsaRequestControlCommandInfoMapper msaReqCtrlCmdMapper;
	private final MsaControlCommandSequenceInfoMapper msaSequenceMapper;
	private final MsaSequenceStatusChangeRecordMapper msaSeqStatusChangeHisMapper;
	
	@Autowired
	RabbitMQComponent rabbitMqComponent;

	// MSA 제어명령 이력생성 여부
	@Value("${iitp.fedit.orchstr.req-ctrl-cmd.recoring-type}")
	public boolean CTRL_CMD_REQ_RECORDING_TYPE = false;

	@Autowired
	private MsaControlCommandStatusChangeRecordMapper statusChangeHisMapper;
	
	private final Logger logger = LoggerFactory.getLogger(ControlCommandServiceImpl.class);

	public ControlCommandServiceImpl(MsaRequestControlCommandInfoMapper msaReqCtrlCmdMapper,
			MsaControlCommandSequenceInfoMapper msaSequenceMapper,
			MsaSequenceStatusChangeRecordMapper msaSeqStatusChangeHisMapper) {
		this.msaReqCtrlCmdMapper = msaReqCtrlCmdMapper;
		this.msaSequenceMapper = msaSequenceMapper;
		this.msaSeqStatusChangeHisMapper = msaSeqStatusChangeHisMapper;
	}
	
	public HttpStatus procRequestControlCommand(ControlCommandVO controlCommand) throws Exception {		
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;
		
		HashMap<String, String> param = new HashMap<String, String>();
		try {
			HashMap<String, Object> data = insertRequestControlCommand(controlCommand);
			
			JSONObject json = new JSONObject();
			json.put("requestControlCommandId", String.valueOf(data.get("requestControlCommandId")));
			json.put("ctrlCmdSequenceId", String.valueOf(data.get("ctrlCmdSequenceId")));
			
			param.put("requestControlCommandId", String.valueOf(data.get("requestControlCommandId")));
			param.put("ctrlCmdSequenceId", String.valueOf(data.get("ctrlCmdSequenceId")));

			rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_REQ_CTRL_COMMAND_SEND);
			//***********************************************************************//		
			
			procStat = Constant.HTTP_CREATE_STAT;
		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
			procStat = Constant.HTTP_SERVER_ERROR_STAT;
		}finally {
			try {
				if(procStat == Constant.HTTP_SERVER_ERROR_STAT)
					updateStatusCtrlSeqCmdData(param);
			} catch(Exception e) {
				e.printStackTrace();
				procStat = Constant.HTTP_SERVER_ERROR_STAT;
			}
		}
		return procStat;		
	}	
	
	
	public HttpStatus procRequestRegisteFdtObjData(ControlCommandVO controlCommand) throws Exception {		
		HttpStatus procStat = Constant.HTTP_SERVER_ERROR_STAT;
		
		HashMap<String, String> param = new HashMap<String, String>();
		try {
			HashMap<String, Object> data = insertRequestRegisteFdtObjData(controlCommand);
			//***********************************************************************//			
			
			JSONObject json = new JSONObject();
			json.put("requestControlCommandId", String.valueOf(data.get("requestControlCommandId")));
			json.put("ctrlCmdSequenceId", String.valueOf(data.get("ctrlCmdSequenceId")));
			
			param.put("requestControlCommandId", String.valueOf(data.get("requestControlCommandId")));
			param.put("ctrlCmdSequenceId", String.valueOf(data.get("ctrlCmdSequenceId")));

			rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_REQ_CTRL_COMMAND_SEND);
			//***********************************************************************//			
			
			procStat = Constant.HTTP_CREATE_STAT;
		} catch(Exception e) {
			logger.error("Error Message : {}" , e);
			procStat = Constant.HTTP_SERVER_ERROR_STAT;
		}finally {
			try {
				if(procStat == Constant.HTTP_SERVER_ERROR_STAT)
					updateStatusCtrlSeqCmdData(param);
			} catch(Exception e) {
				e.printStackTrace();
				procStat = Constant.HTTP_SERVER_ERROR_STAT;
			}
		}
		return procStat;
	}
	
	
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public void updateStatusCtrlSeqCmdData(HashMap<String, String> param) throws Exception {
		MsaRequestControlCommandInfo controlCommand = new MsaRequestControlCommandInfo();
		controlCommand.setRequestControlCommandId(Integer.valueOf((String)param.get("requestControlCommandId")).intValue());
		controlCommand.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_ERROR);
		this.msaReqCtrlCmdMapper.updateMsaRequestControlCommandInfo(controlCommand);
		
		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("requestControlCommandId", Integer.valueOf((String)param.get("requestControlCommandId")));
		data.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
		
		msaSequenceMapper.updateControlCommandSequenceByParam(data);
		
	}
	
	
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public HashMap<String, Object> insertRequestRegisteFdtObjData(ControlCommandVO controlCommand) throws Exception {
		int requestControlCommandId = -1, regCnt = 0, ctrlCmdSequenceId = -1, regSeqCnt = 0;
		
		HashMap<String, Object> data = new HashMap<String, Object>();
		
		// Factory를 통한 명령 생성
		MsaRequestControlCommandInfo mrcc = ctrlCmdFactory.makeDefaultCtrlCmdInfo(controlCommand);

		// 장비 등록 제어명령 등록처리
		regCnt = this.msaReqCtrlCmdMapper.insertMsaRequestControlCommandInfo(mrcc);

		// 장비 등록이 정상이라면 등록 이후 생성 객체에 자동으로 생성되는 제어요청ID 값을 가지고 와서 제어시퀀스 단일 실행정보에 셋팅
		if (regCnt > 0) {
			requestControlCommandId = mrcc.getRequestControlCommandId();

			if (requestControlCommandId > -1) {
				
				data.put("requestControlCommandId", requestControlCommandId);
				
				// 장비 등록 제어명령 생성 이력등록
				if(CTRL_CMD_REQ_RECORDING_TYPE) {
					MsaControlCommandStatusChangeRecord msaCh = new MsaControlCommandStatusChangeRecord();
					msaCh.setRequestControlCommandId(requestControlCommandId);
					msaCh.setChangeStatus(mrcc.getReqCtrlCmdStatus());
					msaCh.setStatusResultMsg("Request Command Insert Success");

					statusChangeHisMapper.insertControlCommandStatusChangeHistory(msaCh);
				}

				// Factory를 통한 명령 생성
				CtrlSequencesVO ctrlSequence = controlCommand.getCtrlSequences()[0];
				
				
				ctrlSequence.setRequestControlCommandId(requestControlCommandId);
				MsaControlCommandSequenceInfo seqInfo = ctrlCmdFactory
						.makeDefaultCtrlCmdSequenceInfo(Constant.CTRL_CMD_REQ_TYPE_REG_DV, ctrlSequence);

				// 장비 등록처리에 대한 제어시퀀스 단위 실행정보 등록
				
				regSeqCnt = msaSequenceMapper.insertControlCommandSequence(seqInfo);

				// 장비 등록이 정상이라면 등록 이후 생성 객체에 자동으로 생성되는 시퀀스ID 값을 가지고 와서 이력정보에 사용하기 위해서 정보를 저장
				if (regSeqCnt > 0)
					ctrlCmdSequenceId = seqInfo.getCtrlCmdSequenceId();

				if (ctrlCmdSequenceId > -1) {
					data.put("ctrlCmdSequenceId", ctrlCmdSequenceId);
					
					// 장비 등록 제어명령 생성 이력등록
					if(CTRL_CMD_REQ_RECORDING_TYPE) {
						MsaSequenceStatusChangeRecord mssh = new MsaSequenceStatusChangeRecord();

						mssh.setCtrlCmdSequenceId(ctrlCmdSequenceId);
						mssh.setRequestControlCommandId(requestControlCommandId);
						mssh.setChangeStatus(seqInfo.getSequenceStatus());
						mssh.setStatusResultMsg("Request Command Sequence Insert Success");

						msaSeqStatusChangeHisMapper.insertSequenceStatusChangeHistory(mssh);
					}
				} else {
					// 시퀀스 제어명령 생성 이력등록
					throw new RuntimeException(
							"****************  Request Sequence Command Insert Processing Runtime Error *******************");
				}
			} else {
				// 장비 등록 제어명령 생성 이력등록
				throw new RuntimeException(
						"****************  Request Command Insert Processing Runtime Error *******************");
			}
		} else {
			// 장비 등록 제어명령 생성 이력등록
			throw new RuntimeException(
					"****************  Request Command Insert Processing Runtime Error *******************");
		}

		data.put("regCnt", String.valueOf(regCnt));
		
		return data;
	}
	

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public HashMap<String, Object> insertRequestControlCommand(ControlCommandVO controlCommand) throws Exception {
		int requestControlCommandId = -1, regCnt = 0, ctrlCmdSequenceId = -1, regSeqCnt = 0, stsCtrlCmdSeq = -1;

		HashMap<String, Object> data = new HashMap<String, Object>();

		// Factory를 통한 명령 생성
		MsaRequestControlCommandInfo mrcc = ctrlCmdFactory.makeDefaultCtrlCmdInfo(controlCommand);

		// 장비 제어명령 처리
		regCnt = this.msaReqCtrlCmdMapper.insertMsaRequestControlCommandInfo(mrcc);
		// 제어 명령 등록이 정상이라면 등록 이후 생성 객체에 자동으로 생성되는 제어요청ID 값을 가지고 와서 제어시퀀스 단일 실행정보에 셋팅
		if (regCnt > 0) {
			requestControlCommandId = mrcc.getRequestControlCommandId();

			if (requestControlCommandId > -1) {
				data.put("requestControlCommandId", requestControlCommandId);
				// 제어명령 생성 이력등록
				if(CTRL_CMD_REQ_RECORDING_TYPE) {
					MsaControlCommandStatusChangeRecord msaCh = new MsaControlCommandStatusChangeRecord();
					msaCh.setRequestControlCommandId(requestControlCommandId);
					msaCh.setChangeStatus(mrcc.getReqCtrlCmdStatus());
					msaCh.setStatusResultMsg("Request Command Insert Success");

					statusChangeHisMapper.insertControlCommandStatusChangeHistory(msaCh);
				}

				// Factory를 통한 명령 생성
				for (CtrlSequencesVO ctrlSequence : controlCommand.getCtrlSequences()) {
					ctrlCmdSequenceId = -1;
					regSeqCnt = 0;
					// 제어 명령 등록처리 제어시퀀스 단위정보 등록
					ctrlSequence.setRequestControlCommandId(requestControlCommandId);
					MsaControlCommandSequenceInfo seqInfo = ctrlCmdFactory
							.makeDefaultCtrlCmdSequenceInfo(Constant.CTRL_CMD_REQ_TYPE_CTRL_DV, ctrlSequence);

					// 장비 등록처리에 대한 제어시퀀스 단위 실행정보 등록
					regSeqCnt = msaSequenceMapper.insertControlCommandSequence(seqInfo);

					// 장비 등록이 정상이라면 등록 이후 생성 객체에 자동으로 생성되는 시퀀스ID 값을 가지고 와서 이력정보에 사용하기 위해서 정보를 저장
					if (regSeqCnt > 0)
						ctrlCmdSequenceId = seqInfo.getCtrlCmdSequenceId();

					if (ctrlCmdSequenceId > -1) {
						if(Constant.CTRL_CMD_SEQUENCE_START.equals(seqInfo.getSequenceActType()) || Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(seqInfo.getSequenceActType())) {
							stsCtrlCmdSeq = ctrlCmdSequenceId;
							data.put("ctrlCmdSequenceId", ctrlCmdSequenceId);						
						}

						// 장비 제어 제어명령 생성 이력등록
						if(CTRL_CMD_REQ_RECORDING_TYPE) {
							MsaSequenceStatusChangeRecord mssh = new MsaSequenceStatusChangeRecord();

							mssh.setCtrlCmdSequenceId(ctrlCmdSequenceId);
							mssh.setRequestControlCommandId(requestControlCommandId);
							mssh.setChangeStatus(seqInfo.getSequenceStatus());
							mssh.setStatusResultMsg("Request Command Sequence Insert Success");

							msaSeqStatusChangeHisMapper.insertSequenceStatusChangeHistory(mssh);
						}
					} else {
						// 시퀀스 제어명령 생성 이력등록
						throw new RuntimeException(
								"****************  Request Sequence Command Insert Processing Runtime Error *******************");
					}
				}
			} else {
				// 장비 등록 제어명령 생성 시 에러 발생 이력
				throw new RuntimeException(
						"****************  Request Command Insert Processing Runtime Error *******************");
			}
		} else {

		}

		data.put("regCnt", String.valueOf(regCnt));

		return data;
	}

}
