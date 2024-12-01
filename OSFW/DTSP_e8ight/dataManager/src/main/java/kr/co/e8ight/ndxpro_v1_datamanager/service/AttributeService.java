package kr.co.e8ight.ndxpro_v1_datamanager.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.geojson.GeoJsonObjectType;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.code.AttributeValueType;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.AttributeSchemaRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.AttributeException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.PagingResult;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ResponseMessage;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ValidateUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AttributeService {

    private static final int DEFAULT_PAGE_SIZE = 25;
    private final ObjectMapper objectMapper;
    private final AttributeRepository attributeRepository;
    private final DataModelRepository dataModelRepository;
    private final AttributeSchemaRepository attributeSchemaRepository;
    private final FileService fileService;

    public AttributeService(ObjectMapper objectMapper, AttributeRepository attributeRepository,
            DataModelRepository dataModelRepository,
            AttributeSchemaRepository attributeSchemaRepository, FileService fileService) {
        this.objectMapper = objectMapper;
        this.attributeRepository = attributeRepository;
        this.dataModelRepository = dataModelRepository;
        this.attributeSchemaRepository = attributeSchemaRepository;
        this.fileService = fileService;
    }

    public String createAttribute(AttributeRequestDto attributeRequestDto)
            throws JsonProcessingException {


        Attribute attribute = new Attribute();
        attribute.setId(attributeRequestDto.getId());
        attribute.setTitle(attributeRequestDto.getTitle());
        attribute.setDescription(attributeRequestDto.getDescription());
//        attribute.setAttributeType(attributeRequestDto.getAttributeType());
        attribute.setValueType(attributeRequestDto.getValueType());
        attribute.setType(attributeRequestDto.getType());
        attribute.setFormat(attributeRequestDto.getFormat());

        validateParameter(attribute);

        attributeRepository.findByid(attribute.getId()).ifPresent(m -> {
            throw new AttributeException(ErrorCode.ALREADY_EXISTS,
                    "Already Exists. Attribute= " + attribute.getId());
        });

        checkAttributeValueType(attribute);

        attributeRepository.save(attribute);

        return ResponseMessage.ATTRIBUTE_CREATE_SUCCESS;
    }

    public PagingResult<List<String>> readAllAttributeId(Integer curPage, Integer size,
            String word) {

        int pageSize = size != null ? size : DEFAULT_PAGE_SIZE;
        Pageable pageable = PageRequest.of(curPage, pageSize);

        Page<Attribute> attributes;
        if (!ValidateUtil.isEmptyData(word)) {
            attributes = attributeRepository.findByIdContainingIgnoreCaseOrderByIdAsc(word, pageable);
        } else {
            attributes = attributeRepository.findAllByOrderByIdAsc(pageable);
        }

//
//        List<AttributeResponseDto> attributeResponseDtos = new ArrayList<>();
//        for (int i = 0; i < attributes.getContent().size(); i++) {
//            Attribute attribute = attributes.getContent().get(i);
//            AttributeResponseDto attributeResponseDto = new AttributeResponseDto();
//            attributeResponseDto.setId(attribute.getId());
//            attributeResponseDto.setType(attribute.getType());
//            attributeResponseDtos.add(attributeResponseDto);
//        }
        List<AttributeResponseDto> attributeResponseDtos = attributes.getContent().stream()
                .map(attribute -> {
                    AttributeResponseDto attributeResponseDto = new AttributeResponseDto();
                    attributeResponseDto.setId(attribute.getId());
                    attributeResponseDto.setType(attribute.getType());
                    return attributeResponseDto;
                })
                .collect(Collectors.toList());


        return new PagingResult<>(attributeResponseDtos, attributes.getTotalElements(),attributes.getTotalPages());
    }


    public AttributeResponseDto readSpecificAttribute(String id) {

        Attribute attribute = attributeRepository.findByid(id).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Attribute= " + id));

        AttributeResponseDto attributeResponseDto = new AttributeResponseDto();
        attributeResponseDto.setId(attribute.getId());
        attributeResponseDto.setTitle(attribute.getTitle());
        attributeResponseDto.setDescription(attribute.getDescription());
        attributeResponseDto.setValueType(attribute.getValueType());
        attributeResponseDto.setType(attribute.getType());
        attributeResponseDto.setAttributeType(attribute.getAttributeType());
        attributeResponseDto.setFormat(attribute.getFormat());
        attributeResponseDto.setCreatedAt(attribute.getCreatedAt());
        attributeResponseDto.setModifiedAt(attribute.getModifiedAt());

        return attributeResponseDto;
    }

    public List<String> readUsingModel(String attributeId) {
        List<DataModel> allCategory = dataModelRepository.findAllDataModel();

        List<String> dataModels = new ArrayList<>();
        for (DataModel a : allCategory) {
            String type = a.getType();
            HashMap<String, Object> attributes = a.getAttributes();
            Map<String, String> attributeNames = a.getAttributeNames();

            if (attributeNames.containsKey(attributeId)) {
                dataModels.add(type);
            }
            for (Map.Entry<String, Object> entry : attributes.entrySet()) {

                Object entryValue = entry.getValue();
                Object childAttribute = ((Map) entryValue).get("childAttributeNames");
                Map<String, Object> childAttributeNames = (Map<String, Object>) childAttribute;

                if (childAttribute != null && childAttributeNames.containsKey(attributeId)) {
                    dataModels.add(type);
                }
            }
        }
        List<String> collect = dataModels.stream().distinct().collect(Collectors.toList());

        return collect;
    }
    public String updateAttribute(AttributeRequestDto attributeRequestDto) {

        String attributeId = attributeRequestDto.getId();
        Attribute existingAttributeValue = attributeRepository.findByid(attributeId).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Attribute= " + attributeRequestDto.getId()));

        checkInDataModel(attributeId);

        existingAttributeValue.update(attributeRequestDto);

        validateParameter(existingAttributeValue);

        checkAttributeValueType(existingAttributeValue);

        attributeRepository.save(existingAttributeValue);

        return ResponseMessage.ATTRIBUTE_UPDATE_SUCCESS;

    }

    public String deleteAttribute(String attributeId) {

        attributeRepository.findByid(attributeId).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Attribute= " + attributeId));

        checkInDataModel(attributeId);

        List<AttributeSchema> all = attributeSchemaRepository.findAll();

        for (AttributeSchema attributeSchema:all) {
            String id = attributeSchema.getId();
            Map<String, String> schemaValue = attributeSchema.getValue();

            if (!ValidateUtil.isEmptyData(schemaValue) && schemaValue.containsKey(attributeId)){
                throw new AttributeException(ErrorCode.OPERATION_NOT_SUPPORTED,
                        "Attribute Is Use In AttributeSchema= " + id);
            }
        }

        attributeRepository.deleteByid(attributeId);

        return ResponseMessage.ATTRIBUTE_DELETE_SUCCESS;
    }

    public void checkInDataModel(String attributeId){

        List<DataModel> allCategory = dataModelRepository.findAllDataModel();

        for (DataModel a : allCategory) {
            String type = a.getType();
            HashMap<String, Object> attributes = a.getAttributes();
            Map<String, String> attributeNames = a.getAttributeNames();

            if (attributeNames.containsKey(attributeId)) {
                throw new AttributeException(ErrorCode.OPERATION_NOT_SUPPORTED,
                        "Attribute Is Use In Data Model= " + type);
            }
            for (Map.Entry<String, Object> entry : attributes.entrySet()) {

                Object entryValue = entry.getValue();
                Object childAttribute = ((Map) entryValue).get("childAttributeNames");
                Map<String, Object> childAttributeNames = (Map<String, Object>) childAttribute;

                if (childAttribute != null && childAttributeNames.containsKey(attributeId)) {
                    throw new AttributeException(ErrorCode.OPERATION_NOT_SUPPORTED,
                            "Attribute Is Use In Data Model= " + type);
                }
            }
        }
    }

    public void validateParameter(Attribute attribute) {
        String id = attribute.getId();
        String valueType = attribute.getValueType();
        String type = attribute.getType();
        String attributeType = attribute.getAttributeType();
        if (ValidateUtil.isEmptyData(id)) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST, "Attribute Id is Empty");
        }
        if (ValidateUtil.isEmptyData(valueType)) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST, "Attribute ValueType is Empty");
        }
        if (ValidateUtil.isEmptyData(type)) {
            throw new AttributeException(ErrorCode.INVALID_REQUEST, "Attribute Type is Empty");
        }
//        if (ValidateUtil.isEmptyData(attributeType)) {
//            throw new AttributeException(ErrorCode.INVALID_REQUEST, "Attribute attributeType is Empty");
//        }
//        if (type!="e8ight"){
//
//        }
    }

    public void checkAttributeValueType(Attribute attribute) {

        String valueType = attribute.getValueType();

        if (!valueType.equals(AttributeValueType.STRING.getCode())
                && !valueType.equals(AttributeValueType.ENUM.getCode())
                && !valueType.equals(AttributeValueType.INTEGER.getCode())
                && !valueType.equals(AttributeValueType.DOUBLE.getCode())
                && !valueType.equals(AttributeValueType.BOOLEAN.getCode())
                && !valueType.equals(AttributeValueType.DATE.getCode())
                && !valueType.equals(AttributeValueType.OBJECT.getCode())
                && !valueType.equals(AttributeValueType.ARRAY_STRING.getCode())
                && !valueType.equals(AttributeValueType.ARRAY_INTEGER.getCode())
                && !valueType.equals(AttributeValueType.ARRAY_DOUBLE.getCode())
                && !valueType.equals(AttributeValueType.ARRAY_BOOLEAN.getCode())
                && !valueType.equals(AttributeValueType.ARRAY_OBJECT.getCode())

                && !valueType.equals(GeoJsonObjectType.GEOMETRY_COLLECTION.toString())
                && !valueType.equals(GeoJsonObjectType.LINE_STRING.toString())
                && !valueType.equals(GeoJsonObjectType.MULTI_LINE_STRING.toString())
                && !valueType.equals(GeoJsonObjectType.MULTI_POINT.toString())
                && !valueType.equals(GeoJsonObjectType.MULTI_POLYGON.toString())
                && !valueType.equals(GeoJsonObjectType.POINT.toString())
                && !valueType.equals(GeoJsonObjectType.POLYGON.toString())
        ) {

            throw new AttributeException(ErrorCode.INVALID_REQUEST,
                    "This ValueType Is Not Allow= " + valueType);
        }

//        if (valueType.equals(AttributeValueType.BOOLEAN.getCode())
//                || valueType.equals(AttributeValueType.DATE.getCode())
//                || valueType.equals(AttributeValueType.OBJECT.getCode())) {
//            if (!ValidateUtil.isEmptyData(valid) || !ValidateUtil.isEmptyData(
//                    attribute.getEnumList())) {
//
//                throw new AttributeException(ErrorCode.INVALID_REQUEST,
//                        "ValueType " + valueType + " Is Not Include ENUM Or VALID");
//            }
//        }
//        if (!ValidateUtil.isEmptyData(valid)) {
//            if (valueType.equals(AttributeValueType.INTEGER.getCode())
//                    || valueType.equals(AttributeValueType.DOUBLE.getCode())
//                    || valueType.equals(AttributeValueType.ARRAY_INTEGER.getCode())
//                    || valueType.equals(AttributeValueType.ARRAY_DOUBLE.getCode())) {
//                if (valid.containsKey(ValidType.MINLENGTH.getCode()) ||
//                        valid.containsKey(ValidType.MAXLENGTH.getCode())) {
//                    throw new AttributeException(ErrorCode.INVALID_REQUEST,
//                            valueType + " Not available " + valid);
//                }
//            }
//
//            if (valueType.equals(AttributeValueType.STRING.getCode())
//                    || valueType.equals(AttributeValueType.ENUM.getCode())
//                    || valueType.equals(AttributeValueType.ARRAY_STRING.getCode())
//                    || valueType
//                    .equals(AttributeValueType.ARRAY_BOOLEAN.getCode())) {
//                if (valid.containsKey(ValidType.MINIMUM.getCode()) ||
//                        valid.containsKey(ValidType.MAXIMUM.getCode())) {
//                    throw new AttributeException(ErrorCode.INVALID_REQUEST,
//                            valueType + " Not available " + valid);
//                }
//
//            }
//            validValueCheck(valid);
//        }

    }


//
//    public void validValueCheck(HashMap<String, Object> valid) {
//
//        //Integer , Double, ArrayInteger, ArrayDouble, ArrayObject
//        if (valid.containsKey(ValidType.MINIMUM.getCode()) && valid.containsKey(
//                ValidType.MAXIMUM.getCode())) {
//            Integer minimum = (Integer) valid.get(ValidType.MINIMUM.getCode());
//            Integer maximum = (Integer) valid.get(ValidType.MAXIMUM.getCode());
//            greaterThan(minimum, maximum);
//        }
//
//        //String, Enum, ArrayString, ArrayBoolean, ArrayObject
//        if (valid.containsKey(ValidType.MINLENGTH.getCode()) && valid.containsKey(
//                ValidType.MAXLENGTH.getCode())) {
//            Integer minLength = (Integer) valid.get(ValidType.MINLENGTH.getCode());
//            Integer maxLength = (Integer) valid.get(ValidType.MAXLENGTH.getCode());
//            greaterThan(minLength, maxLength);
//        }
//    }
//
//
//    public void greaterThan(Integer min, Integer max) {
//        if (min > max) {
//            throw new AttributeException(ErrorCode.INVALID_REQUEST,
//                    "Min Cannot Be Greater Than Max");
//
//        }
//
//    }

    //    public AttributeResponseDto readAttribute(String id) {
//
//        List<Attribute> allAttributeByid = attributeRepository.findAllByid(id).orElseThrow(
//                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND,
//                        "Not Exists. Attribute= " + id));
//
//        HashMap<String, Object> definition = new HashMap<>();
//
//        String title = null;
//        String context = null;
//
//        for (Attribute attribute : allAttributeByid) {
//            AttributeResponseDto attributeDefinitions = new AttributeResponseDto();
//            title = attribute.getTitle();
//
//            String description = attribute.getDescription();
//            String valueType = attribute.getValueType();
//            String format = attribute.getFormat();
//
//            attributeDefinitions.setDescription(description);
//            attributeDefinitions.setValueType(valueType);
//            attributeDefinitions.setFormat(format);
//
//        }
//
//        AttributeResponseDto attributeResponseDto = new AttributeResponseDto();
//        attributeResponseDto.setId(schemaId);
//        attributeResponseDto.setTitle(title);
//
//        return attributeResponseDto;
//    }



}


