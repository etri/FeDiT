package kr.co.e8ight.ndxpro_v1_datamanager.domain.attributeType;

import java.util.ArrayList;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.ValidInfo;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Relationship {

    private String type;

    private String description;

    private String valueType;

    private ValidInfo valid;

    private List<String> modelType = new ArrayList<>();
}