package net.jw.twin.repository.db.restKey.model;

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
public class RestKeySearch extends RestKey {
	@Builder.Default
	List<String> isNotNull = new ArrayList<String>();
	@Builder.Default
	List<String> isNull = new ArrayList<>();
	@Builder.Default
	Map<String, Object> searchParam = new HashMap<>();
	private LocalDateTime startIssueTime;
	private LocalDateTime endIssueTime;
	private LocalDateTime startExpireTime;
	private LocalDateTime endExpireTime;

	public RestKeySearch(RestKey instance) {
		super(instance.toBuilder());
	}
	public static RestKeySearchBuilder<?, ?> from(RestKey instance) {
		return new RestKeySearch(instance).toBuilder();
	}
}