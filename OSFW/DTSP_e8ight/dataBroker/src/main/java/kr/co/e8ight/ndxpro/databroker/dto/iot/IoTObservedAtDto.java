package kr.co.e8ight.ndxpro.databroker.dto.iot;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTObservedAtDto {

    private String datetime;

    private String nextDateTime;

    private Integer scenarioId;

    private String scenarioType;
}
