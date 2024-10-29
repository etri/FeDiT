package kr.co.n2m.platform.meta.portal.notifc.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSendDto;
import kr.co.n2m.platform.meta.portal.notifc.service.NotifcService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "알림 웹소켓 메시지", description = "알림 웹소켓 메시지 API")
@Slf4j
@RestController
public class NotificWebsocketController {

	@Autowired
    private SimpMessageSendingOperations messagingTemplate;
	
	@Autowired	
	NotifcService notifcService;
	
    @MessageMapping("/notifc/sendall")
    public void sendAllNotifcMessage(String notifcMsg) {
    	Map<String, String> msgMap = new HashMap<>();
    	msgMap.put("notifcMsg", notifcMsg);
    	messagingTemplate.convertAndSend("/sub/notifc/all", msgMap);
    }
    
    @MessageMapping("/notifc/send")
    public void sendNotifcMessage(NotifcSendDto notifcSendDto) {

    	// TODO 여러 서버에서 이벤트를 공유하는 방식 고려 필요
    	
    	// 알림 메시지 저장
    	notifcService.sendNotifc(notifcSendDto);
    }
	 
}
