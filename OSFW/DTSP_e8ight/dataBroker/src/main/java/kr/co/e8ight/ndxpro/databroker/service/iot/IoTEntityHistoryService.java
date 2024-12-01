package kr.co.e8ight.ndxpro.databroker.service.iot;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.domain.datamanager.AttributeResponseDto;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityHistory;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityTotalCount;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import kr.co.e8ight.ndxpro.databroker.dto.QueryDto;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityDto;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.service.AttributeCacheService;
import kr.co.e8ight.ndxpro.databroker.service.EntityDocumentKey;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.data.mongodb.core.aggregation.AddFieldsOperation.addField;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
import static org.springframework.data.mongodb.core.aggregation.ArrayOperators.arrayOf;

@Slf4j
@Service
public class IoTEntityHistoryService {

    private final IoTEntityService ioTEntityService;

    private final AttributeCacheService attributeCacheService;

    private final MongoTemplate mongoTemplate;

    public IoTEntityHistoryService(IoTEntityService ioTEntityService, AttributeCacheService attributeCacheService, MongoTemplate mongoTemplate) {
        this.ioTEntityService = ioTEntityService;
        this.attributeCacheService = attributeCacheService;
        this.mongoTemplate = mongoTemplate;
    }

    public Page<EntityDto> getTemporalIoTEntities(QueryDto queryDto) {

        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        List<Criteria> criteriaList = new ArrayList<>();

        // context match
        String context = queryDto.getLink();
        if(!ValidateUtil.isEmptyData(context))
            criteriaList.add(matchContext(context));

        // type match
        String type = queryDto.getType();
        if(!ValidateUtil.isEmptyData(type))
            criteriaList.add(matchType(type));

        // q 쿼리 match
        if (!ValidateUtil.isEmptyData(queryDto.getQ()))
            getQQuery(criteriaList, queryDto);

        // timeproperty value match
        matchTimepropertyValue(criteriaList, queryDto.getTimerel(), queryDto.getTimeproperty(), queryDto.getTime(), queryDto.getEndTime());

        Criteria criteria = new Criteria();
        criteria.andOperator(criteriaList);
        aggregationOperationList.add(match(criteria));

        // total 조회
        IoTEntityTotalCount ioTEntityTotalCount = getEntityHistoriesTotalCount(aggregationOperationList);

        setTimeproperty(aggregationOperationList, queryDto.getTimeproperty());
        sortTimeproperty(aggregationOperationList);

        // pageable 적용
        Pageable pageable = PageRequest.of(queryDto.getOffset(), queryDto.getLimit());
        setPageableAggregation(aggregationOperationList, pageable);

        List<IoTEntityHistory> ioTEntityHistoryList = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(IoTEntityHistory.class),
                        IoTEntityHistory.class)
                .getMappedResults();

        List<EntityDto> iotEntityDtoList = new ArrayList<>();
        ioTEntityHistoryList.stream().forEach((ioTEntity) -> {
            iotEntityDtoList.add(ioTEntityService.mapEntityToEntityDto(ioTEntity.getEntity()));
        });

        if(ValidateUtil.isEmptyData(ioTEntityTotalCount))
            ioTEntityTotalCount = new IoTEntityTotalCount();
        return new PageImpl<>(iotEntityDtoList, pageable, ioTEntityTotalCount.getTotal());
    }

    public IoTEntityDto getIoTEntityHistory(String historyId, String timeProperty) {
        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        List<Criteria> criteriaList = new ArrayList<>();

        // history id match
        criteriaList.add(matchHistoryId(historyId));

        // timeproperty match
        if (!ValidateUtil.isEmptyData(timeProperty))
            matchTimepropertyName(criteriaList, timeProperty);

        Criteria criteria = new Criteria();
        criteria.andOperator(criteriaList);
        aggregationOperationList.add(match(criteria));

        // timeproperty value 조회 적용
        if (!ValidateUtil.isEmptyData(timeProperty)) {
            setTimeproperty(aggregationOperationList, timeProperty);
            sortTimeproperty(aggregationOperationList);
        }

        IoTEntityHistory iotEntityHistory = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(IoTEntityHistory.class),
                        IoTEntityHistory.class)
                .getUniqueMappedResult();
        if(ValidateUtil.isEmptyData(iotEntityHistory))
            throw new DataBrokerException(ErrorCode.RESOURCE_NOT_FOUND, "Not Found Entity History. historyId = " + historyId);

        return IoTEntityDto.builder()
                .historyId(iotEntityHistory.get_id())
                .observedAt(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT, iotEntityHistory.getObservedAt()))
                .provider(iotEntityHistory.getEntity().getId().getServicePath())
                .entity(ioTEntityService.mapEntityToEntityDto(iotEntityHistory.getEntity()))
                .build();
    }

    public Page<IoTEntityDto> getIoTEntityHistories(QueryDto queryDto) {
        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        List<Criteria> criteriaList = new ArrayList<>();

        // id, context match
        matchEntityIdAndContext(criteriaList, queryDto);

        // timeproperty match
        if (!ValidateUtil.isEmptyData(queryDto.getTimeproperty())) {
            if (!ValidateUtil.isEmptyData(queryDto.getTimerel())) {
                matchTimepropertyValue(criteriaList, queryDto.getTimerel(), queryDto.getTimeproperty(), queryDto.getTime(), queryDto.getEndTime());
//            } else {
//                matchTimepropertyName(criteriaList, queryDto.getTimeproperty());
            }
        }

        // q 쿼리 match
        if (!ValidateUtil.isEmptyData(queryDto.getQ()))
            getQQuery(criteriaList, queryDto);

        Criteria criteria = new Criteria();
        criteria.andOperator(criteriaList);
        aggregationOperationList.add(match(criteria));

        // total 조회
        IoTEntityTotalCount ioTEntityTotalCount = getEntityHistoriesTotalCount(aggregationOperationList);

        // timeproperty value 조회 적용
        String timeProperty = queryDto.getTimeproperty();
        if (!ValidateUtil.isEmptyData(queryDto.getTimeproperty())) {
            setTimeproperty(aggregationOperationList, timeProperty);
            sortTimeproperty(aggregationOperationList);
        } else {
            // sortproperty 적용
            String sortType = queryDto.getSort().getType();
            String sortProperty = queryDto.getSortproperty();
            if (!ValidateUtil.isEmptyData(sortProperty)) {
                if (!sortProperty.equals(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_SORT_PROPERTY_KEY)) {
                    aggregationOperationList.add(match(matchSortPropertyName(sortProperty)));
                }
            }

            // sortProperty value 조회 적용
            if (!ValidateUtil.isEmptyData(sortProperty)) {
                if (!sortProperty.equals(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_SORT_PROPERTY_KEY)) {
                    setSortProperty(aggregationOperationList, sortProperty);
                    sortSortProperty(aggregationOperationList, sortType);
                } else {
                    aggregationOperationList.add(
                            sort(Sort.Direction.valueOf(sortType), sortProperty));
                }
            }
        }

        // pageable 적용
        Pageable pageable = PageRequest.of(queryDto.getOffset(), queryDto.getLimit());
        setPageableAggregation(aggregationOperationList, pageable);

        List<IoTEntityHistory> ioTEntityHistoryList = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(IoTEntityHistory.class),
                        IoTEntityHistory.class)
                .getMappedResults();

        List<IoTEntityDto> ioTEntityDtoList = new ArrayList<>();
        ioTEntityHistoryList.stream().forEach((ioTEntity) -> {
            ioTEntityDtoList.add(IoTEntityDto.builder()
                    .historyId(ioTEntity.get_id())
                    .observedAt(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT, ioTEntity.getObservedAt()))
                    .provider(ioTEntity.getEntity().getId().getServicePath())
                    .entity(ioTEntityService.mapEntityToEntityDto(ioTEntity.getEntity()))
                    .build());
        });

        if(ValidateUtil.isEmptyData(ioTEntityTotalCount))
            ioTEntityTotalCount = new IoTEntityTotalCount();
        return new PageImpl<>(ioTEntityDtoList, pageable, ioTEntityTotalCount.getTotal());
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

    public void validateSortPropertyValueType(String sortPropertyValueType) {
        if(!sortPropertyValueType.equals("String") &&
                !sortPropertyValueType.equals("Boolean") &&
                !sortPropertyValueType.equals("Integer") &&
                !sortPropertyValueType.equals("Double")) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid sort property valueType. sort property valueType=" + sortPropertyValueType);
        }
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
                                        arrayOf(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).filter().as("attrs").by(
                                                ComparisonOperators.valueOf("attrs.name").equalToValue(sortProperty)))
                                        .first())
                        .build());
    }

    // child sortProperty attribute value 찾기
    public void setChildSortPropertyAttributeAggregation(List<AggregationOperation> aggregationOperationList, String attributeName, String sortPropertyName) {
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).filter().as("attrs").by(
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

    public IoTEntityTotalCount getEntityHistoriesTotalCount(List<AggregationOperation> aggregationOperationList) {
        List<AggregationOperation> aggregationOperationListForCountTotal = new ArrayList<>();
        aggregationOperationListForCountTotal.addAll(aggregationOperationList);
        aggregationOperationListForCountTotal.add(group().count().as("total"));
        Aggregation totalAggregation = newAggregation(aggregationOperationListForCountTotal);
        return mongoTemplate.aggregate(
                        totalAggregation,
                        mongoTemplate.getCollectionName(IoTEntityHistory.class),
                        IoTEntityTotalCount.class)
                .getUniqueMappedResult();
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

    public void matchEntityIdAndContext(List<Criteria> criteriaList, QueryDto queryDto) {
        String context = queryDto.getLink();
        String entityId = queryDto.getId();

        if(!ValidateUtil.isEmptyData(entityId))
            criteriaList.add(matchEntityId(entityId));

        if(!ValidateUtil.isEmptyData(context))
            criteriaList.add(matchContext(context));
    }

    public Criteria getQueryWithOperator(String q) {
        if (q.contains("==")) { // String, DateTime String, Boolean, Integer, Double type 지원
            String[] splitQ = q.split("==");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                String[] splitKey = key.split("\\.");
                if (splitKey.length == 1) {
                    Object parsedValue = ioTEntityService.parsedAttributeEqualValueType(key, value);
                    return matchAttributeEqualValue(key, parsedValue);
                } else if (splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = ioTEntityService.parsedAttributeEqualValueType(childAttributeName, value);
                    return matchChildAttributeEqualValue(attributeName, childAttributeName, parsedValue);
                } else {
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                }
            }
        } else if (q.contains("~=")) { // String, DateTime String type 지원
            String[] splitQ = q.split("~=");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                String[] splitKey = key.split("\\.");
                if (splitKey.length == 1) {
                    Object parsedValue = ioTEntityService.parsedAttributePatternValueType(key, value);
                    return matchAttributePatternStringValue(key, String.valueOf(parsedValue));
                } else if (splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = ioTEntityService.parsedAttributePatternValueType(childAttributeName, value);
                    return matchChildAttributePatternStringValue(attributeName, childAttributeName, String.valueOf(parsedValue));
                } else {
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                }
            }
        } else if (q.contains("<=")) { // DateTime String, Integer, Double 지원
            String[] splitQ = q.split("<=");
            if (splitQ.length == 2) {
                String key = splitQ[0];
                String value = splitQ[1];
                String[] splitKey = key.split("\\.");
                if (splitKey.length == 1) {
                    Object parsedValue = ioTEntityService.parsedAttributeOperatorValueType(key, value);
                    return matchAttributeLessThanEqualValue(key, parsedValue);
                } else if (splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = ioTEntityService.parsedAttributeOperatorValueType(childAttributeName, value);
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
                if (splitKey.length == 1) {
                    Object parsedValue = ioTEntityService.parsedAttributeOperatorValueType(key, value);
                    return matchAttributeGreaterThanEqualValue(key, parsedValue);
                } else if (splitKey.length == 2) {
                    String attributeName = splitKey[0];
                    String childAttributeName = splitKey[1];
                    Object parsedValue = ioTEntityService.parsedAttributeOperatorValueType(childAttributeName, value);
                    return matchChildAttributeGreaterThanEqualValue(attributeName, childAttributeName, parsedValue);
                } else {
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Request Key of Q is Invalid. q=" + q);
                }
            }
        }
        // 지원하지 않는 연산자
        throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Operator or Q Query. q=" + q);
    }

    // timeproperty attribute name 찾기
    public void matchTimepropertyName(List<Criteria> criteriaList, String timeproperty) {
        String[] splitTimeProperty = timeproperty.split("\\.");
        if(splitTimeProperty.length == 1) {
            String timePropertyValueType = getAttributeValueType(timeproperty);
            validateTimePropertyValueType(timePropertyValueType);

            criteriaList.add((matchAttributeName(timeproperty)));
        } else if(splitTimeProperty.length == 2) {
            String attributeName = splitTimeProperty[0];
            getAttributeValueType(attributeName);

            String timePropertyName = splitTimeProperty[1];
            String timePropertyValueType = getAttributeValueType(timePropertyName);
            validateTimePropertyValueType(timePropertyValueType);

            criteriaList.add(matchChildAttributeName(attributeName, timePropertyName));
        } else {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Property. timeproperty=" + timeproperty);
        }
    }

    // timeproperty attribute value 찾기
    public void matchTimepropertyValue(List<Criteria> criteriaList, String timerel, String timeproperty, String time, String endTime) {
        String[] splitTimeProperty = timeproperty.split("\\.");
//        if(ValidateUtil.isEmptyData(timerel))
//            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Relation. timerel=" + timerel);

        String parsedDate = DataBrokerDateFormat.parseUTCDateString(time);

        if(splitTimeProperty.length == 1) {
            String timePropertyValueType = getAttributeValueType(timeproperty);
            validateTimePropertyValueType(timePropertyValueType);

            if(ValidateUtil.isEmptyData(timerel)) {
                criteriaList.add((matchAttributeEqualValue(timeproperty, parsedDate)));
                return;
            }
            switch (timerel) {
                case "before":
                    criteriaList.add((matchAttributeLessThanEqualValue(timeproperty, parsedDate)));
                    break;
                case "after":
                    criteriaList.add((matchAttributeGreaterThanEqualValue(timeproperty, parsedDate)));
                    break;
                case "between":
                    String parsedEndDate = DataBrokerDateFormat.parseUTCDateString(endTime);
                    criteriaList.add((matchTimepropertyValueByBetweenOperator(timeproperty, parsedDate, parsedEndDate)));
                    break;
                default:
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Relation. timerel=" + timerel);
            }
        } else if(splitTimeProperty.length == 2) {
            String attributeName = splitTimeProperty[0];
            getAttributeValueType(attributeName);

            String timePropertyName = splitTimeProperty[1];
            String timePropertyValueType = getAttributeValueType(timePropertyName);
            validateTimePropertyValueType(timePropertyValueType);

            if(ValidateUtil.isEmptyData(timerel)) {
                criteriaList.add((matchChildAttributeEqualValue(attributeName, timePropertyName, parsedDate)));
                return;
            }
            switch (timerel) {
                case "before":
                    criteriaList.add((matchChildAttributeLessThanEqualValue(attributeName, timePropertyName, parsedDate)));
                    break;
                case "after":
                    criteriaList.add((matchChildAttributeGreaterThanEqualValue(attributeName, timePropertyName, parsedDate)));
                    break;
                case "between":
                    String parsedEndDate = DataBrokerDateFormat.parseUTCDateString(endTime);
                    criteriaList.add((matchChildTimepropertyValueByBetweenOperator(attributeName, timePropertyName, parsedDate, parsedEndDate)));
                    break;
                default:
                    throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Relation. timerel=" + timerel);
            }
        } else {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Property. timeproperty=" + timeproperty);
        }
    }

    public String getAttributeValueType(String attributeName) {
        AttributeResponseDto attribute = attributeCacheService.getAttribute(attributeName);
        if(ValidateUtil.isEmptyData(attribute))
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid attribute. attributeName=" + attributeName);
        return attribute.getValueType();
    }

    public void validateTimePropertyValueType(String timePropertyValueType) {
        if(!timePropertyValueType.equals("String")) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid time property valueType. time property valueType=" + timePropertyValueType);
        }
    }

    // timeproperty attribute value 세팅
    public void setTimeproperty(List<AggregationOperation> aggregationOperationList, String timeproperty) {
        String[] splitTimeProperty = timeproperty.split("\\.");
        if(splitTimeProperty.length == 1) {
            setTimepropertyAttributeAggregation(aggregationOperationList, timeproperty);
        } else if(splitTimeProperty.length == 2) {
            String attributeName = splitTimeProperty[0];
            String timePropertyName = splitTimeProperty[1];
            setChildTimepropertyAttributeAggregation(aggregationOperationList, attributeName, timePropertyName);
        } else {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid Time Property. timeproperty=" + timeproperty);
        }
        setTimepropertyAttributeValue(aggregationOperationList);
    }

    // sort timeproperty value
    public void sortTimeproperty(List<AggregationOperation> aggregationOperationList){
        aggregationOperationList.add(
                sort(Sort.Direction.DESC, "observedAt"));
    }

    // timeproperty attribute value 찾기
    public void setTimepropertyAttributeAggregation(List<AggregationOperation> aggregationOperationList, String timePropertyName) {
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf("entity.attrs").filter().as("attrs").by(
                                                        ComparisonOperators.valueOf("attrs.name").equalToValue(timePropertyName)))
                                        .first())
                        .build());
    }

    // child timeproperty attribute value 찾기
    public void setChildTimepropertyAttributeAggregation(List<AggregationOperation> aggregationOperationList, String attributeName, String timePropertyName) {
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf("entity.attrs").filter().as("attrs").by(
                                                        ComparisonOperators.valueOf("attrs.name").equalToValue(attributeName)))
                                        .first())
                        .build());
        aggregationOperationList.add(
                addField("temp").withValueOf(
                                arrayOf(
                                        arrayOf("temp.md").filter().as("md").by(
                                                        ComparisonOperators.valueOf("md.name").equalToValue(timePropertyName)))
                                        .first())
                        .build());
    }

    // add field observedAt value
    public void setTimepropertyAttributeValue(List<AggregationOperation> aggregationOperationList) {
        aggregationOperationList.add(
                addField("observedAt").withValueOf(DateOperators.dateFromString("$temp.value"))
                        .build());
    }

    // entity id 매칭
    public Criteria matchEntityId(String entityId) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ID_KEY).is(entityId);
    }

    // entity id 매칭
    public Criteria matchHistoryId(String historyId) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ID_KEY).is(historyId);
    }

    // context 매칭
    public Criteria matchContext(String context) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_CONTEXT_KEY).is(context);
    }

    // entity type 매칭
    public Criteria matchType(String type) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_TYPE_KEY).is(type);
    }

    // attribute name 매칭
    public Criteria matchAttributeName(String attributeName) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName));
    }

    // child attribute name 매칭
    public Criteria matchChildAttributeName(String attributeName, String childAttributeName) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)));
    }

    // attribute value 매칭 - equal operator (==)
    public Criteria matchAttributeEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").is(value));
    }

    // attribute value 매칭 - equal operator (~=)
    public Criteria matchAttributePatternStringValue(String attributeName, String value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").regex(value, "i"));
    }

    // attribute value 매칭 - equal operator (<=)
    public Criteria matchAttributeLessThanEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").lte(value));
    }

    // attribute value 매칭 - equal operator (>=)
    public Criteria matchAttributeGreaterThanEqualValue(String attributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").gte(value));
    }

    // child attribute value 매칭 - equal operator (==)
    public Criteria matchChildAttributeEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").is(value)));
    }

    // child attribute value 매칭 - equal operator (~=)
    public Criteria matchChildAttributePatternStringValue(String attributeName, String childAttributeName, String value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").regex(value, "i")));
    }

    // child attribute value 매칭 - equal operator (<=)
    public Criteria matchChildAttributeLessThanEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").lte(value)));
    }

    // child attribute value 매칭 - equal operator (>=)
    public Criteria matchChildAttributeGreaterThanEqualValue(String attributeName, String childAttributeName, Object value) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").gte(value)));
    }

    // timeproperty value 매칭 - between operator
    public Criteria matchTimepropertyValueByBetweenOperator(String attributeName, String time, String endTime) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("value").gte(endTime).lte(time));
    }

    // child timeproperty value 매칭 - between operator
    public Criteria matchChildTimepropertyValueByBetweenOperator(String attributeName, String childAttributeName, String time, String endTime) {
        return Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY).elemMatch(
                Criteria.where("name").is(attributeName)
                        .and("md").elemMatch(
                                Criteria.where("name").is(childAttributeName)
                                        .and("value").gte(time).lte(endTime)));
    }

    // pageable 적용
    public void setPageableAggregation(List<AggregationOperation> aggregationOperationList, Pageable pageable) {
        aggregationOperationList.add(
                skip(pageable.getPageNumber() * pageable.getPageSize()));
        aggregationOperationList.add(
                limit(pageable.getPageSize()));
    }

//    public void deleteTemporalEntities(int scenarioId, String scenarioType, String date, String timeGroup) {
//        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
//
//        log.info("get ioTObservedAtList " + LocalDateTime.now());
//        aggregationOperationList.add(
//                match(
//                        Criteria.where("scenarioId").is(scenarioId)
//                                .and("scenarioType").is(scenarioType)
//                                .and("date").is(date)
//                                .and("timeGroup").is(timeGroup)));
//        aggregationOperationList.add(
//                sort(Sort.Direction.ASC, "datetime"));
//
//        List<IoTObservedAt> ioTObservedAtList = mongoTemplate.aggregate(
//                        newAggregation(aggregationOperationList),
//                        mongoTemplate.getCollectionName(IoTObservedAt.class),
//                        IoTObservedAt.class)
//                .getMappedResults();
//
//        if (!ValidateUtil.isEmptyData(ioTObservedAtList)) {
//            Date firstDateTime = ioTObservedAtList.get(0).getDatetime();
//            Date lastDateTime = ioTObservedAtList.get(ioTObservedAtList.size() - 1).getDatetime();
//
//            log.info("remove iotEntities " + LocalDateTime.now());
//            // iotEntitiesHis collection 에서 시간대 범위내의 observedAt 값을 가진 Entity 찾아서 제거
//            mongoTemplate.remove(
//                    new Query(
//                            Criteria.where(EntityDocumentKey.DEFAULT_HISTORY_ENTITY_ATTRS_KEY+".md")
//                                    .elemMatch(Criteria.where("name").is("observedAt")
//                                            .and("value")
//                                    .gte(DataBrokerDateFormat.parseUTCDateString(
//                                            DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE, firstDateTime)))
//                                    .lte(DataBrokerDateFormat.parseUTCDateString(
//                                            DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE, lastDateTime))))),
//                    mongoTemplate.getCollectionName(IoTEntityHistory.class)
//            );
//            log.info("remove Entities from " + DataBrokerDateFormat.parseUTCDateString(
//                            DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE, firstDateTime))
//                    + " to " + DataBrokerDateFormat.parseUTCDateString(
//                                    DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_TIME_FORMAT_WITH_TIME_ZONE, lastDateTime)));
//
//            log.info("remove iotObservedAtList " + LocalDateTime.now());
//            // iotObservedAt collection 에서 시간대 범위내의 observedAt 값 제거
//            mongoTemplate.remove(
//                    new Query(
//                            Criteria.where("scenarioId").is(scenarioId)
//                                    .and("scenarioType").is(scenarioType)
//                                    .and("date").is(date)
//                                    .and("timeGroup").is(timeGroup)
//                                    .and("datetime")
//                                        .gte(firstDateTime)
//                                        .lte(lastDateTime)),
//                    mongoTemplate.getCollectionName(IoTObservedAt.class)
//            );
//
//            log.info("Finish Remove");
//        }
//    }
}
