package kr.co.e8ight.ndxpro.databroker.dto.statistics;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityStatisticsDto {

    private String date;

    private String dataModel;

    private String provider;

    private StatisticsDto statistics;
}
