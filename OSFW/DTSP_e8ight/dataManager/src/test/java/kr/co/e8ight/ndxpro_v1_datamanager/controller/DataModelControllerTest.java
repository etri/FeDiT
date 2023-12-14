package kr.co.e8ight.ndxpro_v1_datamanager.controller;


import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.refEq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.Gson;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.DataModelDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.DataModelRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.DataModelResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.service.DataModelService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@SpringBootTest
@AutoConfigureMockMvc
public class DataModelControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    DataModelService dataModelService;

    @MockBean
    DataModelRepository dataModelRepository;


//    ObjectMapper defaultObjectMapper = new ObjectMapper();
//    DataModel defaultDataModel = defaultObjectMapper.readValue(DataModelDefaultValue.dataModel,
//            DataModel.class);


    DataModel dataModel = DataModelDefaultValue.dataModel;

    public DataModelControllerTest() throws JsonProcessingException {
    }


    @Test
    public void createDataModel() throws Exception {

        DataModelRequestDto dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;

        String dataModel = new Gson().toJson(dataModelRequestDto);


        mockMvc.perform(post("/ndxpro/v1/manager/data-models")
                        .content(dataModel)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());

        //then
        verify(dataModelService).createDataModel(refEq(dataModelRequestDto));


    }

    @Test
    public void readDataModel() throws Exception {

        //given
        DataModelResponseDto dataModelResponseDto = new DataModelResponseDto();
        dataModelResponseDto.setId(dataModel.getId());
        dataModelResponseDto.setType(dataModel.getType());
        dataModelResponseDto.setTitle(dataModel.getTitle());
        dataModelResponseDto.setDescription(dataModel.getDescription());
        dataModelResponseDto.setAttributeNames(dataModel.getAttributeNames());
        dataModelResponseDto.setAttributes(dataModel.getAttributes());
        dataModelResponseDto.setRequired(dataModel.getRequired());
        dataModelResponseDto.setReference(dataModel.getReference());
        dataModelResponseDto.setIsDynamic(dataModel.getIsDynamic());
        dataModelResponseDto.setIsReady(dataModel.getIsReady());
        dataModelResponseDto.setCreatedAt(dataModel.getCreatedAt());
        dataModelResponseDto.setModifiedAt(dataModel.getModifiedAt());;

        given(dataModelService.readDataModel(dataModel.getType(),null)).willReturn(dataModelResponseDto);


        mockMvc.perform(get("/ndxpro/v1/manager/data-models/{type}",dataModel.getType()))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.content().string(containsString("urn:e8ight:Vehicle:")))
                .andDo(print());

    }

    @Test
    public void updateDataModel() throws Exception {

        dataModelRepository.save(dataModel);

        DataModelRequestDto dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;
        String dataModel = new Gson().toJson(dataModelRequestDto);

        mockMvc.perform(put("/ndxpro/v1/manager/data-models")
                        .content(dataModel)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());

    }

}