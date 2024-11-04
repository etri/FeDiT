package kr.co.e8ight.ndxpro.databroker.service.iot;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntity;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityHistory;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityTotalCount;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.QueryDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityDto;
import kr.co.e8ight.ndxpro.databroker.service.AttributeCacheService;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
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
public class IoTEntityHistoryServiceTest {

    @InjectMocks
    private IoTEntityHistoryService ioTEntityHistoryService;

    @Mock
    private IoTEntityService ioTEntityService;

    @Mock
    private AttributeCacheService attributeCacheService;

    @Spy
    private ObjectMapper objectMapper;

    @Mock
    private MongoTemplate mongoTemplate;

    private static final Pageable defaultPageable = PageRequest.of(0, 50);

    private String testEntityString = TestConfiguration.testEntityString;

    private String testEntityDtoString = TestConfiguration.testEntityDtoString;

    private IoTEntity testIoTEntity;

    private EntityDto testEntityDto;

    @BeforeEach
    public void setEntity() {
        try {
            testIoTEntity = objectMapper.readValue(testEntityString, IoTEntity.class);
            testEntityDto = objectMapper.readValue(testEntityDtoString, EntityDto.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("IoT Entity 시계열 조회 ")
    public void getTemporalIoTEntities() {
        // given
        String observedAt = "2023-03-14T10:00:59.285";
        QueryDto queryDto = QueryDto.builder()
                .id("urn:e8ight:SimulationVehicle:1010")
                .time("2023-03-14T10:00:59.285")
                .timeproperty("speed.observedAt")
                .q("lane==1")
                .offset(defaultPageable.getPageNumber())
                .limit(defaultPageable.getPageSize())
                .link("http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld")
                .build();

        IoTEntityHistory ioTEntityHistory = IoTEntityHistory.builder()
                .observedAt(DataBrokerDateFormat.formatStringToDate(DataBrokerDateFormat.DATE_TIME_FORMAT, observedAt))
                .entity(testIoTEntity)
                .build();

        AttributeResponseDto speedAttribute = AttributeResponseDto.builder()
                .id("speed")
                .valueType("Double")
                .build();

        AttributeResponseDto observedAtAttribute = AttributeResponseDto.builder()
                .id("observedAt")
                .valueType("String")
                .build();

        // when
        doReturn(speedAttribute)
                .when(attributeCacheService).getAttribute(eq("speed"));

        doReturn(observedAtAttribute)
                .when(attributeCacheService).getAttribute(eq("observedAt"));

        doReturn("iotEntitiesHis")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityHistory.class));

        IoTEntityTotalCount ioTEntityTotalCount = IoTEntityTotalCount.builder()
                .total(Long.valueOf(1))
                .build();
        List<IoTEntityTotalCount> ioTEntityTotalCountList = new ArrayList<>();
        ioTEntityTotalCountList.add(ioTEntityTotalCount);

        AggregationResults<IoTEntityTotalCount> expectedIoTEntityTotalCount =  new AggregationResults<>(ioTEntityTotalCountList, new Document());
        doReturn(expectedIoTEntityTotalCount)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntityTotalCount.class));

        List<IoTEntityHistory> ioTEntityHistoryList = new ArrayList<>();
        ioTEntityHistoryList.add(ioTEntityHistory);

        AggregationResults<IoTEntityHistory> expectedIoTEntityHistory = new AggregationResults<>(ioTEntityHistoryList, new Document());
        doReturn(expectedIoTEntityHistory)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntityHistory.class));

        doReturn(testEntityDto)
                .when(ioTEntityService).mapEntityToEntityDto(any(IoTEntity.class));

        // then
        Page<EntityDto> temporalIoTEntities = ioTEntityHistoryService.getTemporalIoTEntities(queryDto);
        assertEquals(temporalIoTEntities.getContent().get(0).get("id"), queryDto.getId());
    }

    @Test
    @DisplayName("IoT History 정보 조회 테스트")
    public void getIoTEntityHistory() {
        // given
        String historyId = "640fc7bd564f7778f58f1a9f";
        String observedAt = "2023-03-14T10:00:59.285";
        String timeproperty = "speed.observedAt";

        IoTEntityHistory ioTEntityHistory = IoTEntityHistory.builder()
                ._id(historyId)
                .observedAt(DataBrokerDateFormat.formatStringToDate(DataBrokerDateFormat.DATE_TIME_FORMAT, observedAt))
                .entity(testIoTEntity)
                .build();

        AttributeResponseDto speedAttribute = AttributeResponseDto.builder()
                .id("speed")
                .valueType("Double")
                .build();

        AttributeResponseDto observedAtAttribute = AttributeResponseDto.builder()
                .id("observedAt")
                .valueType("String")
                .build();

        // when
        doReturn(speedAttribute)
                .when(attributeCacheService).getAttribute(eq("speed"));

        doReturn(observedAtAttribute)
                .when(attributeCacheService).getAttribute(eq("observedAt"));

        doReturn("iotEntitiesHis")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityHistory.class));

        List<IoTEntityHistory> ioTEntityHistoryList = new ArrayList<>();
        ioTEntityHistoryList.add(ioTEntityHistory);

        AggregationResults<IoTEntityHistory> expectedIoTEntityHistory = new AggregationResults<>(ioTEntityHistoryList, new Document());
        doReturn(expectedIoTEntityHistory)
                .when(mongoTemplate).aggregate(any(Aggregation.class), any(String.class), eq(IoTEntityHistory.class));

        doReturn(testEntityDto)
                .when(ioTEntityService).mapEntityToEntityDto(any(IoTEntity.class));

        // then
        IoTEntityDto ioTEntityDto = ioTEntityHistoryService.getIoTEntityHistory(historyId, timeproperty);
        assertEquals(ioTEntityDto.getHistoryId(), historyId);
        assertEquals(ioTEntityDto.getObservedAt(), observedAt);
    }
}
