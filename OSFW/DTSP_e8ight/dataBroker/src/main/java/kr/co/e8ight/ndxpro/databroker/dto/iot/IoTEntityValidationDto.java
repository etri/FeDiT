package kr.co.e8ight.ndxpro.databroker.dto.iot;

import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTEntityValidationDto {

    String result;

    String cause;

    Entity entity;
}
