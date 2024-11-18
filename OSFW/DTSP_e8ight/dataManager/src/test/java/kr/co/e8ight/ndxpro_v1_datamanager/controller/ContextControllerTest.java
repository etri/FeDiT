package kr.co.e8ight.ndxpro_v1_datamanager.controller;


import static org.hamcrest.Matchers.containsString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import java.util.ArrayList;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.ContextDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Context;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.ContextRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ContextResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.ContextRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.service.ContextService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class ContextControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    ContextService contextService;

    @MockBean
    ContextRepository contextRepository;

    ObjectMapper defaultObjectMapper = new ObjectMapper();
    Context context = defaultObjectMapper.readValue(ContextDefaultValue.context, Context.class);

    ContextRequestDto contextRequestDto = defaultObjectMapper.readValue(ContextDefaultValue.context, ContextRequestDto.class);

    public ContextControllerTest() throws JsonProcessingException {
    }

    @Test
    public void createContext() throws Exception {

        //given


        ContextResponseDto contextResponseDto = new ContextResponseDto();
        contextResponseDto.setContext(context.getValue().toString());
        //when
        mockMvc.perform(post("/ndxpro/v1/manager/contexts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ContextDefaultValue.context)
                )
                .andExpect(status().isOk())
                .andDo(print());
        //then
    }

    @Test
    public void readContext() throws Exception {


        ContextResponseDto contextResponseDto = new ContextResponseDto();
        contextResponseDto.setContext(context.getValue().toString());

        given(contextService.readContext(context.getUrl(),false)).willReturn(contextResponseDto);

        mockMvc.perform(get("/ndxpro/v1/manager/context")
                        .param("contextUrl",context.getUrl())
                        .param("full","false")

                )
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("https://e8ight-data-models/")))
                .andDo(print());

    }


    @Test
    public void readAllContext() throws Exception {

        //given
        List<String> urls = new ArrayList<>();
        urls.add(context.getDefaultUrl());
        urls.add("https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld");

        given(contextService.readAllContext()).willReturn(urls);

        //when

        //then
        mockMvc.perform(get("/ndxpro/v1/manager/contexts"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(
                        "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld")))
                .andExpect(content().string(
                        containsString(context.getDefaultUrl())))
                .andDo(print());


    }
    @Test
    public void registrationDataModelInContext() throws Exception {

        List<String> dataModels = new ArrayList<>();
        dataModels.add("Vehicle");

        String dataModel = new Gson().toJson(dataModels);

        mockMvc.perform(put("/ndxpro/v1/manager/contexts/models/enrollment")
                        .param("contextUrl",context.getUrl())
                        .content(dataModel)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());

    }

}