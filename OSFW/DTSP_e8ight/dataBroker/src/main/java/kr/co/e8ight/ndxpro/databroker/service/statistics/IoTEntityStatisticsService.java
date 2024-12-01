package kr.co.e8ight.ndxpro.databroker.service.statistics;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityValidation;
import kr.co.e8ight.ndxpro.databroker.domain.statistics.IoTEntityStatisticsId;
import kr.co.e8ight.ndxpro.databroker.domain.statistics.IoTEntityStatisticsWithObjectId;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityValidationDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityDataModelListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.StatisticsDto;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Slf4j
@Service
public class IoTEntityStatisticsService {
    private final MongoTemplate mongoTemplate;

    private final ObjectMapper objectMapper;

    public IoTEntityStatisticsService(MongoTemplate mongoTemplate, ObjectMapper objectMapper) {
        this.mongoTemplate = mongoTemplate;
        this.objectMapper = objectMapper;
    }

    public IoTEntityStatisticsDto getTotalEntities(Date date, String dataModel, String provider) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("_id.date").is(date));
        Fields groupFields = Fields.fields("_id.date").and("_id.status");

        if(!ValidateUtil.isEmptyData(dataModel)) {
            criteriaList.add(Criteria.where("_id.dataModel").is(dataModel));
            groupFields = groupFields.and("_id.dataModel");
        } else {
            criteriaList.add(Criteria.where("_id.dataModel").exists(true).ne(null));
        }

        if(!ValidateUtil.isEmptyData(provider)) {
            criteriaList.add(Criteria.where("_id.servicePath").is(provider));
            groupFields = groupFields.and("_id.servicePath");
        } else {
            criteriaList.add(Criteria.where("_id.servicePath").exists(true).ne(null));
        }

        IoTEntityStatisticsWithObjectId successEntities = getStatisticsWithStatus(criteriaList, groupFields, "success", null);

        IoTEntityStatisticsWithObjectId failEntities = getStatisticsWithStatus(criteriaList, groupFields, "fail", null);

        long totalEntities = 0;

        long successTotalEntities = 0;
        if(!ValidateUtil.isEmptyData(successEntities)) {
            successTotalEntities = successEntities.getTotalEntities();
            totalEntities += successTotalEntities;
        }
        long failTotalEntities = 0;
        if(!ValidateUtil.isEmptyData(failEntities)) {
            failTotalEntities = failEntities.getTotalEntities();
            totalEntities += failTotalEntities;
        }

        StatisticsDto statisticsDto = StatisticsDto.builder()
                .successEntities(successTotalEntities)
                .failEntities(failTotalEntities)
                .totalEntities(totalEntities)
                .build();
        return IoTEntityStatisticsDto.builder()
                .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                .dataModel(dataModel)
                .provider(provider)
                .statistics(statisticsDto)
                .build();
    }

    public IoTEntityStatisticsListDto     getTotalEntitiesByDateRange(List<Date> dateList, Date startDate, Date endDate, String dataModel, String provider) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("_id.date").gte(startDate).lte(endDate));
        Fields groupFields = Fields.fields("_id.date").and("_id.status");

        if(!ValidateUtil.isEmptyData(dataModel)) {
            criteriaList.add(Criteria.where("_id.dataModel").is(dataModel));
            groupFields = groupFields.and("_id.dataModel");
        } else {
            criteriaList.add(Criteria.where("_id.dataModel").exists(true).ne(null));
        }

        if(!ValidateUtil.isEmptyData(provider)) {
            criteriaList.add(Criteria.where("_id.servicePath").is(provider));
            groupFields = groupFields.and("_id.servicePath");
        } else {
            criteriaList.add(Criteria.where("_id.servicePath").exists(true).ne(null));
        }

        String sortField = "date";
        List<IoTEntityStatisticsWithObjectId> successEntities = getStatisticsListWithStatus(criteriaList, groupFields, "success", sortField);

        List<IoTEntityStatisticsWithObjectId> failEntities = getStatisticsListWithStatus(criteriaList, groupFields, "fail", sortField);

        // ioTEntityStatisticsDtoMap 초기화
        TreeMap<Date, StatisticsDto> statisticsDtoMap = new TreeMap<>();
        dateList.stream().forEach((date) -> {
            statisticsDtoMap.put(date, StatisticsDto.builder()
                    .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                    .build());
        });
        successEntities.stream().forEach(ioTEntityStatisticsWithObjectId -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(ioTEntityStatisticsWithObjectId.getId(), IoTEntityStatisticsId.class);
            Date date = ioTEntityStatisticsId.getDate();
            long successTotalEntities = ioTEntityStatisticsWithObjectId.getTotalEntities();

            StatisticsDto statisticsDto = StatisticsDto.builder()
                    .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                    .successEntities(successTotalEntities)
                    .totalEntities(successTotalEntities)
                    .build();
            statisticsDtoMap.put(date, statisticsDto);
        });

        failEntities.stream().forEach(ioTEntityStatisticsWithObjectId -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(ioTEntityStatisticsWithObjectId.getId(), IoTEntityStatisticsId.class);
            Date date = ioTEntityStatisticsId.getDate();
            StatisticsDto statisticsDto = statisticsDtoMap.get(date);

            long failTotalEntities = ioTEntityStatisticsWithObjectId.getTotalEntities();

            if(ValidateUtil.isEmptyData(statisticsDto)) {
                statisticsDto = StatisticsDto.builder()
                        .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                        .failEntities(failTotalEntities)
                        .totalEntities(failTotalEntities)
                        .build();
            } else {
                statisticsDto.setFailEntities(failTotalEntities);
                statisticsDto.setTotalEntities(statisticsDto.getTotalEntities() + failTotalEntities);
            }
            statisticsDtoMap.put(date, statisticsDto);
        });

        return IoTEntityStatisticsListDto.builder()
                .startDate(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, startDate))
                .endDate(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, endDate))
                .dataModel(dataModel)
                .provider(provider)
                .statistics(statisticsDtoMap.values().stream().collect(Collectors.toList()))
                .build();
    }

    public IoTEntityStatisticsListDto getTotalEntitiesByDataModel(Date date) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("_id.date").is(date));
        Fields groupFields = Fields.fields("_id.date")
                .and("_id.dataModel");

        String sortField = "dataModel";
        List<IoTEntityStatisticsWithObjectId> successEntities = getStatisticsListWithStatus(criteriaList, groupFields, "success", sortField);

        List<IoTEntityStatisticsWithObjectId> failEntities = getStatisticsListWithStatus(criteriaList, groupFields, "fail", sortField);

        TreeMap<String, StatisticsDto> statisticsDtoMap = new TreeMap<>();

        successEntities.stream().forEach(ioTEntityStatisticsWithObjectId -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(ioTEntityStatisticsWithObjectId.getId(), IoTEntityStatisticsId.class);
            String dataModel = ioTEntityStatisticsId.getDataModel();
            long successTotalEntities = ioTEntityStatisticsWithObjectId.getTotalEntities();

            StatisticsDto statisticsDto = StatisticsDto.builder()
                    .dataModel(dataModel)
                    .successEntities(successTotalEntities)
                    .totalEntities(successTotalEntities)
                    .build();
            statisticsDtoMap.put(dataModel, statisticsDto);
        });

        failEntities.stream().forEach(ioTEntityStatisticsWithObjectId -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(ioTEntityStatisticsWithObjectId.getId(), IoTEntityStatisticsId.class);
            String dataModel = ioTEntityStatisticsId.getDataModel();
            StatisticsDto statisticsDto = statisticsDtoMap.get(dataModel);

            long failTotalEntities = ioTEntityStatisticsWithObjectId.getTotalEntities();

            if(ValidateUtil.isEmptyData(statisticsDto)) {
                statisticsDto = StatisticsDto.builder()
                        .dataModel(dataModel)
                        .failEntities(failTotalEntities)
                        .totalEntities(failTotalEntities)
                        .build();
            } else {
                statisticsDto.setFailEntities(failTotalEntities);
                statisticsDto.setTotalEntities(statisticsDto.getTotalEntities() + failTotalEntities);
            }
            statisticsDtoMap.put(dataModel, statisticsDto);
        });

        return IoTEntityStatisticsListDto.builder()
                .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                .statistics(statisticsDtoMap.values().stream().collect(Collectors.toList()))
                .build();
    }

    public IoTEntityStatisticsListDto getTotalEntitiesByProvider(Date date, String dataModel) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("_id.date").is(date)
                .and("_id.dataModel").is(dataModel));
        Fields groupFields = Fields.fields("_id.date")
                .and("_id.servicePath");

        String sortField = "servicePath";
        List<IoTEntityStatisticsWithObjectId> successEntities = getStatisticsListWithStatus(criteriaList, groupFields, "success", sortField);

        List<IoTEntityStatisticsWithObjectId> failEntities = getStatisticsListWithStatus(criteriaList, groupFields, "fail", sortField);

        TreeMap<String, StatisticsDto> statisticsDtoMap = new TreeMap<>();

        successEntities.stream().forEach(ioTEntityStatisticsWithObjectId -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(ioTEntityStatisticsWithObjectId.getId(), IoTEntityStatisticsId.class);
            String servicePath = ioTEntityStatisticsId.getServicePath();
            long successTotalEntities = ioTEntityStatisticsWithObjectId.getTotalEntities();

            StatisticsDto statisticsDto = StatisticsDto.builder()
                    .provider(servicePath)
                    .successEntities(successTotalEntities)
                    .totalEntities(successTotalEntities)
                    .build();
            statisticsDtoMap.put(servicePath, statisticsDto);
        });

        failEntities.stream().forEach(ioTEntityStatisticsWithObjectId -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(ioTEntityStatisticsWithObjectId.getId(), IoTEntityStatisticsId.class);
            String servicePath = ioTEntityStatisticsId.getServicePath();
            StatisticsDto statisticsDto = statisticsDtoMap.get(servicePath);

            long failTotalEntities = ioTEntityStatisticsWithObjectId.getTotalEntities();

            if(ValidateUtil.isEmptyData(statisticsDto)) {
                statisticsDto = StatisticsDto.builder()
                        .provider(servicePath)
                        .failEntities(failTotalEntities)
                        .totalEntities(failTotalEntities)
                        .build();
            } else {
                statisticsDto.setFailEntities(failTotalEntities);
                statisticsDto.setTotalEntities(statisticsDto.getTotalEntities() + failTotalEntities);
            }
            statisticsDtoMap.put(servicePath, statisticsDto);
        });

        return IoTEntityStatisticsListDto.builder()
                .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                .dataModel(dataModel)
                .statistics(statisticsDtoMap.values().stream().collect(Collectors.toList()))
                .build();
    }

    public List<String> getEntityCollectionDateList(int year, int month) {
        List<AggregationOperation> aggregationOperationList = new ArrayList<>();

        LocalDate firstLocalDateOfMonth = LocalDate.of( year , month , 1 ) ;
        Date firstDateOfMonth = DataBrokerDateFormat.formatLocalDateToDate(firstLocalDateOfMonth) ;

        LocalDate firstLocalDateOfNextMonth = LocalDate.of( year , month + 1 , 1 ) ;
        Date firstDateOfNextMonth = DataBrokerDateFormat.formatLocalDateToDate(firstLocalDateOfNextMonth) ;

        aggregationOperationList.add(
                match(Criteria.where("_id.date").gte(firstDateOfMonth).lt(firstDateOfNextMonth)));

        aggregationOperationList.add(
                group("_id.date")
                        .sum("totalEntities")
                        .as("totalEntities"));

        aggregationOperationList.add(
                sort(Sort.Direction.ASC, "_id"));

        List<String> dateList = new ArrayList<>();
        List<IoTEntityStatisticsWithObjectId> ioTEntityStatisticsWithObjectIdList = mongoTemplate.aggregate(
                        newAggregation(aggregationOperationList),
                        mongoTemplate.getCollectionName(IoTEntityStatisticsWithObjectId.class),
                        IoTEntityStatisticsWithObjectId.class)
                .getMappedResults();

        ioTEntityStatisticsWithObjectIdList.stream().forEach((ioTEntityStatisticsWithObjectId) -> {
            dateList.add(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, (Date) ioTEntityStatisticsWithObjectId.getId()));
        });

        return dateList;
    }

    public IoTEntityDataModelListDto getEntityCollectionDataModelList(Date date) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("_id.date").is(date));
        Fields groupFields = Fields.fields("_id.date")
                .and("_id.dataModel");

        String sortField = "dataModel";
        List<IoTEntityStatisticsWithObjectId> statisticsList = getStatisticsList(criteriaList, groupFields, sortField);

        List<String> dataModelList = new ArrayList<>();

        statisticsList.stream().forEach((statistics) -> {
            IoTEntityStatisticsId ioTEntityStatisticsId = objectMapper.convertValue(statistics.getId(), IoTEntityStatisticsId.class);
            dataModelList.add(ioTEntityStatisticsId.getDataModel());
        });

        return IoTEntityDataModelListDto.builder()
                .date(DataBrokerDateFormat.formatDateToString(DataBrokerDateFormat.DATE_FORMAT, date))
                .dataModel(dataModelList)
                .build();
    }

    public IoTEntityStatisticsWithObjectId getStatisticsWithStatus(List<Criteria> criteriaList, Fields groupFields, String status, String sortField) {
        return mongoTemplate.aggregate(
                        newAggregation(getStatisticsAggregationWithStatus(criteriaList, groupFields, status, sortField)),
                        mongoTemplate.getCollectionName(IoTEntityStatisticsWithObjectId.class),
                        IoTEntityStatisticsWithObjectId.class)
                .getUniqueMappedResult();
    }

    public List<IoTEntityStatisticsWithObjectId> getStatisticsList(List<Criteria> criteriaList, Fields groupFields, String sortField) {
        return mongoTemplate.aggregate(
                        newAggregation(getStatisticsAggregation(criteriaList, groupFields, sortField)),
                        mongoTemplate.getCollectionName(IoTEntityStatisticsWithObjectId.class),
                        IoTEntityStatisticsWithObjectId.class)
                .getMappedResults();
    }

    public List<IoTEntityStatisticsWithObjectId> getStatisticsListWithStatus(List<Criteria> criteriaList, Fields groupFields, String status, String sortField) {
        return mongoTemplate.aggregate(
                        newAggregation(getStatisticsAggregationWithStatus(criteriaList, groupFields, status, sortField)),
                        mongoTemplate.getCollectionName(IoTEntityStatisticsWithObjectId.class),
                        IoTEntityStatisticsWithObjectId.class)
                .getMappedResults();
    }

    public List<AggregationOperation> getStatisticsAggregation(List<Criteria> criteriaList, Fields groupFields, String sortField) {
        List<Criteria> finalCriteriaList = new ArrayList<>();
        finalCriteriaList.addAll(criteriaList);

        Criteria criteria = new Criteria();
        criteria.andOperator(finalCriteriaList);

        List<AggregationOperation> aggregationOperationList = new ArrayList<>();

        aggregationOperationList.add(match(criteria));
        aggregationOperationList.add(
                group(groupFields)
                        .sum("totalEntities")
                        .as("totalEntities"));


        if(!ValidateUtil.isEmptyData(sortField)) {
            aggregationOperationList.add(
                    project("totalEntities").and(sortField).as(sortField)
            );
            aggregationOperationList.add(
                    sort(Sort.Direction.ASC, sortField));
        }

        return aggregationOperationList;
    }

    public List<AggregationOperation> getStatisticsAggregationWithStatus(List<Criteria> criteriaList, Fields groupFields, String status, String sortField) {
        List<Criteria> finalCriteriaList = new ArrayList<>();
        finalCriteriaList.addAll(criteriaList);
        finalCriteriaList.add(Criteria.where("_id.status").is(status));

        Criteria criteria = new Criteria();
        criteria.andOperator(finalCriteriaList);

        List<AggregationOperation> aggregationOperationList = new ArrayList<>();
        aggregationOperationList.add(match(criteria));
        aggregationOperationList.add(
                group(groupFields)
                        .sum("totalEntities")
                        .as("totalEntities"));

        if(!ValidateUtil.isEmptyData(sortField)) {
            aggregationOperationList.add(
                    project("totalEntities").and(sortField).as(sortField)
            );
            aggregationOperationList.add(
                    sort(Sort.Direction.ASC, sortField));
        }

        return aggregationOperationList;
    }

    public Page<IoTEntityValidationDto> getFailTotalEntitiesByDataModelAndProvider(Date date, Date nextDate, String dataModel, String provider, int offset, int limit) {
        Criteria criteria = Criteria.where("entity.creDate").gte(date).lt(nextDate);

        if(!ValidateUtil.isEmptyData(dataModel))
            criteria.and("entity._id.type").is(dataModel);

        if(!ValidateUtil.isEmptyData(provider))
            criteria.and("entity._id.servicePath").is(provider);

        Query query = new Query(criteria);

        // total 조회
        long total = mongoTemplate.count(query, IoTEntityValidation.class);

        // pageable 적용
        Pageable pageable = PageRequest.of(offset, limit);
        query.with(pageable);

        List<IoTEntityValidation> failEntityList = mongoTemplate.find(query, IoTEntityValidation.class);
        List<IoTEntityValidationDto> failEntiyDtoList = new ArrayList<>();
        failEntityList.forEach((entity) -> {
            failEntiyDtoList.add(IoTEntityValidationDto.builder()
                    .result(entity.getResult())
                    .cause(entity.getCause())
                    .entity(entity.getEntity())
                    .build());
        });
        return new PageImpl<>(failEntiyDtoList, pageable, total);
    }
}
