package kr.co.e8ight.ndxpro.databroker.controller.statistics;

import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityValidationDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityDataModelListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.StatisticsDto;
import kr.co.e8ight.ndxpro.databroker.service.statistics.IoTEntityStatisticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@EnableWebMvc
@WebMvcTest(excludeAutoConfiguration = {WebMvcAutoConfiguration.class}, controllers = {IoTEntityStatisticsController.class})
public class IoTEntityStatisticsControllerTest {

    @SpyBean
    private ObjectMapper objectMapper;

    @MockBean
    private IoTEntityStatisticsService ioTEntityStatisticsService;

    @Autowired
    private MockMvc mockMvc;

    private String testEntityString = TestConfiguration.testEntityString;

    private Entity testEntity;

    private static final String BASE_URL = "/ndxpro/v1/broker";

    @BeforeEach
    public void setEntity() {
        try {
            testEntity = objectMapper.readValue(testEntityString, Entity.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    void getTotalEntities() throws Exception {
        // given
        String date ="2023-03-17";
        String dataModel ="Vehicle";
        String servicePath = "UOS";

        StatisticsDto statisticsDto = StatisticsDto.builder()
                .totalEntities(10000)
                .successEntities(10000)
                .failEntities(0)
                .build();

        IoTEntityStatisticsDto ioTEntityStatisticsDto = IoTEntityStatisticsDto.builder()
                .date(date)
                .dataModel(dataModel)
                .provider(servicePath)
                .statistics(statisticsDto)
                .build();

        // when
        doReturn(ioTEntityStatisticsDto)
                .when(ioTEntityStatisticsService).getTotalEntities(any(), any(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics" +
                        "?date=" + date +
                        "&dataModel=" + dataModel +
                        "&servicePath=" + servicePath));

        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTEntityStatisticsDto responseIoTEntityStatisticsDto = objectMapper.readValue(content, IoTEntityStatisticsDto.class);
        assertEquals(responseIoTEntityStatisticsDto.getDate(), ioTEntityStatisticsDto.getDate());
    }

    @Test
    @DisplayName("일자별 IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    void getTotalEntitiesByDateRange() throws Exception {
        // given
        String startDate ="2023-03-17";
        String endDate ="2023-03-18";
        String dataModel ="Vehicle";
        String servicePath = "UOS";

        List<StatisticsDto> statisticsDtoList = new ArrayList<>();
        statisticsDtoList.add(StatisticsDto.builder()
                .date("2023-03-17")
                .totalEntities(10000)
                .successEntities(10000)
                .failEntities(0)
                .build());
        statisticsDtoList.add(StatisticsDto.builder()
                .date("2023-03-18")
                .totalEntities(0)
                .successEntities(0)
                .failEntities(0)
                .build());

        IoTEntityStatisticsListDto ioTEntityDateRangeStatisticsDto = IoTEntityStatisticsListDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .dataModel(dataModel)
                .provider(servicePath)
                .statistics(statisticsDtoList)
                .build();

        // when
        doReturn(ioTEntityDateRangeStatisticsDto)
                .when(ioTEntityStatisticsService).getTotalEntitiesByDateRange(any(), any(), any(), any(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics/date-range" +
                        "?startDate=" + startDate +
                        "&endDate=" + endDate +
                        "&dataModel=" + dataModel +
                        "&servicePath=" + servicePath));

        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTEntityStatisticsListDto responseIoTEntityDateRangeStatisticsDto = objectMapper.readValue(content, IoTEntityStatisticsListDto.class);
        assertEquals(responseIoTEntityDateRangeStatisticsDto.getStartDate(), ioTEntityDateRangeStatisticsDto.getStartDate());
        assertEquals(responseIoTEntityDateRangeStatisticsDto.getEndDate(), ioTEntityDateRangeStatisticsDto.getEndDate());
    }

    @Test
    @DisplayName("모델 별 IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    void getTotalEntitiesByDataModel() throws Exception {
        // given
        String date ="2023-03-17";

        List<StatisticsDto> statisticsDtoList = new ArrayList<>();
        statisticsDtoList.add(StatisticsDto.builder()
                .dataModel("Vehicle")
                .totalEntities(10000)
                .successEntities(10000)
                .failEntities(0)
                .build());
        statisticsDtoList.add(StatisticsDto.builder()
                .dataModel("Pedestrian")
                .totalEntities(1)
                .successEntities(1)
                .failEntities(0)
                .build());

        IoTEntityStatisticsListDto ioTEntityDateRangeStatisticsDto = IoTEntityStatisticsListDto.builder()
                .date(date)
                .statistics(statisticsDtoList)
                .build();

        // when
        doReturn(ioTEntityDateRangeStatisticsDto)
                .when(ioTEntityStatisticsService).getTotalEntitiesByDataModel(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics/model-type" +
                        "?date=" + date));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTEntityStatisticsListDto responseIoTEntityDataModelStatisticsDto = objectMapper.readValue(content, IoTEntityStatisticsListDto.class);
        assertEquals(responseIoTEntityDataModelStatisticsDto.getDate(), ioTEntityDateRangeStatisticsDto.getDate());
    }

    @Test
    @DisplayName("수집처 별 IoT Entity 수집 성공/실패 건 갯수 조회 테스트")
    void getTotalEntitiesByServicePath() throws Exception {
        // given
        String date = "2023-03-17";
        String dataModel = "Vehicle";

        List<StatisticsDto> statisticsDtoList = new ArrayList<>();
        statisticsDtoList.add(StatisticsDto.builder()
                .provider("UOS")
                .totalEntities(10000)
                .successEntities(10000)
                .failEntities(0)
                .build());
        statisticsDtoList.add(StatisticsDto.builder()
                .provider("PINTEL")
                .totalEntities(1)
                .successEntities(1)
                .failEntities(0)
                .build());

        IoTEntityStatisticsListDto ioTEntityServicePathStatisticsDto = IoTEntityStatisticsListDto.builder()
                .date(date)
                .dataModel(dataModel)
                .statistics(statisticsDtoList)
                .build();

        // when
        doReturn(ioTEntityServicePathStatisticsDto)
                .when(ioTEntityStatisticsService).getTotalEntitiesByProvider(any(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics/provider" +
                        "?date=" + date +
                        "&dataModel=" + dataModel));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTEntityStatisticsListDto responseIoTEntityServicePathDto = objectMapper.readValue(content, IoTEntityStatisticsListDto.class);
        assertEquals(responseIoTEntityServicePathDto.getDate(), ioTEntityServicePathStatisticsDto.getDate());
    }

    @Test
    @DisplayName("수집 날짜 리스트 조회 테스트")
    void getEntityCollectionDateList() throws Exception {
        // given
        int year = 2023;
        int month = 3;

        String firstDate = "2023-03-08";
        String secondDate = "2023-03-13";

        List<String> dateList = new ArrayList<>();
        dateList.add(firstDate);
        dateList.add(secondDate);

        // when
        doReturn(dateList)
                .when(ioTEntityStatisticsService).getEntityCollectionDateList(any(Integer.class), any(Integer.class));

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics/list/date" +
                        "?year=" + year +
                        "&month=" + month));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        List<String> responseDateList = objectMapper.readValue(content, List.class);
        assertEquals(responseDateList.get(0), firstDate);
    }

    @Test
    @DisplayName("수집 모델 리스트 조회 테스트")
    void getEntityCollectionDataModelList() throws Exception {
        // given
        String date ="2023-03-17";

        List<String> dataModelList = new ArrayList<>();
        dataModelList.add("Vehicle");
        dataModelList.add("Pedestrian");

        IoTEntityDataModelListDto ioTEntityDataModelListDto = IoTEntityDataModelListDto.builder()
                .date(date)
                .dataModel(dataModelList)
                .build();

        // when
        doReturn(ioTEntityDataModelListDto)
                .when(ioTEntityStatisticsService).getEntityCollectionDataModelList(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics/list/model-type" +
                        "?date=" + date));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTEntityDataModelListDto responseIoTEntityDataModelListDto = objectMapper.readValue(content, IoTEntityDataModelListDto.class);
        assertEquals(responseIoTEntityDataModelListDto.getDate(), ioTEntityDataModelListDto.getDate());
    }

    @Test
    @DisplayName("IoT Entity 수집 실패 건 상세 조회 테스트")
    void getFailTotalEntitiesByDataModelAndServicePath() throws Exception {
        // given
        String date ="2023-03-17";
        String dataModel ="Vehicle";
        String servicePath = "UOS";

        String result = "Bad Request Data";
        String cause = "Invalid child attribute.";

        // when
        List<IoTEntityValidationDto> ioTEntityValidationDtoList = new ArrayList<>();
        ioTEntityValidationDtoList.add(IoTEntityValidationDto.builder()
                .result(result)
                .cause(cause)
                .entity(testEntity)
                .build());
        Pageable pageable = PageRequest.of(0, 1);
        Page<IoTEntityValidationDto> ioTEntityValidationDtoPageList = new PageImpl<>(ioTEntityValidationDtoList, pageable, 1);

        doReturn(ioTEntityValidationDtoPageList)
                .when(ioTEntityStatisticsService).getFailTotalEntitiesByDataModelAndProvider(any(), any(), any(), any(), anyInt(), anyInt());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/statistics/fail" +
                        "?date=" + date +
                        "&dataModel=" + dataModel +
                        "&servicePath=" + servicePath));

        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        List<LinkedHashMap> responseIoTEntityValidationDto = objectMapper.readValue(content, List.class);
        assertEquals(responseIoTEntityValidationDto.get(0).get("result"), result);
        assertEquals(responseIoTEntityValidationDto.get(0).get("cause"), cause);
    }
}