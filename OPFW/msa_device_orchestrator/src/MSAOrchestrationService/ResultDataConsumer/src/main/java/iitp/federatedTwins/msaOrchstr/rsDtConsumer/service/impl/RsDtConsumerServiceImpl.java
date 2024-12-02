package iitp.federatedTwins.msaOrchstr.rsDtConsumer.service.impl;

import java.util.HashMap;

import javax.script.Bindings;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
import iitp.federatedTwins.msaOrchstr.common.util.RabbitMQConstant;
import iitp.federatedTwins.msaOrchstr.rsDtConsumer.component.RabbitMQComponent;
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
	
	@Autowired
	RabbitMQComponent rabbitMqComponent;
	
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
			
			// 현재 시퀀스 상태정보 확인
			HashMap<String, Object> map = new HashMap<>();
			map.put("taskSendingIdentifier", param.get("reqCtrlCmdIdentifier"));
			MsaTaskSendingInfo si = msaTaskSendingInfoMapper.getTaskSendingInfo(map);
			
			map.put("ctrlCmdSequenceId", si.getCtrlCmdSequenceId());
			map.put("requestControlCommandId", si.getRequestControlCommandId());
			
			MsaControlCommandSequenceInfo msaCtrlCmdSeqInfo = msaControlCommandSequenceInfoMapper.getControlCommandSequenceInfo(map);
			
			logger.info("SequenceStatus : {}", msaCtrlCmdSeqInfo.getSequenceStatus());
			
			if(!msaCtrlCmdSeqInfo.getSequenceStatus().equals(Constant.CTRL_SEQUENCE_STATUS_COMPLETE) 
					&& !msaCtrlCmdSeqInfo.getSequenceStatus().equals(Constant.CTRL_SEQUENCE_STATUS_TIMEOUT)
					&& !msaCtrlCmdSeqInfo.getSequenceStatus().equals(Constant.CTRL_SEQUENCE_STATUS_ERROR)
				) {
				//컨슈머로 들어오는 리시브 데이터저장 및 프로세스 정보 업데이트처리  
				data = regReceiveResultData(param);	
				
				//data -> 수신처리되는 저장되는 Object, 수신된 처리결과 값
				executeActTypeVailidProc(data);
			}else {
				logger.info("=========================================== SequenceStatus COMPLETE OR ERROR Consumer BYPASS ===========================================");
			}

			procStat = Constant.HTTP_OK_STAT;	
		} 
		catch(Exception e) {
			e.printStackTrace();
		}
		
		return procStat;
	}
	
	private boolean procLogicalExpression(String logicalExpr, Object rtnVal) {
		Boolean procBool = false;
		
		StringBuilder sb = new StringBuilder();
		try{
			logger.debug(">>>>>>>>>>>  procLogicalExpression logicalExpr  >>>>>>>>>>> "+logicalExpr);
			logger.debug(">>>>>>>>>>>  procLogicalExpression rtnVal  >>>>>>>>>>> "+rtnVal);
            sb.append("var rtnVal=rtnVal; ");
    		sb.append("if( ");
    		sb.append(logicalExpr);
    		sb.append(" ) ");
    		sb.append(" true; ");
    		sb.append(" else ");
    		sb.append(" false; ");
    		String expression = sb.toString();
    		
    		Bindings bindings = scriptEngine.createBindings();
    		bindings.put("rtnVal", rtnVal);
    		scriptEngine.setBindings(bindings, ScriptContext.ENGINE_SCOPE);


            procBool = (Boolean) scriptEngine.eval(expression);
        	
            logger.debug(">>>>>>>>>>>  procLogicalExpression procBool  >>>>>>>>>>> "+procBool);
        }
		catch(Exception e){
        	e.printStackTrace();
            System.out.println(String.format("ScriptException while running js code: {}", ""));
        }
				
		return procBool;
	}
	

	//수신한 정보를 저장하고 실행중인 타스크, 전송정보 상태를 업데이트
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public HashMap<String, Object> regReceiveResultData(HashMap<String, Object> param) throws Exception {
		logger.debug("regReceiveResultData Start >>>>>>>>>>>" + param.get("reqCtrlCmdIdentifier"));

		
		HashMap<String, Object> data = new HashMap<String, Object>();
		data.put("taskSendingIdentifier", param.get("reqCtrlCmdIdentifier"));
		
		
		//들어온 데이터 저장하는 부분 
		//데이터 파싱/벨리데이션 추가 
		HashMap<String, Object> map = new HashMap<>();
		map.put("taskSendingIdentifier", param.get("reqCtrlCmdIdentifier"));
		
		MsaTaskSendingInfo si = msaTaskSendingInfoMapper.getTaskSendingInfo(map);
		if(si == null) {
			throw new RuntimeException("**************** MsaTaskSendingInfo Null or Empty Error *******************");
		}
		
		
		String execResultCode = null, execResultValue = null, execResultMsg = null;
		try {
			JSONParser parser = new JSONParser(); 
			JSONObject json = (JSONObject) parser.parse((String)param.get("controlResult"));
			
			execResultCode = (String)json.get("execResultCode");			
			execResultValue = (String)json.get("execResultValue");
			execResultMsg = (String)json.get("execResultMsg");
		} 
		catch(Exception e) {
			logger.error("Error Message : {} " , e);
			e.printStackTrace();
		}
		
		data.put("execResultCode", execResultCode);
		data.put("execResultMsg", execResultMsg);
		
		MsaTaskResponseRecord rd = new MsaTaskResponseRecord();
		rd.setTaskSendingId(si.getTaskSendingId());
		rd.setTaskProcessingId(si.getTaskProcessingId());
		rd.setCtrlCmdSequenceId(si.getCtrlCmdSequenceId());
		rd.setRequestControlCommandId(si.getRequestControlCommandId());
		rd.setReceiveStatus(Constant.CTRL_SEQ_RES_RECIEVE_STS_CMP);
		rd.setReceiveVal(execResultValue);
		rd.setReceiveMsg(execResultMsg);
		
		int res = msaReceiveResultDataInfoMapper.insertReceiveResultData(rd);

		logger.debug("regReceiveResultData center >>>>>>>>>>>>>>>>>>>>>>>>>");
		
		//데이터 상태변경 처리 부분
		//향후 상태변경부분만 발췌하여 메소드화 작업 진행
		if (res > 0) {
			data.put("MsaTaskResponseRecord", rd);
			
			MsaTaskProcessingInfo msa = new MsaTaskProcessingInfo();
			msa.setTaskProcessingId(si.getTaskProcessingId());
			msa.setCtrlCmdSequenceId(si.getCtrlCmdSequenceId());
			msa.setRequestControlCommandId(si.getRequestControlCommandId());
			msa.setTaskProcessingStatus(Constant.CTRL_SEQ_TASK_STATUS_COMPLETE);

			MsaTaskSendingInfo mts = new MsaTaskSendingInfo();
			mts.setTaskSendingId(si.getTaskSendingId());
			mts.setTaskProcessingId(si.getTaskProcessingId());
			mts.setCtrlCmdSequenceId(si.getCtrlCmdSequenceId());
			mts.setRequestControlCommandId(si.getRequestControlCommandId());
			mts.setTaskSendingStatus(Constant.TASK_SENDING_STATUS_RES);
			mts.setTaskReceiveResultMsg("OK");

			//2세부에 전송한 정보에 수신한 정보 업데이트
			int updTs = msaTaskSendingInfoMapper.updateTaskSending(mts);
			//전송한 타스크에 대한 완료 상태 변경처리
			int updTp = msaTaskProcessingInfoMapper.updateTaskProcessing(msa);									
		} 
		else {
			throw new RuntimeException("**************** MsaTaskResponseRecord Insert Processing Runtime Error *******************");
		}

		logger.debug("regReceiveResultData End >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + map.get("taskSendingIdentifier"));

		
		return data;
	}
	
	//데이터 저장/상태변경 처리 후 다음시퀀스/연결시퀀스 동작을 위한 준비/확인 및 필터링 조건처리작업을 진행 
	private void executeActTypeVailidProc(HashMap<String, Object> map) {
		try {
			//수신된 데이터 Object
			MsaTaskResponseRecord rd = (MsaTaskResponseRecord)map.get("MsaTaskResponseRecord");
			
			HashMap<String, Object> data = new HashMap<String, Object>();
			HashMap<String, Object> param = new HashMap<>();
			param.put("requestControlCommandId", rd.getRequestControlCommandId());
			param.put("ctrlCmdSequenceId", rd.getCtrlCmdSequenceId());
			
			MsaControlCommandSequenceInfo mccs = msaControlCommandSequenceInfoMapper.getControlCommandSequenceInfo(param);		

			//전송받은 데이터의 정상처리 여부 확인
			boolean execResultBool = false, logicExprBool = false, retrySendChk = false;
			
			String execResultCode = (String)map.get("execResultCode");
			if(map.get("execResultCode") != null && !"".equals(map.get("execResultCode")) && "200".equals(map.get("execResultCode"))) {
				//정상처리상태
				execResultBool = true;
			}
			
			//처리상태 반영
			data.put("execResultBool", execResultBool);
			
			if (mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_SINGLE) 
					|| mccs.getSequenceActType().equals(Constant.CTRL_CMD_STATUS_CHECKER)
					|| mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_RUNNING)) {
				String logicalExpr = mccs.getLogicalExpression();

				//시퀀스가 정상처리 되었을 경우에만 리턴값을 확인한다.
				if(!"".equals(logicalExpr) && execResultBool) {
					logicExprBool = procLogicalExpression(logicalExpr, rd.getReceiveVal());
				}
				
				//처리상태 반영
				data.put("logicExprBool", logicExprBool);
				

				//retrySendingCnt와 지금까지 전송한 수량 체크 
				int retrySendingCnt = mccs.getRetrySendingCount();				
				int sendingTotalCnt = msaTaskSendingInfoMapper.getTaskSendingTotalCnt(param);
				
				if(sendingTotalCnt < retrySendingCnt) {
					retrySendChk = true;
				}
				
				//처리상태 반영
				data.put("retrySendChk", retrySendChk);
				
				/*TODO
				 정상케이스		=> 재전송 횟수 : O, 정상처리 : O, 제어구문 : O
				 정상 케이스		=> 재전송 횟수 : X, 정상처리 : O, 제어구문 : O		-> 마지막꺼에 들어온거
				 
				 재 전송 케이스	=> 재전송 횟수 : O, 정상처리 : X, 제어구문 : X
				 재 전송 케이스	=> 재전송 횟수 : O, 정상처리 : O, 제어구문 : X
				 재 전송 케이스	=> 재전송 횟수 : O, 정상처리 : X, 제어구문 : O
				 
				 오류 케이스		=> 재전송 횟수 : X, 정상처리 : X, 제어구문 : O
				 오류 케이스		=> 재전송 횟수 : X, 정상처리 : O, 제어구문 : X
				   
				 
				 무조건 재전송 횟수 남아 있지 않아야 함. 왜냐하면 비정상일 경우 재전송을 진행하기때문에 오류일 경우에는 
				 
				  sendingTotalCnt == retrySendingCnt  ==> 재전송하면 안됨
				 */
				
				//재 전송횟수가 남아있고, 결과코드 오류이거나 결과 정상/제어구문 오류일때 확인
				if(retrySendChk && ( !execResultBool || !logicExprBool) ) {					
					//결과코드 오류이거나 제어구문처리 오류(false)인 경우 현재 실행중인 시퀀스를 재 전송
					data.put("sequenceActType", mccs.getSequenceActType());
					data.put("requestControlCommandId", mccs.getRequestControlCommandId());
					data.put("ctrlCmdSequenceId", mccs.getCtrlCmdSequenceId());
					data.put("nextSeqProcBool", true);					
				} else {					
					//정상케이스, 오류케이스 별 상태정보 업데이트 진행
					//상태별로 요청정보 업데이트 처리를 진행해야 한다.
					//정상처리되지 않은 경우 요청정보 및 시퀀스 정보들을 오류처리 해야 한다.
					
					MsaRequestControlCommandInfo tt = new MsaRequestControlCommandInfo();
					
					//정상처리 일경우 처리결과값 반영 
					if(execResultBool && logicExprBool) {
						if (mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_SINGLE) 
								|| mccs.getSequenceActType().equals(Constant.CTRL_CMD_STATUS_CHECKER)
								|| mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_END)
							) {
							tt.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_COMPLETE);	
						} else {
							tt.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_SEQ_RUNNING);
						}	
					} else 
						tt.setReqCtrlCmdStatus(Constant.CTRL_CMD_STATUS_ERROR);

					tt.setRequestControlCommandId(mccs.getRequestControlCommandId());
					int upd3 = msaRequestControlCommandInfoMapper.updateMsaRequestControlCommandInfo(tt);
					
					
					//시퀀스 상태를 업데이트					
					HashMap<String, Object> seqMap = new HashMap<String, Object>();
					seqMap.put("ctrlCmdSequenceId", rd.getCtrlCmdSequenceId());

					//결과정보 셋팅 
					//정상처리 일경우 처리결과값 반영 
					if(execResultBool && logicExprBool) {
						seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_COMPLETE);
					} else {
						seqMap.put("sequenceStatus", Constant.CTRL_SEQUENCE_STATUS_ERROR);
					}					
					seqMap.put("statusResultMsg", map.get("execResultMsg"));						

					this.updateWithHisAndCtrlCmdSeqInfoTaskProc(seqMap);
					
					
					//싱글시퀀스의 트랜스미터로 전송하여 완료처리 한다. 
					if (mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_SINGLE) 
							|| mccs.getSequenceActType().equals(Constant.CTRL_CMD_STATUS_CHECKER)) {						
						data.put("sequenceActType", mccs.getSequenceActType());
						data.put("nextSeqProcBool", false);
						data.put("requestControlCommandId", mccs.getRequestControlCommandId());
						data.put("ctrlCmdSequenceId", mccs.getCtrlCmdSequenceId());
					} else if(mccs.getSequenceActType().equals(Constant.CTRL_CMD_SEQUENCE_RUNNING)) {
						//연결시퀀스를 확인하는 부분 
						param.clear();
						param.put("sequenceIdentifier", mccs.getNextSequenceIdentifier());

						MsaControlCommandSequenceInfo nxtSeq = msaControlCommandSequenceInfoMapper.getControlCommandSequenceInfo(param);

						data.put("sequenceActType", nxtSeq.getSequenceActType());
						data.put("requestControlCommandId", nxtSeq.getRequestControlCommandId());
						data.put("ctrlCmdSequenceId", nxtSeq.getCtrlCmdSequenceId());					
					}
				}
			}
						
			//next sequence 실행 종료 인터벌이 있으면 인터벌 적용
			long nextInterval = mccs.getNextInterval();
			if(nextInterval > 0) {
				try {
					logger.debug("************* executeActTypeVailidProc Next Interval Start Thread Sleep ==> "+nextInterval);
					
					Thread.currentThread().sleep(nextInterval);							
				} catch (InterruptedException ex) {
					logger.error("Error Message : {}" , ex);
					throw new InterruptedException("************* executeActTypeVailidProc Next Interval Start Thread Sleep ==> "+nextInterval);
				}catch(Exception e) {
					logger.error("Error Message : {}" , e);
				}
			}
			

			sendProducerCmd(data);
		} 
		catch(Exception e) {
			e.printStackTrace();
		}		
	}
	
	

	public void sendProducerCmd(HashMap<String, Object> data) throws Exception {
		//***********************************************************************//			
		
		HashMap<String, Object> param = new HashMap<String, Object>();
		JSONObject json = new JSONObject();
		
		//엔드 시퀀스의 경우 프로듀서로 보내서 시퀀스 처리하는 것으로 하자.  logicExprBool ==> 정상처리  retrySendChk ==> true 면 오류
		//정상처리되지 않은 시퀀스의 경우 바로 피드백을 위하여 트랜스미터에 전송, 정상처리된 싱글시퀀스일 경우 트랜스미터로 전송  
		/*TODO
		 정상케이스		=> 재전송 횟수 : O, 정상처리 : O, 제어구문 : O
		 정상 케이스		=> 재전송 횟수 : X, 정상처리 : O, 제어구문 : O		-> 마지막꺼에 들어온거
		 
		 재 전송 케이스	=> 재전송 횟수 : O, 정상처리 : X, 제어구문 : X
		 재 전송 케이스	=> 재전송 횟수 : O, 정상처리 : O, 제어구문 : X
		 재 전송 케이스	=> 재전송 횟수 : O, 정상처리 : X, 제어구문 : O
		 
		 오류 케이스		=> 재전송 횟수 : X, 정상처리 : X, 제어구문 : O
		 오류 케이스		=> 재전송 횟수 : X, 정상처리 : O, 제어구문 : X
		   
		 
		 무조건 재전송 횟수 남아 있지 않아야 함. 왜냐하면 비정상일 경우 재전송을 진행하기때문에 오류일 경우에는 
		 
		  sendingTotalCnt == retrySendingCnt  ==> 재전송하면 안됨
		 */
		
		//재 전송처리해야 되는 정보들
		if((Boolean)data.get("retrySendChk") && (!(Boolean)data.get("execResultBool") || !(Boolean)data.get("logicExprBool")) ) {
			json.put("requestControlCommandId", data.get("requestControlCommandId"));
			json.put("ctrlCmdSequenceId", data.get("ctrlCmdSequenceId"));
			rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_REQ_CTRL_COMMAND_SEND);	
		} else if(!(Boolean)data.get("retrySendChk") && (!(Boolean)data.get("execResultBool") || !(Boolean)data.get("logicExprBool")) ) {
			json.put("requestControlCommandId", data.get("requestControlCommandId"));
			rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);
		} else if((Boolean)data.get("execResultBool") && (Boolean)data.get("logicExprBool")) {
			if(Constant.CTRL_CMD_SEQUENCE_SINGLE.equals(data.get("sequenceActType"))
					|| Constant.CTRL_CMD_STATUS_CHECKER.equals(data.get("sequenceActType"))
					) {
				json.put("requestControlCommandId", data.get("requestControlCommandId"));
				rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);
			} else {
				json.put("requestControlCommandId", data.get("requestControlCommandId"));
				json.put("ctrlCmdSequenceId", data.get("ctrlCmdSequenceId"));
				rabbitMqComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_REQ_CTRL_COMMAND_SEND);	
			}
		}
	}
	
	
	/*
 	1. 시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
 	2. 변경된 시퀀스 정보의 이력을 남기는 쿼리
 */
	@Transactional(readOnly=false, propagation=Propagation.REQUIRED, rollbackFor=Exception.class)
	public int updateWithHisAndCtrlCmdSeqInfoTaskProc(HashMap<String, Object> map) throws Exception {
		//시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
		int proCnt = this.msaControlCommandTaskInfoMapper.updateCtrlCmdSeqInfoTaskProc(map);
	
		//상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
		if(proCnt > 0) {
			//변경된 시퀀스 정보의 이력을 남기는 쿼리
			this.msaControlCommandTaskInfoMapper.insertCtrlCmdSeqChangeHisMultiProcInfo(map);			
		}
	
		return proCnt;
	}
}
