package kr.co.e8ight.ndxpro.databroker.controller;

import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.EntityProviderDto;
import kr.co.e8ight.ndxpro.databroker.service.EntityService;
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
import org.springframework.http.MediaType;
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
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@EnableWebMvc
@WebMvcTest(excludeAutoConfiguration = {WebMvcAutoConfiguration.class}, controllers = {EntityController.class})
public class EntityControllerTest {

    @SpyBean
    private ObjectMapper objectMapper;

    @MockBean
    private EntityService entityService;

    @Autowired
    private MockMvc mockMvc;

    private String testEntityString = TestConfiguration.testEntityString;

    private String testEntityDtoString = TestConfiguration.testEntityDtoString;

    private String testEntityDtoWithProviderString = TestConfiguration.testEntityDtoWithProviderString;

    private Entity testEntity;

    private EntityDto testEntityDto;

    private static final String BASE_URL = "/ndxpro/v1/broker";

    @BeforeEach
    public void setEntity() {
        try {
            testEntity = objectMapper.readValue(testEntityString, Entity.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        try {
            testEntityDto = objectMapper.readValue(testEntityDtoString, EntityDto.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("NGSI-LD Entity 전체 조회 테스트 (by queryDto)")
    void getEntities() throws Exception {
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
                .when(entityService).getEntities(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities" +
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
    @DisplayName("NGSI-LD Entity 전체 조회 with ServicePath 테스트 (by queryDto)")
    void getEntitiesWithServicePath() throws Exception {
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
                .when(entityService).getEntitiesWithProvider(any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/provider" +
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
    @DisplayName("NGSI-LD Entity 단건 조회 테스트 (by entityId)")
    void getEntity() throws Exception {
        // given
        String id = "urn:e8ight:SimulationVehicle:1010";
        String context = "<http://172.16.28.218:3005/e8ight-context-v1.0.1.jsonld>;";

        // when
        EntityDto entityDto = new EntityDto();
        entityDto.setId(id);
        entityDto.setContext(HttpHeadersUtil.parseLinkURI(context));
        doReturn(entityDto)
                .when(entityService).getEntity(any(), any());

        // then
        ResultActions actions = mockMvc.perform(
                get(BASE_URL + "/entities/" + id)
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
    @DisplayName("NGSI-LD Entity 저장 테스트")
    void saveEntity() throws Exception {
        // given

        // when
        doReturn(testEntity)
                .when(entityService).saveEntity((EntityDto) any());

        // then
        mockMvc.perform(post(BASE_URL + "/entities")
                        .content(testEntityDtoString)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("NGSI-LD Entity 저장 with ServicePath 테스트")
    void saveEntityWithServicePath() throws Exception {
        // given

        // when
        doReturn(testEntity)
                .when(entityService).saveEntity((Entity) any());

        // then
        mockMvc.perform(post(BASE_URL + "/entities/provider")
                        .content(testEntityDtoWithProviderString)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
