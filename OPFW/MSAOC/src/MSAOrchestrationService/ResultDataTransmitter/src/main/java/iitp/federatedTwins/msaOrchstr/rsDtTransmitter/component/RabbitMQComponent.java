package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.component;

import java.util.ArrayList;
import java.util.HashMap;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.service.RequestControlCommandService;
import iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo.RequestTransmissionVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Repository
@RequiredArgsConstructor
public class RabbitMQComponent {
	
	private final Logger logger = LoggerFactory.getLogger(RabbitMQComponent.class);

	
	 @Value("${rabbitmq.exchange.name}")
	  private String exchangeName;

	  @Value("${rabbitmq.routing.key}")
	  private String routingKey;

	  @Autowired
	  public RabbitTemplate rabbitTemplate;

	  @Autowired
	  public RequestControlCommandService requestControlCommandService;
	  
	  

	  /**
	   * Queue로 메시지를 발행
	   *
	   * @param messageDto 발행할 메시지의 DTO 객체
	   */
	  public void sendMessage(JSONObject json) {
	    rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	  }
	  
	  public void sendMessage(JSONObject json, String sendRoutingKey) {
	    rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
	  }

	  /**
	   * Queue에서 메시지를 구독
	   *
	   * @param messageDto 구독한 메시지를 담고 있는 MessageDto 객체
	 * @throws Exception 
	   */
	@RabbitListener(queues = "#{trgEventMsgTransmitQueue.getName()}")
	  public void listenTrnCreate(JSONObject json) throws Exception {
		
		if(json == null || json.get("requestControlCommandId") == null)
			return;
			
		RequestTransmissionVO tran = new RequestTransmissionVO();
		logger.info("requestControlCommandId : {}" , json.get("requestControlCommandId"));
		logger.info("sessionCheckStatus : {}" , json.get("sessionCheckStatus"));
		

		HashMap<String, Object> paramMap = new HashMap<>();
		paramMap.put("requestControlCommandId", json.get("requestControlCommandId").toString());		
		
		ArrayList reqCtrlCmdStatusList = new ArrayList<String>();
		reqCtrlCmdStatusList.add(Constant.CTRL_CMD_STATUS_COMPLETE);
		reqCtrlCmdStatusList.add(Constant.CTRL_CMD_STATUS_ERROR);
				
		if(json.get("sessionCheckStatus") != null && "SSCK".equals(json.get("sessionCheckStatus"))) {
			reqCtrlCmdStatusList.add(Constant.CTRL_CMD_STATUS_TIMEOUT);
		}
		
		paramMap.put("reqCtrlCmdStatusList", reqCtrlCmdStatusList);	
		
		requestControlCommandService.execTransmitter(paramMap);
	  }
}
