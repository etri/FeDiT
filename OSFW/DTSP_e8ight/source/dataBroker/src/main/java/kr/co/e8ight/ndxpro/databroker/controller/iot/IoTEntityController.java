package kr.co.e8ight.ndxpro.databroker.controller.iot;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.config.SwaggerConfiguration;
import kr.co.e8ight.ndxpro.databroker.config.SwaggerDescription;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityProviderDto;
import kr.co.e8ight.ndxpro.databroker.dto.QueryDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTObservedAtDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityDto;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.service.EntityDocumentKey;
import kr.co.e8ight.ndxpro.databroker.service.EntityService;
import kr.co.e8ight.ndxpro.databroker.service.iot.IoTEntityHistoryService;
import kr.co.e8ight.ndxpro.databroker.service.iot.IoTEntityService;
import kr.co.e8ight.ndxpro.databroker.util.HttpHeadersUtil;
import kr.co.e8ight.ndxpro.databroker.util.SortTypeCode;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/broker")
@Tag(name = SwaggerConfiguration.TAG_TIME_SERIES)
public class IoTEntityController {

    private final IoTEntityService ioTEntityService;

    private final IoTEntityHistoryService ioTEntityHistoryService;

    private final EntityService entityService;

    private final ObjectMapper objectMapper;

    public IoTEntityController(IoTEntityService ioTEntityService, IoTEntityHistoryService ioTEntityHistoryService, EntityService entityService, ObjectMapper objectMapper) {
        this.ioTEntityService = ioTEntityService;
        this.ioTEntityHistoryService = ioTEntityHistoryService;
        this.entityService = entityService;
        this.objectMapper = objectMapper;
    }

    @Operation(
            summary = "시계열 Entity 저장",
            description = "NGSI-LD Entity 를 시계열 Entity 로 저장하는 API 입니다. 최신 스냅샷을 갱신하고 이력(history)에 추가합니다.<br><br>" +
                    "Kafka 수집 경로와 동일하게 저장되며, 유효성 검사 실패 시 400 을 반환합니다.<br>" +
                    "<ul>" +
                    "<li>하나 이상의 attribute 에 <code>observedAt</code> 이 있어야 합니다.</li>" +
                    "<li><code>observedAt</code> 은 타임존을 포함한 <code>yyyy-MM-dd'T'HH:mm:ss.SSSXXX</code> 형식입니다. (예: 2026-10-02T13:50:00.123+09:00)</li>" +
                    "<li>같은 Entity 에 같은 <code>observedAt</code> 이 이미 있으면 이력은 추가되지 않습니다.</li>" +
                    "</ul>" +
                    SwaggerDescription.SAVE_ENTITY_RULES,
            method = "POST"
    )
    @PostMapping("/entities/iot")
    public void saveIoTEntity(
            @RequestBody @Schema(example = "{" +
                    "  \"id\": \"urn:ngsi-ld:SimulationVehicle:695\", " +
                    "  \"type\": \"SimulationVehicle\"," +
                    "    \"speed\": {" +
                    "      \"type\": \"Property\"," +
                    "      \"value\": 32.5," +
                    "      \"observedAt\": \"2026-10-02T13:50:00.123+09:00\"" +
                    "    }," +
                    "    \"@context\": \"http://context-server:53005/e8ight-context-v1.0.1.jsonld\"" +
                    "}") LinkedHashMap<String, Object> entity) {
        log.info("saveIoTEntity(), Entity : {}", entity);

        EntityDto entityDto = objectMapper.convertValue(entity, EntityDto.class);
        entityService.mapAttributeDto(entityDto);
        ioTEntityService.createIoTEntity(entityService.mapEntityDtoToIoTEntity(entityDto));
    }

    @Operation(
            summary = "시계열 Entity 최신 단건 조회 (by entityId)",
            description = "NGSI-LD Entity id 로 시계열 Entity 의 최신 스냅샷을 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택이며, 생략하면 id 만으로 조회합니다.",
            method = "GET"
    )
    @GetMapping("/entities/iot/{entityId}")
    public EntityDto getIoTEntity(@PathVariable(required = false) @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:SimulationVehicle:695") String entityId,
                                  @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntity request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return ioTEntityService.getIoTEntity(entityId, parsedLink);
    }

    @Operation(
            summary = "시계열 Entity 최신 목록 조회 (by queryDto)",
            description = "QueryDto(id, type, q) 로 시계열 Entity 의 최신 스냅샷 목록을 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택입니다.<br><br>" +
                    SwaggerDescription.Q_OPERATORS_WITH_ID,
            method = "GET"
    )
    @GetMapping("/entities/iot")
    public ResponseEntity<List<EntityDto>> getIoTEntities(@RequestParam(required = false) @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:SimulationVehicle:695") String id,
                                                          @RequestParam(required = false) @Parameter(description = SwaggerDescription.TYPE, example = "SimulationVehicle") String type,
                                                          @RequestParam(required = false) @Parameter(description = SwaggerDescription.Q, example = "vehicleType==car") String q,
                                                          @RequestParam(defaultValue = "0") @Parameter(description = SwaggerDescription.OFFSET) int offset,
                                                          @RequestParam(defaultValue = "50") @Parameter(description = SwaggerDescription.LIMIT) int limit,
                                                          @RequestParam(defaultValue = "DESC") @Parameter(description = SwaggerDescription.SORT) SortTypeCode sort,
                                                          @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) @Parameter(description = SwaggerDescription.SORT_PROPERTY) String sortproperty,
                                                          @RequestParam(required = false) @Parameter(description = SwaggerDescription.OPTIONS, example = "count") String options,
                                                          @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntities request id={}, type={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, options={}, Link={}", id, type, q, offset, limit, sort, sortproperty, options, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        QueryDto queryDto = QueryDto.builder()
                .id(id)
                .type(type)
                .q(q)
                .offset(offset)
                .limit(limit)
                .link(parsedLink)
                .sort(sort)
                .sortproperty(sortproperty)
                .build();

        Page<EntityDto> ioTEntities = ioTEntityService.getIoTEntities(queryDto);
        return getResponseEntityByOptions(options, ioTEntities.getContent(), ioTEntities.getTotalPages(), ioTEntities.getTotalElements());
    }

    @Operation(
            summary = "시계열 Entity 최신 단건 조회 with provider (by entityId)",
            description = "NGSI-LD Entity id 로 수집처 정보를 포함한 시계열 Entity 의 최신 스냅샷을 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택이며, 생략하면 id 만으로 조회합니다.",
            method = "GET"
    )
    @GetMapping("/entities/iot/provider/{entityId}")
    public EntityProviderDto getIoTEntityWithProvider(@PathVariable(required = false) @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:SimulationVehicle:695") String entityId,
                                  @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntityWithProvider request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return ioTEntityService.getIoTEntityWithProvider(entityId, parsedLink);
    }

    @Operation(
            summary = "시계열 Entity 최신 목록 조회 with provider (by queryDto)",
            description = "QueryDto(id, type, q) 로 수집처 정보를 포함한 시계열 Entity 의 최신 스냅샷 목록을 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택입니다.<br><br>" +
                    SwaggerDescription.Q_OPERATORS_WITH_ID,
            method = "GET"
    )
    @GetMapping("/entities/iot/provider")
    public ResponseEntity<List<EntityProviderDto>> getIoTEntitiesWithProvider(@RequestParam(required = false) @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:SimulationVehicle:695") String id,
                                                                              @RequestParam(required = false) @Parameter(description = SwaggerDescription.TYPE, example = "SimulationVehicle") String type,
                                                                              @RequestParam(required = false) @Parameter(description = SwaggerDescription.Q, example = "vehicleType==car") String q,
                                                                              @RequestParam(defaultValue = "0") @Parameter(description = SwaggerDescription.OFFSET) int offset,
                                                                              @RequestParam(defaultValue = "50") @Parameter(description = SwaggerDescription.LIMIT) int limit,
                                                                              @RequestParam(defaultValue = "DESC") @Parameter(description = SwaggerDescription.SORT) SortTypeCode sort,
                                                                              @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) @Parameter(description = SwaggerDescription.SORT_PROPERTY) String sortproperty,
                                                                              @RequestParam(required = false) @Parameter(description = SwaggerDescription.OPTIONS, example = "count") String options,
                                                                              @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntitiesWithProvider request id={}, type={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, options={}, Link={}", id, type, q, offset, limit, sort, sortproperty, options, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        QueryDto queryDto = QueryDto.builder()
                .id(id)
                .type(type)
                .q(q)
                .offset(offset)
                .limit(limit)
                .link(parsedLink)
                .sort(sort)
                .sortproperty(sortproperty)
                .build();

        Page<EntityProviderDto> ioTEntities = ioTEntityService.getIoTEntitiesWithProvider(queryDto);
        return getResponseEntityByOptions(options, ioTEntities.getContent(), ioTEntities.getTotalPages(), ioTEntities.getTotalElements());
    }

    @Operation(
            summary = "시계열 Entity 시점 조회 (by temporal query)",
            description = "특정 시점(time) 또는 시간 조건(timerel)에 해당하는 시계열 Entity 들을 type 단위로 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택입니다.<br><br>" +
                    "<b>예시</b><br>" +
                    "- 특정 시점 : timeproperty=speed.observedAt&time=2023-03-14T09:04:46.117<br>" +
                    "- 특정 시점 이후 : timeproperty=speed.observedAt&time=2023-03-14T09:04:46.117&timerel=after<br>" +
                    "- 기간 : timeproperty=speed.observedAt&timerel=between&time=2023-03-14T09:00:00.000&endtime=2023-03-14T10:00:00.000<br><br>" +
                    SwaggerDescription.Q_OPERATORS,
            method = "GET"
    )
    @GetMapping("/entities/iot/temporal")
    public ResponseEntity<List<EntityDto>> getTemporalIoTEntities(@RequestParam(required = false) @Parameter(description = SwaggerDescription.TYPE, example = "SimulationVehicle") String type,
                                                                  @RequestParam(required = false) @Parameter(description = SwaggerDescription.TIMEREL, schema = @Schema(allowableValues = {"before", "after", "between"})) String timerel,
                                                                  @RequestParam @Parameter(description = SwaggerDescription.TEMPORAL_TIME, example = "2023-03-14T09:04:46.117") String time,
                                                                  @RequestParam(required = false) @Parameter(description = SwaggerDescription.END_TIME, example = "2023-03-14T10:04:46.117") String endtime,
                                                                  @RequestParam @Parameter(description = SwaggerDescription.TIME_PROPERTY, example = "speed.observedAt") String timeproperty,
                                                                  @RequestParam(required = false) @Parameter(description = SwaggerDescription.Q, example = "scenarioId==2;scenarioType==TOD;") String q,
                                                                  @RequestParam(defaultValue = "0") @Parameter(description = SwaggerDescription.OFFSET) int offset,
                                                                  @RequestParam(defaultValue = "50") @Parameter(description = SwaggerDescription.LIMIT) int limit,
                                                                  @RequestParam(required = false) @Parameter(description = SwaggerDescription.OPTIONS, example = "count") String options,
                                                                  @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getTemporalIoTEntities request type={}, timerel={}, time={}, endtime={}, timeproperty={}, q={}, offset={}, limit={}, options={}, Link={}", type, timerel, time, endtime, timeproperty, q, offset, limit, options, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        QueryDto queryDto = QueryDto.builder()
                .type(type)
                .timerel(timerel)
                .time(time)
                .endTime(endtime)
                .timeproperty(timeproperty)
                .q(q)
                .offset(offset)
                .limit(limit)
                .link(parsedLink)
                .build();

        validateTemporalQuery(queryDto);

        Page<EntityDto> temporalIoTEntities = ioTEntityHistoryService.getTemporalIoTEntities(queryDto);
        return getResponseEntityByOptions(options, temporalIoTEntities.getContent(), temporalIoTEntities.getTotalPages(), temporalIoTEntities.getTotalElements());
    }

    @Operation(
            summary = "시계열 Entity observedAt 일시 조회",
            description = "시나리오(scenarioId, scenarioType)의 observedAt 일시를 순서대로 조회하는 API 입니다.<br><br>" +
                    "nextDateTime 을 생략하면 첫 번째 observedAt 을, 지정하면 그 다음 observedAt 을 반환합니다.",
            method = "GET"
    )
    @GetMapping("/entities/iot/temporal/observed-at")
    public IoTObservedAtDto getIoTObservedAt(@RequestParam(required = false) @Parameter(description = "기준 일시. 생략 시 첫 번째 observedAt 반환") String nextDateTime,
                                             @RequestParam @Parameter(description = "시나리오 id", example = "2") int scenarioId,
                                             @RequestParam @Parameter(description = "시나리오 type", example = "RTSC") String scenarioType) {
        IoTObservedAtDto observedAt = null;
        if(ValidateUtil.isEmptyData(nextDateTime))
            observedAt = ioTEntityService.getFirstObservedAt(scenarioId, scenarioType);
        else
            observedAt = ioTEntityService.getNextObservedAt(nextDateTime, scenarioId, scenarioType);

        if(ValidateUtil.isEmptyData(observedAt))
            throw new DataBrokerException(ErrorCode.RESOURCE_NOT_FOUND, "Not Found nextDateTime data. nextDateTime=" + nextDateTime);
        return observedAt;
    }

//    @Operation(
//            summary = "IoT NGSI-LD Entities 삭제",
//            description = "IoT NGSI-LD Entity 들을 삭제하는 API 입니다.<br><br>",
//            method = "DELETE"
//    )
//    @DeleteMapping("/entities/iot/temporal/delete")
//    public void deleteTemporalEntities(@RequestParam @Schema(example = "2") int scenarioId,
//                                       @RequestParam @Schema(example = "RTSC") String scenarioType,
//                                       @RequestParam @Schema(example = "2023-05-31") String date,
//                                       @RequestParam @Schema(example = "오전첨두") String timeGroup) {
//        ioTEntityHistoryService.deleteTemporalEntities(scenarioId, scenarioType, date, timeGroup);
//    }

    @Operation(
            summary = "시계열 Entity 이력 목록 조회 (by entityId, timeproperty)",
            description = "NGSI-LD Entity id 로 시계열 Entity 의 이력을 observedAt 순으로 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택입니다.<br><br>" +
                    "<b>사용 방법</b><br>" +
                    "1. entityId 와 timeproperty(<code>{속성명}.observedAt</code>) 를 넣습니다. (필수)<br>" +
                    "2. 기간을 제한하려면 timerel 을 선택하고 time / endTime 을 넣습니다.<br>" +
                    "&nbsp;&nbsp;- before / after : time 필수<br>" +
                    "&nbsp;&nbsp;- between : time, endTime 필수<br>" +
                    "3. 응답의 historyId 로 <code>/entities/iot/history/{historyId}</code> 를 호출하면 해당 시점의 전체 속성값을 확인할 수 있습니다.<br><br>" +
                    SwaggerDescription.Q_OPERATORS,
            method = "GET"
    )
    @GetMapping("/entities/iot/history")
    public ResponseEntity<List<IoTEntityDto>> getIoTEntityHistories(@RequestParam @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:SimulationVehicle:695") String entityId,
                                                                    @RequestParam(required = false) @Parameter(description = SwaggerDescription.TIMEREL, example = "between", schema = @Schema(allowableValues = {"before", "after", "between"})) String timerel,
                                                                    @RequestParam(required = false) @Parameter(description = SwaggerDescription.TIME, example = "2023-03-01T09:00:00.000") String time,
                                                                    @RequestParam(required = false) @Parameter(description = SwaggerDescription.END_TIME, example = "2023-03-30T09:00:00.000") String endTime,
                                                                    @RequestParam @Parameter(description = SwaggerDescription.TIME_PROPERTY, example = "speed.observedAt") String timeproperty,
                                                                    @RequestParam(required = false) @Parameter(description = SwaggerDescription.Q, example = "vehicleType==car") String q,
                                                                    @RequestParam(defaultValue = "0") @Parameter(description = SwaggerDescription.OFFSET) int offset,
                                                                    @RequestParam(defaultValue = "50") @Parameter(description = SwaggerDescription.LIMIT) int limit,
                                                                    @RequestParam(defaultValue = "DESC") @Parameter(description = SwaggerDescription.SORT) SortTypeCode sort,
                                                                    @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_HISTORY_ENTITY_SORT_PROPERTY_KEY) @Parameter(description = SwaggerDescription.SORT_PROPERTY) String sortproperty,
                                                                    @RequestParam(required = false) @Parameter(description = SwaggerDescription.OPTIONS, example = "count") String options,
                                                                    @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntityHistories request entityId={}, timerel={}, time={}, endTime={}, timeproperty={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, options={}, Link={}", entityId, timerel, time, endTime, timeproperty, q, offset, limit, sort, sortproperty, options, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        QueryDto queryDto = QueryDto.builder()
                .id(entityId)
                .q(q)
                .timerel(timerel)
                .time(time)
                .endTime(endTime)
                .timeproperty(timeproperty)
                .offset(offset)
                .limit(limit)
                .sort(sort)
                .sortproperty(sortproperty)
                .link(parsedLink)
                .build();

        validateTemporalQuery(queryDto);

        Page<IoTEntityDto> ioTEntityHistories = ioTEntityHistoryService.getIoTEntityHistories(queryDto);
        return getResponseEntityByOptions(options, ioTEntityHistories.getContent(), ioTEntityHistories.getTotalPages(), ioTEntityHistories.getTotalElements());
    }

    @Operation(
            summary = "시계열 Entity 이력 단건 조회 (by historyId)",
            description = "이력 목록 조회에서 받은 historyId 로 해당 시점의 시계열 Entity 전체 속성값을 조회하는 API 입니다.<br><br>" +
                    "timeproperty 기준으로 이력을 조회 하기 때문에, 이력 목록 조회에서 사용한 timeproperty 를 동일하게 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/iot/history/{historyId}")
    public IoTEntityDto getIoTEntityHistory(@PathVariable @Parameter(description = SwaggerDescription.HISTORY_ID, example = "640fc74c564f7778f58e8088") String historyId,
                                            @RequestParam @Parameter(description = SwaggerDescription.TIME_PROPERTY, example = "speed.observedAt") String timeproperty) {
        log.info("getIoTEntityHistory request historyId={}, timeproperty={}", historyId, timeproperty);

        return ioTEntityHistoryService.getIoTEntityHistory(historyId, timeproperty);
    }

    public void validateTemporalQuery(QueryDto queryDto) {
        String timerel = queryDto.getTimerel();
        if(!ValidateUtil.isEmptyData(timerel)) {
            String time = queryDto.getTime();
            String endTime = queryDto.getEndTime();
            switch (timerel) {
                case "before":
                case "after":
                    if (ValidateUtil.isEmptyData(time))
                        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid time value. Time is null. time=" + time);
                    break;
                case "between":
                    if (ValidateUtil.isEmptyData(time) || ValidateUtil.isEmptyData(endTime))
                        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid time or end time value. Time or End Time is null. time=" + time + ", endTime=" + endTime);
                    break;
                default:
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Relation. timerel=" + timerel);
            }
        }
    }

    public ResponseEntity getResponseEntityByOptions(String options, Object content, int page, long data) {
        if(!ValidateUtil.isEmptyData(options)) {
            if (options.contains("count")) {
                HttpHeaders headers = new HttpHeaders();
                headers.set("totalPage", String.valueOf(page));
                headers.set("totalData", String.valueOf(data));
                return new ResponseEntity<>(content, headers, HttpStatus.OK);
            } else {
                throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Not Supported options. options=" + options);
            }
        } else {
            return new ResponseEntity<>(content, HttpStatus.OK);
        }
    }
}
