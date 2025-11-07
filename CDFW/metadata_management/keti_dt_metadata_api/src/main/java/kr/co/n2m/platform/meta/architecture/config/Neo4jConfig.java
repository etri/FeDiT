package kr.co.n2m.platform.meta.architecture.config;

import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.neo4j.core.transaction.Neo4jTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import kr.co.n2m.platform.meta.architecture.property.Neo4jProperty;

@Configuration
//2025-10-23 neo4j 트랜잭션 불필요. @EnableTransactionManagement
public class Neo4jConfig {
	
    private final Neo4jProperty property;

    public Neo4jConfig(Neo4jProperty property) {
        this.property = property;
    }
    
	@Bean(name = "neo4jDriver", destroyMethod = "close")
    public Driver neo4jDriver() {
        return GraphDatabase.driver(property.getUri(), AuthTokens.basic(property.getUsername(), property.getPassword()));
    }

//    @Bean(name = "neo4jTransactionManager")
//    public Neo4jTransactionManager neo4jTransactionManager() {
//    	return new Neo4jTransactionManager(neo4jDriver());
//    }
    
}