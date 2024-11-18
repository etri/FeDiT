package kr.co.e8ight.ndxpro.databroker.controller.iot;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityProviderDto;
import kr.co.e8ight.ndxpro.databroker.dto.QueryDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTObservedAtDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityDto;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.service.EntityDocumentKey;
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

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/broker")
public class IoTEntityController {

    private final IoTEntityService ioTEntityService;

    private final IoTEntityHistoryService ioTEntityHistoryService;

    public IoTEntityController(IoTEntityService ioTEntityService, IoTEntityHistoryService ioTEntityHistoryService) {
        this.ioTEntityService = ioTEntityService;
        this.ioTEntityHistoryService = ioTEntityHistoryService;
    }

    @Operation(
            summary = "IoT NGSI-LD Entity 단건 조회 (by entityId)",
            description = "NGSI-LD Entity id 로 IoT NGSI-LD Entity 단건 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/iot/{entityId}")
    public EntityDto getIoTEntity(@PathVariable(required = false) @Schema(example = "urn:e8ight:SimulationVehicle:695") String entityId,
                                  @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntity request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return ioTEntityService.getIoTEntity(entityId, parsedLink);
    }

    @Operation(
            summary = "IoT NGSI-LD Entity 전체 조회 (by queryDto)",
            description = "QueryDto(id, type, q) 로 IoT NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities/iot")
    public ResponseEntity<List<EntityDto>> getIoTEntities(@RequestParam(required = false) @Schema(example = "urn:e8ight:SimulationVehicle:695") String id,
                                                          @RequestParam(required = false) @Schema(example = "SimulationVehicle") String type,
                                                          @RequestParam(required = false) @Schema(example = "vehicleType==car") String q,
                                                          @RequestParam(defaultValue = "0") int offset,
                                                          @RequestParam(defaultValue = "50") int limit,
                                                          @RequestParam(defaultValue = "DESC") SortTypeCode sort,
                                                          @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) String sortproperty,
                                                          @RequestParam(required = false) @Schema(example = "count") String options,
                                                          @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
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
            summary = "IoT NGSI-LD Entity 단건 조회 with provider (by entityId)",
            description = "NGSI-LD Entity id 로 수집처 정보를 포함한 IoT NGSI-LD Entity 단건 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/iot/provider/{entityId}")
    public EntityProviderDto getIoTEntityWithProvider(@PathVariable(required = false) @Schema(example = "urn:e8ight:SimulationVehicle:695") String entityId,
                                  @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntityWithProvider request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return ioTEntityService.getIoTEntityWithProvider(entityId, parsedLink);
    }

    @Operation(
            summary = "IoT NGSI-LD Entity 전체 조회 with provider (by queryDto)",
            description = "QueryDto(id, type, q) 로 수집처 정보를 포함한 IoT NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities/iot/provider")
    public ResponseEntity<List<EntityProviderDto>> getIoTEntitiesWithProvider(@RequestParam(required = false) @Schema(example = "urn:e8ight:SimulationVehicle:695") String id,
                                                                              @RequestParam(required = false) @Schema(example = "SimulationVehicle") String type,
                                                                              @RequestParam(required = false) @Schema(example = "vehicleType==car") String q,
                                                                              @RequestParam(defaultValue = "0") int offset,
                                                                              @RequestParam(defaultValue = "50") int limit,
                                                                              @RequestParam(defaultValue = "DESC") SortTypeCode sort,
                                                                              @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) String sortproperty,
                                                                              @RequestParam(required = false) @Schema(example = "count") String options,
                                                                              @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
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
            summary = "IoT NGSI-LD Entities 조회 (by temporal query)",
            description = "temporal query로 IoT NGSI-LD Entity 들을 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "temporal query 파라미터 예시1 : timeproperty=speed.observedAt&time=2023-03-14T09:04:46.117<br>" +
                    "temporal query 파라미터 예시2 : timeproperty=speed.observedAt&time=2023-03-14T09:04:46.117&timerel=after<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities/iot/temporal")
    public ResponseEntity<List<EntityDto>> getTemporalIoTEntities(@RequestParam(required = false) @Schema(example = "SimulationVehicle") String type,
                                                                  @RequestParam(required = false) String timerel,
                                                                  @RequestParam String time,
                                                                  @RequestParam(required = false) String endtime,
                                                                  @RequestParam @Schema(example = "speed.observedAt") String timeproperty,
                                                                  @RequestParam(required = false) @Schema(example = "scenarioId==2;scenarioType==TOD;") String q,
                                                                  @RequestParam(defaultValue = "0") int offset,
                                                                  @RequestParam(defaultValue = "50") int limit,
                                                                  @RequestParam(required = false) @Schema(example = "count") String options,
                                                                  @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
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
            summary = "IoT NGSI-LD Entities observedAt date time 조회",
            description = "IoT NGSI-LD Entity 들을 조회하는 API 입니다.<br><br>",
            method = "GET"
    )
    @GetMapping("/entities/iot/temporal/observed-at")
    public IoTObservedAtDto getIoTObservedAt(@RequestParam(required = false) String nextDateTime,
                                             @RequestParam @Schema(example = "2") int scenarioId,
                                             @RequestParam @Schema(example = "RTSC") String scenarioType) {
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
            summary = "IoT NGSI-LD Entity Histories 조회 (by entityId, timeproperty)",
            description = "NGSI-LD Entity id 로 IoT NGSI-LD Entity 를 시계열(observedAt) 순으로 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context url값을 넣어주세요.<br><br>" +
                    "timeproperty 기준으로 history를 조회 하기 때문에, timeproperty를 필수로 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double<br><br>" +
                    "timerel은 'before', 'after', 'between' 값을 지원합니다. timerel을 요청할 경우 time 값은 필수 값이고, timerel이 'between'의 경우 time 뿐만아니라 endTime 값이 필수 값입니다.",
            method = "GET"
    )
    @GetMapping("/entities/iot/history")
    public ResponseEntity<List<IoTEntityDto>> getIoTEntityHistories(@RequestParam @Schema(example = "urn:e8ight:SimulationVehicle:695")String entityId,
                                                                    @RequestParam(required = false) @Schema(example = "between") String timerel,
                                                                    @RequestParam(required = false) @Schema(example = "2023-03-01T09:00:00.000") String time,
                                                                    @RequestParam(required = false) @Schema(example = "2023-03-30T09:00:00.000") String endTime,
                                                                    @RequestParam @Schema(example = "speed.observedAt") String timeproperty,
                                                                    @RequestParam(required = false) @Schema(example = "vehicleType==car") String q,
                                                                    @RequestParam(defaultValue = "0") int offset,
                                                                    @RequestParam(defaultValue = "50") int limit,
                                                                    @RequestParam(defaultValue = "DESC") SortTypeCode sort,
                                                                    @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_HISTORY_ENTITY_SORT_PROPERTY_KEY) String sortproperty,
                                                                    @RequestParam(required = false) @Schema(example = "count") String options,
                                                                    @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
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
            summary = "History 정보 조회 (by historyId)",
            description = "History id 로 Iot NGSI-LD Entity History 정보를 조회하는 API 입니다.<br><br>" +
                    "timeproperty 기준으로 history를 조회 하기 때문에, timeproperty를 필수로 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/iot/history/{historyId}")
    public IoTEntityDto getIoTEntityHistory(@PathVariable @Schema(example = "640fc74c564f7778f58e8088") String historyId,
                                            @RequestParam @Schema(example = "speed.observedAt") String timeproperty) {
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
