package kr.co.e8ight.ndxpro_v1_datamanager.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Collectors;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Context;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.ContextRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ContextFileDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ContextResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.ContextRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ContextException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.DataModelException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ResponseMessage;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ValidateUtil;
import org.json.simple.parser.ParseException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Service
public class ContextService {

    private final ContextRepository contextRepository;

    private final DataModelRepository dataModelRepository;
    private final ObjectMapper objectMapper;
    private final FileService fileService;


    public ContextService(ContextRepository contextRepository,
            DataModelRepository dataModelRepository, ObjectMapper objectMapper,
            FileService fileService) {
        this.contextRepository = contextRepository;
        this.dataModelRepository = dataModelRepository;
        this.objectMapper = objectMapper;
        this.fileService = fileService;
    }


    public Object createContext(ContextRequestDto contextRequestDto)
            throws IOException, ParseException {

        Context context = new Context();
        context.setUrl(contextRequestDto.getUrl());
        context.setDefaultUrl(contextRequestDto.getDefaultUrl());
        context.setVersion(contextRequestDto.getVersion());
        context.setValue(contextRequestDto.getValue());

        String url = context.getUrl();

        contextRepository.findByUrl(url).ifPresent(m -> {
            throw new ContextException(ErrorCode.ALREADY_EXISTS,
                    "Already Exists. @context= " + url);
        });
        validationContextUrl(url);

        verificationContext(context.getValue());

        context.setIsReady(false);

        // File 로 저장할 context 생성
        ContextFileDto contextFileDto = new ContextFileDto();
        contextFileDto.setContext(context.getValue());
        String writeValueAsStringContext = objectMapper.writeValueAsString(contextFileDto);
        validationContext(writeValueAsStringContext);
        fileService.uploadJsonFile(context.getUrl(), writeValueAsStringContext);

        contextRepository.save(context);

        return context.getValue();
    }


    public ContextResponseDto importContext(String contextUrl) throws JsonProcessingException {

        validationContextUrl(contextUrl);

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<String> forEntity = null;
        String contextBody = "";
        try {
            forEntity = restTemplate.getForEntity(contextUrl, String.class);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND ) {
                throw new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Found Context In= " + contextUrl);
            }
        }
        catch (ResourceAccessException e) {
            if (e.getCause() instanceof java.net.UnknownHostException) {
                contextBody = "{\n"
                        + "  \"@context\": {\n"
                        + "    \"ngsi-ld\": \"https://uri.etsi.org/ngsi-ld/\",\n"
                        + "    \"id\": \"@id\",\n"
                        + "    \"type\": \"@type\",\n"
                        + "    \"value\": \"https://uri.etsi.org/ngsi-ld/hasValue\",\n"
                        + "    \"object\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/hasObject\",\n"
                        + "      \"@type\": \"@id\"\n"
                        + "    },\n"
                        + "    \"Property\": \"https://uri.etsi.org/ngsi-ld/Property\",\n"
                        + "    \"Relationship\": \"https://uri.etsi.org/ngsi-ld/Relationship\",\n"
                        + "    \"DateTime\": \"https://uri.etsi.org/ngsi-ld/DateTime\",\n"
                        + "    \"Date\": \"https://uri.etsi.org/ngsi-ld/Date\",\n"
                        + "    \"Time\": \"https://uri.etsi.org/ngsi-ld/Time\",\n"
                        + "    \"createdAt\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/createdAt\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"modifiedAt\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/modifiedAt\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"observedAt\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/observedAt\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"datasetId\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/datasetId\",\n"
                        + "      \"@type\": \"@id\"\n"
                        + "    },\n"
                        + "    \"instanceId\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/instanceId\",\n"
                        + "      \"@type\": \"@id\"\n"
                        + "    },\n"
                        + "    \"unitCode\": \"https://uri.etsi.org/ngsi-ld/unitCode\",\n"
                        + "    \"location\": \"https://uri.etsi.org/ngsi-ld/location\",\n"
                        + "    \"observationSpace\": \"https://uri.etsi.org/ngsi-ld/observationSpace\",\n"
                        + "    \"operationSpace\": \"https://uri.etsi.org/ngsi-ld/operationSpace\",\n"
                        + "    \"GeoProperty\": \"https://uri.etsi.org/ngsi-ld/GeoProperty\",\n"
                        + "    \"TemporalProperty\": \"https://uri.etsi.org/ngsi-ld/TemporalProperty\",\n"
                        + "    \"ContextSourceRegistration\": \"https://uri.etsi.org/ngsi-ld/ContextSourceRegistration\",\n"
                        + "    \"Subscription\": \"https://uri.etsi.org/ngsi-ld/Subscription\",\n"
                        + "    \"Notification\": \"https://uri.etsi.org/ngsi-ld/Notification\",\n"
                        + "    \"ContextSourceNotification\": \"https://uri.etsi.org/ngsi-ld/ContextSourceNotification\",\n"
                        + "    \"title\": \"https://uri.etsi.org/ngsi-ld/title\",\n"
                        + "    \"detail\": \"https://uri.etsi.org/ngsi-ld/detail\",\n"
                        + "    \"idPattern\": \"https://uri.etsi.org/ngsi-ld/idPattern\",\n"
                        + "    \"name\": \"https://uri.etsi.org/ngsi-ld/name\",\n"
                        + "    \"description\": \"https://uri.etsi.org/ngsi-ld/description\",\n"
                        + "    \"information\": \"https://uri.etsi.org/ngsi-ld/information\",\n"
                        + "    \"observationInterval\": \"https://uri.etsi.org/ngsi-ld/observationInterval\",\n"
                        + "    \"managementInterval\": \"https://uri.etsi.org/ngsi-ld/managementInterval\",\n"
                        + "    \"expires\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/expires\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"endpoint\": \"https://uri.etsi.org/ngsi-ld/endpoint\",\n"
                        + "    \"entities\": \"https://uri.etsi.org/ngsi-ld/entities\",\n"
                        + "    \"properties\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/properties\",\n"
                        + "      \"@type\": \"@vocab\"\n"
                        + "    },\n"
                        + "    \"relationships\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/relationships\",\n"
                        + "      \"@type\": \"@vocab\"\n"
                        + "    },\n"
                        + "    \"start\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/start\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"end\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/end\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"watchedAttributes\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/watchedAttributes\",\n"
                        + "      \"@type\": \"@vocab\"\n"
                        + "    },\n"
                        + "    \"timeInterval\": \"https://uri.etsi.org/ngsi-ld/timeInterval\",\n"
                        + "    \"q\": \"https://uri.etsi.org/ngsi-ld/q\",\n"
                        + "    \"geoQ\": \"https://uri.etsi.org/ngsi-ld/geoQ\",\n"
                        + "    \"csf\": \"https://uri.etsi.org/ngsi-ld/csf\",\n"
                        + "    \"isActive\": \"https://uri.etsi.org/ngsi-ld/isActive\",\n"
                        + "    \"notification\": \"https://uri.etsi.org/ngsi-ld/notification\",\n"
                        + "    \"status\": \"https://uri.etsi.org/ngsi-ld/status\",\n"
                        + "    \"throttling\": \"https://uri.etsi.org/ngsi-ld/throttling\",\n"
                        + "    \"temporalQ\": \"https://uri.etsi.org/ngsi-ld/temporalQ\",\n"
                        + "    \"geometry\": \"https://uri.etsi.org/ngsi-ld/geometry\",\n"
                        + "    \"coordinates\": \"https://uri.etsi.org/ngsi-ld/coordinates\",\n"
                        + "    \"georel\": \"https://uri.etsi.org/ngsi-ld/georel\",\n"
                        + "    \"geoproperty\": \"https://uri.etsi.org/ngsi-ld/geoproperty\",\n"
                        + "    \"attributes\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/attributes\",\n"
                        + "      \"@type\": \"@vocab\"\n"
                        + "    },\n"
                        + "    \"format\": \"https://uri.etsi.org/ngsi-ld/format\",\n"
                        + "    \"timesSent\": \"https://uri.etsi.org/ngsi-ld/timesSent\",\n"
                        + "    \"lastNotification\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/lastNotification\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"lastFailure\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/lastFailure\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"lastSuccess\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/lastSuccess\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"uri\": \"https://uri.etsi.org/ngsi-ld/uri\",\n"
                        + "    \"accept\": \"https://uri.etsi.org/ngsi-ld/accept\",\n"
                        + "    \"success\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/success\",\n"
                        + "      \"@type\": \"@id\"\n"
                        + "    },\n"
                        + "    \"errors\": \"https://uri.etsi.org/ngsi-ld/errors\",\n"
                        + "    \"error\": \"https://uri.etsi.org/ngsi-ld/error\",\n"
                        + "    \"entityId\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/entityId\",\n"
                        + "      \"@type\": \"@id\"\n"
                        + "    },\n"
                        + "    \"updated\": \"https://uri.etsi.org/ngsi-ld/updated\",\n"
                        + "    \"unchanged\": \"https://uri.etsi.org/ngsi-ld/unchanged\",\n"
                        + "    \"attributeName\": \"https://uri.etsi.org/ngsi-ld/attributeName\",\n"
                        + "    \"reason\": \"https://uri.etsi.org/ngsi-ld/reason\",\n"
                        + "    \"timerel\": \"https://uri.etsi.org/ngsi-ld/timerel\",\n"
                        + "    \"time\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/time\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"endTime\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/endTime\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"timeproperty\": \"https://uri.etsi.org/ngsi-ld/timeproperty\",\n"
                        + "    \"subscriptionId\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/subscriptionId\",\n"
                        + "      \"@type\": \"@id\"\n"
                        + "    },\n"
                        + "    \"notifiedAt\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/notifiedAt\",\n"
                        + "      \"@type\": \"DateTime\"\n"
                        + "    },\n"
                        + "    \"data\": \"https://uri.etsi.org/ngsi-ld/data\",\n"
                        + "    \"triggerReason\": \"https://uri.etsi.org/ngsi-ld/triggerReason\",\n"
                        + "    \"values\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/hasValues\",\n"
                        + "      \"@container\": \"@list\"\n"
                        + "    },\n"
                        + "    \"objects\": {\n"
                        + "      \"@id\": \"https://uri.etsi.org/ngsi-ld/hasObjects\",\n"
                        + "      \"@type\": \"@id\",\n"
                        + "      \"@container\": \"@list\"\n"
                        + "    },\n"
                        + "    \"@vocab\": \"https://uri.etsi.org/ngsi-ld/default-context/\"\n"
                        + "  }\n"
                        + "}";
            }
        }
//        if (forEntity==null){
//            throw new ContextException(ErrorCode.INVALID_REQUEST,
//                    "@context body is empty. context");
//        }else {
//            contextBody = forEntity.getBody();
//        }
        if (forEntity!=null){
            contextBody = forEntity.getBody();
        }
        validationContext(contextBody);

        Context objectContext = objectMapper.readValue(contextBody, Context.class);

//        if (objectContext == null) {
//            throw new ContextException(ErrorCode.INVALID_REQUEST,
//                    "@context body is empty. context= " + contextBody);
//        }

        LinkedHashMap<String, String> stringStringTreeMap = verificationContext(
                objectContext.getValue());

        objectContext.setUrl(contextUrl);
//        objectContext.setDefaultUrl(contextUrl);

        Optional<Context> byUrl = contextRepository.findByUrl(contextUrl);

        if (byUrl.isEmpty()) { //value = null;
            contextRepository.save(objectContext);
        } else {
            if (!byUrl.get().getValue().equals(objectContext.getValue())) {
                byUrl.get().updateContext(objectContext.getValue());
                contextRepository.save(byUrl.get());
            }
        }

        ContextResponseDto contextResponseDto = new ContextResponseDto();
        contextResponseDto.setContext(stringStringTreeMap);
        return contextResponseDto;
    }


    public LinkedHashMap<String, Object> attributeDeduplication(Object contextValue) {

        LinkedHashMap<String, Object> linkedHashMaps = (LinkedHashMap<String, Object>) contextValue;

        LinkedHashMap<String, Object> linkedHashMap = new LinkedHashMap<>();
        for (Entry<String, Object> entry : linkedHashMaps.entrySet()) {
            String key = entry.getKey();
            Object entryValue = entry.getValue();

            if (key.contains(":")) {
                String[] split = key.split(":");
                String resource = split[1];
                linkedHashMap.put(resource, entryValue);
            } else {
                linkedHashMap.put(key, entryValue);
            }
        }
        return linkedHashMap;


    }
    public List<ContextResponseDto> readContextVersion(String contextUrl) {

        List<Context> contextInfo =  contextRepository.findByUrlOrderByCreatedAtDesc(contextUrl);

        List<ContextResponseDto> contexts = new ArrayList<>();

        for (Context context: contextInfo) {
            final ContextResponseDto contextResponseDto = new ContextResponseDto();
//            contextResponseDto.setVersion(context.getVersion());
            contextResponseDto.setUrl(context.getUrl());
            contexts.add(contextResponseDto);
        }
        return contexts;

    }

    public ContextResponseDto readContext(String contextUrl,Boolean full) {

        validationContextUrl(contextUrl);

        Context contextInfo  =  contextRepository.findByUrl(contextUrl).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. @context= " + contextUrl));

        Object value = contextInfo.getValue();

        LinkedHashMap<String, Object> linkedHashMap = attributeDeduplication(value);

        LinkedHashMap<String, String> stringStringTreeMap = verificationContext(linkedHashMap);

        ContextResponseDto contextResponseDto = new ContextResponseDto();
        contextResponseDto.setIsReady(contextInfo.getIsReady());

        if (full) {
            contextResponseDto.setContext(stringStringTreeMap);
//            contextResponseDto.setVersion(contextInfo.getVersion());
        } else {
            contextResponseDto.setContext(linkedHashMap);
//            contextResponseDto.setVersion(contextInfo.getVersion());
        }

        return contextResponseDto;
    }


    public List<String> readAllContext() {

        List<String> allUrl = contextRepository.findAllUrl();

        return allUrl.stream().distinct().collect(Collectors.toList());
    }

    public List<ContextResponseDto> readContextFirstVersion() {
        List<String> allUrl = contextRepository.findAllUrl();
        List<String> collect = allUrl.stream().distinct().collect(Collectors.toList());
        List<ContextResponseDto> contextResponseDtos = new ArrayList<>();
        for (String a:collect) {
            final ContextResponseDto contextResponseDto = new ContextResponseDto();
            List<Context> byDefaultUrlOrderByCreatedAtDesc = contextRepository.findByUrlOrderByCreatedAtDesc(a);
            Context context = byDefaultUrlOrderByCreatedAtDesc.get(byDefaultUrlOrderByCreatedAtDesc.size() - 1);
            contextResponseDto.setUrl(context.getUrl());
//            contextResponseDto.setVersion(context.getVersion());
            contextResponseDtos.add(contextResponseDto);
        }
        return contextResponseDtos;
    }

    public String updateContextIsReady(String contextUrl) {
        Context contextInfo = contextRepository.findByUrl(contextUrl).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Context=" + contextUrl));

        contextInfo.setIsReady(true);

        contextRepository.save(contextInfo);

        return ResponseMessage.CONTEXT_UPDATE_SUCCESS;
    }

    public Object registrationDataModelInContext(String contextUrl, List<String> dataModels)
            throws IOException, ParseException {
        Context contextInfo = contextRepository.findByUrl(contextUrl).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Context= " + contextUrl));

        if (contextInfo.getIsReady()){
            throw new ContextException(ErrorCode.INVALID_REQUEST,"You Cannot Modify A Ready Context= " + contextUrl);
        }

        Object value = contextInfo.getValue();
        LinkedHashMap<String, Object> contextInnerMap = (LinkedHashMap<String, Object>) value;

        if (!ValidateUtil.isEmptyData(dataModels)) {

            for (String model : dataModels) {
                DataModel dataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(model).orElseThrow(
                        () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. DataModel= " + model));
                if (dataModel.getIsReady()) {
                    String id = dataModel.getId();
                    String[] split = id.split(":", 3);
                    String resource = split[1];

                    Map<String, String> attributeNames = dataModel.getAttributeNames();
                    HashMap<String, Object> attributes = dataModel.getAttributes();
                    contextInnerMap.put(model, resource + ":" + model);

                    for (Map.Entry<String, Object> entry : attributes.entrySet()) {
                        String entryKey = entry.getKey();  //
                        Object attributeValue = attributeNames.get(entryKey);  //
                        contextInnerMap.put(model + ":" + entryKey, attributeValue);

                        Object entryValue = entry.getValue();
                        Object childAttribute = ((Map) entryValue).get("childAttributeNames");
                        if (childAttribute != null) {
                            Map<String, Object> childAttributeNames = (Map<String, Object>) childAttribute;
                            for (Map.Entry<String, Object> childAttributeValue : childAttributeNames.entrySet()) {
                                contextInnerMap.put(model + ":" + childAttributeValue.getKey(), childAttributeValue.getValue());
                            }
                        }
                    }
                } else {
                    throw new DataModelException
                            (ErrorCode.BAD_REQUEST_DATA,
                                    "Data Model Is Not Ready For Use= " + dataModel.getType());
                }
            }
        }

        uploadContextFile(contextUrl,contextInnerMap);

        contextRepository.save(contextInfo);
        return ResponseMessage.CONTEXT_UPDATE_SUCCESS;

    }

    public String unRegistrationDataModelInContext(String contextUrl, List<String> dataModels)
            throws IOException, ParseException {

        Context contextInfo = contextRepository.findByUrl(contextUrl).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Context=" + contextUrl));

        if (contextInfo.getIsReady()){
            throw new ContextException(ErrorCode.INVALID_REQUEST,"You Cannot Modify A Ready Context= " + contextUrl);
        }

        Object value = contextInfo.getValue();
        LinkedHashMap<String, Object> contextInnerMap = (LinkedHashMap<String, Object>) value;

        for (String model : dataModels) {

            DataModel dataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(model).orElseThrow(
                    () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Not Exists. DataModel= " + model));
            HashMap<String, Object> attributes = dataModel.getAttributes();

            for (Map.Entry<String, Object> entry : attributes.entrySet()) {
                contextInnerMap.remove(model+":"+entry.getKey());

                Object entryValue = entry.getValue();
                Object childAttribute = ((Map) entryValue).get("childAttributeNames");

                if (childAttribute != null) {
                    Map<String, Object> childAttributeNames = (Map<String, Object>) childAttribute;
                    for (Map.Entry<String, Object> childAttributeValue : childAttributeNames.entrySet()) {
                        contextInnerMap.remove(model+":"+childAttributeValue.getKey());
                    }
                }
            }
            contextInnerMap.remove(model);
        }


        uploadContextFile(contextUrl,contextInnerMap);

        contextRepository.save(contextInfo);
        return ResponseMessage.CONTEXT_UPDATE_SUCCESS;
    }
    public void uploadContextFile(String contextUrl,LinkedHashMap<String, Object> contextInnerMap)
            throws IOException, ParseException {
        LinkedHashMap<String, Object> stringObjectLinkedHashMap = attributeDeduplication(contextInnerMap);
        LinkedHashMap<String, String> linkedHashMap = verificationContext(stringObjectLinkedHashMap);
        ContextFileDto contextFileDto = new ContextFileDto();
        contextFileDto.setContext(linkedHashMap);
        String writeValueAsStringContext = objectMapper.writeValueAsString(contextFileDto);
        fileService.uploadJsonFile(contextUrl, writeValueAsStringContext);
    }


    public String deleteContext(String contextUrl) {

        Context contextInfo = contextRepository.findByUrl(contextUrl).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Not Exists. Context=" + contextUrl));

        if (contextInfo.getIsReady()){
            throw new ContextException(ErrorCode.INVALID_REQUEST,"Cannot Delete A Ready Context= " + contextUrl);
        }

        contextRepository.deleteById(contextInfo.getId());
        fileService.deleteJsonFile(contextUrl);

        return ResponseMessage.CONTEXT_DELETE_SUCCESS;
    }

//    public String versionContext(String defaultUrl, String version){
//        StringBuilder url = new StringBuilder();
//        url.append(defaultUrl);
//        int index = defaultUrl.lastIndexOf(".jsonld");
//        url.insert(index,"/"+version);
//        String contextUrl = url.toString();
//
//        return contextUrl;
//    }
//

//    private LinkedHashMap<String, String> checkDataModelStatus(
//            LinkedHashMap<String, String> stringStringTreeMap) {
//
//        LinkedHashMap<String, String> dataModelStatus = new LinkedHashMap<>();
//        for (Map.Entry<String, String> dataModel : stringStringTreeMap.entrySet()) {
//            String key = dataModel.getKey();
//            if (Character.isUpperCase(key.charAt(0))) {
//                Optional<DataModel> byType = dataModelRepository.findByType(key);
//                if (byType.isPresent()) {
//                    Boolean isUsing = byType.get().getIsUsing();
//                    dataModelStatus.put(key, String.valueOf(isUsing));
//                }
//            }
//        }
//        return dataModelStatus;
//    }

    public LinkedHashMap<String, String> verificationContext(Object context) {

        LinkedHashMap<String, String> contextMap = new LinkedHashMap<>();
        LinkedHashMap<String, Object> contextInnerMap = (LinkedHashMap<String, Object>) context;

        for (Map.Entry<String, Object> entry : contextInnerMap.entrySet()) {
            String entryKey = entry.getKey();
            Object entryValue = entry.getValue();

            validationContextValue(entryKey, entryValue);

            String value = null;
            if (entryValue instanceof String) {
                value = (String) entryValue;
            } else if (entryValue instanceof Map) {
                value = (String) ((Map) entryValue).get("@id");
            }

            if (value != null && !value.startsWith("http") && value.contains(":")) {
                String[] valueArr = value.split(":", 2);
                String valueReferenceUri = (String) contextInnerMap.get(valueArr[0]);
                if (!ValidateUtil.isEmptyData(valueReferenceUri)) {
                    value = valueReferenceUri + valueArr[1];
                }
            }
            if (value != null && value.startsWith("http")) {
                contextMap.put(entryKey, value);
            }
        }
        return contextMap;
    }



    public void validationContextValue(String entryKey, Object entryValue) {

        if (!entryValue.toString().contains("@id")
                && !entryValue.toString().contains("DateTime")
                && !entryValue.toString().contains("@type")
                && !entryValue.toString().contains("@vocab")
                && !entryValue.toString().contains("@list")
                && !entryValue.toString().startsWith("http")
                && !entryValue.toString().contains(":")) {
            throw new ContextException(ErrorCode.INVALID_REQUEST,
                    "@key= " + entryKey + " @row= " + entryValue);
        }
        if (!entryKey.contains("@")) {
            if (!entryValue.toString().toLowerCase().contains(entryKey.toLowerCase())) {
                throw new ContextException(ErrorCode.INVALID_REQUEST,
                        "Key Value Not Matched= " + "@key= " + entryKey + " @row= " + entryValue
                );
            }
        }


    }

    public void validationContextUrl(String contextUrl) {

        if (ValidateUtil.isEmptyData(contextUrl)) {
            throw new ContextException(ErrorCode.INVALID_REQUEST, "ContextUrl Is Empty.");
        }
        if (!ValidateUtil.urlValidator(contextUrl)) {
            throw new ContextException(ErrorCode.INVALID_REQUEST,
                    "Invalid Format ContextUrl= " + contextUrl);
        }
        if (!contextUrl.substring(contextUrl.length() - 7).contains(".jsonld")) {
            throw new ContextException(ErrorCode.INVALID_REQUEST,
                    "Invalid Format Url / url.jsonld= " + contextUrl);

        }

    }

    public void validationContext(String context) {
        if (ValidateUtil.isEmptyData(context)) {
            throw new ContextException(ErrorCode.INVALID_REQUEST, "ContextValue Is Empty.");
        }
        if (!context.contains("@context")) {
            throw new ContextException(ErrorCode.INVALID_REQUEST,
                    "Check The Format @context");
        }

    }


}



