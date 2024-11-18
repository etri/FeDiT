package kr.co.e8ight.ndxpro.databroker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.dto.*;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.service.EntityDocumentKey;
import kr.co.e8ight.ndxpro.databroker.service.EntityService;
import kr.co.e8ight.ndxpro.databroker.util.HttpHeadersUtil;
import kr.co.e8ight.ndxpro.databroker.util.SortTypeCode;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.*;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/broker")
public class EntityController {

    private final EntityService entityService;

    private final ObjectMapper objectMapper;

    public EntityController(EntityService entityService, ObjectMapper objectMapper) {
        this.entityService = entityService;
        this.objectMapper = objectMapper;
    }

    @Operation(
            summary = "NGSI-LD Entity 단건 조회 (by entityId)",
            description = "NGSI-LD Entity id 로 NGSI-LD Entity 단건 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/{entityId}")
    public EntityDto getEntity(@PathVariable @Schema(example = "urn:e8ight:Link:10280") String entityId,
                               @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntity request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return entityService.getEntity(entityId, parsedLink);
    }

    @Operation(
            summary = "NGSI-LD Entity 전체 조회 (by queryDto)",
            description = "QueryDto(id, type, q) 로 NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities")
    public ResponseEntity<List<EntityDto>> getEntities(@RequestParam(required = false) @Schema(example = "urn:e8ight:Link:10280") String id,
                                       @RequestParam(required = false) @Schema(example = "Link") String type,
                                       @RequestParam(required = false) @Schema(example = "carriagewayWidth==3") String q,
                                       @RequestParam(defaultValue = "0") int offset,
                                       @RequestParam(defaultValue = "50") int limit,
                                       @RequestParam(defaultValue = "DESC") SortTypeCode sort,
                                       @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) String sortproperty,
                                       @RequestParam(required = false) @Schema(example = "count") String options,
                                       @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntities request id={}, type={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, options={}, Link={}", id, type, q, offset, limit, sort, sortproperty, options, link);
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

        Page<EntityDto> entities = entityService.getEntities(queryDto);
        return getResponseEntityByOptions(options, entities.getContent(), entities.getTotalPages(), entities.getTotalElements());
    }

    @Operation(
            summary = "NGSI-LD Entity 단건 조회 with provider (by entityId)",
            description = "NGSI-LD Entity id 로 수집처 정보를 포함한 NGSI-LD Entity 단건 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.",
            method = "GET"
    )
    @GetMapping("/entities/provider/{entityId}")
    public EntityProviderDto getEntityWithProvider(@PathVariable @Schema(example = "urn:e8ight:Link:10280") String entityId,
                                                   @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntityWithProvider request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return entityService.getEntityWithProvider(entityId, parsedLink);
    }

    @Operation(
            summary = "NGSI-LD Entity 전체 조회 with provider (by queryDto)",
            description = "QueryDto(id, type, q) 로 수집처 정보를 포함한 NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Header의 Link에는 context 값을 넣어주세요.<br><br>" +
                    "q 파라미터의 key 값은 attribute 또는 child attribute name 입니다. 연산자 별 지원되는 attribute value type은 다음과 같습니다." +
                    " == 와 ~= 연산자의 경우, entity id key(_id.id), entity service path key(_id.servicePath)도 지원 됩니다.<br>" +
                    "== : String, DateTime String, Boolean, Integer, Double<br>" +
                    "~= : String<br>" +
                    "<= 또는 >= : DateTime String, Integer, Double",
            method = "GET"
    )
    @GetMapping("/entities/provider")
    public ResponseEntity<List<EntityProviderDto>> getEntitiesWithProvider(@RequestParam(required = false) @Schema(example = "urn:e8ight:Link:10280") String id,
                                                                              @RequestParam(required = false) @Schema(example = "Link") String type,
                                                                              @RequestParam(required = false) @Schema(example = "carriagewayWidth==3") String q,
                                                                              @RequestParam(defaultValue = "0") int offset,
                                                                              @RequestParam(defaultValue = "50") int limit,
                                                                              @RequestParam(defaultValue = "DESC") SortTypeCode sort,
                                                                              @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) String sortproperty,
                                                                              @RequestParam(required = false) @Schema(example = "count") String options,
                                                                              @RequestHeader(value = HttpHeaders.LINK, required = false) @Schema(example = "<http://172.16.28.218:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntitiesWithProvider request id={}, type={}, q={}, offset={}, limit={}, sort={}, sortproperty={}, options={}, Link={}", id, type, q, offset, limit, sort, sortproperty, options, link);
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

        Page<EntityProviderDto> entities = entityService.getEntitiesWithProvider(queryDto);
        return getResponseEntityByOptions(options, entities.getContent(), entities.getTotalPages(), entities.getTotalElements());
    }

    @Operation(
            summary = "NGSI-LD Entity 저장",
            description = "NGSI-LD Entity를 저장하는 API 입니다.",
            method = "POST"
    )
    @PostMapping("/entities")
    public void saveEntity(
            @RequestBody @Schema(example = "{" +
                    "  \"id\": \"urn:e8ight:Link:test01\", " +
                    "  \"type\": \"Link\"," +
                    "    \"name\": {" +
                    "      \"type\": \"Property\"," +
                    "      \"value\": \"Valladolid-Dueñas\"" +
                    "    }," +
                    "    \"@context\": \"http://175.106.98.248:53005/e8ight-context-v1.0.jsonld\"" +
                    "}") LinkedHashMap<String, Object> entity) {
        log.info("saveEntity(), Entity : {}", entity);

        EntityDto entityDto = objectMapper.convertValue(entity, EntityDto.class);
        mapAttributeDto(entityDto);
        entityService.saveEntity(entityDto);
    }

    @Operation(
            summary = "NGSI-LD Entity 저장 with provider",
            description = "수집처 정보를 포함하는 NGSI-LD Entity를 저장하는 API 입니다.",
            method = "POST"
    )
    @PostMapping("/entities/provider")
    public void saveEntityWithProvider(
            @RequestBody @Schema(example = "{" +
                    "\"provider\": \"UOS\"," +
                    "\"entity\":" +
                    "{" +
                    "  \"id\": \"urn:e8ight:Link:test01\", " +
                    "  \"type\": \"Link\"," +
                    "    \"name\": {" +
                    "      \"type\": \"Property\"," +
                    "      \"value\": \"Valladolid-Dueñas\"" +
                    "    }," +
                    "    \"@context\": \"http://175.106.98.248:53005/e8ight-context-v1.0.jsonld\"" +
                    "}" +
                    "}") LinkedHashMap<String, Object> entity) {
        log.info("saveEntityWithProvider(), Entity : {}", entity);

        String provider = String.valueOf(entity.get("provider"));
        if(ValidateUtil.isEmptyData(provider))
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "provider is null.");
        EntityDto entityDto = objectMapper.convertValue(entity.get("entity"), EntityDto.class);
        if(ValidateUtil.isEmptyData(entityDto))
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "entity is null.");
        entityService.saveEntityWithProvider(provider, entityDto);
    }

    public LinkedHashMap<String, Object> mapAttributeDto(LinkedHashMap<String, Object> model) {
        if(ValidateUtil.isEmptyData(model))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Fail to parse Entity or Attribute.");
        for (String key : model.keySet()) {
            if (!hasCoreContextDataModel(key)) {
                LinkedHashMap<String, Object> attribute = (LinkedHashMap<String, Object>) model.get(key);
                String type = (String) attribute.get(TYPE.getCode());
                if (type.equals(PROPERTY.getCode())) {
                    PropertyDto propertyDto = objectMapper.convertValue(model.get(key), PropertyDto.class);
                    mapAttributeDto(propertyDto);
                    model.replace(key, propertyDto);
                } else if (type.equals(GEO_PROPERTY.getCode())) {
                    GeoPropertyDto geoPropertyDto = objectMapper.convertValue(model.get(key), GeoPropertyDto.class);
                    geoPropertyDto.mapGeoJson();
                    mapAttributeDto(geoPropertyDto);
                    model.replace(key, geoPropertyDto);
                } else if (type.equals(RELATIONSHIP.getCode())) {
                    RelationshipDto relationshipDto = objectMapper.convertValue(model.get(key), RelationshipDto.class);
                    mapAttributeDto(relationshipDto);
                    model.replace(key, relationshipDto);
                }
            }
        }
        return model;
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
