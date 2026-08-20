package kr.co.e8ight.ndxpro.databroker.domain.iot;

import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection="iotEntitiesValidation")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityValidation {

    @Id
    private String _id;

    String result;

    String cause;

    Entity entity;
}
