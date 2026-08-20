package kr.co.e8ight.ndxpro.dataservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IoTEntityHistoryIdListDto {

    private String context;

    private String timeproperty;

    private int totalPage;

    private long totalData;

    @JsonProperty("entityHistoryList")
    private List<IoTEntityHistoryIdDto> entityHistoryDtoList;
}
