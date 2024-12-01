package kr.co.e8ight.ndxpro.dataservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.DataModelEntityDto;
import kr.co.e8ight.ndxpro.dataservice.service.EntityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Tag(name = "EntityController", description = "NGSI-LD Entity 조회")
@RestController
@RequestMapping("/ndxpro/v1/service")
public class EntityController {

    private final EntityService entityService;

    public EntityController(EntityService entityService) {
        this.entityService = entityService;
    }

    @Operation(
            summary = "NGSI-LD Entity 전체 조회 with provider",
            description = "DataModel type 으로 수집처 정보를 포함한 NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities")
    public DataModelEntityDto getEntities(@RequestParam @Schema(example = "Link") String type,
                                                          @RequestParam(required = false) @Schema(example = "") String q,
                                                          @RequestParam(defaultValue = "0") int offset,
                                                          @RequestParam(defaultValue = "50") int limit,
                                                          @RequestParam(defaultValue = "DESC") String sort,
                                                          @RequestParam(defaultValue = "modDate") String sortproperty,
                                                          @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.222:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntities request type={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, Link={}", type, q, offset, limit, sort, sortproperty, link);
        return entityService.getEntities(offset, limit, sort, sortproperty, type, q, link);
    }

    @Operation(
            summary = "NGSI-LD Entity 단건 조회 with provider",
            description = "NGSI-LD Entity id 로 수집처 정보를 포함한 NGSI-LD Entity 단건 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/{entityId}")
    public Object getEntity(@PathVariable @Schema(example = "urn:e8ight:Link:1") String entityId,
                                          @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.222:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntity request entityId={}, Link={}", entityId, link);
        return entityService.getEntity(entityId, link);
    }
}
