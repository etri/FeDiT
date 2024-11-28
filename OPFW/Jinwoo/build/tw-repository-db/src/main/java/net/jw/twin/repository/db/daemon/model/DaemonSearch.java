package net.jw.twin.repository.db.daemon.model;

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
public class DaemonSearch extends Daemon {
	@Builder.Default
	List<String> isNotNull = new ArrayList<String>();
	@Builder.Default
	List<String> isNull = new ArrayList<>();
	@Builder.Default
	Map<String, Object> searchParam = new HashMap<>();

	public DaemonSearch(Daemon instance) {
		super(instance.toBuilder());
	}
	public static DaemonSearchBuilder<?, ?> from(Daemon instance) {
		return new DaemonSearch(instance).toBuilder();
	}
}