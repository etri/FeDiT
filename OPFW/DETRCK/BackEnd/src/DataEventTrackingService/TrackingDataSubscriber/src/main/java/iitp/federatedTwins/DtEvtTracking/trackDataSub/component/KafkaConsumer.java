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
import java.util.concurrent.ConcurrentHashMap;

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
	ConcurrentHashMap<String, ScheduledFuture> dataScheduledFutureInfo;

	private String consumerId;
	private String topic;
	private String groupId;
	private String resId;
	private String proId;
	private String digitalTwinObjId;
	private String trckValInfo;
	private String trckFltTp;

	private String digitalObjectPath;
	private String objValType;
	private String trckJSonPath;

	private Object payload;

	public KafkaConsumer(String consumerId, String topic, String groupId, String resId, String proId, String digitalTwinObjId,String trckValInfo,String trckFltTp) {
		this.consumerId = consumerId;
		this.topic = topic;
		this.groupId = groupId;
		this.resId = resId;
		this.proId = proId;
		this.digitalTwinObjId = digitalTwinObjId;
		this.trckValInfo = trckValInfo;
		this.trckFltTp = trckFltTp;

		if(this.trckValInfo != null && !"".equals(this.trckValInfo)) {
			try {
				JSONParser parser = new JSONParser();        	
				JSONObject ttrckval = (JSONObject)parser.parse(this.trckValInfo);

				this.digitalObjectPath = (String)ttrckval.get("digitalObjectPath");
				this.objValType = (String)ttrckval.get("objValType");

				StringBuffer sb = new StringBuffer();
				sb.append("$");
				sb.append(".");
				sb.append(this.digitalTwinObjId);
				sb.append(".");
				sb.append(this.digitalObjectPath);

				this.trckJSonPath = sb.toString();
			} catch(Exception e) {
				e.printStackTrace();

				this.digitalObjectPath = null;
				this.objValType = null;
				this.trckJSonPath = null;
			}
		}
	}
	
	public String getConsumerId() {
		return consumerId;
	}

	public void setConsumerId(String consumerId) {
		this.consumerId = consumerId;
	}

	public String getTopic() {
		return topic;
	}

	public void setTopic(String topic) {
		this.topic = topic;
	}

	public String getResId() {
		return resId;
	}

	public void setResId(String resId) {
		this.resId = resId;
	}

	public String getProId() {
		return proId;
	}

	public void setProId(String proId) {
		this.proId = proId;
	}

	@KafkaListener(id = "#{__listener.consumerId}", topics = "#{__listener.topic}", containerFactory = "filterListenerContainerFactory")
	public void batchListener(ConsumerRecords<String, Object> records) throws Exception {      
		if(this.digitalObjectPath == null || "".equals(this.digitalObjectPath) || this.objValType == null || "".equals(this.objValType)) {		   
			return;
		}

		JSONObject json = new JSONObject();
		JSONParser parser = new JSONParser();
		List<TrackingResponseRecord> trList = new ArrayList<>();

		try {
			for(ConsumerRecord<String, Object> consumerRecord:records) {						
				TrackingResponseRecord rd = new TrackingResponseRecord();

				try {
					payload = consumerRecord.value();  

					if(payload == null)
						continue;

					rd.setReceiveStatus(Constant.TASK_SENDING_STATUS_RES);
					rd.setTrackingProcessId(Integer.parseInt(proId));
					rd.setRequestTrackingId(Integer.parseInt(resId));

					String jsonStr = payload.toString();
					String data = JsonPath.parse(jsonStr).read("$.data");
					rd.setReceivePayload(data.substring(0,data.length()>50?50:data.length()));

					JSONArray dataArray = new JSONArray();

					ObjectMapper mapper = new ObjectMapper();
					mapper.enable(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY);
					try {
						StringBuffer sb = new StringBuffer();
						sb.append("$");
						sb.append(".");
						sb.append(this.digitalTwinObjId);
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
					} catch(Exception e) {
						e.printStackTrace();
					}

					if("INTEGER".equalsIgnoreCase(this.objValType)) {
						ArrayList<Integer> trckData = mapper.convertValue(JsonPath.parse(data).read(this.trckJSonPath), new TypeReference<ArrayList<Integer>>(){}) ;
						if(trckData != null && trckData.size() > 0) {						
							rd.setReceiveMsg(trckData.toString());	

							OptionalInt trckStat = trckData.stream()
									.mapToInt(num -> num)
									
									.max()
									;

							rd.setReceiveVal(String.valueOf(trckStat.getAsInt()));
						} else {
							rd.setReceiveMsg("");
							rd.setReceiveVal(String.valueOf(0));
						}
					} else if("FLOAT".equalsIgnoreCase(this.objValType) || "DOUBLE".equalsIgnoreCase(this.objValType)) {
						ArrayList<Double> trckData = mapper.convertValue(JsonPath.parse(data).read(this.trckJSonPath), new TypeReference<ArrayList<Double>>(){}) ;
						if(trckData != null && trckData.size() > 0) {							
							rd.setReceiveMsg(trckData.toString());	

							OptionalDouble trckStat = trckData.stream()
									.mapToDouble(num -> num)
									.max()
									;

							rd.setReceiveVal(String.valueOf(trckStat.getAsDouble()));
						} else {
							rd.setReceiveMsg("");
							rd.setReceiveVal(String.valueOf(0));
						}
					} else if("LONG".equalsIgnoreCase(this.objValType)) {
						ArrayList<Long> trckData = mapper.convertValue(JsonPath.parse(data).read(this.trckJSonPath), new TypeReference<ArrayList<Long>>(){}) ;
						if(trckData != null && trckData.size() > 0) {

							rd.setReceiveMsg(trckData.toString());	

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
					if(dataScheduledFutureInfo.get(resId+proId) == null) {
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
