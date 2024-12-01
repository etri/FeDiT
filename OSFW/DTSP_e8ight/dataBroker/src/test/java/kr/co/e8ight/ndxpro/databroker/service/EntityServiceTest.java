package kr.co.e8ight.ndxpro.databroker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
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
                .link("http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld")
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
                .link("http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld")
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
        String context = "http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld";

        // when
        doReturn(testEntity)
                .when(entityRepository).findByIdIdAndContext(any(), any());

        // then
        EntityDto entityDto = entityService.getEntity(entityId, context);
        assertEquals(entityDto.getId(), entityId);
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
}
