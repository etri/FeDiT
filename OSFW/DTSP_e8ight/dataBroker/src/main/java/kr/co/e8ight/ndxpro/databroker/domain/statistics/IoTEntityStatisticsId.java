package kr.co.e8ight.ndxpro.databroker.domain.statistics;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTEntityStatisticsId {

    private Date date;

    private String dataModel;

    private String servicePath;

    private String status;
}
