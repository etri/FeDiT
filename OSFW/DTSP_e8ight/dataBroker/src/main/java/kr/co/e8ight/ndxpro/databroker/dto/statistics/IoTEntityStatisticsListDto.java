package kr.co.e8ight.ndxpro.databroker.dto.statistics;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityStatisticsListDto {

    private String date;

    private String startDate;

    private String endDate;

    private String dataModel;

    private String provider;

    private List<StatisticsDto> statistics;
}
