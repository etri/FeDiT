package kr.co.n2m.platform.meta.datastore.influxdb.service;


import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.apicatalog.jsonld.StringUtils;
import com.influxdb.client.DeleteApi;
import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.client.WriteApi;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;
import com.influxdb.client.write.events.WriteErrorEvent;
import com.influxdb.client.write.events.WriteSuccessEvent;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import com.influxdb.query.dsl.Flux;
import com.influxdb.query.dsl.functions.restriction.Restrictions;

import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResForbiddenException;
import kr.co.n2m.platform.meta.architecture.property.InfluxProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.DateUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbKeywordDto;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbKeywordVo;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbMetadataVo;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbSearchVo;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.JsonRecord;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.JsonRecordDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class InfluxDbService {
	
	public static String THE_FIRST_ISO_TIME = "1970-01-01T00:00:00Z";
	
	@Autowired
	private InfluxProperty influxProperty;	

	@Autowired
	private InfluxDBClient influxDBClient;
	
    @Autowired
	MetadataSetService metadataSetService;
    
	@PostConstruct
	public void init() {
		metadataSetService.setInfluxDbService(this); // 순환참조 오류 방지
	}
	
	@Autowired
	private MetadataMapper metadataMapper;
	
	
	/**
	 * InfluxDB URL
	 * @return
	 */
	public String getInfluxDbBrowserUrl() {
		return influxProperty.getBrowserUrl();
	}
	
	// 테스트용	
	public List<FluxTable> getJsonData(InfluxDbSearchVo searchVo) {		
//		InfluxDBClient influxDBClient = influxDBClient();
//		InfluxDBClient influxDBClient = InfluxDBClientFactory.create(influxProperty.getUrl(), influxProperty.getToken(), influxProperty.getOrg(), influxProperty.getBucket());

//		try (InfluxDBClient influxDBClient = influxDBClient()) {
			
			StringBuilder sb = new StringBuilder();
			sb.append("from(bucket: \"").append(influxProperty.getBucket()).append("\")\n")
			  .append(" |> range(start: -200d)\n")
			  .append(" |> filter(fn: (r) => r._measurement == \"json\")\n")
			  .append(" |> filter(fn: (r) => r._field == \"value\")\n")
			  .append(" |> yield(name: \"mean\")")
			  ;
			
			QueryApi queryApi = influxDBClient.getQueryApi();
			
			List<FluxTable> list = queryApi.query(sb.toString());		
		
			if (list != null) {
				for (FluxTable tab : list) {
					for (FluxRecord rec : tab.getRecords()) {
						log.debug("{} : {}", rec.getTime(), rec.getValue());
					}
				}
			}

			// 빈으로 만들면.. 여기서 닫으면 안될 듯
//			influxDBClient.close();
			
			return list;
//		}
	}
	
	/**
	 * 키워드 측정 데이터 초기화 후 재등록
	 * @Author      : heenim
	 * @Date        : 2025. 02. 07.
	 * @param logRegrId
	 */
	public void initKeywordMeasurement(String logRegrId) {
		log.debug("[키워드 측정 데이터 초기화 후 재등록] 서비스 시작 - {}", logRegrId);
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("초기화 후 재등록에 대한 권한이 없습니다.");
			}

			// 1. 키워드 측정 의 모든 Point 삭제
			
			DeleteApi deleteApi = influxDBClient.getDeleteApi();
			
			// 시간 범위 : 처음부터 현재까지
			OffsetDateTime start = OffsetDateTime.parse(THE_FIRST_ISO_TIME);
			OffsetDateTime stop  = OffsetDateTime.now();
			String predicate = String.format("_measurement=\"keyword\"");
			// 삭제
			deleteApi.delete(start, stop, predicate, influxProperty.getBucket(), influxProperty.getOrg());
			
			// 2. 전체 메타데이터 키워드 목록 조회 후 저장
			
			// InfluxDB 키워드 용 메타데이터 목록 조회
   			List<InfluxDbKeywordDto> list = metadataMapper.selectMetadataListForInfluxDbKeyword(null);
   			log.debug("[키워드 측정 데이터 초기화 후 재등록] 키워드 측정 대상 건수: {}", (list != null ? list.size() : 0));

   			int cnt = 0;
   			if (list != null && list.size() > 0) {
   				for (InfluxDbKeywordDto keywordDto : list) {
					// 전체 삭제 후 등록하므로 빈 목록. 셋별 키워드별 이므로 for문 안에 설정.
	   				List<String> prevKeywordList = new ArrayList<String>(); // not null
	   				// 저장
					metadataSetService.saveKeywordToInfluxDb(keywordDto, prevKeywordList); // TODO 애매하다 로직 안에서 비동기 처리로 되어 있어서 실제 성공인지 알수 없다.
					cnt++;
   				}
   			}
   			log.debug("[키워드 측정 데이터 초기화 후 재등록] 키워드 저장 건수: {}", cnt);
			
		} catch (ResBaseRuntimeException e) {
			log.info("[키워드 측정 데이터 초기화 후 재등록] - {} 실패/오류 (정보성) : {}", logRegrId, e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[키워드 측정 데이터 초기화 후 재등록] - {} 실패/오류", logRegrId, e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[키워드 측정 데이터 초기화 후 재등록] 서비스 종료 - {}", logRegrId);			
	}
	
	/**
	 * 해당 메타데이터 셋 ID 로 InfluxDB에서 키워드 측정 데이터 저장  (삭제 후 재등록)
	 * @Author      : heenim
	 * @Date        : 2025. 02. 07.
	 * @param medataSetId
	 * @param logRegrId
	 */
	public void saveKeywordDataBySetId(String medataSetId, String logRegrId) {
		log.debug("[셋 ID 로 키워드 측정 데이터 저장] 서비스 시작 - {}", medataSetId);
		try {
			// InfluxDB 키워드 용 메타데이터 목록 조회
    		MetadataSearchVo paramVo = new MetadataSearchVo();
   			paramVo.setMedataSetId(medataSetId);
   			List<InfluxDbKeywordDto> list = metadataMapper.selectMetadataListForInfluxDbKeyword(paramVo);
   			log.debug("[셋 ID 로 키워드 측정 데이터 저장] 키워드 측정 대상 건수: {}", (list != null ? list.size() : 0));
   			
   			int cnt = 0;   			
   			if (list != null && list.size() > 0) {
   				
   				// 1. 삭제
   				this.deleteKeywordDataBySetId(medataSetId, logRegrId, list.get(0).getMinDateTimeStr(), list.get(0).getMaxDateTimeStr());
   				
   				for (InfluxDbKeywordDto keywordDto : list) {
   					// 전체 삭제 후 등록하므로 빈 목록. 키워드별 이므로 for문 안에 설정.
   	   				List<String> prevKeywordList = new ArrayList<String>(); // not null
   	   				// 2. 저장
   					metadataSetService.saveKeywordToInfluxDb(keywordDto, prevKeywordList); // TODO 애매하다 로직 안에서 비동기 처리로 되어 있어서 실제 성공인지 알수 없다.
					cnt++;   					
   				}
   			}
   			log.debug("[셋 ID 로 키워드 측정 데이터 저장] 키워드 저장 건수: {}", cnt);   			
			
		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 키워드 측정 데이터 저장] - {} 실패/오류 (정보성) : {}", medataSetId, e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 키워드 측정 데이터 저장] - {} 실패/오류", medataSetId, e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[셋 ID 로 키워드 측정 데이터 저장] 서비스 종료 - {}", medataSetId);			
	}

	/**
	 * 해당 메타데이터 셋 ID 로 InfluxDB에서 키워드 측정 데이터 삭제
	 * @Author      : heenim
	 * @Date        : 2025. 02. 04.
	 * @param medataSetId
	 * @param logRegrId
	 * @param regDt
	 * @param toDt (null 일 경우 현재까지) @Nullable
	 */
	public void deleteKeywordDataBySetId(String medataSetId, String logRegrId, String regDt, String toDt) {
		log.debug("[셋 ID 로 키워드 측정 데이터 삭제] 서비스 시작 - {}", medataSetId);
		try {
			DeleteApi deleteApi = influxDBClient.getDeleteApi();
			
			// 시간 범위 : 등록일시 부터 현재까지 (또는 지정일시 까지)
			OffsetDateTime start = DateUtil.toOffsetDateTime(regDt);
			OffsetDateTime stop  = OffsetDateTime.now();
			if (StringUtils.isNotBlank(toDt)) {
				stop = DateUtil.toOffsetDateTime(toDt);
			}
			
			String predicate = String.format("_measurement=\"keyword\" AND id=\"%s\"", medataSetId);
			deleteApi.delete(start, stop, predicate, influxProperty.getBucket(), influxProperty.getOrg());
			
		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 키워드 측정 데이터 삭제] - {} 실패/오류 (정보성) : {}", medataSetId, e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 키워드 측정 데이터 삭제] - {} 실패/오류", medataSetId, e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[셋 ID 로 키워드 측정 데이터 삭제] 서비스 종료 - {}", medataSetId);				
	}
	
	/**
	 * 최근 1년 동안의 키워드별 건수 현황 조회
	 * @Author      : heenim
	 * @Date        : 2025. 02. 05.
	 * @param searchVo
	 * @return
	 */
	public List<JSONObject> getKeywordCountData(InfluxDbSearchVo searchVo) {
		log.debug("[최근 1년 동안의 키워드별 건수 현황 조회] 서비스 시작");

		StringBuilder sb = new StringBuilder();
		/*
			 base = from(bucket: "metadata")
			   |> range(start: -365d)                			// 최근 1년 데이터만 조회
			   |> filter(fn: (r) => r._measurement == "keyword")
			   |> filter(fn: (r) => r._field == "value")  
		
			 counts = base
			   |> group(columns: ["word"])          			// 정규화된 키(태그) word 별로 묶기
			   |> count()                           			// 각 word 그룹의 발생 건수 세기
			   |> rename(columns: {_value: "count"})			// 결과 컬럼명을 count 로 바꿔서 사람이 보기 쉽게
			
			 labels = base
			   |> group(columns: ["word"])          			// 동일하게 word 단위로 묶고
			   |> last()             							// 그 word에서 가장 마지막(최근) 하나만 대표로 가져오기
			   |> keep(columns: ["word", "_value"])  			
			   |> rename(columns: {"_value": "keyword"})        // 결과 컬럼명을 keyword 이름으로 바꿔서 표시용으로 씀
			
			 join(tables: {c: counts, l: labels}, on: ["word"], method: "inner")  // word를 기준으로 count 정보와 label 정보를 합침
			   |> keep(columns: ["word", "keyword", "count"])                     // 최종으로 필요한 컬럼만 유지
			   |> sort(columns: ["count"], desc: true)                            // 등장 횟수 많은 순서대로 정렬
		*/
		sb.append("base = from(bucket: \"").append(influxProperty.getBucket()).append("\")\n")
		  .append("  |> range(start: -365d)\n")
		  .append("  |> filter(fn: (r) => r._measurement == \"keyword\")\n")
		  .append("  |> filter(fn: (r) => r._field == \"value\")\n") // 우리가 쓰려는 필드(value)만 남김
		  .append("\n")
		  .append("counts = base\n")
		  .append("  |> group(columns: [\"word\"])\n")
		  .append("  |> count()\n")
		  .append("  |> rename(columns: {_value: \"count\"})\n")
		  .append("\n")
		  .append("labels = base\n")
		  .append("  |> group(columns: [\"word\"])\n")
		  .append("  |> last()\n") // 그룹별 마지막 _value 를 가져옴
		  .append("  |> keep(columns: [\"word\", \"_value\"])\n")
		  .append("  |> rename(columns: {_value: \"keyword\"})\n")
		  .append("\n")
		  .append("join(tables: {c: counts, l: labels}, on: [\"word\"], method: \"inner\")\n")
		  .append("  |> keep(columns: [\"word\", \"keyword\", \"count\"])\n")
		  .append("  |> sort(columns: [\"count\"], desc: true)\n");
		
		QueryApi queryApi = influxDBClient.getQueryApi();
		
		List<FluxTable> resultList = queryApi.query(sb.toString());
		
		List<JSONObject> list = new ArrayList<>();
		if (resultList != null) {
			for (FluxTable tab : resultList) {
				for (FluxRecord rec : tab.getRecords()) {
					//log.debug("{} : {}", rec.getTime(), rec.getValues());
					//log.debug("{} : {}", rec.getValueByKey("keyword"), rec.getValueByKey("count"));
					JSONObject jsonObject = new JSONObject(rec.getValues());
					list.add(jsonObject);
				}
			}
		}

		log.debug("[최근 1년 동안의 키워드별 건수 현황 조회] 서비스 종료 : {}건", list.size());		
		return list;
	}
	
	/**
	 * 키워드 측정 데이터 값 추가 (1건)
	 * @Author      : heenim
	 * @Date        : 2025. 02. 04.
	 * @param dataVo
	 */
	public void addKeywordData(InfluxDbKeywordVo dataVo) {
		try {
			WriteApiBlocking writeApi = influxDBClient.getWriteApiBlocking();
			
			// Write by Data Point
			Point point = Point.measurement("keyword") // 측정값(measurement)
					           .addTag("word", dataVo.getWord()) // 태그 추가
					           .addTag("lang", dataVo.getLang())
					           .addTag("prptyId", dataVo.getPrptyId())
					           .addTag("id", dataVo.getId())
					           .addField("value", dataVo.getValue()) // 필드 추가
					           .time(NumberUtils.createNumber(dataVo.getNanosec()), WritePrecision.NS) // 타임스탬프 설정 (나노초)
					           ;
	        writeApi.writePoint(point);		
	
	//		// 다른 방법) Write by LineProtocol
	//		writeApi.writeRecord(WritePrecision.NS, dataVo.toLineProtocol());
	
	        log.debug("[키워드 측정 데이터 값 추가 (1건)] 성공: {}", dataVo.toLineProtocol());
		} catch (Exception e) {
			log.error("[키워드 측정 데이터 값 추가 (1건)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[키워드 측정 데이터 값 추가 (1건)] 서비스 종료");		        
	}

	/**
	 * 키워드 측정 데이터에서 값 삭제 (1건) 
	 * @Author      : heenim
	 * @Date        : 2025. 02. 11.
	 * @param dataVo
	 * @param regDt
	 * @param toDt
	 */
	public void deleteKeywordData(InfluxDbKeywordVo dataVo, String regDt, String toDt) {
		log.debug("[키워드 측정 데이터에서 값 삭제 (1건)] 서비스 시작 - {}", dataVo);
		try {
			DeleteApi deleteApi = influxDBClient.getDeleteApi();
			
			// 시간 범위 : 등록일시 부터 현재까지 (또는 지정일시 까지)
			OffsetDateTime start = DateUtil.toOffsetDateTime(regDt);
			OffsetDateTime stop  = OffsetDateTime.now();
			if (StringUtils.isNotBlank(toDt)) {
				stop = DateUtil.toOffsetDateTime(toDt);
			}
			
			String predicate = String.format("_measurement=\"keyword\" AND id=\"%s\" AND word=\"%s\" AND prptyId=\"%s\" AND lang=\"%s\""
					, dataVo.getId(), dataVo.getWord(), dataVo.getPrptyId(), dataVo.getLang());
			deleteApi.delete(start, stop, predicate, influxProperty.getBucket(), influxProperty.getOrg());
			
	        log.debug("[키워드 측정 데이터에서 값 삭제 (1건)] 성공: {}", predicate);
	        
		} catch (Exception e) {
			log.error("[키워드 측정 데이터에서 값 삭제 (1건)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[키워드 측정 데이터에서 값 삭제 (1건)] 서비스 종료");	
	}
	
	/**
	 * 셋 ID 로 키워드 측정 데이터 조회
	 * @Author      : heenim
	 * @Date        : 2025. 02. 11.
	 * @param medataSetId
	 * @param regDt
	 * @param toDt
	 * @return 
	 */
	public List<JSONObject> getKeywordDataBySetId(String medataSetId, String regDt, String toDt) {
		log.debug("[셋 ID 로 키워드 측정 데이터 조회] 서비스 시작 - {}", medataSetId);
		
		/*
			 from(bucket: "metadata")
			  |> range(start: 2025-02-05T00:00:00+9:00, stop: 2025-02-11T00:00:00+09:00)
			  |> filter(fn: (r) => r["_measurement"] == "keyword")
	          |> filter(fn: (r) => r["id"] == "KR-101015-0001")
              |> yield(name: "mean")
		 */
		
		String start = DateUtil.toISOTimeStr(regDt);
		String stop  = DateUtil.getCurrISOTime();
		if (StringUtils.isNotBlank(toDt)) {
			stop = DateUtil.toISOTimeStr(toDt);
		}
		StringBuilder sb = new StringBuilder();
		sb.append("from(bucket: \"").append(influxProperty.getBucket()).append("\")\n")
		  .append(" |> range(start: ").append(start).append(", stop: ").append(stop).append(")\n")
		  .append(" |> filter(fn: (r) => r._measurement == \"keyword\")\n")
		  .append(" |> filter(fn: (r) => r[\"id\"] == \"").append(medataSetId).append("\")\n")
		  .append(" |> yield(name: \"mean\")")
		  ;
		
		QueryApi queryApi = influxDBClient.getQueryApi();
		
		List<FluxTable> resultList = queryApi.query(sb.toString());
		
		List<JSONObject> list = new ArrayList<>();
		if (resultList != null) {
			for (FluxTable tab : resultList) {
				for (FluxRecord rec : tab.getRecords()) {
					log.debug("{} : {}", rec.getTime(), rec.getValues());
					JSONObject jsonObject = new JSONObject(rec.getValues());
					list.add(jsonObject);
				}
			}
		}
	
		log.debug("[셋 ID 로 키워드 측정 데이터 조회] 서비스 종료 : {}건", list.size());
		return list;
	}
	
	
	
    /**
     * 
     * 변경된 메타데이터셋 객체 snapshot influx db 저장
     * @param influxDbMetadataVo
     * */
    public void addMetadataAsync(InfluxDbMetadataVo vo) {
        try (WriteApi writeApi = influxDBClient.makeWriteApi()) {
            Point point = Point.measurement("json")
                    .addTag("medataSetId", escapeBackslashForTag(vo.getMedataSetId()))
//                    .addTag("medataSetNwstRvsn", escapeBackslashForTag(dataDto.getMedataSetNwstRvsn()))
                    .addTag("typeModelId", escapeBackslashForTag(vo.getTypeModelId()))
                    .addField("value", vo.getJsonStr())
                    .time(ZonedDateTime.now(ZoneId.systemDefault()).toInstant().toEpochMilli() * 1_000_000,
                    		WritePrecision.NS) // 타임스탬프 설정 (나노초)
                    ;
            String lineProtocol = point.toLineProtocol();
            log.debug("generated line protocol ========== {}", lineProtocol);
            
            writeApi.listenEvents(WriteSuccessEvent.class, event ->
            log.info("Successfully written data to InfluxDB: {}", event.toString()));

            writeApi.listenEvents(WriteErrorEvent.class, event ->
            log.error("Failed to write data to InfluxDB", event.getThrowable()));

            writeApi.writePoint(point);
            writeApi.flush();
        }
        log.debug("[InfluxDB addMetadataSync success]");
    }
    
    /**
     * 
     * metadata 버킷 json measurement의 총 data 목록 건수 조회
     * @param influxDbSearchVo
     * */
    public long getJsonMeasurementDataCount(String medataSetId, InfluxDbSearchVo influxDbSearchVo) {
    	log.debug("[json measurement의 총 data 목록 건수 조회] 서비스 시작");
    	
    	long totalCount = 0;
    	QueryApi queryApi = influxDBClient.getQueryApi();
    	Flux flux;
		Restrictions restrictions = Restrictions.and(
			    Restrictions.measurement().equal("json"),
			    Restrictions.field().equal("value")
			);
		if (medataSetId != null 
				&& !medataSetId.isBlank()) {
			restrictions = Restrictions.and(
					restrictions,
				    Restrictions.column("medataSetId").equal(medataSetId)
				);
		}
    	//1 날짜 범위 range 설정 - 필수 입력
		if (influxDbSearchVo.getSrchStartDd() == null || influxDbSearchVo.getSrchEndDd() == null) {
			return totalCount;
		}
		
		// 시간 범위 설정 - 사용자로부터 입력받은 시간 범위
		Instant startDateInstant = toInstantForInfluxRange(influxDbSearchVo.getSrchStartDd());
		Instant endDateInstant = toInstantForInfluxRange(influxDbSearchVo.getSrchEndDd());
		flux = Flux
                .from(influxProperty.getBucket())
                .range(startDateInstant, endDateInstant)
                .filter(restrictions)
                .group()
                .count();	
		log.debug("count flux query ----> {}", flux.toString());
		List<FluxTable> result = queryApi.query(flux.toString());
		if (!result.isEmpty()) {
			FluxTable table = result.get(0);
			List<FluxRecord> records = table.getRecords();	
		    if (!records.isEmpty()) {
		        Object value = records.get(0).getValueByKey("_value"); // 첫 번째 레코드의 "_value"
		        if (value instanceof Number) {
		            totalCount = ((Number) value).longValue();
		        }
		    }
		}
		log.debug("[json measurement의 총 data 목록 건수 조회] 서비스 종료");
    	return totalCount;
    }
    
    /**
     * metadata 버킷에서 json measurement의 지정 id의 가장 최근 data 단건 조회
     * @param medataSetId
     * */
    public JsonRecord getLatestJsonMeasurementByMedataSetId(String medataSetId) {
    	log.debug("[json measurement 지정 id 최근 data 단건 조회] 서비스 시작");
    	JsonRecord jsonRecord = new JsonRecord();
    	
    	try {
    		QueryApi queryApi = influxDBClient.getQueryApi();
    		Restrictions restrictions = Restrictions.and(
    			    Restrictions.measurement().equal("json"),
    			    Restrictions.field().equal("value"),
    			    Restrictions.column("medataSetId").equal(medataSetId)
    			);
    		// 1년 내 범위로 지정.
    		Instant now = Instant.now();
            Instant oneYearAgo = LocalDateTime.now()
                    .minus(1, ChronoUnit.YEARS) // 1년 전 계산
                    .atZone(ZoneId.systemDefault()) // 시스템 기본 시간대 적용
                    .toInstant(); // Instant로 변환
    		
    		Flux flux = Flux
    				.from(influxProperty.getBucket())
    				.range(oneYearAgo, now)
    				.filter(restrictions)
    				.sort(Arrays.asList("_time"), true)
    				.limit(1);           
            // measurement POJO mapping
            List<JsonRecord> jsonRecords = queryApi.query(flux.toString(), JsonRecord.class);
            if (ObjectUtils.isEmpty(jsonRecords)) {
            	return jsonRecord;
            }
            jsonRecord = jsonRecords.get(0);
    	} catch (Exception e) {
			log.error("[json measurement 지정 id 최근 data 단건 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
        
        return jsonRecord;
    }
    
    /**
     * 
     * metadata 버킷에서 json 메저먼트 목록 조회
     * @param influxDbSearchVo
     * */
    public SearchResultListVo getJsonMeasurementData(InfluxDbSearchVo influxDbSearchVo) {
    	SearchResultListVo listVo = new SearchResultListVo();
    	//시간 입력 필수 - 시간 미입력 시, 빈값 반환
    	if (influxDbSearchVo.getSrchStartDd() == null || influxDbSearchVo.getSrchEndDd() == null
    			|| influxDbSearchVo.getSrchStartDd().isBlank() || influxDbSearchVo.getSrchEndDd().isBlank()) {
    		return listVo;
    	}
    	
    	long totalCount = getJsonMeasurementDataCount(influxDbSearchVo.getMedataSetId(), influxDbSearchVo);
    	influxDbSearchVo.setTotalListSize((int) totalCount);
    	
		QueryApi queryApi = influxDBClient.getQueryApi();
		Flux flux;
		Restrictions restrictions = Restrictions.and(
			    Restrictions.measurement().equal("json"),
			    Restrictions.field().equal("value")
			);
		
		if (influxDbSearchVo.getMedataSetId() != null && !influxDbSearchVo.getMedataSetId().isBlank()) {
			restrictions = Restrictions.and(
					restrictions,
				    Restrictions.column("medataSetId").equal(influxDbSearchVo.getMedataSetId())
				);
		}
		
		// 시간 범위 설정 - 사용자로부터 입력받은 시간 범위
		Instant startDateInstant = toInstantForInfluxRange(influxDbSearchVo.getSrchStartDd());
		Instant endDateInstant = toInstantForInfluxRange(influxDbSearchVo.getSrchEndDd());
		
		// paging	
		boolean isDescOrder = !"ascending".equals(influxDbSearchVo.getSortOrder());
		if (influxDbSearchVo.getIsPaging()) {
			flux = Flux
	                .from(influxProperty.getBucket())
	                .range(startDateInstant, endDateInstant)
	                .filter(restrictions)
	                .group()
	                .sort(Arrays.asList("_time"), isDescOrder)
	                .limit(influxDbSearchVo.getPageListSize())
	                .withOffset(influxDbSearchVo.getStartIndex());
		} else {
			flux = Flux
	                .from(influxProperty.getBucket())
	                .range(startDateInstant, endDateInstant)
	                .filter(restrictions)
	                .group()
	                .sort(Arrays.asList("_time"), isDescOrder);
		}
		log.debug("getJsonMeasurementData flux query ----> {}", flux.toString());
        // measurement pojo mapping
        List<JsonRecord> jsonRecords = queryApi.query(flux.toString(), JsonRecord.class);
        List<JsonRecordDto> jsonRecordsResult = jsonRecords.stream()
        		.map((e) -> new JsonRecordDto(e))
        		.collect(Collectors.toList());
        listVo.setList(jsonRecordsResult);
        listVo.setPage(new PageVo(influxDbSearchVo));
        return listVo;
    }
    
    /**
     * 
     * metadata 버킷에서 json 메저먼트 에서 지정 id 의 목록 조회
     * @param searchVo
     * */
    public SearchResultListVo getJsonMeasurementByMetadataSetId(
    		String medataSetId, InfluxDbSearchVo influxDbSearchVo) {
    	
    	SearchResultListVo listVo = new SearchResultListVo();
		QueryApi queryApi = influxDBClient.getQueryApi();
		Restrictions restrictions = Restrictions.and(
			    Restrictions.measurement().equal("json"),
			    Restrictions.field().equal("value"),
			    Restrictions.column("medataSetId").equal(medataSetId)
			);
						
		Flux flux;
		boolean isDescOrder = !"ascending".equals(influxDbSearchVo.getSortOrder());
		
		if (Optional.ofNullable(influxDbSearchVo.getSrchStartDd()).filter(s -> !s.isBlank()).isPresent() &&
			    Optional.ofNullable(influxDbSearchVo.getSrchEndDd()).filter(s -> !s.isBlank()).isPresent()) {
			// 시간 범위 설정 - 사용자로부터 입력받은 시간 범위
			Instant startDateInstant = toInstantForInfluxRange(influxDbSearchVo.getSrchStartDd());
			Instant endDateInstant = toInstantForInfluxRange(influxDbSearchVo.getSrchEndDd());
			
	    	long totalCount = getJsonMeasurementDataCount(medataSetId, influxDbSearchVo);
	    	influxDbSearchVo.setTotalListSize((int) totalCount);
			
			// paging 적용
			if (influxDbSearchVo.getIsPaging()) {
				flux = Flux
		                .from(influxProperty.getBucket())
		                .range(startDateInstant, endDateInstant)
		                .filter(restrictions)
		                .group()
		                .sort(Arrays.asList("_time"), isDescOrder)
		                .limit(influxDbSearchVo.getPageListSize())
		                .withOffset(influxDbSearchVo.getStartIndex());
			} else {
				flux = Flux
		                .from(influxProperty.getBucket())
		                .range(startDateInstant, endDateInstant)
		                .filter(restrictions)
		                .group()
		                .sort(Arrays.asList("_time"), isDescOrder);
			}
			
		} else {
			
			JsonRecord latestJsonRecord = getLatestJsonMeasurementByMedataSetId(medataSetId);
			if (latestJsonRecord == null || latestJsonRecord.getTime() == null) {
				return listVo;
			}
			
			// 시간 범위 설정 - 제일 최근 data timestamp로부터 7일 이전의 data를 조회
			Instant latestJsonRecordTime = latestJsonRecord.getTime();
	        Instant oneWeeksAgeTime = latestJsonRecordTime.minus(7, ChronoUnit.DAYS);

	        LocalDate latestDate = latestJsonRecordTime.atZone(ZoneId.systemDefault()).toLocalDate();
	        LocalDate oneWeekAgoDate = oneWeeksAgeTime.atZone(ZoneId.systemDefault()).toLocalDate();
	        
	        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	        
	        String latestDateString = latestDate.format(formatter);
	        String oneWeekAgoDateString = oneWeekAgoDate.format(formatter);
	        
	        influxDbSearchVo.setSrchStartDd(oneWeekAgoDateString);
	        influxDbSearchVo.setSrchEndDd(latestDateString);
	        
	    	long totalCount = getJsonMeasurementDataCount(medataSetId, influxDbSearchVo);
	    	influxDbSearchVo.setTotalListSize((int) totalCount);
	        
	        // paging 적용	       
	    	// range - 시간 범위 설정: 제일 최근 data timestamp로부터 7일 이전의 data를 조회
	        if (influxDbSearchVo.getIsPaging()) {
		        flux = Flux
		                .from(influxProperty.getBucket())
		                .range(oneWeeksAgeTime)
		                .filter(restrictions)
		                .group()
		                .sort(Arrays.asList("_time"), isDescOrder)
		                .limit(influxDbSearchVo.getPageListSize())
		                .withOffset(influxDbSearchVo.getStartIndex());
	        } else {
		        flux = Flux
		                .from(influxProperty.getBucket())
		                .range(oneWeeksAgeTime)
		                .filter(restrictions)
		                .group()
		                .sort(Arrays.asList("_time"), isDescOrder);
	        }
		}
        log.debug("generated flux toString ==== >>>> {}", flux.toString());
        
        // measurement pojo mapping
        List<JsonRecord> jsonRecords = queryApi.query(flux.toString(), JsonRecord.class);
        listVo.setList(jsonRecords);
        listVo.setPage(new PageVo(influxDbSearchVo));
        return listVo;
    }
    
    /**
     * json measurement 지정 id 의 지정 시각의 데이터 단건 조회
     * @param medataSetId
     * @param timestamp
     * */
    public JsonRecord getJsonMeasurementBySetIdAndTimestamp(String medataSetId, String time) {
    	log.debug("[json measurement 지정 id 의 지정 시각의 데이터 단건 조회] 서비스 시작");	
    	Instant timestamp = parseRFC3339toDateStr(time);
    	JsonRecord jsonRecord = new JsonRecord();	
    	try {
    	 	
    		QueryApi queryApi = influxDBClient.getQueryApi();
    		Restrictions restrictions = Restrictions.and(
    			    Restrictions.measurement().equal("json"),
    			    Restrictions.field().equal("value"),
    			    Restrictions.column("medataSetId").equal(medataSetId)
    			);
    		
    		Flux flux = Flux
    				.from(influxProperty.getBucket())
    				.range(timestamp.minusSeconds(15), timestamp.plusSeconds(15)) // 초 단위로 입력받는 내 data를 제외 - select query 생성 시, range는 필수
    				.filter(restrictions)
    				.sort(Arrays.asList("_time"), true)
    				.limit(1);
    		log.debug("flux getJsonMeasurementBySetIdAndTimestamp flux query ----->>> {}", flux.toString());
    		
            // measurement POJO mapping
            List<JsonRecord> jsonRecords = queryApi.query(flux.toString(), JsonRecord.class);
            if (ObjectUtils.isEmpty(jsonRecords)) {
            	return jsonRecord;
            }
            jsonRecord = jsonRecords.get(0);
    		
    	} catch (Exception e) {
			log.error("[json measurement 지정 id 의 지정 시각의 데이터 단건 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);	
    	}
    	log.debug("[json measurement 지정 id 의 지정 시각의 데이터 단건 조회] 서비스 종료");
    	return jsonRecord;
    }   
    
    /**
     * 
     * influx db Java client 사용 시,
     * tag value의 backslash parsing error를 방지.
     * @param tagValue
     * @return escaped tagValue
     * */
    private String escapeBackslashForTag(String tagValue) {
    	return tagValue.replace("\\", "\\\\");
    }
    
    private Instant parseRFC3339toDateStr(String dateStr) {
    	Instant instant = null;
        try {
        	instant = Instant.parse(dateStr);
        } catch (DateTimeParseException ex) {
        	StringBuffer sb = new StringBuffer();
        	sb.append("time").append(ValueUtil.invalid("Invalid timestamp format. Expected RFC3339.")).append("\n");
        	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
        } 
    	return instant;
    }
    
	private Long toNanosec(String dateTimeStr) {
		if (dateTimeStr == null) return null;
		return DateUtil.toUnixTimestamp(dateTimeStr) * 1_000_000;
	}
	
	private Instant toInstantForInfluxRange(String dateTimeStr) {
		LocalDateTime localDateTime = DateUtil.toLocalDateTime(dateTimeStr);
		ZoneOffset zoneOffset = ZoneOffset.UTC;
		return localDateTime.toInstant(zoneOffset);
	}
	
}
