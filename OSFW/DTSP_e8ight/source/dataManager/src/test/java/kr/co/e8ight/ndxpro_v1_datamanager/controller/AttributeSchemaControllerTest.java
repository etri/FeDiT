package kr.co.e8ight.ndxpro_v1_datamanager.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.google.gson.Gson;
import java.util.ArrayList;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeSchemaRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeSchemaRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeSchemaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class AttributeSchemaControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    AttributeSchemaService attributeSchemaService;

    @MockBean
    AttributeSchemaRepository attributeSchemaRepository;

    @Test
    public void createAttributeSchema() throws Exception {

        AttributeSchemaRequestDto attributeSchemaRequestDto = new AttributeSchemaRequestDto();
        attributeSchemaRequestDto.setId("city.custom-schema.json");
        String attributeSchema = new Gson().toJson(attributeSchemaRequestDto);

        mockMvc.perform(post("/ndxpro/v1/manager/attribute-schemata")
                        .content(attributeSchema)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());

    }

    @Test
    public void readAllAttributeSchemaId() throws Exception {
        List<String> attributeSchemaId = new ArrayList<>();
        attributeSchemaId.add("city.custom-schema.json");
        attributeSchemaId.add("farm.custom-schema.json");

        given(attributeSchemaService.readAllAttributeSchemaId()).willReturn(attributeSchemaId);

        mockMvc.perform(get("/ndxpro/v1/manager/attribute-schemata"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("city.custom-schema.json")))
                .andDo(print());
    }

    @Test
    public void updateAttributeSchema() throws Exception {

        String id = "city.custom-schema.json";

        AttributeSchema attributeSchema = new AttributeSchema();
        attributeSchema.setId(id);
        attributeSchemaRepository.save(attributeSchema);

        List<String> attributeId = new ArrayList<>();
        attributeId.add("speed");
        attributeId.add("vehicleType");
        AttributeSchemaRequestDto attributeSchemaRequestDto = new AttributeSchemaRequestDto();
        attributeSchemaRequestDto.setAttributes(attributeId);

        String  attribute = new Gson().toJson(attributeSchemaRequestDto);

        mockMvc.perform(put("/ndxpro/v1/manager/attribute-schemata")
                        .content(attribute)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(print());
    }
}
