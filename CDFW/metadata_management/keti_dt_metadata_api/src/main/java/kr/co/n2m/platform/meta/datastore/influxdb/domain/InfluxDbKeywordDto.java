package kr.co.n2m.platform.meta.datastore.influxdb.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.util.DateUtil;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InfluxDbKeywordDto {

	private String keyword;
	private String langMtcd;
	private String prptyId;
	private String medataSetId;
	private String dateTimeStr;
	
	// 범위 쿼리용
	private String minDateTimeStr;
	private String maxDateTimeStr;
	
	public String toNanosec() {
		if (this.dateTimeStr == null) return null;
		return DateUtil.toUnixTimestamp(this.dateTimeStr) + "000000000";
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }

}
