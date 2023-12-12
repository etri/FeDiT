package kr.co.n2m.platform.meta.architecture.util;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;

/**
 * CacheServiceUtil
 * 
 * @author  n2m
 */
@Service
public class CacheServiceUtil {
	
	private PublicKey publicKey;
	
	private Gson gson = new Gson();
	
	@Cacheable(value="publicKey")
	public PublicKey getPublicKey(String url) throws Exception {

		String method = "GET";
		
		HttpRequestUtil httpRequest = new HttpRequestUtil();
		String key = httpRequest.sendHttpGetRequest(url, method);
		
		Map map = gson.fromJson(key, Map.class);
		key = (String) map.get("publickey");
		
		key = key.replace("-----BEGIN PUBLIC KEY-----", "")
	        .replace("-----END PUBLIC KEY-----", "")
	        .replace("\r\n", "")
	        .replace("/", "_").replace("+", "-");

	    byte[] publicKeyBytes = Base64.getUrlDecoder().decode(key.getBytes());
	    X509EncodedKeySpec spec = new X509EncodedKeySpec(publicKeyBytes);
	    KeyFactory kf = KeyFactory.getInstance("RSA");
	    publicKey = kf.generatePublic(spec);
	    
	    return publicKey;
	}
	
	
	@CacheEvict(cacheNames="publicKey")
	public void removeKey() {
		
	}
}
