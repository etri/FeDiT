package iitp.federatedTwins.msaOrchstr.common.config;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ScriptEngineConfig {
    @Bean
    public ScriptEngine scriptEngine(){
        ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
  
        return engine;
    }
}
