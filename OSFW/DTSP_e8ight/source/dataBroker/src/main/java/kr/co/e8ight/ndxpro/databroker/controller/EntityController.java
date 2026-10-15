package kr.co.e8ight.ndxpro.databroker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.config.SwaggerConfiguration;
import kr.co.e8ight.ndxpro.databroker.config.SwaggerDescription;
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
@Tag(name = SwaggerConfiguration.TAG_ENTITY)
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
                    "Link 헤더(context)는 선택이며, 생략하면 id 만으로 조회합니다.",
            method = "GET"
    )
    @GetMapping("/entities/{entityId}")
    public EntityDto getEntity(@PathVariable @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:Link:10280") String entityId,
                               @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntity request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return entityService.getEntity(entityId, parsedLink);
    }

    @Operation(
            summary = "NGSI-LD Entity 전체 조회 (by queryDto)",
            description = "QueryDto(id, type, q) 로 NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택입니다.<br><br>" +
                    SwaggerDescription.Q_OPERATORS_WITH_ID,
            method = "GET"
    )
    @GetMapping("/entities")
    public ResponseEntity<List<EntityDto>> getEntities(@RequestParam(required = false) @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:Link:10280") String id,
                                       @RequestParam(required = false) @Parameter(description = SwaggerDescription.TYPE, example = "Link") String type,
                                       @RequestParam(required = false) @Parameter(description = SwaggerDescription.Q, example = "carriagewayWidth==3") String q,
                                       @RequestParam(defaultValue = "0") @Parameter(description = SwaggerDescription.OFFSET) int offset,
                                       @RequestParam(defaultValue = "50") @Parameter(description = SwaggerDescription.LIMIT) int limit,
                                       @RequestParam(defaultValue = "DESC") @Parameter(description = SwaggerDescription.SORT) SortTypeCode sort,
                                       @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) @Parameter(description = SwaggerDescription.SORT_PROPERTY) String sortproperty,
                                       @RequestParam(required = false) @Parameter(description = SwaggerDescription.OPTIONS, example = "count") String options,
                                       @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
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
                    "Link 헤더(context)는 선택이며, 생략하면 id 만으로 조회합니다.",
            method = "GET"
    )
    @GetMapping("/entities/provider/{entityId}")
    public EntityProviderDto getEntityWithProvider(@PathVariable @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:Link:10280") String entityId,
                                                   @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
        log.info("getEntityWithProvider request entityId={}, Link={}", entityId, link);
        String parsedLink = HttpHeadersUtil.parseLinkURI(link);

        return entityService.getEntityWithProvider(entityId, parsedLink);
    }

    @Operation(
            summary = "NGSI-LD Entity 전체 조회 with provider (by queryDto)",
            description = "QueryDto(id, type, q) 로 수집처 정보를 포함한 NGSI-LD Entity 전체 조회하는 API 입니다.<br><br>" +
                    "Link 헤더(context)는 선택입니다.<br><br>" +
                    SwaggerDescription.Q_OPERATORS_WITH_ID,
            method = "GET"
    )
    @GetMapping("/entities/provider")
    public ResponseEntity<List<EntityProviderDto>> getEntitiesWithProvider(@RequestParam(required = false) @Parameter(description = SwaggerDescription.ENTITY_ID, example = "urn:ngsi-ld:Link:10280") String id,
                                                                              @RequestParam(required = false) @Parameter(description = SwaggerDescription.TYPE, example = "Link") String type,
                                                                              @RequestParam(required = false) @Parameter(description = SwaggerDescription.Q, example = "carriagewayWidth==3") String q,
                                                                              @RequestParam(defaultValue = "0") @Parameter(description = SwaggerDescription.OFFSET) int offset,
                                                                              @RequestParam(defaultValue = "50") @Parameter(description = SwaggerDescription.LIMIT) int limit,
                                                                              @RequestParam(defaultValue = "DESC") @Parameter(description = SwaggerDescription.SORT) SortTypeCode sort,
                                                                              @RequestParam(defaultValue = EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY) @Parameter(description = SwaggerDescription.SORT_PROPERTY) String sortproperty,
                                                                              @RequestParam(required = false) @Parameter(description = SwaggerDescription.OPTIONS, example = "count") String options,
                                                                              @RequestHeader(value = HttpHeaders.LINK, required = false) @Parameter(description = SwaggerDescription.LINK_HEADER, example = "<http://context-server:53005/e8ight-context-v1.0.1.jsonld>;") String link) {
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
            description = "NGSI-LD Entity를 저장하는 API 입니다. 같은 id 의 Entity 가 있으면 덮어씁니다.<br><br>" +
                    SwaggerDescription.SAVE_ENTITY_RULES,
            method = "POST"
    )
    @PostMapping("/entities")
    public void saveEntity(
            @RequestBody @Schema(example = "{" +
                    "  \"id\": \"urn:ngsi-ld:Link:test01\", " +
                    "  \"type\": \"Link\"," +
                    "    \"name\": {" +
                    "      \"type\": \"Property\"," +
                    "      \"value\": \"Valladolid-Dueñas\"" +
                    "    }," +
                    "    \"@context\": \"http://context-server:53005/e8ight-context-v1.0.jsonld\"" +
                    "}") LinkedHashMap<String, Object> entity) {
        log.info("saveEntity(), Entity : {}", entity);

        EntityDto entityDto = objectMapper.convertValue(entity, EntityDto.class);
        entityService.mapAttributeDto(entityDto);
        entityService.saveEntity(entityDto);
    }

    @Operation(
            summary = "NGSI-LD Entity 저장 with provider",
            description = "수집처(provider) 정보를 포함하는 NGSI-LD Entity를 저장하는 API 입니다. " +
                    "Body 는 <code>{ \"provider\": \"수집처\", \"entity\": { NGSI-LD Entity } }</code> 형식이며, entity 는 아래 규칙을 따라야 합니다.<br><br>" +
                    SwaggerDescription.SAVE_ENTITY_RULES,
            method = "POST"
    )
    @PostMapping("/entities/provider")
    public void saveEntityWithProvider(
            @RequestBody @Schema(example = "{" +
                    "\"provider\": \"UOS\"," +
                    "\"entity\":" +
                    "{" +
                    "  \"id\": \"urn:ngsi-ld:Link:test01\", " +
                    "  \"type\": \"Link\"," +
                    "    \"name\": {" +
                    "      \"type\": \"Property\"," +
                    "      \"value\": \"Valladolid-Dueñas\"" +
                    "    }," +
                    "    \"@context\": \"http://context-server:53005/e8ight-context-v1.0.jsonld\"" +
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
