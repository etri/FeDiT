package kr.co.e8ight.ndxpro.databroker.domain.iot;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Getter
@Setter
@Builder
@Document(collection = "iotObservedAt")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTObservedAt {

    @Id
    private String _id;

    private Date datetime;

    private Integer scenarioId;

    private String scenarioType;

    // 수집 완료 여부
    private String isFinish;
}
