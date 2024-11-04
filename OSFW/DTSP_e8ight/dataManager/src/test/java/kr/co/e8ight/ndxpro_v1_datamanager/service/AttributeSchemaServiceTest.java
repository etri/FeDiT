package kr.co.e8ight.ndxpro_v1_datamanager.service;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeSchemaRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeSchemaResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeSchemaRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.AttributeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext
@ExtendWith(MockitoExtension.class)
public class AttributeSchemaServiceTest {

    @Mock
    private AttributeSchemaRepository attributeSchemaRepository;

    @Mock
    private AttributeRepository attributeRepository;
    @InjectMocks
    private AttributeSchemaService attributeSchemaService;

    @BeforeEach
    void before() {
        this.attributeSchemaRepository.deleteAll();
    }

    @Nested
    @DisplayName("AttributeSchema 생성 성공케이스")
    class CreateAttribute {

        @DisplayName("AttributeSchema 생성")
        @Test
        void createAttributeSchema() {

            AttributeSchemaRequestDto attributeSchemaRequestDto = new AttributeSchemaRequestDto();
            String id = "city.custom-schema.json";
            attributeSchemaRequestDto.setId(id);

            //given
            AttributeSchema attributeSchema = new AttributeSchema();
            attributeSchema.setId(id);
            ArgumentCaptor<AttributeSchema> captor = ArgumentCaptor.forClass(AttributeSchema.class);
            attributeSchemaService.createAttributeSchema(attributeSchemaRequestDto);

            //when
            verify(attributeSchemaRepository, times(1)).save(captor.capture());
            String schemaId = captor.getValue().getId();
            List<AttributeSchema> allValues = captor.getAllValues();

            //then
            assertEquals(1, allValues.size());
            assertEquals(schemaId, attributeSchema.getId());
        }
    }

    @Nested
    @DisplayName("AttributeSchema 생성 실패케이스")
    class CreateAttributeFail {

        @DisplayName("AttributeSchemaId 유효성 검사(실패)")
        @Test
        void createAttributeSchemaFail() {

            String id = "city.custom-schema.fail";
            //given
            AttributeSchema attributeSchema = new AttributeSchema();
            attributeSchema.setId(id);

            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
                attributeSchemaService.validateAttributeSchemaId(id);
            });
            String message = attributeException.getMessage();

            //when
            assertEquals(message, "Invalid Format Url / { }.json= city.custom-schema.fail");

        }
    }

    @Nested
    @DisplayName("AttributeSchema 조회 성공케이스")
    class ReadAttribute {

        @DisplayName("AttributeSchema 전체 조회")
        @Test
        void readAllAttributeSchema() {

            //given
            List<String> attributeSchemaId = new ArrayList<>();
            attributeSchemaId.add("city.custom-schema.json");
            attributeSchemaId.add("farm.custom-schema.json");

            //when

            given(attributeSchemaRepository.findAllAttributeSchemaId()).willReturn(
                    (attributeSchemaId));
            List<String> strings = attributeSchemaService.readAllAttributeSchemaId();
            //then
            assertEquals(attributeSchemaId, strings);

        }

        @DisplayName("AttributeSchema 단건 조회")
        @Test
        void readAttributeSchema() {

            String id = "city.custom-schema.json";
            Map<String, String> stringStringMap = new HashMap<>();
            stringStringMap.put("e8ight","Vehicle");

            //given
            AttributeSchema attributeSchema = new AttributeSchema();
            attributeSchema.setId(id);
            attributeSchema.setValue(stringStringMap);

            //when
            given(attributeSchemaRepository.findByid(id)).willReturn(Optional.of(attributeSchema));
            AttributeSchemaResponseDto attributeSchemaResponseDto = attributeSchemaService.readAttributeSchema(id);

            //then
            assertEquals(id, attributeSchemaResponseDto.getId());

        }


    }

    @Nested
    @DisplayName("AttributeSchema 조회 실패 케이스")
    class ReadAttributeFail {

        @DisplayName("AttributeSchema 없을시")
        @Test
        void readAllAttributeSchemaId() {

            //given
            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
                attributeSchemaService.readAllAttributeSchemaId();
            });

            //when
            String message = attributeException.getMessage();

            //then
            assertEquals(message, "No AttributeSchemaIds found.");

        }
    }


    @Nested
    @DisplayName("AttributeSchema attribute 등록 성공 및 취소 케이스")
    class registerAttribute {

        @DisplayName("AttributeSchema 에 등록")
        @Test
        void registerAttributeSchemaId() {
            //given
            AttributeSchema attributeSchema = new AttributeSchema();
            attributeSchema.setId("city.custom-schema.json");
            attributeSchema.setIsReadOnly(false);

            Attribute attribute = new Attribute();
            attribute.setId("speed");
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("Double");
            attribute.setType("e8ight");

            List<String> attr = new ArrayList<>();
            attr.add("speed");
            AttributeSchemaRequestDto attributeSchemaRequestDto = new AttributeSchemaRequestDto();
            attributeSchemaRequestDto.setId(attributeSchema.getId());
            attributeSchemaRequestDto.setAttributes(attr);
            ArgumentCaptor<AttributeSchema> captor = ArgumentCaptor.forClass(AttributeSchema.class);

            //when
            given(attributeSchemaRepository.findByid(attributeSchema.getId())).willReturn(Optional.of(attributeSchema));
            given(attributeRepository.findByid(attribute.getId())).willReturn(Optional.of(attribute));

            System.out.println(attributeSchemaRequestDto);
            attributeSchemaService.updateAttributeSchema(attributeSchemaRequestDto);
            verify(attributeSchemaRepository, times(1)).save(captor.capture());
            String id = captor.getValue().getValue().toString();

            //then
            assertEquals(id, "{speed=e8ight:speed}");

        }

        @DisplayName("AttributeSchema 에 등록 취소")
        @Test
        void cancellationRegisterAttributeSchemaId() {
//            //given
            AttributeSchema attributeSchema = new AttributeSchema();
            attributeSchema.setId("city.custom-schema.json");
            attributeSchema.setIsReadOnly(false);

            Attribute attribute = new Attribute();
            attribute.setId("speed");
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("Double");
            attribute.setType("e8ight");
            ArgumentCaptor<AttributeSchema> captor = ArgumentCaptor.forClass(AttributeSchema.class);

            List<String> attr = new ArrayList<>();
            attr.add("speed");
            AttributeSchemaRequestDto attributeSchemaRequestDto = new AttributeSchemaRequestDto();
            attributeSchemaRequestDto.setId(attributeSchema.getId());
            attributeSchemaRequestDto.setAttributes(attr);

            //when
            given(attributeSchemaRepository.findByid(attributeSchema.getId())).willReturn(
                    Optional.of(attributeSchema));
            given(attributeRepository.findByid(attribute.getId())).willReturn(
                    Optional.of(attribute));
            attributeSchemaService.updateAttributeSchema(attributeSchemaRequestDto);
            attributeSchemaRequestDto.setAttributes(null);
            attributeSchemaService.updateAttributeSchema(attributeSchemaRequestDto);

            verify(attributeSchemaRepository, times(2)).save(captor.capture());
            String id = captor.getValue().getValue().toString();

            //then
            assertEquals(id,"{}");

        }
    }

}
