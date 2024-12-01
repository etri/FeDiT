package kr.co.e8ight.ndxpro.databroker.service.statistics;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityValidation;
import kr.co.e8ight.ndxpro.databroker.domain.statistics.IoTEntityStatisticsId;
import kr.co.e8ight.ndxpro.databroker.domain.statistics.IoTEntityStatisticsWithObjectId;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityValidationDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityDataModelListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsListDto;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import org.bson.Document;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
public class IoTEntityStatisticsServiceTest {

    @InjectMocks
    private IoTEntityStatisticsService ioTEntityStatisticsService;

    @Mock
    private MongoTemplate mongoTemplate;

    @Spy
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    public void getTotalEntities() {
        // given
        String date = "2023-03-08";
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(
                LocalDate.parse(date));
        String dataModel = "Vehicle";
        String servicePath = "UOS";

        // when
        doReturn("iotEntitiesStatistics")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityStatisticsWithObjectId.class));

        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = new ArrayList<>();
        ioTEntityStatisticsWithObjectIdList.add(
                IoTEntityStatisticsWithObjectId.builder()
                        .totalEntities(1)
                        .build());
        AggregationResults<IoTEntityStatisticsWithObjectId> expectedResults =
                new AggregationResults<>(ioTEntityStatisticsWithObjectIdList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate)
                .aggregate(
                        any(Aggregation.class),
                        any(String.class),
                        eq(IoTEntityStatisticsWithObjectId.class));

        // then
        IoTEntityStatisticsDto ioTEntityStatisticsDto = ioTEntityStatisticsService.getTotalEntities(parsedDate, dataModel, servicePath);
        assertEquals(ioTEntityStatisticsDto.getDate(), date);
        assertEquals(ioTEntityStatisticsDto.getDataModel(), dataModel);
        assertEquals(ioTEntityStatisticsDto.getProvider(), servicePath);
    }

    @Test
    @DisplayName("일자별 IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    public void getTotalEntitiesByDateRange() {
        // given
        String startDate = "2023-03-08";
        String endDate = "2023-03-09";
        Date parsedStartDate = DataBrokerDateFormat.formatLocalDateToDate(
                LocalDate.parse(startDate));
        Date parsedEndDate = DataBrokerDateFormat.formatLocalDateToDate(
                LocalDate.parse(endDate));
        List<Date> dateList = getDateList(LocalDate.parse(startDate), LocalDate.parse(endDate));
        String dataModel = "Vehicle";
        String servicePath = "UOS";

        // when
        doReturn("iotEntitiesStatistics")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityStatisticsWithObjectId.class));

        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = new ArrayList<>();
        IoTEntityStatisticsId ioTEntityStatisticsId = IoTEntityStatisticsId.builder()
                .date(parsedStartDate)
                .dataModel(dataModel)
                .build();
        ioTEntityStatisticsWithObjectIdList.add(
                IoTEntityStatisticsWithObjectId.builder()
                        .id(ioTEntityStatisticsId)
                        .totalEntities(1)
                        .build());
        AggregationResults<IoTEntityStatisticsWithObjectId> expectedResults =
                new AggregationResults<>(ioTEntityStatisticsWithObjectIdList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate)
                .aggregate(
                        any(Aggregation.class),
                        any(String.class),
                        eq(IoTEntityStatisticsWithObjectId.class));

        // then
        IoTEntityStatisticsListDto ioTEntityStatisticsListDto = ioTEntityStatisticsService.getTotalEntitiesByDateRange(dateList, parsedStartDate, parsedEndDate, dataModel, servicePath);
        assertEquals(ioTEntityStatisticsListDto.getStartDate(), startDate);
        assertEquals(ioTEntityStatisticsListDto.getEndDate(), endDate);
        assertEquals(ioTEntityStatisticsListDto.getDataModel(), dataModel);
        assertEquals(ioTEntityStatisticsListDto.getProvider(), servicePath);
    }

    public List<Date> getDateList(LocalDate startLocalDate, LocalDate endLocalDate) {
        Stream<LocalDate> dates = startLocalDate.datesUntil(endLocalDate.plusDays(1));
        List<LocalDate> localDateList = dates.collect(Collectors.toList());
        List<Date> dateList = new ArrayList<>();
        localDateList.stream().forEach((localDate -> {
            dateList.add(DataBrokerDateFormat.formatLocalDateToDate(localDate));
        }));
        return dateList;
    }

    @Test
    @DisplayName("모델 별 IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    public void getTotalEntitiesByDataModel() {
        // given
        String date = "2023-03-08";
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(LocalDate.parse(date));
        String dataModel = "Vehicle";

        // when
        doReturn("iotEntitiesStatistics")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityStatisticsWithObjectId.class));

        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = new ArrayList<>();
        IoTEntityStatisticsId ioTEntityStatisticsId = IoTEntityStatisticsId.builder()
                .date(parsedDate)
                .dataModel(dataModel)
                .build();
        ioTEntityStatisticsWithObjectIdList.add(
                IoTEntityStatisticsWithObjectId.builder()
                        .id(ioTEntityStatisticsId)
                        .totalEntities(1)
                        .build());
        AggregationResults<IoTEntityStatisticsWithObjectId> expectedResults =
                new AggregationResults<>(ioTEntityStatisticsWithObjectIdList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate)
                .aggregate(
                        any(Aggregation.class),
                        any(String.class),
                        eq(IoTEntityStatisticsWithObjectId.class));

        // then
        IoTEntityStatisticsListDto ioTEntityStatisticsListDto = ioTEntityStatisticsService.getTotalEntitiesByDataModel(parsedDate);
        assertEquals(ioTEntityStatisticsListDto.getDate(), date);
        assertEquals(ioTEntityStatisticsListDto.getStatistics().get(0).getDataModel(), dataModel);
    }

    @Test
    @DisplayName("수집처 별 IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    public void getTotalEntitiesByServicePath() {
        // given
        String date = "2023-03-08";
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(
                LocalDate.parse(date));
        String dataModel = "Vehicle";
        String servicePath = "UOS";

        // when
        doReturn("iotEntitiesStatistics")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityStatisticsWithObjectId.class));

        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = new ArrayList<>();
        IoTEntityStatisticsId ioTEntityStatisticsId = IoTEntityStatisticsId.builder()
                .date(parsedDate)
                .servicePath(servicePath)
                .build();
        ioTEntityStatisticsWithObjectIdList.add(
                IoTEntityStatisticsWithObjectId.builder()
                        .id(ioTEntityStatisticsId)
                        .totalEntities(1)
                        .build());
        AggregationResults<IoTEntityStatisticsWithObjectId> expectedResults =
                new AggregationResults<>(ioTEntityStatisticsWithObjectIdList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate)
                .aggregate(
                        any(Aggregation.class),
                        any(String.class),
                        eq(IoTEntityStatisticsWithObjectId.class));

        // then
        IoTEntityStatisticsListDto ioTEntityStatisticsListDto = ioTEntityStatisticsService.getTotalEntitiesByProvider(parsedDate, dataModel);
        assertEquals(ioTEntityStatisticsListDto.getDate(), date);
        assertEquals(ioTEntityStatisticsListDto.getDataModel(), dataModel);
    }

    @Test
    @DisplayName("수집 날짜 리스트 조회 테스트")
    public void getEntityCollectionDateList() {
        // given
        int year = 2023;
        int month = 3;
        String date = "2023-03-08";
        Date parsedDate = DataBrokerDateFormat.formatStringToDate(DataBrokerDateFormat.DATE_FORMAT, date);

        // when
        doReturn("iotEntitiesStatistics")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityStatisticsWithObjectId.class));

        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = new ArrayList<>();
        ioTEntityStatisticsWithObjectIdList.add(
                IoTEntityStatisticsWithObjectId.builder()
                        .id(parsedDate)
                        .totalEntities(1)
                        .build());
        AggregationResults<IoTEntityStatisticsWithObjectId> expectedResults =
                new AggregationResults<>(ioTEntityStatisticsWithObjectIdList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate)
                .aggregate(
                        any(Aggregation.class),
                        any(String.class),
                        eq(IoTEntityStatisticsWithObjectId.class));

        // then
        List<String> dateList = ioTEntityStatisticsService.getEntityCollectionDateList(year, month);
        assertEquals(dateList.get(0), date);
    }

    @Test
    @DisplayName("수집 모델 리스트 조회 테스트")
    public void getEntityCollectionDataModelList() {
        // given
        String date = "2023-03-08";
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(LocalDate.parse(date));
        String dataModel = "Vehicle";

        // when
        doReturn("iotEntitiesStatistics")
                .when(mongoTemplate).getCollectionName(eq(IoTEntityStatisticsWithObjectId.class));

        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = new ArrayList<>();
        IoTEntityStatisticsId ioTEntityStatisticsId = IoTEntityStatisticsId.builder()
                .date(parsedDate)
                .dataModel(dataModel)
                .build();
        ioTEntityStatisticsWithObjectIdList.add(
                IoTEntityStatisticsWithObjectId.builder()
                        .id(ioTEntityStatisticsId)
                        .totalEntities(1)
                        .build());
        AggregationResults<IoTEntityStatisticsWithObjectId> expectedResults =
                new AggregationResults<>(ioTEntityStatisticsWithObjectIdList, new Document());
        doReturn(expectedResults)
                .when(mongoTemplate)
                .aggregate(
                        any(Aggregation.class),
                        any(String.class),
                        eq(IoTEntityStatisticsWithObjectId.class));

        // then
        IoTEntityDataModelListDto ioTEntityStatisticsListDto = ioTEntityStatisticsService.getEntityCollectionDataModelList(parsedDate);
        assertEquals(ioTEntityStatisticsListDto.getDate(), date);
        assertEquals(ioTEntityStatisticsListDto.getDataModel().get(0), dataModel);
    }

    @Test
    @DisplayName("IoT Entity 수집 실패 건 상세 조회 테스트")
    public void getFailTotalEntitiesByDataModelAndServicePath() {
        // given
        String date = "2023-03-08";
        String nextDate = "2023-03-09";
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(
                LocalDate.parse(date));
        Date parsedNextDate = DataBrokerDateFormat.formatLocalDateToDate(
                LocalDate.parse(nextDate));
        String dataModel = "Vehicle";
        String servicePath = "UOS";
        int offset = 0;
        int limit = 10;

        String result = "fail";
        String cause = "Bad Request Data";
        Entity testEntity;
        String testEntityString = TestConfiguration.testEntityString;
        try {
            testEntity = objectMapper.readValue(testEntityString, Entity.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // when
        doReturn(Long.valueOf(1))
                .when(mongoTemplate).count(any(Query.class), eq(IoTEntityValidation.class));

        List<IoTEntityValidation> ioTEntityValidationList = new ArrayList<>();
        ioTEntityValidationList.add(IoTEntityValidation.builder()
                .result(result)
                .cause(cause)
                .entity(testEntity)
                .build());
        doReturn(ioTEntityValidationList)
                .when(mongoTemplate).find(any(Query.class), eq(IoTEntityValidation.class));

        // then
        Page<IoTEntityValidationDto> failTotalEntitiesByDataModelAndServicePath = ioTEntityStatisticsService.getFailTotalEntitiesByDataModelAndProvider(parsedDate, parsedNextDate, dataModel, servicePath, offset, limit);
        IoTEntityValidationDto expectedIoTEntityValidationDto = failTotalEntitiesByDataModelAndServicePath.getContent().get(0);
        assertEquals(expectedIoTEntityValidationDto.getResult(), result);
        assertEquals(expectedIoTEntityValidationDto.getCause(), cause);
        assertEquals(expectedIoTEntityValidationDto.getEntity().getId().getId(), testEntity.getId().getId());
    }
}
