package kr.co.e8ight.ndxpro.databroker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.config.TestConfiguration;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.DataModelResponseDto;
import kr.co.e8ight.ndxpro.databroker.domain.Attribute;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityValidation;
import kr.co.e8ight.ndxpro.databroker.dto.GeoJsonImpl;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityValidationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.assertj.core.api.Assertions.fail;

@ExtendWith(MockitoExtension.class)
public class EntityValidationServiceTest {

    @InjectMocks
    private EntityValidationService entityValidService;

    @Mock
    private DataModelCacheService dataModelCacheService;

    @Spy
    private ObjectMapper objectMapper;

    @Mock
    private IoTEntityValidationRepository entityValidationRepository;

    private Entity testEntity;

    private DataModelResponseDto testDataModelDto;

    private String testEntityString = TestConfiguration.testEntityString;

    private String testDataModelString = TestConfiguration.testDataModelString;

    @BeforeEach
    public void setEntity(){
        try {
            testEntity = objectMapper.readValue(testEntityString, Entity.class);
            testDataModelDto = objectMapper.readValue(testDataModelString, DataModelResponseDto.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("Entity 유효성 검사 테스트")
    public void validateEntity() {

        // given

        // when
        lenient().when(entityValidationRepository.insert(any(IoTEntityValidation.class)))
                .thenReturn(IoTEntityValidation.builder()
                        .result("fail")
                        .cause("Bad Request Data")
                        .entity(testEntity)
                        .build());

        when(dataModelCacheService.getDataModel(any(String.class)))
                .thenReturn(testDataModelDto);

        // then
        try {
            entityValidService.validateEntity(testEntity);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property String value 테스트")
    public void validatePropertyStringValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "String");
        LinkedHashMap<String, Object> valid = new LinkedHashMap<>();
        valid.put("minLength", 1);
        valid.put("maxLength", 256);
        dataModelAttribute.put("valid", valid);

        Attribute vehicleType = Attribute.builder()
                .type("Property")
                .value("sedan") // String value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(vehicleType, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Enum value 테스트")
    public void validatePropertyEnumValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "String");
        LinkedHashMap<String, Object> valid = new LinkedHashMap<>();
        valid.put("minLength", 1);
        valid.put("maxLength", 256);
        List<String> validEnum = new ArrayList<>();
        validEnum.add("bus");
        validEnum.add("truck");
        validEnum.add("bike");
        validEnum.add("sedan");
        dataModelAttribute.put("valid", valid);
        dataModelAttribute.put("enum", validEnum);

        Attribute vehicleType = Attribute.builder()
                .type("Property")
                .value("sedan") // Enum value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(vehicleType, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Integer value 테스트")
    public void validatePropertyIntegerValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "Integer");
        LinkedHashMap<String, Object> valid = new LinkedHashMap<>();
        valid.put("minimum", 1);
        valid.put("maximum", 150);
        dataModelAttribute.put("valid", valid);

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(30) // Integer value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Double value 테스트")
    public void validatePropertyDoubleValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "Double");
        LinkedHashMap<String, Object> valid = new LinkedHashMap<>();
        valid.put("minimum", 1.0);
        valid.put("maximum", 150);
        valid.put("format", "##.00");
        dataModelAttribute.put("valid", valid);

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value("2.00") // Double value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Boolean value 테스트")
    public void validatePropertyBooleanValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "Boolean");

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(true) // Boolean value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property DateTime value 테스트")
    public void validatePropertyDateTimeValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "String");

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value("2023-03-14T01:00:59.285+00:00") // ISO 8601 DateTime value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Object value 테스트")
    public void validatePropertyObjectValue() {

        // given

        // DataModelResponseDto Object Value 세팅
        String attributeString = "{" +
                "  \"type\": \"Property\"," +
                "  \"valueType\": \"Object\"," +
                "  \"objectMember\" :   {" +
                "    \"stringValue\": {" +
                "      \"valueType\": \"String\"" +
                "    }," +
                "    \"integerValue\": {" +
                "      \"valueType\": \"Integer\"" +
                "    }," +
                "    \"doubleValue\": {" +
                "      \"valueType\": \"Double\"" +
                "    }," +
                "    \"booleanValue\": {" +
                "      \"valueType\": \"Boolean\"" +
                "    }," +
                "    \"dateTimeValue\": {" +
                "      \"valueType\": \"String\"" +
                "    }," +
                "    \"arrayStringValue\": {" +
                "      \"valueType\": \"ArrayString\"" +
                "    }," +
                "    \"arrayIntegerValue\": {" +
                "      \"valueType\": \"ArrayInteger\"" +
                "    }," +
                "    \"arrayDoubleValue\": {" +
                "      \"valueType\": \"ArrayDouble\"" +
                "    }" +
                "  }" +
                "}";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Object value 세팅
        String objectValueString = "{" +
                "  \"stringValue\": \"Test\"," +
                "  \"integerValue\": 1," +
                "  \"doubleValue\": \"2.03\"," +
                "  \"booleanValue\": true," +
                "  \"dateTimeValue\": \"2022-11-17T15:00:00.000\"," +
                "  \"arrayStringValue\": [\"hello\", \"world\"]," +
                "  \"arrayIntegerValue\": [1, 2, 3]," +
                "  \"arrayDoubleValue\": [1.0, 2.0, 3.0]" +
                "}";
        LinkedHashMap<String, Object> objectValue;
        try {
            objectValue = objectMapper.readValue(objectValueString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(objectValue) // Object value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Child Object value 테스트")
    public void validatePropertyChildObjectValue() {

        // given
        String attributeString = "{" +
                "  \"type\": \"Property\"," +
                "  \"valueType\": \"Object\"," +
                "  \"objectMember\": {" +
                "    \"size\": {" +
                "      \"valueType\": \"Object\"," +
                "      \"objectMember\": {" +
                "        \"width\": {" +
                "          \"valueType\": \"Integer\"" +
                "        }" +
                "      }" +
                "    }," +
                "    \"grade\": {" +
                "      \"valueType\": \"String\"" +
                "    }" +
                "  }" +
                "}";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Entity Child Object Value 세팅
        String objectValueString = "{" +
                "  \"size\" : {" +
                "    \"width\" : 40" +
                "    }," +
                "    \"grade\" : \"high\"" +
                "  }" +
                "}";
        LinkedHashMap<String, Object> objectValue;
        try {
            objectValue = objectMapper.readValue(objectValueString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(objectValue) // Object value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }


    @Test
    @DisplayName("Property ArrayString value 테스트")
    public void validatePropertyArrayStringValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "ArrayString");

        List<String> arrayString = new ArrayList<>();
        arrayString.add("hello");
        arrayString.add("world");

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(arrayString) // ArrayString value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property ArrayInteger value 테스트")
    public void validatePropertyArrayIntegerValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "ArrayInteger");

        List<Integer> arrayInteger = new ArrayList<>();
        arrayInteger.add(1);
        arrayInteger.add(3);

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(arrayInteger) // ArrayInteger value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property ArrayDouble value 테스트")
    public void validatePropertyArrayDoubleValue() {

        // given
        LinkedHashMap<String, Object> dataModelAttribute = new LinkedHashMap<>();
        dataModelAttribute.put("type", "Property");
        dataModelAttribute.put("valueType", "ArrayDouble");

        List<Double> arrayDouble = new ArrayList<>();
        arrayDouble.add(1.2);
        arrayDouble.add(3.4);

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(arrayDouble) // ArrayDouble value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property ArrayObject value 테스트")
    public void validatePropertyArrayObjectValue() {

        // given

        // DataModelResponseDto Array Object Member 세팅
        String attributeString = "{" +
                "  \"type\": \"Property\"," +
                "  \"valueType\": \"ArrayObject\"," +
                "  \"objectMember\" :   [" +
                "    {" +
                "       \"size\": {" +
                "           \"valueType\": \"Integer\"" +
                "       }," +
                "       \"grade\": {" +
                "           \"valueType\": \"String\"" +
                "       }" +
                "    }," +
                "    {" +
                "       \"width\": {" +
                "           \"valueType\": \"Double\"" +
                "       }" +
                "    }" +
                "  ]" +
                "}";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Entity Array Object Value 세팅
        String arrayObjectValueString = "[" +
                "   {" +
                "       \"size\" : 40," +
                "       \"grade\" : \"high\"" +
                "   }," +
                "   {" +
                "       \"width\" : 3.2 " +
                "   }" +
                "]";
        List<LinkedHashMap<String, Object>> arrayObjectValue;
        try {
            arrayObjectValue = objectMapper.readValue(arrayObjectValueString, List.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(arrayObjectValue) // ArrayObject value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Property Child ArrayObject value 테스트")
    public void validatePropertyChildArrayObjectValue() {

        // given

        // DataModelResponseDto Array Object Member 세팅
        String attributeString = "{" +
                "  \"type\": \"Property\"," +
                "  \"valueType\": \"ArrayObject\"," +
                "  \"objectMember\" :   [" +
                "    {" +
                "       \"size\": {" +
                "           \"valueType\": \"ArrayObject\"," +
                "           \"objectMember\" : [" +
                    "          {  " +
                    "           \"width\" : {" +
                    "              \"valueType\" : \"Double\"" +
                    "            }" +
                    "          }," +
                    "          {" +
                    "            \"height\" : {" +
                    "              \"valueType\" : \"Double\"" +
                    "            }" +
                    "          }" +
                "           ]" +
                "       }," +
                "       \"grade\": {" +
                "           \"valueType\": \"Integer\"" +
                "       }" +
                "    }," +
                "    {" +
                "       \"color\": {" +
                "           \"valueType\": \"String\"" +
                "       }" +
                "    }" +
                "  ]" +
                "}";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Entity Child Array Object Value 세팅
        String arrayObjectValueString = "[" +
                "{" +
                "   \"size\" : [" +
                "        {" +
                "          \"width\" : \"30.2\"" +
                "        }," +
                "        {" +
                "          \"height\" : \"24.3\"" +
                "        }" +
                "   ]," +
                "   \"grade\" : \"high\"" +
                "}," +
                "{" +
                "   \"color\" : \"black\"" +
                "}" +
                "]";
        List<LinkedHashMap<String, Object>> arrayObjectValue;
        try {
            arrayObjectValue = objectMapper.readValue(arrayObjectValueString, List.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        Attribute entityAttribute = Attribute.builder()
                .type("Property")
                .value(arrayObjectValue) // ArrayObject value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("GeoProperty value 테스트")
    public void validateGeoPropertyValue() {

        // given

        // DataModelResponseDto GeoProperty 세팅
        String attributeString = "{" +
                "\"type\": \"GeoProperty\"," +
                "\"description\": \"차량 위치\"," +
                "\"valueType\": \"POINT\"" +
                "}";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Entity GeoProperty Value 세팅
        String geoPropertyValueString = "{" +
                "        \"type\": \"Point\"," +
                "        \"coordinates\": [" +
                "          13.3598," +
                "          52.5165" +
                "        ]" +
                "      }";
        GeoJsonImpl geoJson;
        try {
            geoJson = objectMapper.readValue(geoPropertyValueString, GeoJsonImpl.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        Attribute entityAttribute = Attribute.builder()
                .type("GeoProperty")
                .value(geoJson) // GeoJson value
                .build();

        String dataModelAttributeValueType = (String) dataModelAttribute.get("valueType");

        // when

        // then
        try {
            entityValidService.validateGeoPropertyValue(entityAttribute, dataModelAttributeValueType);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Relationship value 테스트")
    public void validateRelationshipValue() {

        // given

        // DataModelResponseDto GeoProperty 세팅
        String attributeString = "{" +
                "\"type\": \"Relationship\"," +
                "\"description\": \"링크 정보\"," +
                "\"valueType\": \"String\"," +
                "\"modelType\": [" +
                "   \"ngsi-ld:Link\"" +
                "]" +
                "}";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Entity Relationship Value 세팅
        String relationshipAttribute = "{" +
                "  \"type\": \"Relationship\"," +
                "  \"value\": [" +
                "      \"urn:ngsi-ld:Link:102\"," +
                "      \"urn:ngsi-ld:Link:103\"" +
                "  ]" +
                "}";
        Attribute attribute;
        try {
            attribute = objectMapper.readValue(relationshipAttribute, Attribute.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // when

        // then
        try {
            entityValidService.validateRelationshipValue(attribute, dataModelAttribute);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Child Attribute value 테스트")
    public void validateChildAttributeValue() {

        // given

        // DataModelResponseDto GeoProperty 세팅
        String attributeString = "{\n" +
                "      \"type\": \"Property\",\n" +
                "      \"description\": \"Property. Current direction of the vehicle.\",\n" +
                "      \"valueType\": \"Double\",\n" +
                "      \"valid\": {\n" +
                "        \"minimum\": 0,\n" +
                "        \"maximum\": 500\n" +
                "      },\n" +
                "      \"childAttributeNames\": {\n" +
                "        \"observedAt\": \"ngsi-ld:observedAt\",\n" +
                "        \"unitCode\": \"ngsi-ld:unitCode\"\n" +
                "      },\n" +
                "      \"childAttributes\": {\n" +
                "        \"observedAt\": {\n" +
                "          \"valueType\": \"String\",\n" +
                "          \"format\": \"DateTime\"\n" +
                "        },\n" +
                "        \"unitCode\": {\n" +
                "          \"valueType\": \"String\",\n" +
                "          \"type\": \"speed\",\n" +
                "          \"enum\": [\n" +
                "            \"MTS\",\n" +
                "            \"M60\",\n" +
                "            \"M62\",\n" +
                "            \"KMH\",\n" +
                "            \"IU\"\n" +
                "          ],\n" +
                "          \"format\": \"UN/CEFACT\"\n" +
                "        }\n" +
                "      }\n" +
                "    },\n";
        LinkedHashMap<String, Object> dataModelAttribute;
        try {
            dataModelAttribute = objectMapper.readValue(attributeString, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        // Entity Child Attribute Value 세팅
        String childAttribute = "{\n" +
                "          \"name\": \"speed\",\n" +
                "          \"type\": \"Property\",\n" +
                "          \"value\": 50.2541763970735,\n" +
                "          \"mdNames\": {\n" +
                "            \"unitCode\": \"ngsi-ld:unitCode\",\n" +
                "            \"observedAt\": \"ngsi-ld:observedAt\",\n" +
                "            \"verify\": \"e8ight:verify\"\n" +
                "          },\n" +
                "          \"md\": [\n" +
                "            {\n" +
                "              \"name\": \"unitCode\",\n" +
                "              \"value\": \"KMH\"\n" +
                "            },\n" +
                "            {\n" +
                "              \"name\": \"observedAt\",\n" +
                "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
                "            }" +
                "          ]\n" +
                "        },\n";
        Attribute attribute;
        try {
            attribute = objectMapper.readValue(childAttribute, Attribute.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        LinkedHashMap<String, Object> dataModelChildAttributes = (LinkedHashMap<String, Object>) dataModelAttribute.get("childAttributes");

        // when

        // then
        try {
            entityValidService.validateChildAttributeValue(attribute.getMd(), dataModelChildAttributes, attribute.getName());
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Required Attribute 테스트")
    public void validateRequiredAttribute() {

        // given
        List<Attribute> entityAttributes = new ArrayList<>();
        String attributeString = "{\n" +
                "          \"name\": \"speed\",\n" +
                "          \"type\": \"Property\",\n" +
                "          \"value\": 50.2541763970735,\n" +
                "          \"mdNames\": {\n" +
                "            \"unitCode\": \"ngsi-ld:unitCode\",\n" +
                "            \"observedAt\": \"ngsi-ld:observedAt\",\n" +
                "            \"verify\": \"e8ight:verify\"\n" +
                "          },\n" +
                "          \"md\": [\n" +
                "            {\n" +
                "              \"name\": \"unitCode\",\n" +
                "              \"value\": \"KMH\"\n" +
                "            },\n" +
                "            {\n" +
                "              \"name\": \"observedAt\",\n" +
                "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
                "            },\n" +
                "            {\n" +
                "              \"name\": \"verify\",\n" +
                "              \"type\": \"Property\",\n" +
                "              \"value\": true\n" +
                "            }\n" +
                "          ]\n" +
                "        },\n";
        Attribute attribute;
        try {
            attribute = objectMapper.readValue(attributeString, Attribute.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        entityAttributes.add(attribute);

        // when

        // then
        try {
            entityValidService.validateRequiredAttribute(entityAttributes, testDataModelDto);
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Entity AttributeNames 테스트")
    public void validateEntityAttributeNames() {

        // given

        // when

        // then
        try {
            entityValidService.validateAttributeNames(testEntity.getAttrNames(), testEntity.getAttrs(), testDataModelDto.getAttributeNames());
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }

    @Test
    @DisplayName("Attribute mdNames 테스트")
    public void validateAttributeMdNames() {

        // given

        LinkedHashMap<String, Attribute> entityAttributes = new LinkedHashMap<>();
        String attributeString = "{\n" +
                "          \"name\": \"speed\",\n" +
                "          \"type\": \"Property\",\n" +
                "          \"value\": 50.2541763970735,\n" +
                "          \"mdNames\": {\n" +
                "            \"unitCode\": \"ngsi-ld:unitCode\",\n" +
                "            \"observedAt\": \"ngsi-ld:observedAt\",\n" +
                "            \"verify\": \"e8ight:verify\"\n" +
                "          },\n" +
                "          \"md\": [\n" +
                "            {\n" +
                "              \"name\": \"unitCode\",\n" +
                "              \"value\": \"KMH\"\n" +
                "            },\n" +
                "            {\n" +
                "              \"name\": \"observedAt\",\n" +
                "              \"value\": \"2023-03-14T01:00:59.285+00:00\"\n" +
                "            },\n" +
                "            {\n" +
                "              \"name\": \"verify\",\n" +
                "              \"type\": \"Property\",\n" +
                "              \"value\": true\n" +
                "            }\n" +
                "          ]\n" +
                "        },\n";
        Attribute attribute;
        try {
            attribute = objectMapper.readValue(attributeString, Attribute.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        entityAttributes.put("speed", attribute);

        // when

        // then
        try {
            entityValidService.validateAttributeNames(attribute.getMdNames(), attribute.getMd(), testDataModelDto.getAttributeNames());
        } catch (DataBrokerException e) {
            fail("Validation Fail. " + e.getMessage());
        }
    }
}
