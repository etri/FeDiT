package net.jw.twin.repository.db.ext.restKeyExt.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
@ToString
public class RestKeySearchExt extends RestKeySearch {
}