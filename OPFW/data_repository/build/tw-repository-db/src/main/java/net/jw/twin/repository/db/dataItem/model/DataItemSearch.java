package net.jw.twin.repository.db.dataItem.model;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
public class DataItemSearch extends DataItem {
	@Builder.Default
	List<String> isNotNull = new ArrayList<String>();
	@Builder.Default
	List<String> isNull = new ArrayList<>();
	@Builder.Default
	Map<String, Object> searchParam = new HashMap<>();
	private LocalDateTime startDeprecatedTime;
	private LocalDateTime endDeprecatedTime;
	private LocalDateTime startRegDt;
	private LocalDateTime endRegDt;

	public DataItemSearch(DataItem instance) {
		super(instance.toBuilder());
	}
	public static DataItemSearchBuilder<?, ?> from(DataItem instance) {
		return new DataItemSearch(instance).toBuilder();
	}
}