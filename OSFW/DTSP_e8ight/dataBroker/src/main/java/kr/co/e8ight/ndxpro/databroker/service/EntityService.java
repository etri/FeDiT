package kr.co.e8ight.ndxpro.databroker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.*;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.dto.*;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.repository.EntityRepository;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.*;
import static org.springframework.data.mongodb.core.aggregation.AddFieldsOperation.addField;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.limit;
import static org.springframework.data.mongodb.core.aggregation.ArrayOperators.arrayOf;

@Slf4j
@Service
public class EntityService {

    private final EntityRepository entityRepository;

    private final EntityValidationService entityValidationService;

    private final ContextCacheService contextCacheService;

    private final AttributeCacheService attributeCacheService;

    private final ObjectMapper objectMapper;

    private final MongoTemplate mongoTemplate;

    public EntityService(EntityRepository entityRepository, EntityValidationService entityValidationService, ContextCacheService contextCacheService, AttributeCacheService attributeCacheService, ObjectMapper objectMapper, MongoTemplate mongoTemplate) {
        this.entityRepository = entityRepository;
        this.entityValidationService = entityValidationService;
        this.contextCacheService = contextCacheService;
        this.attributeCacheService = attributeCacheService;
        this.objectMapper = objectMapper;
        this.mongoTemplate = mongoTemplate;
    }

    public Entity saveEntity(Entity entity) {
        entityValidationService.validateEntity(entity);

        Entity responseEntity;
        Entity existEntity = entityRepository.findByIdIdAndContext(entity.getId().getId(), entity.getContext());
        if(existEntity == null) {
            responseEntity = entityRepository.insert(entity);
        } else {
            existEntity.setContext(entity.getContext());
            existEntity.setAttrNames(entity.getAttrNames());
            existEntity.setAttrs(entity.getAttrs());

            responseEntity = entityRepository.save(existEntity);
        }
        return responseEntity;
    }

    public EntityDto getEntity(String entityId, String context) {
        Entity entity = entityRepository.findByIdIdAndContext(entityId, context);
        if(entity == null)
            throw new DataBrokerException(ErrorCode.RESOURCE_NOT_FOUND, "Not Found Entity. entityId = " + entityId + ", context = " + context);

        return mapEntityToEntityDto(entity);
    }

    public Page<EntityDto> getEntities(QueryDto queryDto) {
        List<Criteria> criteriaList = new ArrayList<>();

        // id, context, type, q 쿼리 match
        getQuery(criteriaList, queryDto);

        Criteria criteria = new Criteria();
        Query query = !ValidateUtil.isEmptyData(criteriaList)? new Query(criteria.andOperator(criteriaList)) : new Query();

        // total 조회
        long total = mongoTemplate.count(query, Entity.class);

        // sortProperty match
        String sortType = queryDto.getSort().getType();
        String sortProperty = queryDto.getSortproperty();
        if (!ValidateUtil.isEmptyData(sortProperty)) {
            if (!sortProperty.equals(EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY)) {
                matchSortPropertyName(criteriaList, sortProperty);
            }
        }

        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        if(!ValidateUtil.isEmptyData(criteriaList))
            aggregationOperationList.add(match(criteria));

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

        List<Entity> entityList = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(Entity.class),
                        Entity.class)
                .getMappedResults();

        List<EntityDto> entityDtoList = new ArrayList<>();
        entityList.stream().forEach((entity) -> {
            EntityDto entityDto = mapEntityToEntityDto(entity);
            entityDtoList.add(entityDto);
        });
        return new PageImpl<>(entityDtoList, pageable, total);
    }

    // sortProperty attribute name 찾기
    public void matchSortPropertyName(List<Criteria> criteriaList, String sortProperty) {
        String[] splitSortProperty = sortProperty.split("\\.");
        if(splitSortProperty.length == 1) {
            String sortPropertyValueType = getAttributeValueType(sortProperty);
            validateSortPropertyValueType(sortPropertyValueType);

            criteriaList.add((matchAttributeName(sortProperty)));
        } else if(splitSortProperty.length == 2) {
            String attributeName = splitSortProperty[0];
            getAttributeValueType(attributeName);

            String sortPropertyName = splitSortProperty[1];
            String sortPropertyValueType = getAttributeValueType(sortPropertyName);
            validateSortPropertyValueType(sortPropertyValueType);

            criteriaList.add(matchChildAttributeName(attributeName, sortPropertyName));
        } else {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Sort Property. sortProperty=" + sortProperty);
        }
    }

    // attribute name 매칭
    public Criteria matchAttributeName(String attributeName) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
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

    public void setPageableAggregation(List<AggregationOperation> aggregationOperationList, Pageable pageable) {
        aggregationOperationList.add(
                skip(pageable.getPageNumber() * pageable.getPageSize()));
        aggregationOperationList.add(
                limit(pageable.getPageSize()));
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

    public EntityProviderDto getEntityWithProvider(String entityId, String context) {
        Entity entity = entityRepository.findByIdIdAndContext(entityId, context);
        if(entity == null)
            throw new DataBrokerException(ErrorCode.RESOURCE_NOT_FOUND, "Not Found Entity. entityId = " + entityId + ", context = " + context);
        EntityDto entityDto = mapEntityToEntityDto(entity);
        return EntityProviderDto.builder()
                .provider(entity.getId().getServicePath())
                .entity(entityDto)
                .build();
    }

    public Page<EntityProviderDto> getEntitiesWithProvider(QueryDto queryDto) {
        List<Criteria> criteriaList = new ArrayList<>();

        // id, context, type, q 쿼리 match
        getQuery(criteriaList, queryDto);

        Criteria criteria = new Criteria();
        Query query = !ValidateUtil.isEmptyData(criteriaList)? new Query(criteria.andOperator(criteriaList)) : new Query();

        // total 조회
        long total = mongoTemplate.count(query, Entity.class);

        // sortProperty match
        String sortType = queryDto.getSort().getType();
        String sortProperty = queryDto.getSortproperty();
        if (!ValidateUtil.isEmptyData(sortProperty)) {
            if (!sortProperty.equals(EntityDocumentKey.DEFAULT_ENTITY_SORT_PROPERTY_KEY)) {
                matchSortPropertyName(criteriaList, sortProperty);
            }
        }

        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        if(!ValidateUtil.isEmptyData(criteriaList))
            aggregationOperationList.add(match(criteria));

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

        List<Entity> entityList = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(Entity.class),
                        Entity.class)
                .getMappedResults();

        List<EntityProviderDto> entityProviderDtoList = new ArrayList<>();
        entityList.stream().forEach((entity) -> {
            EntityProviderDto entityProviderDto = EntityProviderDto.builder()
                    .provider(entity.getId().getServicePath())
                    .entity(mapEntityToEntityDto(entity))
                    .build();
            entityProviderDtoList.add(entityProviderDto);
        });
        return new PageImpl<>(entityProviderDtoList, pageable, total);
    }

    public void getQuery(List<Criteria> criteriaList, QueryDto queryDto) {
        if(!ValidateUtil.isEmptyData(queryDto.getId()))
            criteriaList.add(Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY).is(queryDto.getId()));

        if(!ValidateUtil.isEmptyData(queryDto.getType()))
            criteriaList.add(Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_TYPE_KEY).is(queryDto.getType()));

        if(!ValidateUtil.isEmptyData(queryDto.getQ()))
            getQQuery(criteriaList, queryDto);

        if(!ValidateUtil.isEmptyData(queryDto.getLink()))
            criteriaList.add(Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_CONTEXT_KEY).is(queryDto.getLink()));
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
        if(q.contains("==")) { // String, DateTime String, Boolean, Integer, Double type 지원, _id.id key 지원
            String[] splitQ = q.split("==");
            if(splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                if(key.equals(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY)) {
                    return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ID_KEY).is(value);
                } else if(key.equals(EntityDocumentKey.DEFAULT_ENTITY_SERVICE_PATH_KEY)) {
                    return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_SERVICE_PATH_KEY).is(value);
                } else {
                    String[] splitKey = key.split("\\.");
                    if (splitKey.length == 1) {
                        Object parsedValue = parsedAttributeEqualValueType(key, value);
                        return matchAttributeEqualValue(key, parsedValue);
                    } else if (splitKey.length == 2) {
                        String attributeName = splitKey[0];
                        String childAttributeName = splitKey[1];
                        Object parsedValue = parsedAttributeEqualValueType(childAttributeName, value);
                        return matchChildAttributeEqualValue(attributeName, childAttributeName, parsedValue);
                    } else {
                        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                    }
                }
            }
        } else if(q.contains("~=")) { // String, DateTime String type 지원, _id.id key 지원
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
                        return matchAttributePatternStringValue(key, String.valueOf(parsedValue));
                    } else if (splitKey.length == 2) {
                        String attributeName = splitKey[0];
                        String childAttributeName = splitKey[1];
                        Object parsedValue = parsedAttributePatternValueType(childAttributeName, value);
                        return matchChildAttributePatternStringValue(attributeName, childAttributeName, String.valueOf(parsedValue));
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
                    return matchAttributeLessThanEqualValue(key, parsedValue);
                } else if(splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = parsedAttributeOperatorValueType(childAttributeName, value);
                    return matchChildAttributeLessThanEqualValue(attributeName, childAttributeName, parsedValue);
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
                    return matchAttributeGreaterThanEqualValue(key, parsedValue);
                } else if(splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = parsedAttributeOperatorValueType(childAttributeName, value);
                    return matchChildAttributeGreaterThanEqualValue(attributeName, childAttributeName, parsedValue);
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
    public Criteria matchAttributeEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").is(value));
    }

    // attribute value 매칭 - equal operator (~=)
    public Criteria matchAttributePatternStringValue(String attributeName, String value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").regex(value, "i"));
    }

    // attribute value 매칭 - equal operator (<=)
    public Criteria matchAttributeLessThanEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").lte(value));
    }

    // attribute value 매칭 - equal operator (>=)
    public Criteria matchAttributeGreaterThanEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").gte(value));
    }

    // child attribute value 매칭 - equal operator (==)
    public Criteria matchChildAttributeEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                        Criteria.where("name").is(childAttributeName)
                                                .and("value").is(value)));
    }

    // child attribute value 매칭 - equal operator (~=)
    public Criteria matchChildAttributePatternStringValue(String attributeName, String childAttributeName, String value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                        Criteria.where("name").is(childAttributeName)
                                                .and("value").regex(value, "i")));
    }

    // child attribute value 매칭 - equal operator (<=)
    public Criteria matchChildAttributeLessThanEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                        Criteria.where("name").is(childAttributeName)
                                                .and("value").lte(value)));
    }

    // child attribute value 매칭 - equal operator (>=)
    public Criteria matchChildAttributeGreaterThanEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                        Criteria.where("name").is(childAttributeName)
                                                .and("value").gte(value)));
    }

    public EntityDto mapEntityToEntityDto(Entity entity) {

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
        for (Attribute attribute : attributes) {
            String type = attribute.getType();
            if(type.equals(PROPERTY.getCode())) {
                PropertyDto propertyDto = new PropertyDto();
                propertyDto.setType(type);
                propertyDto.setValue(attribute.getValue());
                mapChildAttribute(propertyDto, attribute);
                entityDto.put(attribute.getName(), propertyDto);
            } else if(type.equals(GEO_PROPERTY.getCode())) {
                GeoPropertyDto geoPropertyDto = new GeoPropertyDto();
                geoPropertyDto.setType(type);
                GeoJsonImpl value = objectMapper.convertValue(attribute.getValue(), GeoJsonImpl.class);
                geoPropertyDto.setValue(value);
                mapChildAttribute(geoPropertyDto, attribute);
                entityDto.put(attribute.getName(), geoPropertyDto);
            } else if(type.equals(RELATIONSHIP.getCode())) {
                RelationshipDto relationshipDto = new RelationshipDto();
                relationshipDto.setType(type);
                relationshipDto.setObject(attribute.getValue());
                mapChildAttribute(relationshipDto, attribute);
                entityDto.put(attribute.getName(), relationshipDto);
            }
        }
        return entityDto;
    }

    public void mapChildAttribute(LinkedHashMap<String, Object> attributeDto, Attribute attribute) {

        List<Attribute> childAttributes = attribute.getMd();

        // childAttributes 매핑
        if(!ValidateUtil.isEmptyData(childAttributes)) {
            for (Attribute childAttribute : childAttributes) {
                String attributeKey = childAttribute.getName();

                if (attributeKey.equals(UNIT_CODE.getCode()) || attributeKey.equals(OBSERVED_AT.getCode())) {
                    attributeDto.put(attributeKey, childAttribute.getValue());
                } else {
                    String childType = childAttribute.getType();
                    if(attribute.getType().equals(PROPERTY.getCode())) {
                        PropertyDto childPropertyDto = new PropertyDto();
                        childPropertyDto.setType(childType);
                        childPropertyDto.setValue(childAttribute.getValue());
                        attributeDto.put(attributeKey, childPropertyDto);
                    } else if(attribute.getType().equals(GEO_PROPERTY.getCode())) {
                        GeoPropertyDto childGeoPropertyDto = new GeoPropertyDto();
                        childGeoPropertyDto.setType(childType);
                        childGeoPropertyDto.setValue((GeoJsonImpl) childAttribute.getValue());
                        attributeDto.put(attributeKey, childGeoPropertyDto);
                    } else if(attribute.getType().equals(RELATIONSHIP.getCode())) {
                        RelationshipDto childRelationshipDto = new RelationshipDto();
                        childRelationshipDto.setType(childType);
                        childRelationshipDto.setObject(childAttribute.getValue());
                        attributeDto.put(attributeKey, childRelationshipDto);
                    }
                }
            }
        }
    }

    public Entity saveEntity(EntityDto entityDto) {
        Entity entity = mapEntityDtoToEntity(entityDto);
        return saveEntity(entity);
    }

    public Entity saveEntityWithProvider(String provider, EntityDto entityDto) {
        Entity entity = mapEntityDtoToEntity(entityDto);
        entity.getId().setServicePath(provider);
        return saveEntity(entity);
    }

    public Entity mapEntityDtoToEntity(EntityDto entityDto) {

        EntityId entityId = EntityId.builder()
                .id(entityDto.getId())
                .type(entityDto.getType())
                .servicePath(EntityDocumentKey.DEFAULT_SERVICE_PATH)
                .build();

        LinkedHashMap<String, String> attributeNames = new LinkedHashMap<>();
        List<Attribute> attributes = new ArrayList<>();
        Map<String, String> dataModelsInCoreContext = new HashMap<>();
//        Map<String, String> dataModelsInCoreContext = contextCacheService.getDataModelsInContext("https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld");
        Map<String, String> dataModelsInContext = contextCacheService.getDataModelsInContext(entityDto.getContext());
        for(String key : entityDto.keySet()) {
            // attribute key 인 경우
            if(!hasCoreContextDataModel(key)) {
                LinkedHashMap<String, Object> attributeDto = (LinkedHashMap<String, Object>) entityDto.get(key);

                LinkedHashMap<String, String> childAttributeNames = new LinkedHashMap<>();
                List<Attribute> childAttributes = new ArrayList<>();

                for(String attributeKey : attributeDto.keySet()) {
                    // childAttribute 가 있는 경우
                    if (!attributeKey.equals(TYPE.getCode()) && !attributeKey.equals(VALUE.getCode()) && !attributeKey.equals(OBJECT.getCode())) {

                        String childAttributeURI = findAttributeNameInContext(dataModelsInContext, attributeKey);
                        childAttributeNames.put(attributeKey, childAttributeURI);

                        Attribute childAttribute = null;
                        // childAttribute key 가 unitCode 또는 observedAt 인 경우
                        if (attributeKey.equals(UNIT_CODE.getCode())) {
                            childAttribute = Attribute.builder()
                                    .name(attributeKey)
                                    .value(attributeDto.get(attributeKey))
                                    .build();
                        } else if (attributeKey.equals(OBSERVED_AT.getCode())) {
                            childAttribute = Attribute.builder()
                                    .name(attributeKey)
                                    .value(Timestamp.valueOf(LocalDateTime.parse(String.valueOf(attributeDto.get(attributeKey)))))
                                    .build();
                        } else {
                            LinkedHashMap<String, Object> childAttributeMap = (LinkedHashMap<String, Object>) attributeDto.get(attributeKey);
                            String childType = (String) childAttributeMap.get(TYPE.getCode());

                            childAttribute = Attribute.builder()
                                    .name(attributeKey)
                                    .type(childType)
                                    .value(getValue(childType, childAttributeMap))
                                    .build();
                        }
                        childAttributes.add(childAttribute);
                    }
                }

                String type = (String) attributeDto.get(TYPE.getCode());

                Attribute attribute = Attribute.builder()
                        .name(key)
                        .type(type)
                        .value(getValue(type, attributeDto))
                        .mdNames(childAttributeNames)
                        .md(childAttributes)
                        .build();

                String attributeURI = findAttributeNameInContext(dataModelsInContext, key);
                attributeNames.put(key, attributeURI);
                attributes.add(attribute);
            }
        }

        return Entity.builder()
                .id(entityId)
                .context(entityDto.getContext())
                .attrNames(attributeNames)
                .attrs(attributes)
                .build();
    }

    public String findAttributeNameInContext(Map<String, String> dataModelsInContext, String attributeKey) {
        String attributeName = dataModelsInContext.get(attributeKey);
//        if(attributeName == null || attributeName.equals("")) {
//            attributeName = dataModelsInCoreContext.get(attributeKey);
//            if(attributeName == null || attributeName.equals(""))
//                throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Invalid Attribute Context URI. Attribute name : " + attributeKey);
//        }
        return attributeName;
    }

    public Object getValue(String attributeType, LinkedHashMap<String, Object> attributeDto) {
        if (attributeType.equals(RELATIONSHIP.getCode()))
            return attributeDto.get(OBJECT.getCode());
        else
            return attributeDto.get(VALUE.getCode());
    }
}
