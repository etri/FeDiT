package kr.co.e8ight.ndxpro.dataservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class NgsiLdResponseDto {

    private String id;
    private String type;
    private CustomData customData;

    @JsonProperty("@context")
    private String context;

}
