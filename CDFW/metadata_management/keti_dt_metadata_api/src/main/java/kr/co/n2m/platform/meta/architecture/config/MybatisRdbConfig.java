package kr.co.n2m.platform.meta.architecture.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.boot.autoconfigure.SpringBootVFS;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import kr.co.n2m.platform.meta.architecture.code.Constant;

/**
 * RDB 연결을 위한 Mybatis 설정
 * 
 * @author  n2m
 */
@Configuration
@EnableTransactionManagement
public class MybatisRdbConfig {
	
	@Bean
	@Primary                        // 같은 type 의 bean 이 여러 개일 경우 의존 주입시 우선 순위.	
	@Qualifier("sqlSessionFactory") // 같은 type 의 bean 이 여러 개일 경우 사용할 bean 이름.
	public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
		final SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
		sessionFactory.setDataSource(dataSource);
		PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
		sessionFactory.setMapperLocations(resolver.getResources("classpath:/**/xml/*.xml"));
		sessionFactory.setVfs(SpringBootVFS.class);
		sessionFactory.setTypeAliasesPackage(Constant.BASE_PACKAGE); //(DtmetaApplication.class.getPackage().getName());
		
		SqlSessionFactory factory = sessionFactory.getObject();
		org.apache.ibatis.session.Configuration configuration = factory.getConfiguration();
		configuration.setMapUnderscoreToCamelCase(true);
		configuration.setCallSettersOnNulls(true); // null 값이어도 key가 나오도록 함.
		
		return factory;
	}	
	
	@Bean	
	@Primary
	@Qualifier("sqlSessionTemplate")
	public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
		return new SqlSessionTemplate(sqlSessionFactory);
	}	
	
	@Bean(name = "rdbTransactionManager")
	@Primary
	public PlatformTransactionManager rdbTransactionManager(DataSource dataSource) {
	    return new DataSourceTransactionManager(dataSource);
	}

}
