package kr.co.e8ight.ndxpro.databroker.domain.statistics;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("iotEntitiesStatistics")
public class IoTEntityStatisticsWithObjectId {

    @Id
    @JsonProperty("_id")
    private Object id;

    private String status;

    private long totalEntities;
}
