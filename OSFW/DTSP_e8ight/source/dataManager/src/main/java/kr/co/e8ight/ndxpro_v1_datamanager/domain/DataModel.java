package kr.co.e8ight.ndxpro_v1_datamanager.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.code.AttributeType;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.attributeType.GeoProperty;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.attributeType.Property;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.attributeType.Relationship;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.DataModelRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.util.DataModelException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ValidateUtil;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@Document(collection = "dataModel")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DataModel {


    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    @Column(
            name = "_id",
            nullable = false,
            columnDefinition = "ObjectId"
    )
    private String _id;

    private String id;

    private String type;

    private String version;
    private String title;

    private String description;

    private Map<String, String> attributeNames;
    private HashMap<String, Object> attributes;

    private List<String> required;

    private List<String> reference;

    private Boolean isDynamic;

    private Boolean isReady;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    public void setAttributeTypes(HashMap<String, Object> attributes)
            throws JsonProcessingException {

        this.attributes = new HashMap<>();

        if (!attributes.isEmpty()) {

            ObjectMapper objectMapper = new ObjectMapper();

            for (Map.Entry<String, Object> entry : attributes.entrySet()) {
                String key = entry.getKey();
                Object entryValue = entry.getValue();

                Map<String, Object> mapData = (Map) attributes.get(key);
                String json = objectMapper.writeValueAsString(mapData);

                String attributeType = (String) ((Map) entryValue).get("type");
//            AttributeType attributeTypes = AttributeType.valueOf(attributeType);

                if (attributeType.equals(AttributeType.PROPERTY.getCode())) {
                    Property propertyInfo = objectMapper.readValue(json, Property.class);
                    validValueCheck(propertyInfo.getValid(), key);
                    attributeNameCheck(propertyInfo.getChildAttributes(),propertyInfo.getChildAttributeNames());
                    this.attributes.put(key, propertyInfo);

                } else if (attributeType.equals(AttributeType.GEO_PROPERTY.getCode())) {
                    GeoProperty geoPropertyInfo = objectMapper.readValue(json, GeoProperty.class);
                    attributeNameCheck(geoPropertyInfo.getChildAttributes(),geoPropertyInfo.getChildAttributeNames());
                    this.attributes.put(key, geoPropertyInfo);

                } else if (attributeType.equals(AttributeType.RELATIONSHIP.getCode())) {
                    Relationship relationshipInfo = objectMapper.readValue(json, Relationship.class);
                    validValueCheck(relationshipInfo.getValid(), key);
                    this.attributes.put(key, relationshipInfo);

                } else {
                    throw new DataModelException(ErrorCode.INVALID_REQUEST,
                            "Mismatch attributeType and valueType. " + "key=" + key
                                    + ", attributeType="
                                    + attributeType);
                }

            }
        }else {
            throw new DataModelException(ErrorCode.INVALID_REQUEST,"Not Attribute");
        }
    }

    public static void attributeNameCheck(Map<String, Object> attributes, Map<String, String> attributeNames) {

        if (!ValidateUtil.isEmptyData(attributes)){
            if (ValidateUtil.isEmptyData(attributeNames)){
                throw new DataModelException(ErrorCode.INVALID_REQUEST,
                        "Attribute Must Have An AttributeName= " + attributes);
            }
            for (Map.Entry<String, Object> entry :attributes.entrySet()) {
                String key = entry.getKey();
                if (!attributeNames.containsKey(key)){
                    throw new DataModelException(ErrorCode.INVALID_REQUEST,
                            "AttributeNames Does Not Contain attribute= " + key);
                }
            }
        }
    }

    public void validValueCheck(ValidInfo valid, String key) {
        if (!ValidateUtil.isEmptyData(valid)) {
            Integer minimum = valid.getMinimum();
            Integer maximum = valid.getMaximum();
            Integer minLength = valid.getMinLength();
            Integer maxLength = valid.getMaxLength();

            //Integer , Double, ArrayInteger, ArrayDouble, ArrayObject
            if (!ValidateUtil.isEmptyData(minimum) && !ValidateUtil.isEmptyData(maximum)) {
                greaterThan(minimum, maximum, key);
            }

            //String, Enum, ArrayString, ArrayBoolean, ArrayObject
            if (!ValidateUtil.isEmptyData(minLength) && !ValidateUtil.isEmptyData(maxLength)) {
                greaterThan(minLength, maxLength, key);
            }
        }

    }

    public void greaterThan(Integer min, Integer max, String key) {
        if (min > max) {
            throw new DataModelException(ErrorCode.INVALID_REQUEST,
                    "Min Cannot Be Greater Than Max= " + key);

        }

    }

    public void update(DataModelRequestDto dataModelRequestDto) {
        this.id = dataModelRequestDto.getId();
        this.type = dataModelRequestDto.getType();
        this.title = dataModelRequestDto.getTitle();
        this.description = dataModelRequestDto.getDescription();
        this.attributeNames = dataModelRequestDto.getAttributeNames();
        this.isDynamic = dataModelRequestDto.getAttributes().toString().contains("observedAt");
        this.required = dataModelRequestDto.getRequired();
        this.reference = dataModelRequestDto.getReference();
    }

//    public void setAttributeType(HashMap<String, Object> attributes) {
//        try {
//            Set set = attributes.keySet();
//            Iterator iterator = set.iterator();
//            ObjectMapper mapper = new ObjectMapper();
//            String attributeType = null;
//
//            while (iterator.hasNext()) {
//                String key = (String) iterator.next();
//                Map<String, Object> mapData = (Map) attributes.get(key);
//                String json = mapper.writeValueAsString(mapData);
//                attributeType = String.valueOf(mapData.get("type"));
//
////                if (!attributeType.equals("Property")
////                        && !attributeType.equals("GeoProperty")
////                        && !attributeType.equals("Relationship")) {
//
//                switch (attributeType) {
//                    case "GeoProperty":
//                        GeoProperty geoPropertyInfo = mapper.readValue(json, GeoProperty.class);
//                        this.attributes.put(key, geoPropertyInfo);
//                        break;
//                    case :
//                        Relationship relationshipInfo = mapper.readValue(json,
//                                Relationship.class);
//                        this.attributes.put(key, relationshipInfo);
//                        break;
//                    case "":
//                        Property propertyInfo = mapper.readValue(json, Property.class);
//                        this.attributes.put(key, propertyInfo);
//                        break;
//                }
//
////                }
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }
}