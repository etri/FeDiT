package kr.co.e8ight.ndxpro.databroker.domain.iot;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "iotEntitiesHis")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityHistory {

    @Id
    private String _id;

    private Date observedAt;

    private IoTEntity entity;
}
