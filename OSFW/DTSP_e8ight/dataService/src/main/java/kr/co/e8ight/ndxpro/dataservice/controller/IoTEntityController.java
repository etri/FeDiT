package kr.co.e8ight.ndxpro.dataservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.DataModelEntityDto;
import kr.co.e8ight.ndxpro.dataservice.dto.IoTEntityHistoryDto;
import kr.co.e8ight.ndxpro.dataservice.dto.IoTEntityHistoryIdListDto;
import kr.co.e8ight.ndxpro.dataservice.service.IoTEntityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Tag(name = "IoTEntityController", description = "IoT NGSI-LD Entity 및 History 조회")
@RestController
@RequestMapping("/ndxpro/v1/service")
public class IoTEntityController {

    private final IoTEntityService ioTEntityService;

    public IoTEntityController(IoTEntityService ioTEntityService) {
        this.ioTEntityService = ioTEntityService;
    }

    @Operation(
            summary = "IoT NGSI-LD Entity 전체 조회 with provider",
            description = "DataModel type 으로 수집처 정보를 포함한 IoT NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities/iot")
    public DataModelEntityDto getIoTEntities(@RequestParam @Schema(example = "SimulationVehicle") String type,
                                                             @RequestParam(required = false) @Schema(example = "") String q,
                                                             @RequestParam(defaultValue = "0") int offset,
                                                             @RequestParam(defaultValue = "50") int limit,
                                                             @RequestParam(defaultValue = "DESC") String sort,
                                                             @RequestParam(defaultValue = "modDate") String sortproperty,
                                                             @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.222:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntities request type={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, options={}, Link={}", type, q, offset, limit, sort, sortproperty, link);
        return ioTEntityService.getIoTEntities(offset, limit, sort, sortproperty, type, q, link);
    }

    @Operation(
            summary = "IoT NGSI-LD Entity 단건 조회 with provider",
            description = "NGSI-LD Entity id 로 수집처 정보를 포함한 IoT NGSI-LD Entity 단건 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/iot/{entityId}")
    public Object getIoTEntity(@PathVariable @Schema(example = "urn:e8ight:SimulationVehicle:695") String entityId,
                                          @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.222:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntity request entityId={}, Link={}", entityId, link);
        return ioTEntityService.getIoTEntity(entityId, link);
    }

    @Operation(
            summary = "IoT NGSI-LD Entity History 조회 with provider",
            description = "NGSI-LD Entity id 로 수집처 정보를 포함한 IoT NGSI-LD Entity 를 observedAt 순으로 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context url값을 넣어주세요.<br><br>" +
                    "timeproperty 기준으로 history를 조회 하기 때문에, timeproperty를 필수로 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity service path key(entity._id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double<br><br>" +
                    "timerel은 'before', 'after', 'between' 값을 지원합니다. timerel을 요청할 경우 time 값은 필수 값이고, timerel이 'between'의 경우 time 뿐만아니라 endTime 값이 필수 값입니다.",
            method = "GET"
    )
    @GetMapping("/entities/iot/history")
    public IoTEntityHistoryIdListDto getEntityHistories(@RequestParam @Schema(example = "urn:e8ight:SimulationVehicle:695") String entityId,
                                                        @RequestParam(required = false) @Schema(example = "between") String timerel,
                                                        @RequestParam(required = false) @Schema(example = "2023-07-25T16:07:58.000") String time,
                                                        @RequestParam(required = false) @Schema(example = "2023-07-25T16:07:59.000") String endTime,
                                                        @RequestParam @Schema(example = "speed.observedAt") String timeproperty,
                                                        @RequestParam(required = false) @Schema(example = "") String q,
                                                        @RequestParam(defaultValue = "0") int offset,
                                                        @RequestParam(defaultValue = "50") int limit,
                                                        @RequestParam(defaultValue = "DESC") String sort,
                                                        @RequestParam(defaultValue = "entity.modDate") String sortproperty,
                                                        @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.222:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getIoTEntityHistories request entityId={}, timerel={}, time={}, endTime={}, timeproperty={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, Link={}", entityId, timerel, time, endTime, timeproperty, q, offset, limit, sort, sortproperty, link);
        return ioTEntityService.getEntityHistories(offset, limit, sort, sortproperty, entityId, timeproperty, timerel, time, endTime, q, link);
    }
    @Operation(
            summary = "IoT NGSI-LD Entity History 상세 조회",
            description = "IoT NGSI-LD Entity History의 상세 정보를 조회하는 API 입니다.<br><br>" +
                    "timeproperty 기준으로 history를 조회 하기 때문에, timeproperty를 필수로 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/iot/history/{historyId}")
    public IoTEntityHistoryDto getEntityHistory(@PathVariable @Schema(example = "64bf8d0b478db509bcf56f42") String historyId,
                                                @RequestParam @Schema(example = "speed.observedAt") String timeproperty) {
        log.info("getEntityHistory request historyId={}, timeproperty={}", historyId, timeproperty);
        return ioTEntityService.getEntityHistory(historyId, timeproperty);
    }
}
