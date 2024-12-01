package kr.co.e8ight.ndxpro_v1_datamanager.service;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.count;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.limit;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.replaceRoot;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.skip;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.sort;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Collectors;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.UnitCode;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.DataModelRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.DataModelResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.UnitCodeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.UnitCodeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ContextException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.CountResult;
import kr.co.e8ight.ndxpro_v1_datamanager.util.DataModelException;
import kr.co.e8ight.ndxpro_v1_datamanager.util.PagingResult;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ResponseMessage;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DataModelService {

    private final DataModelRepository dataModelRepository;



    private final UnitCodeRepository unitCodeRepository;

    private final FileService fileService;

    private static final int DEFAULT_PAGE_SIZE = 25;
    private static final String FIRST_VERSION = "1.0";


//    @Value("${databroker.url}")
//    private String dataBrokerURL;
//
//    @Value("${databroker.api-path}")
//    private String dataBrokerApiPath;

    private final MongoTemplate mongoTemplate;
    public DataModelService(DataModelRepository dataModelRepository,
            UnitCodeRepository unitCodeRepository, FileService fileService,
            MongoTemplate mongoTemplate) {
        this.dataModelRepository = dataModelRepository;
        this.unitCodeRepository = unitCodeRepository;
        this.fileService = fileService;
        this.mongoTemplate = mongoTemplate;
    }

    public String createDataModel(DataModelRequestDto dataModelRequestDto)
            throws IOException {

        // 1. 필수 파리미터 체크
        validateParameter(dataModelRequestDto);

        // 2. 기 존재여부 확인
        dataModelRepository.findByType(dataModelRequestDto.getType()).ifPresent(m -> {
            throw new DataModelException(ErrorCode.ALREADY_EXISTS,
                    "Already Exists. DataModel= " + dataModelRequestDto.getType());
        });


        DataModel dataModel = makeDataModelEntity(dataModelRequestDto);
        dataModel.setVersion(FIRST_VERSION);
        dataModel.setIsReady(false);

        // 5. attributeName 체크
        DataModel.attributeNameCheck(dataModel.getAttributes(), dataModel.getAttributeNames());

        // 6. required가 attribute 체크
        checkRequiredInAttribute(dataModel);

        dataModelRepository.save(dataModel);

        return ResponseMessage.DATA_MODEL_CREATE_SUCCESS;
    }


    public String versionUpDataModel(DataModelRequestDto dataModelRequestDto)
            throws JsonProcessingException {

        // 1. 필수 파리미터 체크
        validateParameter(dataModelRequestDto);

        String type = dataModelRequestDto.getType();
        DataModel dataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(type)
                .orElseThrow(
                        () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. DataModel= " + type));


        String version = dataModel.getVersion();
        String[] parts = version.split("\\.");
        int major = Integer.parseInt(parts[0]);
        int minor = Integer.parseInt(parts[1]);
        minor++;
        version = major+"."+minor;

        DataModel newDataModel = makeDataModelEntity(dataModelRequestDto);

        newDataModel.setVersion(version);
        newDataModel.setIsReady(false);

        // 5. attributeName 체크
        DataModel.attributeNameCheck(dataModel.getAttributes(), dataModel.getAttributeNames());

        // 6. required가 attribute 체크
        checkRequiredInAttribute(newDataModel);

        dataModelRepository.save(newDataModel);
        return ResponseMessage.DATA_MODEL_VERSION_UP_SUCCESS;
    }
    public DataModel makeDataModelEntity(DataModelRequestDto dataModelRequestDto)
            throws JsonProcessingException {
        DataModel dataModel = new DataModel();
        dataModel.setId(dataModelRequestDto.getId());
        dataModel.setType(dataModelRequestDto.getType());
        dataModel.setTitle(dataModelRequestDto.getTitle());
        dataModel.setDescription(dataModelRequestDto.getDescription());
        dataModel.setAttributeNames(dataModelRequestDto.getAttributeNames());

        // 4. attributeType, valid 체크
        dataModel.setAttributeTypes(dataModelRequestDto.getAttributes());
        dataModel.setRequired(dataModelRequestDto.getRequired());
        dataModel.setReference(dataModelRequestDto.getReference());

        // 동적 여부 체크
        dataModel.setIsDynamic(dataModelRequestDto.getAttributes().toString().contains("observedAt"));

        return dataModel;
    }
    public PagingResult<List<String>> readAllDataModel(Integer curPage, Integer size, String word, Boolean isReady) {

        curPage *= size;

        List<DataModel> dataModels = null;
        CountResult countResult = null;
        if (isReady != null) {
            if (!ValidateUtil.isEmptyData(word)) {
                // 준비 여부와 검색 기준 전체 조회
                dataModels = dataModelRepository.findByIsReadyAndTypeContainingIgnoreCaseOrderByTypeAscCreatedAtDesc(word,isReady, curPage,size);
                countResult = dataModelRepository.countByIsReadyAndTypeContainingIgnoreCase(word, isReady);

            } else {
                // 준비 여부 기준 전체 조회
                dataModels = dataModelRepository.findAllByIsReadyOrderByTypeAscCreatedAtDesc(isReady,curPage,size);
                countResult = dataModelRepository.countAllByIsReady(isReady);
            }
        } else {
            if (!ValidateUtil.isEmptyData(word)) {
                // 검색 단어 기준 전체 조회
                dataModels = dataModelRepository.findByTypeContainingIgnoreCaseOrderByTypeAscCreatedAtDesc(word, curPage, size);
                countResult = dataModelRepository.countByTypeContainingIgnoreCase(word);
            } else {
                // 기본 전체 조회
                dataModels = dataModelRepository.findAllByOrderByTypeAscCreatedAtDesc(curPage, size);
                countResult = dataModelRepository.countAll();
            }
        }
        int totalData = (countResult == null) ? 0 : countResult.getTotalData();
        int totalPage = (int) Math.ceil((double) totalData / size);

        List<DataModelResponseDto> dataModelResponseDtos = new ArrayList<>();
        if (!ValidateUtil.isEmptyData(dataModels)){
            for (int i = 0; i < dataModels.size(); i++) {
                DataModel dataModel = dataModels.get(i);
                DataModelResponseDto dataModelResponseDto = new DataModelResponseDto();
                dataModelResponseDto.setId(dataModel.getId());
                dataModelResponseDto.setType(dataModel.getType());
                dataModelResponseDto.setVersion(dataModel.getVersion());
                dataModelResponseDto.setIsReady(dataModel.getIsReady());
                dataModelResponseDtos.add(dataModelResponseDto);
            }
        }

        return new PagingResult<>(dataModelResponseDtos, totalData, totalPage);
    }

//    public Page<DataModel> getDataByTypeRegexIgnoreCase(String typeRegex, Pageable pageable) {
//        Aggregation aggregation = Aggregation.newAggregation(
//                match(Criteria.where("type").regex(typeRegex, "i")),
//                group("type").last("$$ROOT").as("lastDocument"),
//                replaceRoot("lastDocument"),
//                sort(Sort.Direction.ASC, "type"),
//                skip(pageable.getOffset()),
//                limit(pageable.getPageSize())
//        );
//        AggregationResults<DataModel> result = mongoTemplate.aggregate(aggregation, mongoTemplate.getCollectionName(DataModel.class),
//                DataModel.class);
//
//        List<DataModel> resultList = result.getMappedResults();
//        long total = resultList.isEmpty() ? 0 :
//            mongoTemplate.aggregate(
//                    Aggregation.newAggregation(
//                            match(Criteria.where("type").regex(typeRegex, "i")),
//                            group("type").last("$$ROOT").as("lastDocument"),
//                            replaceRoot("lastDocument")),
//                    mongoTemplate.getCollectionName(DataModel.class),
//                    Long.class).getMappedResults().size();
//
//        return new PagingResult<>(resultList, total, 1);
//    }


    // 데이터 모델 단건 조회
    public DataModelResponseDto readDataModel(String type,String version) {

        DataModel dataModel = null;
        if (ValidateUtil.isEmptyData(version)){
            dataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(type)
                    .orElseThrow(
                            () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                                    "Not Exists. DataModel= " + type));
        }else {
            dataModel = dataModelRepository.findByTypeAndVersion(type,version)
                    .orElseThrow(
                            () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                                    "Not Exists. DataModel= " + type));
        }



        return createDataModelResponseDto(dataModel);

    }


    // 해당 데이터 모델 버전 전체 조회
    public List<DataModelResponseDto> readAllModelVersion(String type) {

        List<DataModel> dataModels = dataModelRepository.findAllDataModelVersion(type)
                .orElseThrow(
                        () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. DataModel= " + type));

        List<DataModelResponseDto> dataModelResponseDtos = new ArrayList<>();

        for (DataModel model : dataModels) {
            DataModelResponseDto dataModelResponseDto = new DataModelResponseDto();
            dataModelResponseDto.setId(model.getId());
            dataModelResponseDto.setType(model.getType());
            dataModelResponseDto.setVersion(model.getVersion());
            dataModelResponseDto.setIsReady(model.getIsReady());
            dataModelResponseDtos.add(dataModelResponseDto);
        }

        return dataModelResponseDtos;

    }

    // 준비완료 되기 전 자유수정
    public String updateDataModel(DataModelRequestDto dataModelRequestDto)
            throws JsonProcessingException {

        String type = dataModelRequestDto.getType();


        validateParameter(dataModelRequestDto);


        DataModel existingDataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(type)
                .orElseThrow(
                        () -> new DataModelException(
                                ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. DataModel= " + type));


        if (existingDataModel.getIsReady() != null && existingDataModel.getIsReady()) {
            throw new DataModelException(ErrorCode.OPERATION_NOT_SUPPORTED,
                    "You cannot modify a ready model= " + existingDataModel.getType());
        }

        existingDataModel.setAttributeTypes(dataModelRequestDto.getAttributes());
        DataModel.attributeNameCheck(existingDataModel.getAttributes(),
                dataModelRequestDto.getAttributeNames());

        existingDataModel.update(dataModelRequestDto);

        checkRequiredInAttribute(existingDataModel);

        dataModelRepository.save(existingDataModel);

        return ResponseMessage.DATA_MODEL_UPDATE_SUCCESS;
    }


    public String updateDataModelIsReady(String type) {

        DataModel dataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(type)
                .orElseThrow(
                        () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. DataModel= " + type));

        dataModel.setIsReady(true);

        dataModelRepository.save(dataModel);

        return ResponseMessage.DATA_MODEL_READY_UPDATE_SUCCESS;
    }


    public String deleteDataModel(String type) {

        DataModel existingDataModel = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(type)
                .orElseThrow(
                        () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND,
                                "Not Exists. DataModel= " + type));

        if (existingDataModel.getIsReady() != null && existingDataModel.getIsReady()) {
            throw new DataModelException(ErrorCode.OPERATION_NOT_SUPPORTED,
                    "You cannot modify a ready model= " + existingDataModel.getType());
        }

        dataModelRepository.deleteById(existingDataModel.get_id());
        return ResponseMessage.DATA_MODEL_DELETE_SUCCESS;
    }

    public List<String> readUnitCodeGroup() {
        List<String> allGroup = unitCodeRepository.findAllGroup();

        return allGroup.stream().distinct().collect(Collectors.toList());
    }

    public List<UnitCodeResponseDto> readUnitCode(String group) {

        List<UnitCode> byGroup = unitCodeRepository.findByGroup(group);

        List<UnitCodeResponseDto> list = new ArrayList<>();

        for (UnitCode unitCode : byGroup) {
            UnitCodeResponseDto unitCodeResponseDto = new UnitCodeResponseDto();
            unitCodeResponseDto.setGroupName(unitCode.getGroupName());
            unitCodeResponseDto.setCode(unitCode.getCode());
            unitCodeResponseDto.setSymbol(unitCode.getSymbol());
            list.add(unitCodeResponseDto);
        }

        return list;
    }


    public void validateParameter(DataModelRequestDto dataModelRequestDto) {
        String id = dataModelRequestDto.getId();
        String type = dataModelRequestDto.getType();
        HashMap<String, Object> attributes = dataModelRequestDto.getAttributes();

        if (ValidateUtil.isEmptyData(id)) {
            throw new DataModelException(ErrorCode.INVALID_REQUEST, "DataModel Id Is Empty");
        }
        if (ValidateUtil.isEmptyData(type)) {
            throw new DataModelException(ErrorCode.INVALID_REQUEST, "DataModel Type Is Empty");
        }
        if (!Character.isUpperCase(type.charAt(0))) {
            throw new DataModelException(ErrorCode.INVALID_REQUEST,
                    "Data model type First letter is not uppercase= " + type);
        }
        if (!id.matches("urn(.*)" + type + ":")) {
            throw new DataModelException(ErrorCode.INVALID_REQUEST,
                    "Invalid Format ID= " + id + " Type= " + type);
        }
        if (ValidateUtil.isEmptyData(attributes)) {
            throw new DataModelException(ErrorCode.INVALID_REQUEST,
                    "You must have at least one attribute");
        }


    }

    public void checkRequiredInAttribute(DataModel dataModel) {

        if (!ValidateUtil.isEmptyData(dataModel.getRequired())) {
//            if (ValidateUtil.isEmptyData(dataModel.getRequired())) {
//                throw new DataModelException(ErrorCode.RESOURCE_NOT_FOUND,
//                        "Require Should Be At Least One");
//            }

            List<String> required = dataModel.getRequired();
            HashMap<String, Object> attributes = dataModel.getAttributes();

            String requireKey = null;
            for (String require : required) {
                requireKey = require;
            }

            List<String> attributeKey = new ArrayList<>();
            for (Map.Entry<String, Object> entry : attributes.entrySet()) {

                attributeKey.add(entry.getKey());

            }
            if (!attributeKey.contains(requireKey)) {
                throw new DataModelException(ErrorCode.INVALID_REQUEST,
                        "Attribute Does Not Include Required= " + requireKey);
            }
        }

    }

    // * //
    public List<String> readDataModelObservation(HashMap<String, Object> attributes) {

        List<String> observedAtAttribute = new ArrayList<>();
        for (Entry<String, Object> attribute : attributes.entrySet()) {
            String key = attribute.getKey();
            Object value = attribute.getValue();
            if (value.toString().contains("observedAt")) {
                observedAtAttribute.add(key);
            }
        }
        return observedAtAttribute;

    }

    public Boolean duplicatedCheckDataModel(String dataModelId) {
        Optional<DataModel> byType = dataModelRepository.findFirstByAndTypeOrderByCreatedAtDesc(dataModelId);
        return byType.isEmpty();

    }
    public DataModelResponseDto createDataModelResponseDto(DataModel dataModel){

        DataModelResponseDto dataModelResponseDto = new DataModelResponseDto();
        dataModelResponseDto.setId(dataModel.getId());
        dataModelResponseDto.setType(dataModel.getType());
        dataModelResponseDto.setVersion(dataModel.getVersion());
        dataModelResponseDto.setTitle(dataModel.getTitle());
        dataModelResponseDto.setDescription(dataModel.getDescription());
        dataModelResponseDto.setAttributeNames(dataModel.getAttributeNames());
        dataModelResponseDto.setAttributes(dataModel.getAttributes());
        dataModelResponseDto.setRequired(dataModel.getRequired());
        dataModelResponseDto.setReference(dataModel.getReference());
        dataModelResponseDto.setIsDynamic(dataModel.getIsDynamic());
        dataModelResponseDto.setIsReady(dataModel.getIsReady());
        dataModelResponseDto.setCreatedAt(dataModel.getCreatedAt());
        dataModelResponseDto.setModifiedAt(dataModel.getModifiedAt());
        List<String> strings = readDataModelObservation(dataModel.getAttributes());
        dataModelResponseDto.setObservation(strings);

        return  dataModelResponseDto;
    }


}
