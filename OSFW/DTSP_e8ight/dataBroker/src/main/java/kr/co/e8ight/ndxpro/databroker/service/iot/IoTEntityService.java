package kr.co.e8ight.ndxpro.databroker.service.iot;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.Attribute;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTObservedAtDto;
import kr.co.e8ight.ndxpro.databroker.repository.EntityRepository;
import kr.co.e8ight.ndxpro.databroker.service.AttributeCacheService;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityValidation;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityValidationRepository;
import kr.co.e8ight.ndxpro.databroker.service.EntityDocumentKey;
import kr.co.e8ight.ndxpro.databroker.domain.EntityId;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntity;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityHistory;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityTotalCount;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTObservedAt;
import kr.co.e8ight.ndxpro.databroker.dto.*;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityHistoryRepository;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTEntityRepository;
import kr.co.e8ight.ndxpro.databroker.repository.iot.IoTObservedAtRepository;
import kr.co.e8ight.ndxpro.databroker.service.EntityValidationService;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.*;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.*;
import static org.springframework.data.mongodb.core.aggregation.AddFieldsOperation.addField;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
import static org.springframework.data.mongodb.core.aggregation.ArrayOperators.arrayOf;

@Slf4j
@Service
public class IoTEntityService {

    private final IoTEntityRepository ioTEntityRepository;

    private final IoTEntityHistoryRepository ioTEntityHistoryRepository;

    private final EntityRepository entityRepository;

    private final IoTObservedAtRepository ioTObservedAtRepository;

    private final IoTEntityValidationRepository ioTEntityValidationRepository;

    private final EntityValidationService entityValidationService;

    private final AttributeCacheService attributeCacheService;

    private final ObjectMapper objectMapper;

    private final MongoTemplate mongoTemplate;

    public IoTEntityService(IoTEntityRepository ioTEntityRepository, IoTEntityHistoryRepository ioTEntityHistoryRepository,
            EntityRepository entityRepository, IoTObservedAtRepository ioTObservedAtRepository, IoTEntityValidationRepository ioTEntityValidationRepository, EntityValidationService entityValidationService, AttributeCacheService attributeCacheService, ObjectMapper objectMapper, MongoTemplate mongoTemplate) {
        this.ioTEntityRepository = ioTEntityRepository;
        this.ioTEntityHistoryRepository = ioTEntityHistoryRepository;
        this.entityRepository = entityRepository;
        this.ioTObservedAtRepository = ioTObservedAtRepository;
        this.ioTEntityValidationRepository = ioTEntityValidationRepository;
        this.entityValidationService = entityValidationService;
        this.attributeCacheService = attributeCacheService;
        this.objectMapper = objectMapper;
        this.mongoTemplate = mongoTemplate;
    }

    public IoTEntity saveIoTEntity(IoTEntity entity) {
        try {
            entityValidationService.validateEntity(entity);
        } catch (Exception e) {
            log.error("Entity Validation Fail. entityId = {}", entity.getId().getId());
            ioTEntityValidationRepository.insert(IoTEntityValidation.builder()
                            .result("fail")
                            .cause(e.getMessage())
                            .entity(entity)
                            .build());
            return null;
        }

        IoTEntity responseEntity;
        IoTEntityHistory iotEntityHistory = new IoTEntityHistory();
        IoTEntity existEntity = ioTEntityRepository.findByIdId(entity.getId().getId());
//        IoTEntity existEntity = ioTEntityRepository.findByIdIdAndContext(entity.getId().getId(), entity.getContext());
        if(existEntity == null) {
            responseEntity = ioTEntityRepository.insert(entity);
            entityRepository.insert(entity);
            iotEntityHistory.setEntity(entity);
        } else {
            existEntity.setContext(entity.getContext());
            existEntity.setAttrNames(entity.getAttrNames());
            existEntity.setAttrs(entity.getAttrs());
            entityRepository.save(existEntity);
            responseEntity = ioTEntityRepository.save(existEntity);
            iotEntityHistory.setEntity(existEntity);
        }
        String observedAt = "";
        for (var attribute : iotEntityHistory.getEntity().getAttrs()) {
            for (var childAttribute : attribute.getMd()) {
                if (childAttribute.getName().equals("observedAt")) {
                    observedAt = childAttribute.getValue().toString();
                    break;
                }
            }
            if (observedAt != "") break;
        }
        String entityId = iotEntityHistory.getEntity().getId().getId();
        Optional<IoTEntityHistory> historyEntity = ioTEntityHistoryRepository.findFirstHistoryEntityData(
                entityId, "observedAt", observedAt);
        if (historyEntity.isEmpty()) {
            ioTEntityHistoryRepository.insert(iotEntityHistory);
        }

//        log.debug("Completed Entity Save.", responseEntity.getId().getId());
        log.info("Completed Entity Save. entityId = {}", responseEntity.getId().getId());
        return responseEntity;
    }

    public EntityDto getIoTEntity(String entityId, String context) {
        IoTEntity entity = ioTEntityRepository.findByIdIdAndContext(entityId, context);
        if(entity == null)
            throw new DataBrokerException(ErrorCode.RESOURCE_NOT_FOUND, "Not Found Entity. entityId = " + entityId + ", context = " + context);

        return mapEntityToEntityDto(entity);
    }

    public Page<EntityDto> getIoTEntities(QueryDto queryDto) {
        List<Criteria> criteriaList = new ArrayList<>();

        // id, context, type, q 쿼리 match
        getQuery(criteriaList, queryDto);

        // total 조회
        IoTEntityTotalCount ioTEntityTotalCount = getIoTEntitiesTotalCount(criteriaList);


        // sortproperty match
        String sortType = queryDto.getSort().getType();
        String sortProperty = queryDto.getSortproperty();
        if (!ValidateUtil.isEmptyData(sortProperty)) {
            if (!sortProperty.equals(EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY)) {
                criteriaList.add(matchSortPropertyName(sortProperty));
            }
        }
        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        if(!ValidateUtil.isEmptyData(criteriaList)) {
            Criteria criteria = new Criteria();
            criteria.andOperator(criteriaList);
            aggregationOperationList.add(match(criteria));
        }
        // sortProperty value 조회 적용
        if (!ValidateUtil.isEmptyData(sortProperty)) {
            if (!sortProperty.equals(EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY)) {
                setSortProperty(aggregationOperationList, sortProperty);
                sortSortProperty(aggregationOperationList, sortType);
            } else {
                aggregationOperationList.add(
                        sort(Sort.Direction.valueOf(sortType), sortProperty));
            }
        }

        // pageable 적용
        Pageable pageable = PageRequest.of(queryDto.getOffset(), queryDto.getLimit());
        setPageableAggregation(aggregationOperationList, pageable);

        List<IoTEntity> ioTEntityList = mongoTemplate.aggregate(
                newAggregation(aggregationOperationList),
                mongoTemplate.getCollectionName(IoTEntity.class),
                IoTEntity.class)
                .getMappedResults();

        List<EntityDto> entityDtoList = new ArrayList<>();
        ioTEntityList.stream().forEach((entity) -> {
            EntityDto entityDto = mapEntityToEntityDto(entity);
            entityDtoList.add(entityDto);
        });

        if(ValidateUtil.isEmptyData(ioTEntityTotalCount))
            ioTEntityTotalCount = new IoTEntityTotalCount();
        return new PageImpl<>(entityDtoList, pageable, ioTEntityTotalCount.getTotal());
    }

    public EntityProviderDto getIoTEntityWithProvider(String entityId, String context) {
        IoTEntity entity = ioTEntityRepository.findByIdIdAndContext(entityId, context);
        if(entity == null)
            throw new DataBrokerException(ErrorCode.RESOURCE_NOT_FOUND, "Not Found Entity. entityId = " + entityId + ", context = " + context);
        EntityDto entityDto = mapEntityToEntityDto(entity);
        return EntityProviderDto.builder()
                .provider(entity.getId().getServicePath())
                .entity(entityDto)
                .build();
    }

    public Page<EntityProviderDto> getIoTEntitiesWithProvider(QueryDto queryDto) {
        List<Criteria> criteriaList = new ArrayList<>();

        // id, context, type, q 쿼리 match
        getQuery(criteriaList, queryDto);

        // total 조회
        IoTEntityTotalCount ioTEntityTotalCount = getIoTEntitiesTotalCount(criteriaList);

        // sortProperty match
        String sortType = queryDto.getSort().getType();
        String sortProperty = queryDto.getSortproperty();
        if (!ValidateUtil.isEmptyData(sortProperty)) {
            if (!sortProperty.equals(EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY)) {
                criteriaList.add(matchSortPropertyName(sortProperty));
            }
        }

        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        if(!ValidateUtil.isEmptyData(criteriaList)) {
            Criteria criteria = new Criteria();
            criteria.andOperator(criteriaList);
            aggregationOperationList.add(match(criteria));
        }

        // sortProperty value 조회 적용
        if (!ValidateUtil.isEmptyData(sortProperty)) {
            if (!sortProperty.equals(EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY)) {
                setSortProperty(aggregationOperationList, sortProperty);
                sortSortProperty(aggregationOperationList, sortType);
            } else {
                aggregationOperationList.add(
                        sort(Sort.Direction.valueOf(sortType), sortProperty));
            }
        }

        // pageable 적용
        Pageable pageable = PageRequest.of(queryDto.getOffset(), queryDto.getLimit());
        setPageableAggregation(aggregationOperationList, pageable);

        List<IoTEntity> ioTEntityList = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(IoTEntity.class),
                        IoTEntity.class)
                .getMappedResults();

        List<EntityProviderDto> entityProviderDtoList = new ArrayList<>();
        ioTEntityList.stream().forEach((entity) -> {
            EntityProviderDto entityProviderDto = EntityProviderDto.builder()
                    .provider(entity.getId().getServicePath())
                    .entity(mapEntityToEntityDto(entity))
                    .build();
            entityProviderDtoList.add(entityProviderDto);
        });

        if(ValidateUtil.isEmptyData(ioTEntityTotalCount))
            ioTEntityTotalCount = new IoTEntityTotalCount();
        return new PageImpl<>(entityProviderDtoList, pageable, ioTEntityTotalCount.getTotal());
    }

    public IoTEntityTotalCount getIoTEntitiesTotalCount(List<Criteria> criteriaList) {
        List<AggregationOperation> aggregationOperationListForCountTotal = new ArrayList<>();
        if(!ValidateUtil.isEmptyData(criteriaList)){
            Criteria criteria = new Criteria();
            criteria.andOperator(criteriaList);
            aggregationOperationListForCountTotal.add(match(criteria));
        }
        aggregationOperationListForCountTotal.add(group().count().as("total"));
        Aggregation totalAggregation = newAggregation(aggregationOperationListForCountTotal);
        return mongoTemplate.aggregate(totalAggregation, mongoTemplate.getCollectionName(IoTEntity.class), IoTEntityTotalCount.class).getUniqueMappedResult();
    }

    public void getQuery(List<Criteria> criteriaList, QueryDto queryDto) {
        if(!ValidateUtil.isEmptyData(queryDto.getId()))
            criteriaList.add(
                    Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY).is(queryDto.getId()));

        if(!ValidateUtil.isEmptyData(queryDto.getType()))
            criteriaList.add(
                    Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_TYPE_KEY).is(queryDto.getType()));

        if(!ValidateUtil.isEmptyData(queryDto.getQ()))
            getQQuery(criteriaList, queryDto);

        if(!ValidateUtil.isEmptyData(queryDto.getLink()))
            criteriaList.add(
                    Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_CONTEXT_KEY).is(queryDto.getLink()));
    }

    public Criteria matchSortPropertyName(String sortProperty) {
        String[] splitSortProperty = sortProperty.split("\\.");
        if(splitSortProperty.length == 1) {
            String sortPropertyValueType = getAttributeValueType(sortProperty);
            validateSortPropertyValueType(sortPropertyValueType);

            return matchAttributeName(sortProperty);
        } else if(splitSortProperty.length == 2) {
            String attributeName = splitSortProperty[0];
            getAttributeValueType(attributeName);

            String sortPropertyName = splitSortProperty[1];
            String sortPropertyValueType = getAttributeValueType(sortPropertyName);
            validateSortPropertyValueType(sortPropertyValueType);

            return matchChildAttributeName(attributeName, sortPropertyName);
        } else {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Sort Property. sortProperty=" + sortProperty);
        }
    }

    // attribute name 매칭
    public Criteria matchAttributeName(String attributeName) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName));
    }

    // child attribute name 매칭
    public Criteria matchChildAttributeName(String attributeName, String childAttributeName) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)));
    }

    // sortProperty attribute value 세팅
    public void setSortProperty(List<AggregationOperation> aggregationOperationList, String sortProperty) {
        String[] splitSortProperty = sortProperty.split("\\.");
        if(splitSortProperty.length == 1) {
            setSortPropertyAttributeAggregation(aggregationOperationList, sortProperty);
        } else if(splitSortProperty.length == 2) {
            String attributeName = splitSortProperty[0];
            String sortPropertyName = splitSortProperty[1];
            setChildSortPropertyAttributeAggregation(aggregationOperationList, attributeName, sortPropertyName);
        } else {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Sort Property. sortProperty=" + sortProperty);
        }
        setSortPropertyAttributeValue(aggregationOperationList);
    }

    // sortProperty attribute value 찾기
    public void setSortPropertyAttributeAggregation(List<AggregationOperation> aggregationOperationList, String sortProperty) {
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).filter().as("attrs").by(
                                                ComparisonOperators.valueOf("attrs.name").equalToValue(sortProperty)))
                                        .first())
                        .build());
    }

    // child sortProperty attribute value 찾기
    public void setChildSortPropertyAttributeAggregation(List<AggregationOperation> aggregationOperationList, String attributeName, String sortPropertyName) {
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).filter().as("attrs").by(
                                                ComparisonOperators.valueOf("attrs.name").equalToValue(attributeName)))
                                        .first())
                        .build());
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf("temp.md").filter().as("md").by(
                                                ComparisonOperators.valueOf("md.name").equalToValue(sortPropertyName)))
                                        .first())
                        .build());
    }

    // add field sortPropertyValue
    public void setSortPropertyAttributeValue(List<AggregationOperation> aggregationOperationList) {
        aggregationOperationList.add(
                addField("sortPropertyValue").withValueOf("$temp.value")
                        .build());
    }

    // sort sortPropertyValue
    public void sortSortProperty(List<AggregationOperation> aggregationOperationList, String sortType){
        aggregationOperationList.add(
                sort(Sort.Direction.valueOf(sortType), "sortPropertyValue"));
    }

    public String getAttributeValueType(String attributeName) {
        AttributeResponseDto attribute = attributeCacheService.getAttribute(attributeName);
        if(ValidateUtil.isEmptyData(attribute))
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid attribute. attributeName=" + attributeName);
        return attribute.getValueType();
    }

    public void validateSortPropertyValueType(String sortPropertyValueType) {
        if(!sortPropertyValueType.equals("String") &&
                !sortPropertyValueType.equals("Boolean") &&
                !sortPropertyValueType.equals("Integer") &&
                !sortPropertyValueType.equals("Double")) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid sort property valueType. sort property valueType=" + sortPropertyValueType);
        }
    }

    public void getQQuery(List<Criteria> criteriaList, QueryDto queryDto) {
        String q = queryDto.getQ();
        if(!ValidateUtil.isEmptyData(q)) {
            String[] splitQ = q.split(";");
            if (splitQ.length <= Integer.MAX_VALUE) {
                for (int i = 0; i < splitQ.length; i++) {
                    criteriaList.add(getQueryWithOperator(splitQ[i]));
                }
                return;
            }
        }
        // 지원하지 않는 q 쿼리 형식
        throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Q Query. q=" + q);
    }

    public Criteria getQueryWithOperator(String q) {
        if (q.contains("==")) { // String, DateTime String, Boolean, Integer, Double type 지원, _id.id key 지원
            String[] splitQ = q.split("==");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                if(key.equals(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY)) {
                    return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY).is(value);
                } else if(key.equals(EntityDocumentKey.DEFAULT_ENTITY_SERVICE_PATH_KEY)) {
                    return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_SERVICE_PATH_KEY).is(value);
                } else {
                    String[] splitKey = key.split("\\.");
                    if(splitKey.length == 1) {
                        Object parsedValue = parsedAttributeEqualValueType(key, value);
                        return findAttributeEqualValue(key, parsedValue);
                    } else if (splitKey.length == 2) {
                            String attributeName = splitKey[0];
                            String childAttributeName = splitKey[1];
                            Object parsedValue = parsedAttributeEqualValueType(childAttributeName, value);
                            return findChildAttributeEqualValue(attributeName, childAttributeName, parsedValue);
                    } else {
                        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                    }
                }
            }
        } else if (q.contains("~=")) { // String, DateTime String type 지원, _id.id key 지원
            String[] splitQ = q.split("~=");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                if(key.equals(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY)) {
                    return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY).regex(value, "i");
                } else if(key.equals(EntityDocumentKey.DEFAULT_ENTITY_SERVICE_PATH_KEY)) {
                    return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_SERVICE_PATH_KEY).regex(value, "i");
                } else {
                    String[] splitKey = key.split("\\.");
                    if (splitKey.length == 1) {
                        Object parsedValue = parsedAttributePatternValueType(key, value);
                        return findAttributePatternStringValue(key, String.valueOf(parsedValue));
                    } else if (splitKey.length == 2) {
                        String attributeName = splitKey[0];
                        String childAttributeName = splitKey[1];
                        Object parsedValue = parsedAttributePatternValueType(childAttributeName, value);
                        return findChildAttributePatternStringValue(attributeName, childAttributeName, String.valueOf(parsedValue));
                    } else {
                        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                    }
                }
            }
        } else if (q.contains("<=")) { // DateTime String, Integer, Double 지원
            String[] splitQ = q.split("<=");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                String[] splitKey = key.split("\\.");
                if(splitKey.length == 1) {
                    Object parsedValue = parsedAttributeOperatorValueType(key, value);
                    return findAttributeLessThanEqualValue(key, parsedValue);
                } else if(splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = parsedAttributeOperatorValueType(childAttributeName, value);
                    return findChildAttributeLessThanEqualValue(attributeName, childAttributeName, parsedValue);
                } else {
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                }
            }
        } else if (q.contains(">=")) { // DateTime String, Integer, Double 지원
            String[] splitQ = q.split(">=");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                String[] splitKey = key.split("\\.");
                if(splitKey.length == 1) {
                    Object parsedValue = parsedAttributeOperatorValueType(key, value);
                    return findAttributeGreaterThanEqualValue(key, parsedValue);
                } else if(splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = parsedAttributeOperatorValueType(childAttributeName, value);
                    return findChildAttributeGreaterThanEqualValue(attributeName, childAttributeName, parsedValue);
                } else {
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                }
            }
        }
        // 지원하지 않는 연산자
        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Operator or Q Query. q=" + q);
    }

    public Object parsedAttributeEqualValueType(String attributeName, String attributeValue) {
        AttributeResponseDto attribute = attributeCacheService.getAttribute(attributeName);
        String attributeValueType = attribute.getValueType();
        Object parsedValue = null;
        try {
            switch (attributeValueType) {
                case "String":
                    parsedValue = attributeValue;
                    String attributeValueFormat = attribute.getFormat();
                    if(!ValidateUtil.isEmptyData(attributeValueFormat) && attributeValueFormat.equals("DateTime"))
                        parsedValue = DataBrokerDateFormat.parseUTCDateString(attributeValue);
                    break;
                case "Boolean":
                    parsedValue = Boolean.parseBoolean(attributeValue);
                    break;
                case "Integer":
                    parsedValue = Integer.parseInt(attributeValue);
                    break;
                case "Double":
                    parsedValue = Double.parseDouble(attributeValue);
                    break;
                default:
                    // 연산자가 지원하지 않는 valueType
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Attribute ValueType. Operator '==' support String, DateTime, Boolean, Integer, Double value type.");
            }
        } catch (Exception e) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Invalid Operator or Q Query. Parsed Q key=" + attributeName + ", Parsed Q value=" + attributeValue);
        }
        return parsedValue;
    }

    public Object parsedAttributePatternValueType(String attributeName, String attributeValue) {
        AttributeResponseDto attribute = attributeCacheService.getAttribute(attributeName);
        String attributeValueType = attribute.getValueType();
        Object parsedValue = null;
        switch (attributeValueType) {
            case "String":
                String attributeValueFormat = attribute.getFormat();
                if(!ValidateUtil.isEmptyData(attributeValueFormat) && attributeValueFormat.equals("DateTime"))
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Attribute ValueType. Operator '~=' support String value type.");
                parsedValue = attributeValue;
                break;
            default:
                // 연산자가 지원하지 않는 valueType
                throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Attribute ValueType. Operator '~=' support String value type.");
        }
        return parsedValue;
    }

    public Object parsedAttributeOperatorValueType(String attributeName, String attributeValue) {
        AttributeResponseDto attribute = attributeCacheService.getAttribute(attributeName);
        String attributeValueType = attribute.getValueType();
        try {
            switch (attributeValueType) {
                case "String":
                    String attributeValueFormat = attribute.getFormat();
                    if(!ValidateUtil.isEmptyData(attributeValueFormat) && attributeValueFormat.equals("DateTime"))
                        return DataBrokerDateFormat.parseUTCDateString(attributeValue);
                    return attributeValue;
                case "Integer":
                    return Integer.parseInt(attributeValue);
                case "Double":
                    return Double.parseDouble(attributeValue);
                default:
                    // 연산자가 지원하지 않는 valueType
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Attribute ValueType. Operator '<=' or '>=' support DateTime, Integer, Double value type.");
            }
        } catch (Exception e) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Invalid Operator or Q Query. Parsed Q key=" + attributeName + ", Parsed Q value=" + attributeValue);
        }
    }

    // attribute value 매칭 - equal operator (==)
    public Criteria findAttributeEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").is(value));
    }

    // attribute value 매칭 - equal operator (~=)
    public Criteria findAttributePatternStringValue(String attributeName, String value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").regex(value, "i"));
    }

    // attribute value 매칭 - equal operator (<=)
    public Criteria findAttributeLessThanEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").lte(value));
    }

    // attribute value 매칭 - equal operator (>=)
    public Criteria findAttributeGreaterThanEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").gte(value));
    }

    // child attribute value 매칭 - equal operator (==)
    public Criteria findChildAttributeEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").is(value)));
    }

    // child attribute value 매칭 - equal operator (~=)
    public Criteria findChildAttributePatternStringValue(String attributeName, String childAttributeName, String value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").regex(value, "i")));
    }

    // child attribute value 매칭 - equal operator (<=)
    public Criteria findChildAttributeLessThanEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").lte(value)));
    }

    // child attribute value 매칭 - equal operator (>=)
    public Criteria findChildAttributeGreaterThanEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").gte(value)));
    }

    // pageable 적용
    public void setPageableAggregation(List<AggregationOperation> aggregationOperationList, Pageable pageable) {
        aggregationOperationList.add(
                skip(pageable.getPageNumber() * pageable.getPageSize()));
        aggregationOperationList.add(
                limit(pageable.getPageSize()));
    }

    public EntityDto mapEntityToEntityDto(IoTEntity entity) {

        EntityDto entityDto = new EntityDto();

        EntityId entityId = entity.getId();

        // id 매핑
        entityDto.setId(entityId.getId());

        // type 매핑
        entityDto.setType(entityId.getType());

        // context 매핑
        entityDto.setContext(entity.getContext());

        // attributes 매핑
        List<Attribute> attributes = entity.getAttrs();
        for(Attribute attribute : attributes) {
            String type = attribute.getType();
            String attributeName = attribute.getName();
            if(type.equals(PROPERTY.getCode())) {
                PropertyDto propertyDto = new PropertyDto();
                propertyDto.setType(type);
                propertyDto.setValue(attribute.getValue());
                mapChildAttribute(propertyDto, attribute);
                entityDto.put(attributeName, propertyDto);
            } else if(type.equals(GEO_PROPERTY.getCode())) {
                GeoPropertyDto geoPropertyDto = new GeoPropertyDto();
                geoPropertyDto.setType(type);
                GeoJsonImpl value = objectMapper.convertValue(attribute.getValue(), GeoJsonImpl.class);
                geoPropertyDto.setValue(value);
                mapChildAttribute(geoPropertyDto, attribute);
                entityDto.put(attributeName, geoPropertyDto);
            } else if(type.equals(RELATIONSHIP.getCode())) {
                RelationshipDto relationshipDto = new RelationshipDto();
                relationshipDto.setType(type);
                relationshipDto.setObject(attribute.getValue());
                mapChildAttribute(relationshipDto, attribute);
                entityDto.put(attributeName, relationshipDto);
            }
        }
        return entityDto;
    }

    public void mapChildAttribute(LinkedHashMap<String, Object> attributeDto, Attribute attribute) {

        List<Attribute> childAttributes = attribute.getMd();

        // childAttributes 매핑
        if(!ValidateUtil.isEmptyData(childAttributes)) {
            for (Attribute childAttribute : childAttributes) {
                String childAttributeName = childAttribute.getName();
                if (childAttributeName.equals(UNIT_CODE.getCode())) {
                    attributeDto.put(childAttributeName, childAttribute.getValue());
                } else if(childAttributeName.equals(OBSERVED_AT.getCode())) {
                    String time = String.valueOf(childAttribute.getValue());
                    Date date = DataBrokerDateFormat.formatStringToDate(DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE, time);
                    attributeDto.put(childAttributeName, DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT, date));
                } else {
                    String childType = childAttribute.getType();
                    if(attribute.getType().equals(PROPERTY.getCode())) {
                        PropertyDto childPropertyDto = new PropertyDto();
                        childPropertyDto.setType(childType);
                        childPropertyDto.setValue(childAttribute.getValue());
                        attributeDto.put(childAttributeName, childPropertyDto);
                    } else if(attribute.getType().equals(GEO_PROPERTY.getCode())) {
                        GeoPropertyDto childGeoPropertyDto = new GeoPropertyDto();
                        childGeoPropertyDto.setType(childType);
                        childGeoPropertyDto.setValue((GeoJsonImpl) childAttribute.getValue());
                        attributeDto.put(childAttributeName, childGeoPropertyDto);
                    } else if(attribute.getType().equals(RELATIONSHIP.getCode())) {
                        RelationshipDto childRelationshipDto = new RelationshipDto();
                        childRelationshipDto.setType(childType);
                        childRelationshipDto.setObject(childAttribute.getValue());
                        attributeDto.put(childAttributeName, childRelationshipDto);
                    }
                }
            }
        }
    }

    public void saveObservedAt(IoTObservedAt ioTObservedAt) {
        ioTObservedAtRepository.insert(ioTObservedAt);
    }

    public IoTObservedAtDto getFirstObservedAt(int scenarioId, String scenarioType) {
        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        aggregationOperationList.add(
                match(
                        Criteria.where("scenarioId").is(scenarioId)
                                .and("scenarioType").is(scenarioType)));
        aggregationOperationList.add(
                sort(Sort.Direction.ASC, "datetime"));
        aggregationOperationList.add(
                limit(1));
        IoTObservedAt ioTObservedAt = mongoTemplate.aggregate(
                newAggregation(aggregationOperationList),
                mongoTemplate.getCollectionName(IoTObservedAt.class),
                IoTObservedAt.class)
                .getUniqueMappedResult();

        if (ioTObservedAt == null) {
            return IoTObservedAtDto.builder()
                    .scenarioId(scenarioId)
                    .scenarioType(scenarioType)
                    .build();
        } else {
            return IoTObservedAtDto.builder()
                    .scenarioId(scenarioId)
                    .scenarioType(scenarioType)
                    .nextDateTime(DataBrokerDateFormat.formatDateToString(
                            DataBrokerDateFormat.DATE_TIME_FORMAT,
                            ioTObservedAt.getDatetime()))
                    .build();
        }
    }

    public IoTObservedAtDto getNextObservedAt(String beforeDateTime, int scenarioId, String scenarioType) {
        Date beforeDate = DataBrokerDateFormat.formatStringToDate(
                DataBrokerDateFormat.DATE_TIME_FORMAT,
                beforeDateTime);
        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        aggregationOperationList.add(
                match(
                        Criteria.where("scenarioId").is(scenarioId)
                                .and("scenarioType").is(scenarioType)
                                .and("datetime").gt(beforeDate)));
        aggregationOperationList.add(
                sort(Sort.Direction.ASC, "datetime"));
        aggregationOperationList.add(
                limit(1));
        IoTObservedAt ioTObservedAt = mongoTemplate.aggregate(
                newAggregation(aggregationOperationList),
                mongoTemplate.getCollectionName(IoTObservedAt.class),
                IoTObservedAt.class)
                .getUniqueMappedResult();

        if (ioTObservedAt == null) {
            return IoTObservedAtDto.builder()
                    .scenarioId(scenarioId)
                    .scenarioType(scenarioType)
                    .datetime(beforeDateTime)
                    .build();
        } else {
            return IoTObservedAtDto.builder()
                    .scenarioId(scenarioId)
                    .scenarioType(scenarioType)
                    .datetime(beforeDateTime)
                    .nextDateTime(DataBrokerDateFormat.formatDateToString(
                            DataBrokerDateFormat.DATE_TIME_FORMAT,
                            ioTObservedAt.getDatetime()))
                    .build();
        }
    }
}
