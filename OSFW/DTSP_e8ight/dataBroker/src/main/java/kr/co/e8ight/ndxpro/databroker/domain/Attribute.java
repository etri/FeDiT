package kr.co.e8ight.ndxpro.databroker.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.LinkedHashMap;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Attribute {

    private String name;

    private String type;

    private Object value;

    private LinkedHashMap<String, String> mdNames;

    private List<Attribute> md;

}
