package kr.co.e8ight.ndxpro_v1_datamanager.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidInfo {

    private Integer minLength;

    private Integer maxLength;

    private Integer minimum;

    private Integer maximum;

}