package kr.co.n2m.platform.meta.architecture.util;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * BeanUtil
 * 
 * @author  n2m
 */
@Component
public class BeanUtil {
	
	private static ApplicationContext applicationContext;
	
	@SuppressWarnings("static-access")
	private BeanUtil(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

	public static Object getBean(String beanName) {
		return applicationContext.getBean(beanName);
	}

	/**
	 * ex) MyService myService = BeanUtil.getBean("myService", MyService.class);
	 * @param <T>
	 * @param beanName
	 * @param requiredType
	 * @return
	 */
	public static <T> T getBean(String beanName, Class<T> requiredType) {
		return applicationContext.getBean(beanName, requiredType);
	}
	
}
