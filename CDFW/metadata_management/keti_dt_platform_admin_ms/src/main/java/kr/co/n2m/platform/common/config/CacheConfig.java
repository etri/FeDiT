package kr.co.n2m.platform.common.config;


import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurerSupport;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@EnableCaching
@Configuration
public class CacheConfig extends CachingConfigurerSupport{
	@Bean
	@Override
    public CacheManager cacheManager() {
		return new ConcurrentMapCacheManager("publicKey");
    }

}
