package iitp.federatedTwins.DtEvtTracking.trackDataSub.component;

import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.HashMap;
import java.util.IntSummaryStatistics;
import java.util.List;
import java.util.LongSummaryStatistics;
import java.util.OptionalDouble;
import java.util.OptionalInt;
import java.util.OptionalLong;
import java.util.concurrent.ScheduledFuture;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.task.DataTrackingTaskProcess;
import lombok.extern.slf4j.Slf4j;


@Component
@Slf4j
@Scope(value = "prototype")
public class KafkaConsumer {
	
	@Autowired
	ApplicationContext ctx;
	
	@Autowired
	@Qualifier("trackingTaskExecutor")
	private ThreadPoolTaskExecutor taskExecutor;
		
	@Autowired
	public TrackingDataSubscriberService rsDtConsumerService;
	
	@Autowired
	public TrackingProcessInfoMapper trackingProcessInfoMapper;
	
	@Autowired
	HashMap<String, ScheduledFuture> dataScheduledFutureInfo;
	
	public String consumerId;
    public String topic;
    public String groupId;
    public String resId;
    public String proId;
    public String digitalTwinId;
    public String trckValInfo;
    
    private String digitalObjectPath;
    private String objValType;
    private String trckJSonPath;
    
    
    private Object payload;
        
    

    public KafkaConsumer(String consumerId, String topic, String groupId, String resId, String proId, String digitalTwinId,String trckValInfo) {
        this.consumerId = consumerId;
        this.topic = topic;
        this.groupId = groupId;
        this.resId = resId;
        this.proId = proId;
        this.digitalTwinId = digitalTwinId;
        this.trckValInfo = trckValInfo;
        
//		"{\"digitalObjectPath\":\"weatherMeasurement..list..wave\",\"objValType\":\"INT\"}"
		
        if(this.trckValInfo != null && !"".equals(this.trckValInfo)) {
        	try {
	        	JSONParser parser = new JSONParser();        	
	        	JSONObject ttrckval = (JSONObject)parser.parse(this.trckValInfo);
	        	
	        	this.digitalObjectPath = (String)ttrckval.get("digitalObjectPath");
	        	this.objValType = (String)ttrckval.get("objValType");
	        	
	        	StringBuffer sb = new StringBuffer();
	        	sb.append("$");
	        	sb.append(".");
	        	sb.append(this.digitalTwinId);
	        	sb.append(".");
	        	sb.append(this.digitalObjectPath);
	        	
	        	this.trckJSonPath = sb.toString();
	        	
	        	System.out.println("trckJSonPath ==> "+this.trckJSonPath);
        	} catch(Exception e) {
        		e.printStackTrace();     	
        		this.digitalObjectPath = null;
        		this.objValType = null;
        		this.trckJSonPath = null;
        	}
        }
    }

    // record 를 수신하기 위한 consumer 설정
//    @KafkaListener(id = "#{__listener.consumerId}", topics = "#{__listener.topic}", groupId = "#{__listener.groupId}", containerFactory = "filterListenerContainerFactory")
//  public void batchListener(List<ConsumerRecord<String, Object>> listRecord) throws Exception {
   @KafkaListener(id = "#{__listener.consumerId}", topics = "#{__listener.topic}", containerFactory = "filterListenerContainerFactory")
    public void batchListener(ConsumerRecords<String, Object> records) throws Exception {      
	   if(this.digitalObjectPath == null || "".equals(this.digitalObjectPath) || this.objValType == null || "".equals(this.objValType)) {
		   System.out.println("=================================================================================");
		   System.out.println("batchListener check param Error digitalObjectPath : objValType ==> "+digitalObjectPath+" : "+this.objValType);
		   System.out.println("=================================================================================");

		   return;
	   }
	   
    	JSONObject json = new JSONObject();
    	JSONParser parser = new JSONParser();
    	List<TrackingResponseRecord> trList = new ArrayList<>();
    	
    	try {
    		for(ConsumerRecord<String, Object> consumerRecord:records) {						
    			TrackingResponseRecord rd = new TrackingResponseRecord();
    			
    			try { //int로 변환
    				payload = consumerRecord.value();  
    				
    				if(payload == null)
    					continue;
        			
            		rd.setReceiveStatus(Constant.TASK_SENDING_STATUS_RES);
    				
    				rd.setTrackingProcessId(Integer.parseInt(proId));
    				rd.setRequestTrackingId(Integer.parseInt(resId));
    				
    				String jsonStr = payload.toString();    	
    				int jsonSize = jsonStr.length(); 
    				System.out.println("=================================================================================");
    	    		System.out.println(this.topic + " ==> received payload : "+jsonStr.substring(0,jsonSize>10000?10000:jsonSize));
    	    		System.out.println("=================================================================================");
    				
    	    		String data = JsonPath.parse(jsonStr).read("$.data");
    	    		
    	    		rd.setReceivePayload(data.substring(0,data.length()>10000?10000:data.length()));
    	    		
    				System.out.println("=================================================================================");
    	    		System.out.println(this.topic + " ==> data jsonPath value : "+data.substring(0,data.length()>10000?10000:data.length()));
    	    		System.out.println("=================================================================================");

    	    		
    	    		JSONArray dataArray = new JSONArray();
    	    		
    	    		
    	    		
    	    		ObjectMapper mapper = new ObjectMapper();
    	    		mapper.enable(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY);
    	    		try {
    	    			StringBuffer sb = new StringBuffer();
    		        	sb.append("$");
    		        	sb.append(".");
    		        	sb.append(this.digitalTwinId);
    		        	sb.append(".");
    		        	sb.append("list");
    	    			
    	    		ArrayList<JSONObject> trckData2 = mapper.convertValue(JsonPath.parse(data).read(sb.toString()), new TypeReference<ArrayList<JSONObject>>(){}) ;
    	    		
    	    		if(trckData2 != null && trckData2.size() > 0) {
    	    			JSONObject rtnJson = null;
    	    			for(JSONObject parsData:trckData2) {
    	    				rtnJson = new JSONObject();
    	    				
    	    				rtnJson.put("measurement_date", parsData.get("measurement_date"));
    	    				rtnJson.put("secondary_value", parsData.get("secondary_value"));
    	    				
    	    				dataArray.add(rtnJson);
    	    			}
    	    		}
    	    		
    	    		System.out.println(" ==> received list : "+dataArray.toJSONString());
    	    		
    	    		} catch(Exception e) {
    	    			e.printStackTrace();
    	    		}
    	    		
    	    		
    	    		
    	    		
    	    		if("INTEGER".equals(this.objValType)) {
    	    			ArrayList<Integer> trckData = mapper.convertValue(JsonPath.parse(data).read(this.trckJSonPath), new TypeReference<ArrayList<Integer>>(){}) ;
    	    			if(trckData != null && trckData.size() > 0) {
        	    			System.out.println("=================================================================================");
        	    			System.out.println(this.topic + " ==> received payload : "+trckData.toString());
        	    			rd.setReceiveMsg(trckData.toString());	
//        	    			IntSummaryStatistics trckStat = trckData.stream()
//    								    	    					.mapToInt(num -> num)
//    								    	    					.summaryStatistics()
//    								    	    					;
        	    			OptionalInt trckStat = trckData.stream()
	    	    					.mapToInt(num -> num)
	    	    					.max()
	    	    					;
        	    			rd.setReceiveVal(String.valueOf(trckStat.getAsInt()));
        	    		} else {
        	    			rd.setReceiveMsg("");
        	    			rd.setReceiveVal(String.valueOf(0));
        	    		}
    	    		} else if("FLOAT".equals(this.objValType) || "DOUBLE".equals(this.objValType)) {
    	    			ArrayList<Double> trckData = mapper.convertValue(JsonPath.parse(data).read(this.trckJSonPath), new TypeReference<ArrayList<Double>>(){}) ;
    	    			if(trckData != null && trckData.size() > 0) {
        	    			System.out.println("=================================================================================");
        	    			System.out.println(this.topic + " ==> received payload : "+trckData.toString());
        	    			rd.setReceiveMsg(trckData.toString());	
//        	    			DoubleSummaryStatistics trckStat = trckData.stream()
//    								    	    					.mapToDouble(num -> num)
//    								    	    					.summaryStatistics()
//    								    	    					;
        	    			OptionalDouble trckStat = trckData.stream()
	    	    					.mapToDouble(num -> num)
	    	    					.max()
	    	    					;
        	    			
        	    			rd.setReceiveVal(String.valueOf(trckStat.getAsDouble()));
        	    		} else {
        	    			rd.setReceiveMsg("");
        	    			rd.setReceiveVal(String.valueOf(0));
        	    		}
    	    		} else if("LONG".equals(this.objValType)) {
    	    			ArrayList<Long> trckData = mapper.convertValue(JsonPath.parse(data).read(this.trckJSonPath), new TypeReference<ArrayList<Long>>(){}) ;
    	    			if(trckData != null && trckData.size() > 0) {
        	    			System.out.println("=================================================================================");
        	    			System.out.println(this.topic + " ==> received payload : "+trckData.toString());
        	    			rd.setReceiveMsg(trckData.toString());	
//        	    			LongSummaryStatistics trckStat = trckData.stream()
//    								    	    					.mapToLong(num -> num)
//    								    	    					.summaryStatistics()
//    								    	    					;      
        	    			OptionalLong trckStat = trckData.stream()
	    	    					.mapToLong(num -> num)
	    	    					.max()
	    	    					;      
        	    			rd.setReceiveVal(String.valueOf(trckStat.getAsLong()));
        	    		} else {
        	    			rd.setReceiveMsg("");
        	    			rd.setReceiveVal(String.valueOf(0));
        	    		}
    	    		} else {
    	    			rd.setReceiveMsg("");
    	    			rd.setReceiveVal(String.valueOf(0));
    	    		}
    	    		
    	    		rd.setReceiveMsg(dataArray.toJSONString()); 
    	    		    	    		
    			}catch (Exception e) {
    				e.printStackTrace();
    				rd.setTrackingProcessId(0);
    				rd.setRequestTrackingId(0);
    			}
    			
    			trList.add(rd);
    	 	}
        	
        	rsDtConsumerService.insertResponseRecordList(trList);
        	
        	System.out.println(trList.toString());
    	} catch(Exception e) {
    		e.printStackTrace();
    	}finally {
    		HashMap<String,Object> map = new HashMap<>();
    		map.put("requestTrackingId", resId);
    		map.put("trackingProcessId", proId);
    		    		
    		TrackingProcessInfo trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);
    		
    		if(trackingProcessInfo != null && trackingProcessInfo.getEventDelay() == 0 && Constant.TRCK_CMD_TYPE_DATA.equals(trackingProcessInfo.getTrackingProcessType())) {

    			TrackingProcessInfo trckPrd = rsDtConsumerService.getTrackingProcessInfo(map);
    			
    			if(trckPrd != null) {
        			//데이터 트래킹도 이벤트 딜레이가 있을 경우에는 스케줄 쓰레드 풀로 생성해서 관리. 
        			//이벤트 딜레이가 없을 경우에는 단일동작 타스크로 실행시킨다. mode 추가 => OC(occured Count)
        			if(dataScheduledFutureInfo.get(resId+proId) == null) {        				
        				System.out.println("==========================DataTrackingTaskProcess ==> Empty ================================");
        				DataTrackingTaskProcess dtProd = ctx.getBean(DataTrackingTaskProcess.class, resId,proId, trckPrd.getDetectRecordStartId(), trckPrd.getDetectRecordEndId(), "OC");
        				taskExecutor.execute(dtProd);            			
        			} else {
        				System.out.println("==========================DataTrackingTaskProcess ==> Running ================  "+resId+"  :  "+proId);
        			}
        		}
    		}    	
    	}    
    }
}
