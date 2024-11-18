package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContextResponseDto {

    @JsonProperty("@context")
    private Object context;

    private String url;

//    private String version;

    private Boolean isReady;

}
