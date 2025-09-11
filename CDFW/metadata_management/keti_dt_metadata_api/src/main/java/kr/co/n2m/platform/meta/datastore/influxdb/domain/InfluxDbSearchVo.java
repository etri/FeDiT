package kr.co.n2m.platform.meta.datastore.influxdb.domain;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * influxDB 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="influxDB 검색 Vo")
@Getter
@Setter
public class InfluxDbSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="메타데이터셋 ID")
	private String medataSetId;

}
