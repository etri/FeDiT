package kr.co.e8ight.ndxpro_v1_datamanager.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.DataModelDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeSchemaRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.ContextRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.AttributeException;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext
@ExtendWith(MockitoExtension.class)
@EnableAutoConfiguration(exclude = {
        FileService.class
})
public class AttributeServiceTest {

    @Mock
    private AttributeRepository attributeRepository;
    @Spy
    private ObjectMapper objectMapper;
    @InjectMocks
    private AttributeService attributeService;
    @Mock
    private ContextRepository contextRepository;
    @Mock
    private DataModelRepository dataModelRepository;
    @Mock
    private AttributeSchemaRepository attributeSchemaRepository;
    @Mock
    private FileService fileService;

    ObjectMapper defaultObjectMapper = new ObjectMapper();


    public AttributeServiceTest() throws JsonProcessingException {
    }

    @BeforeEach
    void before() {
        this.attributeRepository.deleteAll();
    }

    @Nested
    @DisplayName("Attribute 생성 성공케이스")
    class CreateAttribute {

        @DisplayName("attribute 생성")
        @Test
        void createAttribute() throws IOException, ParseException {

            AttributeRequestDto attributeRequestDto = new AttributeRequestDto();
            attributeRequestDto.setId("speed");
            attributeRequestDto.setTitle("test");
            attributeRequestDto.setDescription("test");
            attributeRequestDto.setValueType("Double");
            attributeRequestDto.setType("e8ight");

            //given
            ArgumentCaptor<Attribute> captor = ArgumentCaptor.forClass(Attribute.class);
            attributeService.createAttribute(attributeRequestDto);

            //when
            verify(attributeRepository, times(1)).save(captor.capture());
            Attribute value = captor.getValue();
            List<Attribute> allValues = captor.getAllValues();

            //then
            assertEquals(1, allValues.size());
            assertEquals(value.getId(), attributeRequestDto.getId());
        }
    }

    @DisplayName("attribute 생성 실패케이스")
    @Nested
    class CreateAttributeFail {

        @DisplayName("Attribute 필수 파라미터 체크(Id)")
        @Test
        void validateParameterId() {
            //given
            Attribute attribute = new Attribute();
            attribute.setId(null);
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("Double");
            attribute.setType("e8ight");

            //when
            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
                attributeService.validateParameter(attribute);
            });

            String message = attributeException.getMessage();
            //then
            assertEquals(message, "Attribute Id is Empty");
        }

        @DisplayName("Attribute 필수 파라미터 체크(Type)")
        @Test
        void validateParameterAttributeName() {
            //given
            Attribute attribute = new Attribute();
            attribute.setId("speed");
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("Double");
            attribute.setType(null);

            //when
            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
                attributeService.validateParameter(attribute);
            });

            String message = attributeException.getMessage();
            //then
            assertEquals(message, "Attribute Type is Empty");
        }

        @DisplayName("Attribute valueType 체크")
        @Test
        void checkAttributeValueType() {
            //given
            Attribute attribute = new Attribute();
            attribute.setId("speed");
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("test");
            attribute.setType("e8ight");

            //when
            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
                attributeService.checkAttributeValueType(attribute);
            });

            String message = attributeException.getMessage();
            //then
            assertEquals(message,
                    "This ValueType Is Not Allow= " + attribute.getValueType());
        }

//        @DisplayName("Attribute valueType 체크(valid Integer)")
//        @Test
//        void validValueCheckInteger() {
//            //given
//            HashMap<String, Object> map = new HashMap<>();
//            map.put("maximum", 500);
//            map.put("minimum", 0);
//
//            defaultAttribute.setValueType(AttributeValueType.STRING.getCode());
//
//            //when
//            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
//                attributeService.checkAttributeValueType(defaultAttribute);
//            });
//            String message = attributeException.getMessage();
//
//            //then
//            assertEquals(message, "String Not available {maximum=500, minimum=0}");
//
//        }

//        @DisplayName("Attribute valueType 체크(valid String)")
//        @Test
//        void validValueCheckString() {
//            //given
//            HashMap<String, Object> map = new HashMap<>();
//            map.put("maxLength", 500);
//            map.put("minLength", 0);
//
//            defaultAttribute.setValueType(AttributeValueType.INTEGER.getCode());
//
//            //when
//            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
//                attributeService.checkAttributeValueType(defaultAttribute);
//            });
//            String message = attributeException.getMessage();
//
//            //then
//            assertEquals(message, "Integer Not available {minLength=0, maxLength=500}");
//
//        }

//        @DisplayName("Attribute valueType 체크(valid )")
//        @Test
//        void validValueCheck() {
//            //given
//            HashMap<String, Object> map = new HashMap<>();
//            map.put("minimum", 100);
//            map.put("maximum", 0);
//
//            defaultAttribute.setValueType(AttributeValueType.INTEGER.getCode());
//            defaultAttribute.setValid(map);
//
//            //when
//            AttributeException attributeException = assertThrows(AttributeException.class, () -> {
//                attributeService.checkAttributeValueType(defaultAttribute);
//            });
//            String message = attributeException.getMessage();
//
//            //then
//            assertEquals(message, "Min Cannot Be Greater Than Max");
//
//        }

    }

    @Nested
    @DisplayName("Attribute 조회 성공 케이스")
    class ReadAttribute {

        @DisplayName("특정 Attribute ID 조회")
        @Test
        void readAttribute() {

            //given
            Attribute attribute = new Attribute();
            attribute.setId("speed");
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("Double");
            attribute.setType("e8ight");

            Attribute attribute2 = new Attribute();
            attribute.setId("location");
            attribute.setTitle("test");
            attribute.setDescription("test");
            attribute.setValueType("point");
            attribute.setType("e8ight");

            attributeRepository.save(attribute);
            attributeRepository.save(attribute2);

            given(attributeRepository.findByid(attribute.getId())).willReturn(
                    Optional.of(attribute));

            //when
            AttributeResponseDto attributeResponseDto = attributeService.readSpecificAttribute(
                    attribute.getId());
//
            //then
            assertEquals(attribute.getId(), attributeResponseDto.getId());
            assertEquals(attribute.getValueType(), attributeResponseDto.getValueType());
        }

        @DisplayName("Attribute 전체 조회")
        @Test
        void readSpecificAttribute() {

//            //given
//            Attribute attribute = new Attribute();
//            attribute.setId("speed");
//            attribute.setTitle("test");
//            attribute.setDescription("test");
//            attribute.setValueType("Double");
//            attribute.setType("e8ight");
//
//            Attribute attribute2 = new Attribute();
//            attribute.setId("location");
//            attribute.setTitle("test");
//            attribute.setDescription("test");
//            attribute.setValueType("point");
//            attribute.setType("e8ight");
//
//            attributeRepository.save(attribute);
//            attributeRepository.save(attribute2);
//
//            //when
//            int BLOCK_PAGE_NUM_COUNT = 10;
//            int curPage = 1;
//            Pageable pageable = PageRequest.of(curPage-1, BLOCK_PAGE_NUM_COUNT);
//            Page<Attribute> allByOrderByCreatedAtDesc = attributeRepository.findAllByOrderByCreatedAtDesc(pageable);
//
//            given(attributeRepository.findAllByOrderByCreatedAtDesc(pageable)).willReturn(allByOrderByCreatedAtDesc);
//            for (int i = 0; i <allByOrderByCreatedAtDesc.getContent().size() ; i++) {
//                String id = allByOrderByCreatedAtDesc.getContent().get(i).getId();
//
//            }
//            //then
//            assertEquals();

        }

        @Nested
        @DisplayName("Attribute 조회 실패 케이스")
        class ReadAttributeFail {

            @DisplayName("존재하지 않는 Attribute 조회 ")
            @Test
            void readAttributeNotExists() {

                //given
                String id = "speed";
                //when
                AttributeException attributeException = assertThrows(AttributeException.class,
                        () -> {
                            attributeService.readSpecificAttribute(id);
                        });
                String message = attributeException.getMessage();

                assertEquals(message, "Not Exists. Attribute= " + id);
            }
        }

        @Nested
        @DisplayName("Attribute 수정 성공 케이스")
        class UpdateAttribute {

            @DisplayName("Attribute 수정")
            @Test
            void updateAttribute() throws IOException, ParseException {

                //given
                Attribute attribute = new Attribute();
                attribute.setId("test");
                attribute.setTitle("test");
                attribute.setDescription("test");
                attribute.setValueType("Enum");
                attribute.setType("e8ight");

                AttributeRequestDto attributeRequestDto = new AttributeRequestDto();
                attributeRequestDto.setId("test");
                attributeRequestDto.setTitle("test123");
                attributeRequestDto.setDescription("test");
                attributeRequestDto.setValueType("Enum");
                attributeRequestDto.setType("e8ight");

                ArgumentCaptor<Attribute> captor = ArgumentCaptor.forClass(Attribute.class);

                given(attributeRepository.findByid(attribute.getId())).willReturn(
                        Optional.of((attribute)));

                List<DataModel> dataModels = new ArrayList<>();
                DataModel dataModel = DataModelDefaultValue.dataModel;

                dataModels.add(dataModel);
                given(dataModelRepository.findAllDataModel()).willReturn(dataModels);

                //when
                attributeService.updateAttribute(attributeRequestDto);
                verify(attributeRepository, times(1)).save(captor.capture());
                int size = captor.getAllValues().size();
                String title = captor.getValue().getTitle();

                //then
                assertEquals(1, size);
                assertEquals(attributeRequestDto.getTitle(), title);
            }

        }

        @Nested
        @DisplayName("Attribute 수정 실패 케이스")
        class UpdateAttributeFail {

            @DisplayName("Attribute 수정 실패(모델에서 사용중인 경우)")
            @Test
            void updateAttributeFail() throws IOException, ParseException {

                //given
                Attribute attribute = new Attribute();
                attribute.setId("vehicleType");
                attribute.setTitle("test");
                attribute.setDescription("test");
                attribute.setValueType("Enum");
                attribute.setType("e8ight");

                AttributeRequestDto attributeRequestDto = new AttributeRequestDto();
                attributeRequestDto.setId("vehicleType");
                attributeRequestDto.setTitle("test123");
                attributeRequestDto.setDescription("test");
                attributeRequestDto.setValueType("Enum");
                attributeRequestDto.setType("e8ight");

                given(attributeRepository.findByid(attribute.getId())).willReturn(
                        Optional.of((attribute)));

                List<DataModel> dataModels = new ArrayList<>();
                DataModel dataModel = DataModelDefaultValue.dataModel;

                dataModels.add(dataModel);
                given(dataModelRepository.findAllDataModel()).willReturn(dataModels);

                //when
                AttributeException attributeException = assertThrows(AttributeException.class,
                        () -> {
                            attributeService.updateAttribute(attributeRequestDto);
                        });

                String message = attributeException.getMessage();

                //then
                assertEquals(message, "Attribute Is Use In Data Model= " + dataModel.getType());
            }
        }

        @Nested
        @DisplayName("Attribute 삭제 성공 케이스")
        class deleteAttribute {

            @DisplayName("Attribute 삭제")
            @Test
            void deleteAttribute() throws JsonProcessingException {
                //given
                AttributeRequestDto attributeRequestDto = new AttributeRequestDto();
                attributeRequestDto.setId("vehicleType");
                attributeRequestDto.setTitle("test");
                attributeRequestDto.setDescription("test");
                attributeRequestDto.setValueType("Enum");
                attributeRequestDto.setType("e8ight");

                Attribute attribute = new Attribute();
                attribute.setId("vehicleType");
                attribute.setTitle("test");
                attribute.setDescription("test");
                attribute.setValueType("Enum");
                attribute.setType("e8ight");

                AttributeSchema attributeSchema = new AttributeSchema();
                attributeSchema.setId("city.custom-schema.json");

                List<AttributeSchema> attributeSchemas = new ArrayList<>();
                attributeSchemas.add(attributeSchema);

                attributeService.createAttribute(attributeRequestDto);

                given(attributeRepository.findByid(attribute.getId())).willReturn(Optional.of((attribute)));
                given(attributeSchemaRepository.findAll()).willReturn(((attributeSchemas)));

                //when
                String message = attributeService.deleteAttribute(attributeRequestDto.getId());


                //then
                assertEquals(message,"ATTRIBUTE DELETE SUCCESS");

            }

        }
    }
}