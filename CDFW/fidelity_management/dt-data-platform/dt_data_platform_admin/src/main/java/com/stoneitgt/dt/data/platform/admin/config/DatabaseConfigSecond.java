package com.stoneitgt.dt.data.platform.admin.config;

import javax.sql.DataSource;

import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.type.JdbcType;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.stoneitgt.dt.data.platform.interceptor.QueryRowBoundsInterceptor;

/**
 * DB 설정파일
 * @author jhpark
 */
@Configuration
@EnableTransactionManagement
@MapperScan(basePackages = "com.stoneitgt.dt.data.platform.admin.mapper", sqlSessionFactoryRef = DatabaseConfig.SECOND_SESSION_FACTORY)
public class DatabaseConfigSecond {
	@Autowired
	@Qualifier(DatabaseConfig.SECOND_DATASOURCE)
	private DataSource dataSource;
	
	/**
	 * @MapperScan sqlSessionFactoryRef 와 @Bean DatabaseConfig 동일하게 사용
	 */
	@Bean(name = DatabaseConfig.SECOND_SESSION_FACTORY)
	public SqlSessionFactory sqlSessionFactory() throws Exception {
		SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
		factoryBean.setDataSource(dataSource);
		PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

		// Mapper Location
		factoryBean.setMapperLocations(resolver.getResources("classpath:mapper/secondary/*.xml"));

		// MyBatis Plugins
		factoryBean.setPlugins(new Interceptor[] { new QueryRowBoundsInterceptor() });

		// Aliases Package
		factoryBean.setTypeAliasesPackage("com.stoneitgt.cb.platform.domains");

		// Configuration
		org.apache.ibatis.session.Configuration configuration = factoryBean.getObject().getConfiguration();
		configuration.setCallSettersOnNulls(true);
		configuration.setLazyLoadingEnabled(false);
		configuration.setAggressiveLazyLoading(false);
		configuration.setMapUnderscoreToCamelCase(true);
		configuration.setJdbcTypeForNull(JdbcType.NULL);
		factoryBean.setConfiguration(configuration);

		return factoryBean.getObject();
	}

	@Bean(name = DatabaseConfig.SECOND_SQL_SESSION)
	public SqlSessionTemplate sqlSessionTemplate() throws Exception {
		SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory());
		return template;
	}
	
	@Bean(name = DatabaseConfig.SECOND_TRANSACTION_MANAGER)
	public DataSourceTransactionManager dataSourceTransactionManager() {
		return new DataSourceTransactionManager(dataSource);
	}
}
