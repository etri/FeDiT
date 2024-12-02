package net.jw.twin.repository.db.ext.dataUseExt.model;

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
public class DataUseSearchExt extends DataUseSearch {
    Long userId;
    String dataCode;
    String serviceId;
    String dataItemStatus;
}