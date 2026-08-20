package kr.co.e8ight.ndxpro.databroker.controller.iot;

import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityProviderDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTObservedAtDto;
import kr.co.e8ight.ndxpro.databroker.service.iot.IoTEntityHistoryService;
import kr.co.e8ight.ndxpro.databroker.service.iot.IoTEntityService;
import kr.co.e8ight.ndxpro.databroker.util.HttpHeadersUtil;
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
import org.springframework.http.HttpHeaders;
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
@WebMvcTest(excludeAutoConfiguration = {WebMvcAutoConfiguration.class}, controllers = {IoTEntityController.class})
public class IoTEntityControllerTest {

    @SpyBean
    private ObjectMapper objectMapper;

    @MockBean
    private IoTEntityService ioTEntityService;

    @MockBean
    private IoTEntityHistoryService ioTEntityHistoryService;

    @Autowired
    private MockMvc mockMvc;

    private String testEntityString = TestConfiguration.testEntityString;

    private String testEntityDtoString = TestConfiguration.testEntityDtoString;

    private String testIoTEntityDtoString = TestConfiguration.testIoTEntityDtoString;

    private Entity testEntity;

    private EntityDto testEntityDto;

    private IoTEntityDto testIoTEntityDto;

    private static final String BASE_URL = "/ndxpro/v1/broker";

    @BeforeEach
    public void setEntity() {
        try {
            testEntity = objectMapper.readValue(testEntityString, Entity.class);
            testEntityDto = objectMapper.readValue(testEntityDtoString, EntityDto.class);
            testIoTEntityDto = objectMapper.readValue(testIoTEntityDtoString, IoTEntityDto.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("IoT NGSI-LD Entity 전체 조회 테스트 (by queryDto)")
    void getIoTEntities() throws Exception {
        // given
        String id = "urn:e8ight:SimulationVehicle:1010";
        String type = "SimulationVehicle";
        String q = "lane==1";
        String context = "<http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld>;";
        String sort = "ASC";
        String sortproperty = "location.observedAt";

        // when
        List<EntityDto> entityDtoList = new ArrayList<>();
        entityDtoList.add(testEntityDto);
        Pageable pageable = PageRequest.of(0, 1);
        Page<EntityDto> entityDtoPageList = new PageImpl<>(entityDtoList, pageable, 1);

        doReturn(entityDtoPageList)
                .when(ioTEntityService).getIoTEntities(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot" +
                        "?id=" + id +
                        "&type=" + type +
                        "&q=" + q +
                        "&sort=" + sort +
                        "&sortproperty=" + sortproperty)
                        .header(HttpHeaders.LINK, context));

        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        List<LinkedHashMap> responseEntityDtoList = objectMapper.readValue(content, List.class);
        assertEquals(responseEntityDtoList.get(0).get("id"), id);
    }

    @Test
    @DisplayName("IoT NGSI-LD Entity 전체 조회 with ServicePath 테스트 (by queryDto)")
    void getIoTEntitiesWithServicePath() throws Exception {
        // given
        String id = "urn:e8ight:SimulationVehicle:1010";
        String type = "SimulationVehicle";
        String q = "lane==1";
        String context = "<http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld>;";
        String sort = "ASC";
        String sortproperty = "location.observedAt";
        String servicePath = "UOS";

        // when
        List<EntityProviderDto> entityDtoList = new ArrayList<>();
        entityDtoList.add(EntityProviderDto.builder()
                .provider(servicePath)
                .entity(testEntityDto)
                .build());
        Pageable pageable = PageRequest.of(0, 1);
        Page<EntityProviderDto> entityDtoPageList = new PageImpl<>(entityDtoList, pageable, 1);

        doReturn(entityDtoPageList)
                .when(ioTEntityService).getIoTEntitiesWithProvider(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot/provider" +
                        "?id=" + id +
                        "&type=" + type +
                        "&q=" + q +
                        "&sort=" + sort +
                        "&sortproperty=" + sortproperty)
                        .header(HttpHeaders.LINK, context));

        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        List<LinkedHashMap> responseEntityDtoList = objectMapper.readValue(content, List.class);
        assertEquals(responseEntityDtoList.get(0).get("provider"), servicePath);
    }

    @Test
    @DisplayName("IoT NGSI-LD Entity 단건 조회 테스트 (by entityId)")
    void getIoTEntity() throws Exception {
        // given
        String id = "urn:e8ight:SimulationVehicle:1010";
        String context = "<http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld>;";

        // when
        doReturn(testEntityDto)
                .when(ioTEntityService).getIoTEntity(any(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot/" + id)
                        .header(HttpHeaders.LINK, context));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        EntityDto responseEntityDto = objectMapper.readValue(content, EntityDto.class);
        assertEquals(responseEntityDto.getId(), id);
    }

    @Test
    @DisplayName("IoT NGSI-LD Entities 조회 테스트 (by temporal query)")
    void getTemporalIoTEntities() throws Exception {
        // given
//        String timerel = "after";
        String time = "2023-03-14T10:00:59.285";
        String timeproperty = "speed.observedAt";
        String q = "scenarioId==1;scenarioType==RTSC";
        String context = "<http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld>;";

        // when
        List<EntityDto> entityDtoList = new ArrayList<>();
        entityDtoList.add(testEntityDto);
        Pageable pageable = PageRequest.of(0, 1);
        Page<EntityDto> entityDtoPageList = new PageImpl<>(entityDtoList, pageable, 1);

        doReturn(entityDtoPageList)
                .when(ioTEntityHistoryService).getTemporalIoTEntities(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot/temporal" +
                        "?time=" + time +
//                        "&timerel=" + timerel +
                        "&timeproperty=" + timeproperty +
                        "&q=" + q)
                        .header(HttpHeaders.LINK, context));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        List<LinkedHashMap> responseEntityDtoList = objectMapper.readValue(content, List.class);
        assertEquals(responseEntityDtoList.get(0).get("@context"), HttpHeadersUtil.parseLinkURI(context));
    }

    @Test
    @DisplayName("IoT NGSI-LD Entities observedAt date time 조회 테스트 (by temporal query)")
    void getIoTObservedAt() throws Exception {
        // given
        int scenarioId = 1;
        String scenarioType = "RTSC";
        String nextDateTime = "2023-03-14T10:00:59.285";
//        String date = "2023-03-14";
//        String timeGroup = "오전첨두";
//        String isCollectingFinish = "N";

        // when
        IoTObservedAtDto ioTObservedAtDto = IoTObservedAtDto.builder()
                .scenarioId(scenarioId)
                .scenarioType(scenarioType)
                .nextDateTime(nextDateTime)
//                .date(date)
//                .timeGroup(timeGroup)
//                .isCollectingFinish(isCollectingFinish)
                .build();
        doReturn(ioTObservedAtDto)
                .when(ioTEntityService).getFirstObservedAt(anyInt(), any());
        doReturn(ioTObservedAtDto)
                .when(ioTEntityService).getNextObservedAt(any(), anyInt(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot/temporal/observed-at" +
                        "?scenarioId=" + scenarioId +
//                        "&nextDateTime=" + nextDateTime +
                        "&scenarioType=" + scenarioType
//                        "&date=" + date +
//                        "&timeGroup=" + timeGroup
                ));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTObservedAtDto responseIoTObservedAtDto = objectMapper.readValue(content, IoTObservedAtDto.class);
        assertEquals(responseIoTObservedAtDto.getScenarioId(), scenarioId);
        assertEquals(responseIoTObservedAtDto.getScenarioType(), scenarioType);
    }

    @Test
    @DisplayName("IoT NGSI-LD Entity Histories 조회 테스트 (by entityId, timeproperty)")
    void getIoTEntityHistories() throws Exception {
        // given
        String id = "urn:e8ight:SimulationVehicle:1010";
        String timerel = "between";
        String time = "2023-03-14T10:00:59.285";
        String endTime = "2023-03-14T12:00:59.285";
        String timeproperty = "speed.observedAt";
        String q = "vehicleType==car";
        String sort = "ASC";
        String sortproperty = "location.observedAt";
        String context = "<http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld>;";

        String historyId = "640fc7bd564f7778f58f1a9f";
        String observedAt = "2023-03-14T10:00:59.285";

        // when
        List<IoTEntityDto> ioTEntityDtoList = new ArrayList<>();
        ioTEntityDtoList.add(testIoTEntityDto);
        Pageable pageable = PageRequest.of(0, 1);
        Page<IoTEntityDto> ioTEntityDtoPageList = new PageImpl<>(ioTEntityDtoList, pageable, 1);

        doReturn(ioTEntityDtoPageList)
                .when(ioTEntityHistoryService).getIoTEntityHistories(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot/history" +
                        "?entityId=" + id +
                        "&timerel=" + timerel +
                        "&time=" + time +
                        "&endTime=" + endTime +
                        "&timeproperty=" + timeproperty +
                        "&q=" + q +
                        "&sort=" + sort +
                        "&sortproperty=" + sortproperty)
                        .header(HttpHeaders.LINK, context));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        List<LinkedHashMap> responseIoTEntityDtoList = objectMapper.readValue(content, List.class);
        assertEquals(responseIoTEntityDtoList.get(0).get("historyId"), historyId);
        assertEquals(responseIoTEntityDtoList.get(0).get("observedAt"), observedAt);
    }

    @Test
    @DisplayName("History 조회 테스트 (by historyId)")
    void getIoTEntityHistory() throws Exception {
        // given
        String historyId = "640fc7bd564f7778f58f1a9f";
        String timeproperty = "speed.observedAt";

        // when
        doReturn(testIoTEntityDto)
                .when(ioTEntityHistoryService).getIoTEntityHistory(any(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/iot/history/" + historyId +
                        "?timeproperty=" + timeproperty));
        MvcResult response = actions
                .andExpect(status().isOk())
                .andReturn();

        String content = response.getResponse().getContentAsString();
//        System.out.println("response = " + content);

        IoTEntityDto ioTEntityDto = objectMapper.readValue(content, IoTEntityDto.class);
        assertEquals(ioTEntityDto.getHistoryId(), historyId);
    }
}
