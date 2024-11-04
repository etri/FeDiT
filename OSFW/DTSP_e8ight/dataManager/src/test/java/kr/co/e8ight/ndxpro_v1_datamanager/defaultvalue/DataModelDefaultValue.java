package kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.DataModelRequestDto;

public class DataModelDefaultValue {
    public static final HashMap<String, String> attributeNames = new HashMap<>();
    static {
        attributeNames.put("vehicleType","e8ight:vehicleType");
        attributeNames.put("location","e8ight:location");
    }

    public static final HashMap<String, Object> attributeValid = new HashMap<>();
    static {
        attributeValid.put("minLength",1);
        attributeValid.put("maxLength",256);
    }
    public static final HashMap<String, Object> vehicleTypeAttributeValue = new HashMap<>();
    static {
        vehicleTypeAttributeValue.put("type","Property");
        vehicleTypeAttributeValue.put("description","차량 종류");
        vehicleTypeAttributeValue.put("valueType","Enum");
        vehicleTypeAttributeValue.put("valid",attributeValid);
        vehicleTypeAttributeValue.put("enum",List.of("bus","truck","bike"));
    }
    // -------------------
    public static final HashMap<String, Object> childAttributeValue = new HashMap<>();
    static {
        childAttributeValue.put("valueType","DateTime");
    }
    public static final Map<String, Object> childAttribute = new HashMap<>();
    static {
        childAttribute.put("observedAt",childAttributeValue);
    }
    public static final Map<String, String> childAttributeNames = new HashMap<>();
    static {
        childAttributeNames.put("observedAt","ngsi-ld:observedAt");
    }

    public static final HashMap<String, Object> locationAttributeValue = new HashMap<>();
    static {
        locationAttributeValue.put("type","GeoProperty");
        locationAttributeValue.put("description","차량 위치");
        locationAttributeValue.put("valueType","POINT");
        locationAttributeValue.put("childAttributeNames",childAttributeNames);
        locationAttributeValue.put("childAttributes",childAttribute);
    }

    // -------------------
    public static final HashMap<String, Object> attributes = new HashMap<>();
    static {
        attributes.put("vehicleType",vehicleTypeAttributeValue);
        attributes.put("location",locationAttributeValue);
    }

    public static final DataModelRequestDto dataModelRequestDto = new DataModelRequestDto();
    static {
        dataModelRequestDto.setId("urn:e8ight:Vehicle:");
        dataModelRequestDto.setType("Vehicle");
        dataModelRequestDto.setTitle("NDX-PRO - Vehicle DataModel");
        dataModelRequestDto.setDescription("Information on a given Vehicle");
        dataModelRequestDto.setAttributeNames(attributeNames);
        dataModelRequestDto.setAttributes(attributes);
        dataModelRequestDto.setRequired(List.of("vehicleType", "location"));
        dataModelRequestDto.setReference(List.of("test"));
        dataModelRequestDto.setIsDynamic(false);
        dataModelRequestDto.setIsReady(false);
    }

    public static DataModelRequestDto initialDataModelRequestDto() {
        dataModelRequestDto.setId("urn:e8ight:Vehicle:");
        dataModelRequestDto.setType("Vehicle");
        dataModelRequestDto.setTitle("NDX-PRO - Vehicle DataModel");
        dataModelRequestDto.setDescription("Information on a given Vehicle");
        dataModelRequestDto.setAttributeNames(attributeNames);
        dataModelRequestDto.setAttributes(attributes);
        dataModelRequestDto.setRequired(List.of("vehicleType", "location"));
        dataModelRequestDto.setReference(List.of("test"));
        dataModelRequestDto.setIsDynamic(false);
        dataModelRequestDto.setIsReady(false);
        return dataModelRequestDto;
    }

    public static final DataModel dataModel = new DataModel();
    static {

        dataModel.setId(dataModelRequestDto.getId());
        dataModel.setType(dataModelRequestDto.getType());
        dataModel.setTitle(dataModelRequestDto.getTitle());
        dataModel.setDescription(dataModelRequestDto.getDescription());
        dataModel.setAttributeNames(dataModelRequestDto.getAttributeNames());

        dataModel.setAttributes(dataModelRequestDto.getAttributes());
//        try {
//            dataModel.setAttributeTypes(dataModel.getAttributes());
//        } catch (JsonProcessingException e) {
//            throw new RuntimeException(e);
//        }
        dataModel.setRequired(dataModelRequestDto.getRequired());
        dataModel.setReference(dataModelRequestDto.getReference());
        dataModel.setIsDynamic(dataModelRequestDto.getIsDynamic());
        dataModel.setIsReady(dataModelRequestDto.getIsReady());
    }

    public static DataModel initialDataModel(){
        dataModel.setId(dataModelRequestDto.getId());
        dataModel.setType(dataModelRequestDto.getType());
        dataModel.setTitle(dataModelRequestDto.getTitle());
        dataModel.setDescription(dataModelRequestDto.getDescription());
        dataModel.setAttributeNames(dataModelRequestDto.getAttributeNames());

        dataModel.setAttributes(dataModelRequestDto.getAttributes());
//        try {
//            dataModel.setAttributeTypes(dataModel.getAttributes());
//        } catch (JsonProcessingException e) {
//            throw new RuntimeException(e);
//        }
        dataModel.setRequired(dataModelRequestDto.getRequired());
        dataModel.setReference(dataModelRequestDto.getReference());
        dataModel.setIsDynamic(dataModelRequestDto.getIsDynamic());
        dataModel.setIsReady(dataModelRequestDto.getIsReady());
        return dataModel;
    }
}
