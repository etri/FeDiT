package net.jcms.framework.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.io.Resources;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.Reader;
import java.util.Properties;

@Slf4j
@Component
@PropertySource("classpath:/config/properties/globals-${spring.profiles.active}.properties")
@PropertySource("classpath:/config/properties/globals-build.properties")
@PropertySource("classpath:/config/properties/globals-secret.properties")
public class PropertiesUtil {

	private static Environment envPrp;

	@Autowired
	public PropertiesUtil(Environment env) { setEnvPrp(env); }
	public static void setEnvPrp(Environment envPrp) { PropertiesUtil.envPrp = envPrp; }

	public static final String RELATIVE_PATH_PREFIX = PropertiesUtil.class.getResource("").getPath() + System.getProperty("file.separator")
		    + ".." + System.getProperty("file.separator")
		    + ".." + System.getProperty("file.separator") 
		    + ".." + System.getProperty("file.separator")
		    + ".." + System.getProperty("file.separator")
		    + ".." + System.getProperty("file.separator");
	
	public static final String PROPERTY_PATH = RELATIVE_PATH_PREFIX
													+System.getProperty("file.separator")+"config"
													+System.getProperty("file.separator")+"properties"
													+System.getProperty("file.separator")+"globals-" + System.getProperty("spring.profiles.active") + ".properties";

	public static String getProperty(String keyName){
		String value = null;
		try{
			value = envPrp.getProperty(keyName).trim();
		}catch(Exception e){
			log.debug("ERROR ::PropertiesUtil:: EXCEOTION");
		}
		return value;
	}

//	public static String getProperty(String keyName) throws IOException{
//		String value = null;
//		FileInputStream fis = null;
//		try {
////			Properties props = new Properties();
////			String propertyPath = PROPERTY_PATH.replaceAll("\\.{2,}[/\\\\]", "");
////			fis  = new FileInputStream(propertyPath);
////			props.load(new java.io.BufferedInputStream(fis));
////			value = props.getProperty(keyName).trim();
//			String activeProfile = System.getProperty("spring.profiles.active");
//			String resource = "config/properties/globals-" + activeProfile + ".properties";
//			Properties properties = new Properties();
//
//			Reader reader = Resources.getResourceAsReader(resource);
//			properties.load(reader);
//
//			value = properties.getProperty(keyName).trim();
//		} finally {
//			if (fis != null) fis.close();
//		}
//		return value;
//	}

	public static String getCimIconFilePath() throws IOException{
		String activeProfile = System.getProperty("spring.profiles.active");
		String resource = "config/properties/globals-" + activeProfile + ".properties";
		Properties properties = new Properties();

		Reader reader = Resources.getResourceAsReader(resource);
		properties.load(reader);

		return properties.getProperty("AppConf.filePath.icon");
	}

	public static String getMwWebSocketUrl() throws IOException{
		String activeProfile = System.getProperty("spring.profiles.active");
		String resource = "config/properties/globals-" + activeProfile + ".properties";
		Properties properties = new Properties();

		Reader reader = Resources.getResourceAsReader(resource);
		properties.load(reader);

		return "ws://" + properties.getProperty("AppConf.Mw.url");
	}
}
