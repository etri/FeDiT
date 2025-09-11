package kr.co.n2m.platform.meta.datastore.influxdb.domain;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InfluxDbMetadataVo {
	
	private String medataSetId;
	private String medataSetNwstRvsn;
	private String typeModelId;
	private String jsonStr;
	private ListOrderedMap<String, Object> dataMap = new ListOrderedMap<>();

	public static InfluxDbMetadataVo dataMapToDto(
			String medataSetId, String typeModelId, ListOrderedMap<String, Object> dataMap) {
		if (dataMap == null) {
			dataMap = new ListOrderedMap<>();
		}
		String json = StringUtils.defaultIfBlank(JsonUtil.toJson(dataMap), "{}");
		return InfluxDbMetadataVo.builder()
				.medataSetId(medataSetId)
				.typeModelId(typeModelId)
				.jsonStr(json)
				.build();
	}

	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
