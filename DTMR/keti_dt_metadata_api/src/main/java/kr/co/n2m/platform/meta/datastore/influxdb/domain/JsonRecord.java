package kr.co.n2m.platform.meta.datastore.influxdb.domain;

import java.time.Instant;

import com.influxdb.annotations.Column;
import com.influxdb.annotations.Measurement;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * InfluxDB "json" measurement에 저장된 record.
 * "json" measurement의 data 구조와 일치.
 * InfluxDB query 실행 결과를 mapping.
 * */

@Measurement(name = "json")
@Getter 
@Setter
@NoArgsConstructor
public class JsonRecord {

	@Column(tag = true)
	String medataSetId;

	@Column(tag = true)
	String typeModelId;

	@Column
	String value;

	@Column(timestamp = true)
	Instant time;
}
