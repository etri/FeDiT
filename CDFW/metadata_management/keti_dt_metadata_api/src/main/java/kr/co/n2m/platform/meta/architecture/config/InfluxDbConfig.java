package kr.co.n2m.platform.meta.architecture.config;

import javax.annotation.PreDestroy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;

import kr.co.n2m.platform.meta.architecture.property.InfluxProperty;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class InfluxDbConfig {
	
	@Autowired
	private InfluxProperty influxProperty;
	
    private InfluxDBClient influxDBClient;

	@Bean
	public InfluxDBClient influxDBClient() {
		influxDBClient = InfluxDBClientFactory.create(influxProperty.getUrl(), influxProperty.getToken(), influxProperty.getOrg(), influxProperty.getBucket());
    	log.debug("InfluxDBClient 생성");
		return influxDBClient;
	}
	
    @PreDestroy
    public void closeInfluxDBClient() {
        if (influxDBClient != null) {
            influxDBClient.close();  // 클라이언트 종료
            log.debug("InfluxDBClient 종료");
        }
    }
}
