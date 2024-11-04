package iitp.federatedTwins.msaOrchstr.rsDtConsumer.config;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ScriptEngineConfig {
    
	@Value("${script.engine.name}")
	private String scriptEngineName;
	
	@Bean
    public ScriptEngine scriptEngine(){
        ScriptEngine engine = new ScriptEngineManager().getEngineByName(scriptEngineName);

        return engine;
    }
}
