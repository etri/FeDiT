package kr.co.e8ight.ndxpro.dataservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityHistoryIdDto {

    private String historyId;

    private String entityId;

    private String observedAt;

    private String provider;
}
