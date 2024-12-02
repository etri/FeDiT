package net.jw.twin.repository.client.dbExt.dataUseExt.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;

@Getter
@Setter
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
public class DataUseSearchExt extends DataUseSearch {
    private String name;
}
