package iitp.federatedTwins.DtEvtTracking.common.config;

import java.util.ArrayList;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Configuration
@MapperScan(value = { "iitp.federatedTwins.DtEvtTracking.*.mapper" })
@EnableTransactionManagement
public class DatabaseConfigHikari {
	private final Logger logger = LoggerFactory.getLogger(DatabaseConfigHikari.class);

	@Autowired
	private ApplicationContext context;

	private String mapper_config = "classpath:common/mybatis/mybatis-config.xml";

	@Value("${mybatis.mapper-locations}")
	private String mapper_location = "";

	private String common_mapper_location = "classpath:common/mybatis/mapper/**/*.xml";

	@Bean
	@ConfigurationProperties(prefix = "spring.datasource.hikari")
	public HikariConfig hikariConfig() {
		return new HikariConfig();
	}

	@Bean
	@ConfigurationProperties("spring.datasource.hikari")
	public HikariDataSource dataSource() {
		return DataSourceBuilder.create().type(HikariDataSource.class).build();
	}

	@Bean
	public SqlSessionFactory sqlSessionFactory() throws Exception {

		SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
		factoryBean.setDataSource(dataSource());

		factoryBean.setConfigLocation(context.getResource(mapper_config));

		StringBuilder st = new StringBuilder();
		st.append(common_mapper_location);

		if (mapper_location != null && !"".equals(mapper_location)) {
			st.append(",");
			st.append(mapper_location);
		}

		Resource[] moduleResources = this.getApplicationPathResource(st.toString());

		factoryBean.setMapperLocations(moduleResources);

		return factoryBean.getObject();
	}

	private Resource[] getApplicationPathResource(String classPath) throws Exception {
		if (classPath == null || "".equals(classPath))
			return null;

		// split classPath
		String[] paths = classPath.split(",");

		ArrayList<Resource> resList = new ArrayList<Resource>();

		for (int a = 0; a < paths.length; a++) {
			Resource[] resources = context.getResources(paths[a].trim());
			logger.debug("ClassPath Split Path =====> " + paths[a].trim());

			if (resources != null && resources.length > 0) {
				for (int f = 0; f < resources.length; f++) {
					Resource res = resources[f];
					logger.debug("getApplicationPathResource Classpath in the file name  ======> " + res.getFilename());

					resList.add(res);
				}
			} else
				continue;
		}

		Resource[] contextResources = resList.toArray(new Resource[resList.size()]);

		return contextResources;
	}

	@Bean
	public SqlSessionTemplate sqlSession() throws Exception {
		return new SqlSessionTemplate(sqlSessionFactory());
	}

}
