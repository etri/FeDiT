/**
 * 
 */
package com.stoneitgt.dt.data.platform.admin.config;

import javax.sql.DataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * DB 접속이 여러개일 경우 세션정보를 추가하고 DatabaseConfigPrimary.java 와 같은 파일을 추가
 * @author jhpark
 */
@Configuration
public class DatabaseConfig {
	public static final String PRIMARY_DATASOURCE = "primaryDataSource";
	public static final String PRIMARY_SESSION_FACTORY = "primarySqlSessionFactory";
	public static final String PRIMARY_SQL_SESSION = "primarySqlSession";
	public static final String PRIMARY_TRANSACTION_MANAGER = "primaryTransactionManager";

	public static final String SECOND_DATASOURCE = "secondDataSource";
	public static final String SECOND_SESSION_FACTORY = "secondSqlSessionFactory";
	public static final String SECOND_SQL_SESSION = "secondSqlSession";
	public static final String SECOND_TRANSACTION_MANAGER = "secondTransactionManager";
	
	@Primary
	@Bean(name = PRIMARY_DATASOURCE)
	@ConfigurationProperties(prefix = "spring.primary.datasource")
	public DataSource dataSourcePrimary() {
		return DataSourceBuilder.create().build();
	}
	
	@Bean(name = SECOND_DATASOURCE)
	@ConfigurationProperties(prefix = "spring.second.datasource")
	public DataSource dataSourceSecond() {
		return DataSourceBuilder.create().build();
	}
	
}
