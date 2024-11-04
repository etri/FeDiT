package kr.co.e8ight.ndxpro_v1_datamanager.service;


import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeSchemaRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeSchemaResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeSchemaRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.AttributeException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ResponseMessage;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ValidateUtil;
import org.springframework.stereotype.Service;

@Service
public class AttributeSchemaService {

    private final AttributeSchemaRepository attributeSchemaRepository;
    private final AttributeRepository attributeRepository;

    public AttributeSchemaService(AttributeSchemaRepository attributeSchemaRepository,
            AttributeRepository attributeRepository) {
        this.attributeSchemaRepository = attributeSchemaRepository;
        this.attributeRepository = attributeRepository;
    }

    public String createAttributeSchema(AttributeSchemaRequestDto request) {

        String id = request.getId();
        List<String> attributes = request.getAttributes();

        validateAttributeSchemaId(id);
        checkIfAttributeSchemaExists(id);

        AttributeSchema schema = new AttributeSchema();
        Map<String, String> values = new HashMap<>();

        if (!ValidateUtil.isEmptyData(attributes)) {
            for (String attributeId : attributes) {
                Attribute attribute = getAttributeById(attributeId);
                String type = attribute.getType();
                values.put(attributeId, type + ":" + attributeId);
            }
        }

        schema.setId(id);
        schema.setValue(values);
        schema.setIsReadOnly(request.getIsReadOnly() != null && request.getIsReadOnly());

        attributeSchemaRepository.save(schema);
        return ResponseMessage.ATTRIBUTE_SCHEMA_CREATE_SUCCESS;
    }


    private void checkIfAttributeSchemaExists(String id) {
        attributeSchemaRepository.findByid(id).ifPresent(m -> {
            throw new AttributeException(ErrorCode.ALREADY_EXISTS,
                    "AttributeSchema already exists. Id: " + id);
        });
    }

    private Attribute getAttributeById(String id) {
        return attributeRepository.findByid(id)
                .orElseThrow(() -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Attribute not found. Id: " + id));
    }

    public List<String> readAllAttributeSchemaId() {
        List<String> allAttributeSchemaIds = attributeSchemaRepository.findAllAttributeSchemaId();

        if (allAttributeSchemaIds.isEmpty()) {
            throw new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                    "No AttributeSchemaIds found.");
        }
        return allAttributeSchemaIds;
    }

    public AttributeSchemaResponseDto readAttributeSchema(String attributeSchemaId) {
        AttributeSchema schema = getAttributeSchemaById(attributeSchemaId);

        Map<String, String> sortedValues = new TreeMap<>(schema.getValue());

        AttributeSchemaResponseDto responseDto = new AttributeSchemaResponseDto();
        responseDto.setId(schema.getId());
        responseDto.setValue(sortedValues);
        responseDto.setIsReadOnly(schema.getIsReadOnly());

        return responseDto;
    }

    private AttributeSchema getAttributeSchemaById(String attributeSchemaId) {
        return attributeSchemaRepository.findByid(attributeSchemaId)
                .orElseThrow(() -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                        "AttributeSchema not found. Id: " + attributeSchemaId));
    }

    public String updateAttributeSchema(AttributeSchemaRequestDto attributeSchemaRequestDto) {
        String attributeSchemaId = attributeSchemaRequestDto.getId();
        AttributeSchema schema = getAttributeSchemaById(attributeSchemaId);

        if (schema.getIsReadOnly()) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST,
                    attributeSchemaId + " Is ReadOnly");
        }

        List<String> attributeId = attributeSchemaRequestDto.getAttributes();

        Map<String, String> attributeSchemaDefaultValue = new HashMap<>();

        if (schema.getValue() == null) {
            schema.setValue(attributeSchemaDefaultValue);
        }

        Map<String, String> schemaValue = schema.getValue();
        schemaValue.clear();

        if (!ValidateUtil.isEmptyData(attributeId)) {

            for (String attr : attributeId) {
                Attribute attribute = attributeRepository.findByid(attr).orElseThrow(
                        () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. Attribute= " + attr));
                String id = attribute.getId();
                String type = attribute.getType();

                String value = type + ":" + attr;
                schemaValue.put(id, value);
            }
        }

        attributeSchemaRepository.save(schema);

        return ResponseMessage.ATTRIBUTE_SCHEMA_UPDATE_SUCCESS;
    }

    public String deleteAttributeSchema(String attributeSchemaId) {

        AttributeSchema attributeSchema = getAttributeSchemaById(attributeSchemaId);

        if (attributeSchema.getIsReadOnly()) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST,
                    attributeSchemaId + " Is ReadOnly");
        }

        Map<String, String> schemaValue = attributeSchema.getValue();

        if (!schemaValue.isEmpty()) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST,
                    "AttributeSchema Does Not Empty= " + attributeSchemaId);
        }

        attributeSchemaRepository.deleteByid(attributeSchemaId);

        return ResponseMessage.ATTRIBUTE_SCHEMA_DELETE_SUCCESS;
    }

//    public String registerAttribute(String attributeSchemaId, List<String> attributeId) {
//
//        AttributeSchema attributeSchema = attributeSchemaRepository.findByid(attributeSchemaId)
//                .orElseThrow(
//                        () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
//                                "Not Exists. AttributeSchemaId= " + attributeSchemaId));
//
//
//        if (!ValidateUtil.isEmptyData(attributeId)){
//            for (String attr : attributeId) {
//                Attribute attribute = attributeRepository.findByid(attr).orElseThrow(
//                        () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
//                                "Not Exists. Attribute= " + attr));
//                String id = attribute.getId();
//                String type = attribute.getType();
//
//                Map<String, String> attributeSchemaDefaultValue = new HashMap<>();
//                if (attributeSchema.getValue() == null) {
//                    attributeSchema.setValue(attributeSchemaDefaultValue);
//                }
//                Map<String, String> schemaValue = attributeSchema.getValue();
//
//                String value = type + ":" + attributeId;
//                schemaValue.put(id, value);
//            }
//        }
//
//        attributeSchemaRepository.save(attributeSchema);
//
//        return ResponseMessage.ATTRIBUTE_REGISTER_SUCCESS;
//    }

//    public String cancellationRegisterAttribute(String attributeSchemaId, List<String> attributeId) {
//
//        AttributeSchema attributeSchema = attributeSchemaRepository.findByid(attributeSchemaId)
//                .orElseThrow(
//                        () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
//                                "Not Exists. AttributeSchemaId= " + attributeSchemaId));
//
//        Object attributeSchemaValue = attributeSchema.getValue();
//        Map<String, Object> contextInnerMap = (Map<String, Object>) attributeSchemaValue;
//
//        if (!contextInnerMap.containsKey(attributeId)) {
//            throw new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
//                    "AttributeSchema Does Not Include= " + attributeId);
//        }
//
//        if (attributeSchemaId.equals("location-schema.json") || attributeSchemaId.equals(
//                "common-schema.json")) {
//            throw new AttributeException(ErrorCode.INVALID_REQUEST,
//                    attributeSchemaId + " IS readOnly");
//        }
//
//        contextInnerMap.remove(attributeId);
//
//        attributeSchemaRepository.save(attributeSchema);
//        return ResponseMessage.ATTRIBUTE_REGISTER_CANCELLATION_SUCCESS;
//    }


    public void validateAttributeSchemaId(String attributeSchema) {
        if (ValidateUtil.isEmptyData(attributeSchema)) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST, "AttributeSchema Id is Empty");
        }
        if (!attributeSchema.contains(".json")) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST,
                    "Invalid Format Url / { }.json= " + attributeSchema);

        }
    }

}
