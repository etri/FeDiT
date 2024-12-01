package kr.co.e8ight.ndxpro.translatorManager.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@NoArgsConstructor
@Getter
public class DataModelDto {
    private String id;

    private String type;

    private Map<String, String> attributeNames;

    private HashMap<String, Object> attributes;

    private List<String> required;
}
