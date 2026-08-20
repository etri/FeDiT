package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ContextFileDto {


    @JsonProperty("@context")
    private Object context;

}
