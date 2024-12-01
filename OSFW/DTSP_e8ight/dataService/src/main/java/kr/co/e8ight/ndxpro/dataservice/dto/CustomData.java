package kr.co.e8ight.ndxpro.dataservice.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
public class CustomData {

    private String type;
    private Object value;

}
