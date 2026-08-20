package kr.co.e8ight.ndxpro.databroker.service.iot;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.domain.iot.*;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityProviderDto;
import kr.co.e8ight.ndxpro.databroker.dto.QueryDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTObservedAtDto;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityHistoryRepository;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityRepository;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityValidationRepository;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTObservedAtRepository;
import kr.co.e8ight.ndxpro.databroker.service.AttributeCacheService;
import kr.co.e8ight.ndxpro.databroker.service.EntityValidationService;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
public class IoTEntityServiceTest {

    @Mock
    private IoTEntityRepository ioTEntityRepository;

    @Mock
    private IoTEntityHistoryRepository ioTEntityHistoryRepository;

    @Mock
    private IoTObservedAtRepository ioTObservedAtRepository;

    @Mock
    private IoTEntityValidationRepository ioTEntityValidationRepository;

    @Mock
    private EntityValidationService entityValidationService;

    @Mock
    private AttributeCacheService attributeCacheService;

    @Spy
    private ObjectMapper objectMapper;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private IoTEntityService ioTEntityService;

    private static final Pageable defaultPageable = PageRequest.of(0, 50);

    private String testEntityString = TestConfiguration.testEntityString;

    private IoTEntity testIoTEntity;

    @BeforeEach
    public void setEntity() {
        try {
            testIoTEntity = objectMapper.readValue(testEntityString, IoTEntity.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("IoT Entity 전체 조회 테스트")
    public void getIoTEntities() {
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
        List<IoTEntity> entityList = new ArrayList<>();
        entityList.add(testIoTEntity);

        doReturn("iotEntities")
                .when(mongoTemplate).getCollectionName(eq(IoTEntity.class));

        IoTEntityTotalCount ioTEntityTotalCount = IoTEntityTotalCount.builder()
                .total(Long.valueOf(1))
                .build();

        List<IoTEntityTotalCount> ioTEntityTotalCountList = new ArrayList<>();
        ioTEntityTotalCountList.add(ioTEntityTotalCount);

        AggregationResults<IoTEntityTotalCount> expectedIoTEntityTotalCount =  new AggregationResults<>(ioTEntityTotalCountList, new Document());
        doReturn(expectedIoTEntityTotalCount)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntityTotalCount.class));

        AggregationResults<IoTEntity> expectedResults =  new AggregationResults<>(entityList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntity.class));

        doReturn(AttributeResponseDto.builder()
                .id("lane")
                .valueType("Integer")
                .build())
                .when(attributeCacheService).getAttribute(any());

        // then
        Page<EntityDto> entityDtoList = ioTEntityService.getIoTEntities(queryDto);
        assertEquals(entityDtoList.getContent().get(0).get("id"), queryDto.getId());
    }

    @Test
    @DisplayName("IoT Entity 전체 조회 with ServicePath 테스트")
    public void getIoTEntitiesWithServicePath() {
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
        List<IoTEntity> entityList = new ArrayList<>();
        entityList.add(testIoTEntity);

        doReturn("iotEntities")
                .when(mongoTemplate).getCollectionName(eq(IoTEntity.class));

        IoTEntityTotalCount ioTEntityTotalCount = IoTEntityTotalCount.builder()
                .total(Long.valueOf(1))
                .build();
        List<IoTEntityTotalCount> ioTEntityTotalCountList = new ArrayList<>();
        ioTEntityTotalCountList.add(ioTEntityTotalCount);

        AggregationResults<IoTEntityTotalCount> expectedIoTEntityTotalCount =  new AggregationResults<>(ioTEntityTotalCountList, new Document());
        doReturn(expectedIoTEntityTotalCount)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntityTotalCount.class));

        AggregationResults<IoTEntity> expectedResults =  new AggregationResults<>(entityList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntity.class));

        doReturn(AttributeResponseDto.builder()
                .id("lane")
                .valueType("Integer")
                .build())
                .when(attributeCacheService).getAttribute(any());

        // then
        Page<EntityProviderDto> entityServicePathDtoList = ioTEntityService.getIoTEntitiesWithProvider(queryDto);
        assertEquals(entityServicePathDtoList.getContent().get(0).getProvider(), servicePath);
    }

    @Test
    @DisplayName("IoT Entity 단건 조회 테스트")
    public void getIoTEntity() {
        // given
        String entityId = "urn:e8ight:SimulationVehicle:1010";
        String context = "http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld";

        // when
        doReturn(testIoTEntity)
                .when(ioTEntityRepository).findByIdIdAndContext(any(), any());

        // then
        EntityDto entityDto = ioTEntityService.getIoTEntity(entityId, context);
        assertEquals(entityDto.getId(), entityId);
    }

    @Test
    @DisplayName("IoTEntity 저장 테스트")
    public void saveIoTEntity() {
        // given

        // when
        doReturn(testIoTEntity)
                .when(ioTEntityRepository).findByIdId(any());

//        doReturn(testIoTEntity)
//                .when(ioTEntityRepository).insert(any(IoTEntity.class));

        doReturn(testIoTEntity)
                .when(ioTEntityRepository).save(any(IoTEntity.class));

//        doReturn(null)
//                .when(ioTEntityHistoryRepository).insert(any(IoTEntityHistory.class));

        // then
        IoTEntity entity = ioTEntityService.saveIoTEntity(testIoTEntity);
        assertEquals(entity.getId().getId(), testIoTEntity.getId().getId());
    }

    @Test
    @DisplayName("observeAt 시작 시간 값 조회 테스트")
    public void getFirstObservedAt() {
        // given
        int scenarioId = 1;
        String scenarioType = "TOD";
        String datetime = "2023-03-14T10:00:59.285";
//        String date = "2023-03-14";
//        String timeGroup = "오전첨두";

        IoTObservedAt ioTObservedAt = IoTObservedAt.builder()
                .datetime(
                        DataBrokerDateFormat.formatStringToDate(
                                DataBrokerDateFormat.DATE_TIME_FORMAT,
                                datetime))
                .scenarioId(scenarioId)
                .scenarioType(scenarioType)
                .build();

        // when
        doReturn("iotObservedAt")
                .when(mongoTemplate).getCollectionName(eq(IoTObservedAt.class));

        List<IoTObservedAt> ioTObservedAtList = new ArrayList<>();
        ioTObservedAtList.add(ioTObservedAt);

        AggregationResults<IoTObservedAt> expectedIoTObservedAt = new AggregationResults<>(ioTObservedAtList, new Document());
        doReturn(expectedIoTObservedAt)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTObservedAt.class));

        // then
        IoTObservedAtDto firstObservedAt = ioTEntityService.getFirstObservedAt(scenarioId, scenarioType);
        assertEquals(firstObservedAt.getScenarioId(), scenarioId);
        assertEquals(firstObservedAt.getScenarioType(), scenarioType);
        assertEquals(firstObservedAt.getNextDateTime(), datetime);
    }

    @Test
    @DisplayName("observeAt 다음 시간 값 조회 테스트")
    public void getNextObservedAt() {
        // given
        int scenarioId = 1;
        String scenarioType = "TOD";
        String beforeDateTime = "2023-03-14T10:00:59.285";
        String nextDateTime = "2023-03-14T11:00:59.285";
//        String date = "2023-03-14";
//        String timeGroup = "오전첨두";

        IoTObservedAt ioTObservedAt = IoTObservedAt.builder()
                .datetime(
                        DataBrokerDateFormat.formatStringToDate(
                                DataBrokerDateFormat.DATE_TIME_FORMAT,
                                nextDateTime))
                .scenarioId(scenarioId)
                .scenarioType(scenarioType)
                .build();

        // when
        doReturn("iotObservedAt")
                .when(mongoTemplate).getCollectionName(eq(IoTObservedAt.class));

        List<IoTObservedAt> ioTObservedAtList = new ArrayList<>();
        ioTObservedAtList.add(ioTObservedAt);

        AggregationResults<IoTObservedAt> expectedIoTObservedAt = new AggregationResults<>(ioTObservedAtList, new Document());
        doReturn(expectedIoTObservedAt)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTObservedAt.class));

        // then
        IoTObservedAtDto nextObservedAt = ioTEntityService.getNextObservedAt(beforeDateTime, scenarioId, scenarioType);
        assertEquals(nextObservedAt.getScenarioId(), scenarioId);
        assertEquals(nextObservedAt.getScenarioType(), scenarioType);
        assertEquals(nextObservedAt.getDatetime(), beforeDateTime);
        assertEquals(nextObservedAt.getNextDateTime(), nextDateTime);
    }
}
