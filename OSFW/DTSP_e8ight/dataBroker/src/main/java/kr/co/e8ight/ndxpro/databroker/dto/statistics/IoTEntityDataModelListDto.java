package kr.co.e8ight.ndxpro.databroker.dto.statistics;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTEntityDataModelListDto {

    private String date;

    private List<String> dataModel;
}
