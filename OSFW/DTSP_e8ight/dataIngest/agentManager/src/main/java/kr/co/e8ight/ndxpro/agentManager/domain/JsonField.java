package kr.co.e8ight.ndxpro.agentManager.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JsonField {
    private Object value;
    private JsonType type;
    private Boolean incremental;
}
