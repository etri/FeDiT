package kr.co.n2m.platform.meta.datastore.influxdb.domain;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import lombok.Getter;
import lombok.NoArgsConstructor;
/**
 * InfluxDB의 "json" measurement 데이터 DTO.
 * - InfluxDB의 timestamp를 로컬 시간대를 반영한 formatted time으로 변환
 * */

@Getter
@NoArgsConstructor
public class JsonRecordDto {

	String medataSetId;
	String typeModelId;
	String value;
	Instant time;
	String formattedTime;
	
	public JsonRecordDto(JsonRecord jsonRecord) {
		this.medataSetId = jsonRecord.getMedataSetId();
		this.typeModelId = jsonRecord.getTypeModelId();
		this.value = jsonRecord.getValue();
		this.formattedTime = formatInstant(jsonRecord.getTime());
		this.time = jsonRecord.getTime();
	}
	
    private String formatInstant(Instant time) {
        DateTimeFormatter formatter = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("Asia/Seoul"));
        return formatter.format(time);
    }
	
}
