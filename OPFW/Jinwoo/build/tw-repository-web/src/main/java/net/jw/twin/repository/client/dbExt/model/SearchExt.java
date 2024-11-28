package net.jw.twin.repository.client.dbExt.model;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import net.jcms.framework.base.model.BaseModel;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
public class SearchExt extends BaseModel {
    @Builder.Default
    Map<String, Object> searchParam = new HashMap<>();
}
