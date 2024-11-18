package kr.co.e8ight.ndxpro.databroker.dto.iot;

import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.e8ight.ndxpro.databroker.dto.EntityDto;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityDto {

    private String historyId;

    private String observedAt;

    private String provider;

    private EntityDto entity;
}
