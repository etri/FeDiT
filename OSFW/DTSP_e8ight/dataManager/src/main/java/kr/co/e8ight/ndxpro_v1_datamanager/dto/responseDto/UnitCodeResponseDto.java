package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
public class UnitCodeResponseDto {

    private String group;

    private String code;

    private String symbol;

    private String groupName;
}
