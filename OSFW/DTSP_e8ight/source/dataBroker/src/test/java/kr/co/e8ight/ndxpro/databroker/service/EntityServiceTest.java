package kr.co.e8ight.ndxpro.databroker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.Attribute;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntity;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityProviderDto;
import kr.co.e8ight.ndxpro.databroker.dto.QueryDto;
import kr.co.e8ight.ndxpro.databroker.repository.EntityRepository;
import kr.co.e8ight.ndxpro.databroker.util.SortTypeCode;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class EntityServiceTest {

    @Mock
    private EntityRepository entityRepository;

    @Mock
    private EntityValidationService entityValidationService;

    @Mock
    private ContextCacheService contextCacheService;

    @Mock
    private AttributeCacheService attributeCacheService;

    @InjectMocks
    private EntityService entityService;

    @Spy
    private ObjectMapper objectMapper;

    @Mock
    private MongoTemplate mongoTemplate;

    private static final Pageable defaultPageable = PageRequest.of(0, 50);

    private String testEntityString = TestConfiguration.testEntityString;

    private String testEntityDtoString = TestConfiguration.testEntityDtoString;

    private Entity testEntity;

    private EntityDto testEntityDto;

    @BeforeEach
    public void setEntity() {
        try {
            testEntity = objectMapper.readValue(testEntityString, Entity.class);
            testEntityDto = objectMapper.readValue(testEntityDtoString, EntityDto.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("Entity 전체 조회 테스트")
    public void getEntities() {
        // given
        QueryDto queryDto = QueryDto.builder()
                .id("urn:e8ight:SimulationVehicle:1010")
                .type("SimulationVehicle")
                .q("lane==1")
                .offset(defaultPageable.getPageNumber())
                .limit(defaultPageable.getPageSize())
                .link("http://context-server:3005/e8ight-context-v1.0.1.jsonld")
                .sort(SortTypeCode.ASC)
                .sortproperty("location.observedAt")
                .build();

        // when
        List<Entity> entityList = new ArrayList<>();
        entityList.add(testEntity);

        doReturn(Long.valueOf(1))
                .when(mongoTemplate).count(any(), eq(Entity.class));

        doReturn("entities")
                .when(mongoTemplate).getCollectionName(eq(Entity.class));

        AggregationResults<Entity> expectedResults =  new AggregationResults<>(entityList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(Entity.class));

        doReturn(AttributeResponseDto.builder()
                .id("lane")
                .valueType("Integer")
                .build())
                .when(attributeCacheService).getAttribute(any());

        // then
        Page<EntityDto> entityDtoList = entityService.getEntities(queryDto);
        assertEquals(entityDtoList.getContent().get(0).get("id"), queryDto.getId());
    }

    @Test
    @DisplayName("Entity 전체 조회 with ServicePath 테스트")
    public void getEntitiesWithServicePath() {
        // given
        QueryDto queryDto = QueryDto.builder()
                .id("urn:e8ight:SimulationVehicle:1010")
                .type("SimulationVehicle")
                .q("lane==1")
                .offset(defaultPageable.getPageNumber())
                .limit(defaultPageable.getPageSize())
                .link("http://context-server:3005/e8ight-context-v1.0.1.jsonld")
                .sort(SortTypeCode.ASC)
                .sortproperty("location.observedAt")
                .build();

        String servicePath = "UOS";

        // when
        List<Entity> entityList = new ArrayList<>();
        entityList.add(testEntity);

        doReturn(Long.valueOf(1))
                .when(mongoTemplate).count(any(), eq(Entity.class));

        doReturn("entities")
                .when(mongoTemplate).getCollectionName(eq(Entity.class));

        AggregationResults<Entity> expectedResults =  new AggregationResults<>(entityList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(Entity.class));

        doReturn(AttributeResponseDto.builder()
                .id("lane")
                .valueType("Integer")
                .build())
                .when(attributeCacheService).getAttribute(any());

        // then
        Page<EntityProviderDto> entityServicePathDtoList = entityService.getEntitiesWithProvider(queryDto);
        assertEquals(entityServicePathDtoList.getContent().get(0).getProvider(), servicePath);
    }

    @Test
    @DisplayName("Entity 단건 조회 테스트")
    public void getEntity() {
        // given
        String entityId = "urn:e8ight:SimulationVehicle:1010";
        String context = "http://context-server:3005/e8ight-context-v1.0.1.jsonld";

        // when
        doReturn(testEntity)
                .when(entityRepository).findByIdIdAndContext(any(), any());

        // then
        EntityDto entityDto = entityService.getEntity(entityId, context);
        assertEquals(entityDto.getId(), entityId);
    }

    @Test
    @DisplayName("Entity 단건 조회 테스트 (context 없이 id 만으로 조회)")
    public void getEntityWithoutContext() {
        // given
        String entityId = "urn:e8ight:SimulationVehicle:1010";

        // when
        doReturn(testEntity)
                .when(entityRepository).findFirstByIdId(entityId);

        // then
        EntityDto entityDto = entityService.getEntity(entityId, null);
        assertEquals(entityDto.getId(), entityId);
        verify(entityRepository, never()).findByIdIdAndContext(any(), any());
    }

    @Test
    @DisplayName("Entity 저장 테스트")
    public void saveEntity() {
        // given

        // when
        doReturn(testEntity)
                .when(entityRepository).findByIdIdAndContext(any(), any());
        doReturn(testEntity)
                .when(entityRepository).save(testEntity);

        // then
        Entity entity = entityService.saveEntity(testEntityDto);
        assertEquals(entity.getId().getId(), testEntityDto.getId());
    }

    @Test
    @DisplayName("시계열 Entity 매핑 시 observedAt 을 타임존 포함 문자열 그대로 유지")
    public void mapEntityDtoToIoTEntity() throws JsonProcessingException {
        // given
        String observedAt = "2026-10-02T13:50:00.123+09:00";
        EntityDto entityDto = objectMapper.readValue("{" +
                "\"id\": \"urn:ngsi-ld:PohangRainfall:50F8A5FFFE0EF545\"," +
                "\"type\": \"PohangRainfall\"," +
                "\"@context\": \"http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld\"," +
                "\"rainfall\": {\"type\": \"Property\", \"value\": 8.8, \"observedAt\": \"" + observedAt + "\"}" +
                "}", EntityDto.class);
        entityService.mapAttributeDto(entityDto);

        // when
        IoTEntity ioTEntity = entityService.mapEntityDtoToIoTEntity(entityDto);

        // then
        assertEquals("urn:ngsi-ld:PohangRainfall:50F8A5FFFE0EF545", ioTEntity.getId().getId());
        Attribute rainfall = ioTEntity.getAttrs().get(0);
        assertEquals("rainfall", rainfall.getName());
        assertEquals(8.8, rainfall.getValue());
        assertEquals("observedAt", rainfall.getMd().get(0).getName());
        assertEquals(observedAt, rainfall.getMd().get(0).getValue());
    }
}
