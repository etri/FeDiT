package kr.co.n2m.platform.meta.rdf.virtuoso.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description="SPARQL 쿼리 요청 Vo")
@Getter
@Setter
public class SparqlReqVo {

	@Schema(description="쿼리")
	private String query;
	
	@Schema(description="결과 형식", defaultValue="html")
	private String resultFormat = "html";
	
	@Schema(description="쿼리 실행 타임아웃 밀리초", defaultValue="10000", minimum="500", maximum="60000")
	private int timeoutMillis = 10000;	

	public void setTimeoutMillis(int timeoutMillis) {
		if (timeoutMillis < 500) this.timeoutMillis = 500;			
		else if (timeoutMillis > 60000) this.timeoutMillis = 60000;
		else this.timeoutMillis = timeoutMillis;
	}
	
}
