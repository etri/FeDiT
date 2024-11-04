package kr.co.e8ight.ndxpro_v1_datamanager.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.AttributeDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeService;
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
public class AttributeControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    AttributeService attributeService;

    @MockBean
    AttributeRepository attributeRepository;

    ObjectMapper defaultObjectMapper = new ObjectMapper();
    Attribute defaultAttribute = defaultObjectMapper.readValue(AttributeDefaultValue.attribute,
            Attribute.class);

    public AttributeControllerTest() throws JsonProcessingException {
    }

    @Test
    public void createAttribute() throws Exception {
        AttributeRequestDto attributeRequestDto = new AttributeRequestDto();
        attributeRequestDto.setId("speed");
        attributeRequestDto.setTitle("test");
        attributeRequestDto.setDescription("test");
        attributeRequestDto.setValueType("Double");
        attributeRequestDto.setType("e8ight");


        String attribute = new Gson().toJson(attributeRequestDto);

        mockMvc.perform(post("/ndxpro/v1/manager/attributes")
                        .content(attribute)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());


    }

    @Test
    public void readAttribute() throws Exception {

        Attribute attribute = new Attribute();
        attribute.setId("speed");
        attribute.setTitle("test");
        attribute.setDescription("test");
        attribute.setValueType("Double");
        attribute.setType("e8ight");

        AttributeResponseDto attributeResponseDto = new AttributeResponseDto();
        attributeResponseDto.setId(attribute.getId());
        attributeResponseDto.setTitle(attribute.getTitle());
        attributeResponseDto.setDescription(attribute.getDescription());
        attributeResponseDto.setValueType(attribute.getValueType());

        given(attributeService.readSpecificAttribute(attribute.getId())).willReturn(attributeResponseDto);

        mockMvc.perform(get("/ndxpro/v1/manager/attributes/{id}","speed"))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.content().string(containsString("speed")))
                .andDo(print());

    }

    @Test
    public void updateAttribute() throws Exception {

        attributeRepository.save(defaultAttribute);

        mockMvc.perform(put("/ndxpro/v1/manager/attributes")
                        .content(AttributeDefaultValue.updateAttribute)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());
    }

}
