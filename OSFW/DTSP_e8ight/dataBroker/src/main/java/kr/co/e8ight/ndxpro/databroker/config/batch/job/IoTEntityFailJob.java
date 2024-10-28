package kr.co.e8ight.ndxpro.databroker.config.batch.job;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityValidation;
import kr.co.e8ight.ndxpro.databroker.domain.statistics.IoTEntityStatisticsId;
import kr.co.e8ight.ndxpro.databroker.domain.statistics.IoTEntityStatisticsWithObjectId;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.*;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.data.MongoItemWriter;
import org.springframework.batch.item.data.builder.MongoItemWriterBuilder;
import org.springframework.batch.item.support.ListItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;

import java.time.LocalDate;
import java.util.Date;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Slf4j
@Configuration
@EnableBatchProcessing
@Import(SimpleBatchConfiguration.class)
public class IoTEntityFailJob {

    private final JobBuilderFactory jobBuilderFactory;

    private final StepBuilderFactory stepBuilderFactory;

    private final MongoTemplate mongoTemplate;

    private final ObjectMapper objectMapper;

    public IoTEntityFailJob(JobBuilderFactory jobBuilderFactory, StepBuilderFactory stepBuilderFactory, MongoTemplate mongoTemplate, ObjectMapper objectMapper) {
        this.jobBuilderFactory = jobBuilderFactory;
        this.stepBuilderFactory = stepBuilderFactory;
        this.mongoTemplate = mongoTemplate;
        this.objectMapper = objectMapper;
    }

    @Bean
    public Job startInvalidEntityJob() {
        return jobBuilderFactory.get("startInvalidEntityJob")
                .start(startInvalidEntityStep())
                .build();
    }

    @Bean
    @JobScope
    public Step startInvalidEntityStep() {
        return stepBuilderFactory.get("startInvalidEntityStep")
                .<IoTEntityStatisticsWithObjectId, IoTEntityStatisticsWithObjectId>chunk(1)
                .reader(readInvalidEntity())
                .processor(processInvalidEntity())
                .writer(writeInvalidEntity())
                .build();
    }

    @Bean
    @StepScope
    public ListItemReader<IoTEntityStatisticsWithObjectId> readInvalidEntity() {
        log.debug("readInvalidEntity");
        LocalDate now = LocalDate.now();
        LocalDate yesterday = now.minusDays(1);
        Date yesterdayDate = DataBrokerDateFormat.formatLocalDateToDate(yesterday);
        log.info("readInvalidEntity from={}, to={}", yesterday, now);
        return new ListItemReader<>(mongoTemplate.aggregate(
                        newAggregation(
                                project().and("entity.creDate").as("date")
                                        .and("entity._id.type").as("dataModel")
                                        .and("entity._id.servicePath").as("servicePath"),
                                match(Criteria.where("date").gte(yesterday).lt(now)
                                        .and("dataModel").exists(true).ne(null)
                                        .and("servicePath").exists(true).ne(null)),
                                group("dataModel", "servicePath").count().as("totalEntities"),
                                addFields().addField("_id.status").withValue("fail")
                                        .addField("_id.date").withValue(yesterdayDate).build()
                        ),
                        mongoTemplate.getCollectionName(IoTEntityValidation.class),
                        IoTEntityStatisticsWithObjectId.class
                )
                .getMappedResults());
    }

    @Bean
    @StepScope
    public ItemProcessor<IoTEntityStatisticsWithObjectId, IoTEntityStatisticsWithObjectId> processInvalidEntity() {
        log.debug("processInvalidEntity");
        return entityStatistics -> {
            IoTEntityStatisticsId id = objectMapper.convertValue(entityStatistics.getId(), IoTEntityStatisticsId.class);
            IoTEntityStatisticsId ioTEntityStatisticsId = IoTEntityStatisticsId.builder()
                    .date(id.getDate())
                    .dataModel(id.getDataModel())
                    .servicePath(id.getServicePath())
                    .status(id.getStatus())
                    .build();
            return IoTEntityStatisticsWithObjectId.builder()
                    .id(ioTEntityStatisticsId)
                    .totalEntities(entityStatistics.getTotalEntities())
                    .build();
        };
    }

    @Bean
    @StepScope
    public MongoItemWriter<IoTEntityStatisticsWithObjectId> writeInvalidEntity() {
        log.debug("writeInvalidEntity");
        return new MongoItemWriterBuilder<IoTEntityStatisticsWithObjectId>()
                .template(mongoTemplate)
                .collection(mongoTemplate.getCollectionName(IoTEntityStatisticsWithObjectId.class))
                .build();
    }
}
