package kr.co.e8ight.ndxpro.databroker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.geojson.GeoJsonObjectType;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.DataModelResponseDto;
import kr.co.e8ight.ndxpro.databroker.domain.Attribute;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.dto.GeoJsonImpl;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.*;

@Slf4j
@Service
public class EntityValidationService {

    private final DataModelCacheService dataModelCacheService;

    private final ObjectMapper objectMapper;

    public EntityValidationService(DataModelCacheService dataModelCacheService, ObjectMapper objectMapper) {
        this.dataModelCacheService = dataModelCacheService;
        this.objectMapper = objectMapper;
    }

    public void validateEntity(Entity entity) {
        log.info("EntityValidationService.validateEntity() entity={}", entity.getId().getId());
        String entityId = entity.getId().getId();
        String parsedDataModelId = getDataModelId(entityId);

        String entityContext = entity.getContext();
        if(entityContext == null || entityContext.equals(""))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid @context value.");

        // DB dataModelResponseDto 조회 및 entity context 유효성 검사
        DataModelResponseDto dataModel = dataModelCacheService.getDataModel(parsedDataModelId);

        // entity id 유효성 검사
        validateEntityId(entityId);
        validateDataModelId(entityId, dataModel.getId());

        // entity type 유효성 검사
        validateEntityType(entity.getId().getType(), dataModel.getType());

        List<Attribute> entityAttributes = entity.getAttrs();

        // entity required attribute 유효성 검사
        validateRequiredAttribute(entityAttributes, dataModel);

        // entity attrNames 유효성 검사
        validateAttributeNames(entity.getAttrNames(), entityAttributes, dataModel.getAttributeNames());

        HashMap<String, Object> dataModelAttributes = dataModel.getAttributes();

        // entity attribute value 유효성 검사
        if(!ValidateUtil.isEmptyData(dataModelAttributes)) {
            for (Attribute attribute : entityAttributes) {
                if (dataModelAttributes.containsKey(attribute.getName())) {
                    LinkedHashMap<String, Object> dataModelAttribute = (LinkedHashMap<String, Object>) dataModelAttributes.get(attribute.getName());
                    String type = (String) dataModelAttribute.get(TYPE.getCode());
                    String valueType = (String) dataModelAttribute.get("valueType");
                    validateAttributeValue(attribute, dataModelAttribute, type, valueType);

                    List<Attribute> entityChildAttributes = attribute.getMd();
                    if (!ValidateUtil.isEmptyData(entityChildAttributes)) {
                        // child attribute value 유효성 검사
                        LinkedHashMap<String, Object> dataModelChildAttributes = (LinkedHashMap<String, Object>) dataModelAttribute.get("childAttributes");
                        validateChildAttributeValue(entityChildAttributes, dataModelChildAttributes, attribute.getName());

                        // child attribute mdNames 유효성 검사
                        validateAttributeNames(attribute.getMdNames(), attribute.getMd(), (Map<String, String>) dataModelAttribute.get("childAttributeNames"));
                    }
                } else {
                    throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid attribute. attribute=" + attribute.getName());
                }
            }
        }
    }

    public String getDataModelId(String entityId) {
        return entityId.substring(0, entityId.lastIndexOf(":") + 1);
    }

    // entity id 유효성 검사
    public void validateEntityId(String entityId) {
        if(entityId == null || entityId.equals(""))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity id value.");
        String parsedDataModelId = getDataModelId(entityId);
        String[] splitParsedDataModelId = parsedDataModelId.split(":");
        if(splitParsedDataModelId.length != 3
                || !splitParsedDataModelId[0].equals("urn"))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Id.");
    }

    // entity datamodel id 유효성 검사
    public void validateDataModelId(String entityId, String dataModelId) {
        String parsedDataModelId = getDataModelId(entityId);
        if(!parsedDataModelId.equals(dataModelId))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Id.");
    }

    // entity type 유효성 검사
    public void validateEntityType(String entityType, String dataModelType) {
        if(entityType == null || entityType.equals(""))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity type value.");
        if(!entityType.equals(dataModelType))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Type.");
    }

    // entity context 유효성 검사
    public void validateEntityContext(String entityContext, String dataModelContext) {
        if(!entityContext.equals(dataModelContext))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Context.");
    }

    // entity required attribute 유효성 검사
    public void validateRequiredAttribute(List<Attribute> entityAttributes, DataModelResponseDto dataModel) {
        List<String> requiredAttributeList = dataModel.getRequired();
        if(!ValidateUtil.isEmptyData(requiredAttributeList)) {
            if(entityAttributes == null || entityAttributes.isEmpty())
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Attributes.");
            for(String requiredAttribute : requiredAttributeList) {
                entityAttributes.stream()
                        .filter(entityAttribute -> entityAttribute.getName().equals(requiredAttribute))
                        .findAny()
                        .orElseThrow(() -> new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity has not Required Attribute. Required attribute : " + requiredAttribute));
            }
        }
    }

    // entity attribute names 유효성 검사
    public void validateAttributeNames(LinkedHashMap<String, String> attributeNames, List<Attribute> attributes, Map<String, String> dataModelAttributeNames) {
        if(!ValidateUtil.isEmptyData(attributeNames)) {
            if(attributes == null || attributes.isEmpty())
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Attributes.");
            for(String attributeName : attributeNames.keySet()) {
                attributes.stream()
                        .filter(attribute -> attribute.getName().equals(attributeName))
                        .findAny()
                        .orElseThrow(() -> new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity has not Attribute which is named in AttributeNames List. Required attribute : " + attributeName));
                String attributeUrl = attributeNames.get(attributeName);
//                if(!attributeUrl.equals(dataModelAttributeNames.get(attributeName)))
//                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Attribute URL. attributeName=" + attributeName + ", attributeUrl=" + attributeUrl);
            }
        }
    }

    // entity attribute type 유효성 검사
    public void validateEntityAttributeType(Attribute entityAttribute, String dataModelAttributeType) {
        if(entityAttribute.getType().equals(dataModelAttributeType))
            return;
        throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Entity Attribute Type. DataModel Attribute Type is " + dataModelAttributeType);
    }

    // entity attribute value 유효성 검사
    public void validateAttributeValue(Attribute entityAttribute, LinkedHashMap<String, Object> dataModelAttribute, String dataModelAttributeType, String dataModelAttributeValueType) {
        // entity attribute type 유효성 검사
        validateEntityAttributeType(entityAttribute, dataModelAttributeType);
        if(dataModelAttributeType.equals(PROPERTY.getCode())) {
            // entity property attribute value 유효성 검사
            validatePropertyValue(entityAttribute, dataModelAttribute, dataModelAttributeValueType);
        } else if(dataModelAttributeType.equals(GEO_PROPERTY.getCode())) {
            // entity geo property attribute value 유효성 검사
            validateGeoPropertyValue(entityAttribute, dataModelAttributeValueType);
        } else if(dataModelAttributeType.equals(RELATIONSHIP.getCode())) {
            // entity relationship attribute value 유효성 검사
            validateRelationshipValue(entityAttribute, dataModelAttribute);
        }
    }

    // entity property attribute value 유효성 검사
    public void validatePropertyValue(Attribute entityAttribute, LinkedHashMap<String, Object> dataModelAttribute, String dataModelAttributeValueType) {
        LinkedHashMap<String, Object> valid = (LinkedHashMap<String, Object>) dataModelAttribute.get("valid");
        List<String> validEnum = (List<String>) dataModelAttribute.get("enum");
        LinkedHashMap<String, Object> format = (LinkedHashMap<String, Object>) dataModelAttribute.get("format");

        Object value = entityAttribute.getValue();
        if(value == null)
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is null.");
        switch(dataModelAttributeValueType) {
            case "String":
                if(value instanceof String) {
                    if(!ValidateUtil.isEmptyData(valid))
                        validateStringValue(String.valueOf(value), valid);

                    if (!ValidateUtil.isEmptyData(validEnum)) {
                        if (!validEnum.contains(String.valueOf(value)))
                            break;
                    }
                    if (!ValidateUtil.isEmptyData(format)) {
                        if(format.equals("DateTime")) {
                            validateDateTimeValue(String.valueOf(value));
                            return;
                        }
                    }
                    return;
                }
                break;
            case "Integer":
                if(value instanceof Integer) {
                    if(!ValidateUtil.isEmptyData(valid))
                        validateIntegerValue((Integer) value, valid);
                    return;
                }
                break;
            case "Double":
                validateDoubleValue(String.valueOf(value), valid);
                return;
            case "Boolean":
                if(value instanceof Boolean)
                    return;
                break;
            case "Object":
//                LinkedHashMap<String, Object> objectMember = (LinkedHashMap<String, Object>) dataModelAttribute.get("objectMember");
//                validateObjectValue((LinkedHashMap<String, Object>) value, objectMember);
                return;
            case "ArrayString":
                if(value instanceof ArrayList &&
                        ((ArrayList<?>) value).stream().allMatch((valueString) -> valueString instanceof String))
                    return;
                break;
            case "ArrayInteger":
                if(value instanceof ArrayList &&
                        ((ArrayList<?>) value).stream().allMatch((valueInteger) -> valueInteger instanceof Integer))
                    return;
                break;
            case "ArrayDouble":
                if(value instanceof ArrayList &&
                        ((ArrayList<?>) value).stream().allMatch((valueDouble) -> valueDouble instanceof Double))
                    return;
                break;
            case "ArrayObject":
//                List<LinkedHashMap<String, Object>> objectMemberList = (List<LinkedHashMap<String, Object>>) dataModelAttribute.get("objectMember");
//                validateArrayObjectValue((List<LinkedHashMap<String, Object>>) value, objectMemberList);
                return;
            default:
                throw new DataBrokerException(ErrorCode.INTERNAL_SERVER_ERROR, "DataModel Property Attribute ValueType is Invalid." +
                        " DataModel valueType: " + dataModelAttributeValueType);
        }
        throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Property Attribute Value is Invalid." +
                " DataModel valueType: " + dataModelAttributeValueType + "," +
                " Invalid value: " + value);
    }

    // entity geo property attribute value 유효성 검사
    public void validateGeoPropertyValue(Attribute entityAttribute, String dataModelAttributeValueType) {
        GeoJsonImpl value = objectMapper.convertValue(entityAttribute.getValue(), GeoJsonImpl.class);
        if(!value.getType().equals((GeoJsonObjectType.valueOf(dataModelAttributeValueType)).getTypeName()))
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity GeoProperty Attribute Value is Invalid");
    }

    // entity relationship attribute value 유효성 검사
    public void validateRelationshipValue(Attribute entityAttribute, LinkedHashMap<String, Object> dataModelAttribute) {
        Object value = entityAttribute.getValue();
        List<String> modelTypeList = (List<String>) dataModelAttribute.get("modelType");
        if (value instanceof String) {
            validateRelationshipDataModelType(String.valueOf(value), modelTypeList);
        } else if (value instanceof ArrayList &&
                ((ArrayList<?>) value).stream().allMatch((valueInteger) -> valueInteger instanceof String)) {
            ((ArrayList<String>) value).stream().forEach((entityId)-> {
                validateRelationshipDataModelType(entityId, modelTypeList);
            });
        } else {
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Relationship Attribute Value is Invalid");
        }
    }

    public void validateRelationshipDataModelType(String entityId, List<String> modelTypeList){
        validateEntityId(entityId);
        if(!ValidateUtil.isEmptyData(modelTypeList)) {
            for (String modelType : modelTypeList) {
                String parsedDataModelId = getDataModelId(entityId);
                String dataModelId = "urn:" + modelType + ":";
                if (parsedDataModelId.equals(dataModelId))
                    return;
            }
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Relationship Attribute Value is Invalid");
        }
    }

    public void validateStringValue(String value, LinkedHashMap<String, Object> valid) {
        if (valid.containsKey("minLength")) {
            if (value.length() < (int) valid.get("minLength"))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        " MinLength : " + valid.get("minLength") + ", Invalid value : " + value);
        }
        if (valid.containsKey("maxLength")) {
            if (value.length() > (int) valid.get("maxLength"))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        " MaxLength : " + valid.get("maxLength") + ", Invalid value : " + value);
        }
    }

    public void validateIntegerValue(Integer value, LinkedHashMap<String, Object> valid) {
        if(valid.containsKey("minimum")) {
            if(value < (int) valid.get("minimum"))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        " Minimum : " + valid.get("minimum") + ", Invalid value : " + value);
        }
        if(valid.containsKey("maximum")) {
            if (value > (int) valid.get("maximum"))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        " Maximum : " + valid.get("maximum") + ", Invalid value : " + value);
        }
    }

    public void validateDoubleValue(String value, LinkedHashMap<String, Object> valid) {
        Double doubleValue;
        try {
            doubleValue = Double.parseDouble(value);
        } catch (Exception e) {
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Double Value Parsing Error. Invalid value : " + value);
        }
        if(valid == null || valid.isEmpty())
            return;
        if(valid.containsKey("minimum")) {
            if(doubleValue < Double.parseDouble(String.valueOf(valid.get("minimum"))))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        " Minimum : " + valid.get("minimum") + ", Invalid value : " + value);
        }
        if(valid.containsKey("maximum")) {
            if (doubleValue > Double.parseDouble(String.valueOf(valid.get("maximum"))))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        " Maximum : " + valid.get("maximum") + ", Invalid value : " + value);
        }
        if(valid.containsKey("format")) {
            String pattern = (String) valid.get("format");
            DecimalFormat doubleFormat = new DecimalFormat(pattern);
            String formattedValue = doubleFormat.format(doubleValue);
            if(!value.equals(formattedValue))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                        "Format : " + valid.get("format") + ", Invalid value : " + value);
        }
    }

    public boolean validateDateTimeValue(String value) {
        try {
            DataBrokerDateFormat.formatStringToDate(DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE, value);
            return true;
        } catch (Exception e) {
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Attribute Value is Invalid." +
                    " Check ISO 8601 Local Date Time Format." +  " Invalid value : " + value);
        }
    }

    public void validateObjectValue(LinkedHashMap<String, Object> objectValue, LinkedHashMap<String, Object> objectMember) {
        for(String objectMemberKey : objectMember.keySet()) {
            if(!objectValue.containsKey(objectMemberKey))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid objectMember. Required objectMember=" + objectMemberKey);
        }

        for(String key : objectValue.keySet()) {
            LinkedHashMap<String, Object> member = (LinkedHashMap<String, Object>) objectMember.get(key);
            if(ValidateUtil.isEmptyData(member))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Object Key in DataModel objectMember. key=" + key);

            String valueType = String.valueOf(member.get("valueType"));
            Object value = objectValue.get(key);
            if(value == null)
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Attribute Object value, " + key + " is null.");
            switch(valueType) {
                case "String":
                    if(value instanceof String) {
                        String format = String.valueOf(member.get("format"));
                        if(!ValidateUtil.isEmptyData(format)) {
                            if(format.equals("DateTime")) {
                                validateDateTimeValue(String.valueOf(value));
                            }
                        }
                        continue;
                    }
                    break;
                case "Integer":
                    if(value instanceof Integer)
                        continue;
                    break;
                case "Double":
                    validateDoubleValue(String.valueOf(value), null);
                    continue;
                case "Boolean":
                    if(value instanceof Boolean)
                        continue;
                    break;
                case "Object":
//                    LinkedHashMap<String, Object> childMember = (LinkedHashMap<String, Object>) member.get("objectMember");
//                    validateObjectValue((LinkedHashMap<String, Object>) value, childMember);
                    return;
                case "ArrayString":
                    if(value instanceof ArrayList &&
                            ((ArrayList<?>) value).stream().allMatch((valueString) -> valueString instanceof String))
                        continue;
                    break;
                case "ArrayInteger":
                    if(value instanceof ArrayList &&
                            ((ArrayList<?>) value).stream().allMatch((valueInteger) -> valueInteger instanceof Integer))
                        continue;
                    break;
                case "ArrayDouble":
                    if(value instanceof ArrayList &&
                            ((ArrayList<?>) value).stream().allMatch((valueDouble) -> valueDouble instanceof Double))
                        continue;
                    break;
                case "ArrayObject":
//                    List<LinkedHashMap<String, Object>> childMemberList = (List<LinkedHashMap<String, Object>>) member.get("objectMember");
//                    validateArrayObjectValue((List<LinkedHashMap<String, Object>>) value, childMemberList);
                    return;
                default:
                    throw new DataBrokerException(ErrorCode.INTERNAL_SERVER_ERROR, "DataModel Property Attribute ObjectMember ValueType is Invalid." +
                            " DataModel ObjectMember valueType: " + valueType);
            }
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Entity Property Attribute Object Value is Invalid." +
                    " DataModel ObjectMember valueType: " + valueType + ", " +
                    " Invalid object value: " + value);
        }
    }

    public void validateArrayObjectValue(List<LinkedHashMap<String, Object>> objectValueList, List<LinkedHashMap<String, Object>> objectMemberList) {
        for(LinkedHashMap<String, Object> objectMember : objectMemberList) {
            for (LinkedHashMap<String, Object> objectValue : objectValueList) {
                // DataModel-objectMember 와 Entity-objectValue 에서 같은 키를 가진 요소들을 찾고 유효성 검사
                boolean isEqualsAllObjectValueKey = true;
                for(String objectValueKey : objectValue.keySet()) {
                    if(!objectMember.containsKey(objectValueKey))
                        isEqualsAllObjectValueKey = false;
                }
                if(isEqualsAllObjectValueKey)
                    validateObjectValue(objectValue, objectMember);
            }
        }
    }

    public void validateChildAttributeValue(List<Attribute> entityChildAttributes, LinkedHashMap<String, Object> dataModelChildAttributes, String parentAttributeName) {
        if(ValidateUtil.isEmptyData(dataModelChildAttributes)){
            log.error("Invalid child attribute. Parent attribute={}", dataModelChildAttributes);
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid child attribute. Parent attribute=" + parentAttributeName);
        }


        List<String> entityChildAttributesNames = entityChildAttributes.stream().map(attribute -> attribute.getName()).collect(Collectors.toList());
        for(String childAttributeName : dataModelChildAttributes.keySet()) {
            if(!entityChildAttributesNames.contains(childAttributeName))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid child attribute. Parent attribute=" + parentAttributeName + ". Required child attribute=" + childAttributeName);
        }

        for(Attribute entityChildAttribute : entityChildAttributes) {
            String entityChildAttributeName = entityChildAttribute.getName();
            if(entityChildAttributeName == null)
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid child attribute. Parent attribute=" + parentAttributeName + ". child attribute name=" + entityChildAttributeName);

            LinkedHashMap<String, Object> dataModelChildAttribute = (LinkedHashMap<String, Object>) dataModelChildAttributes.get(entityChildAttributeName);
            if(ValidateUtil.isEmptyData(dataModelChildAttribute))
                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid child attribute. Parent attribute=" + parentAttributeName + ". child attribute=" + entityChildAttributeName);

            Object value = entityChildAttribute.getValue();
            if (entityChildAttributeName.equals("unitCode")) {
                List<String> enumList = (List<String>) dataModelChildAttribute.get("enum");

                if (!ValidateUtil.isEmptyData(enumList) && enumList.contains(value)) {
                    LinkedHashMap<String, Object> valid = (LinkedHashMap<String, Object>) dataModelChildAttribute.get("valid");
                    if (!ValidateUtil.isEmptyData(valid))
                        validateStringValue(String.valueOf(value), valid);
                } else {
                    throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid unitCode=" + value);
                }
            } else if (entityChildAttributeName.equals("observedAt")) {
                validateDateTimeValue(String.valueOf(value));
            } else {
                String type = (String) dataModelChildAttribute.get(TYPE.getCode());
                String valueType = (String) dataModelChildAttribute.get("valueType");
                validateAttributeValue(entityChildAttribute, dataModelChildAttribute, type, valueType);
            }
        }
    }
}
