package kr.co.n2m.platform.common.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
public class Properties {

	//@Value("${mobius.host}") 
	//private String mobiusServerHost;
	
	//@Value("${mobius.port}") 
	//private int mobiusServerPort;
	
	//@Value("${mobius.secure_csebase}") 
	//private String mobiusSecureCseBase;
	
	
	@Component
	@ConfigurationProperties(prefix = "super")
	@Data
	public class AdminProperty {
		private String admin;
	}
}
