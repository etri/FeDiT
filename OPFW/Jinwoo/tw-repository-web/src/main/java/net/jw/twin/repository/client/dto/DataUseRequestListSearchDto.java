package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
@ToString
public class DataUseRequestListSearchDto extends DataUseSearch {
    String name;
}
