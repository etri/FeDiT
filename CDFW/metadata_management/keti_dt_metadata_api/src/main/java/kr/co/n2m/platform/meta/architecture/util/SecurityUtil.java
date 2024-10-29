package kr.co.n2m.platform.meta.architecture.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

import org.apache.commons.lang3.StringUtils;
import org.apache.tomcat.util.codec.binary.Base64;

/**
 * SecurityUtil
 * 
 * @author  n2m
 */
public class SecurityUtil {
	
	/**
	 * bytes 를 hex 문자열로 변환.
	 * 
	 * @param bytes
	 * @return
	 */
	public static String bytesToHexString(byte[] bytes) {
	    String encryptData = "";  		
	    for (int i = 0; i < bytes.length; i++) {  
	    	String hex = Integer.toHexString(bytes[i] & 0xFF);  
	        encryptData += hex.length() != 2 ? "0" + hex : hex; 
	    }  
	    return encryptData; 
	}
	
	/**
	 * string 을 hex 문자열로 변환.
	 * 
	 * @param text
	 * @return
	 */
	public static String stringToHexString(String text) {
		return (bytesToHexString(text.getBytes()));
	}

	/**
	 * hex 문자열을 string 으로 변환.
	 * 
	 * @param hex
	 * @return
	 */
	public static String hexStringToString(String hex) {
		byte[] bytes = new byte [hex.length() / 2];
		int j = 0;
		for (int i = 0; i < hex.length(); i += 2) {
			bytes[j++] = Byte.parseByte(hex.substring(i, i + 2), 16);
		}
		return new String(bytes);
	}
	
	/**
	 * 64bit salt 값 생성.
	 * 
	 * @return salt
	 */
	public static String generateSalt() {
		return generateSalt(8); // 기본값 64bit
	}
	
	/**
	 * 해당길이의 salt값 생성.
	 * 
	 * @param byteLength
	 * @return salt
	 */
	public static String generateSalt(int byteLength) {
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < byteLength; i++) {
			int random = (int)(Math.random() * 9); // 0~9
			sb.append(random);
		}
		return sb.toString();
	}
	
	/**
	 * 비밀번호를 salt를 사용하여 SHA-256 방식으로 암호화 및 BASE64 인코딩 처리.  
	 * 
	 * @param passwd
	 * @param salt
	 * @return 암호화된 비밀번호 
	 */	
	public static String encodePassword(String passwd, String salt) {
		try {
			if (StringUtils.isBlank(passwd)) return null;
			if (StringUtils.isBlank(salt))   return null;			
			return Base64.encodeBase64String(encodeSHA256(passwd, salt));
		} catch (Exception e) {
			return passwd;
		}
	}	
	
	/**
	 * salt 사용하여 SHA256 로 인코딩 (단방향).
	 * 
	 * @param text
	 * @param salt
	 * @return
	 * @throws NoSuchAlgorithmException
	 */
	public static byte[] encodeSHA256(String text, String salt) throws NoSuchAlgorithmException {  
	    MessageDigest sha = MessageDigest.getInstance("SHA-256");  
	    sha.reset();	    
	    sha.update(salt.getBytes());	    
	    sha.update(text.getBytes());
 	    return sha.digest();  
	} 	
	
	/**
	 * 임시 비밀번호 생성 후 반환. (기본 8자리)
	 * 
	 * @return String
	 */
    public static String getTempPassword() {
    	return getTempPassword(8);
    }	
    
	/**
	 * 임시 비밀번호 생성 후 반환.
	 * 
	 * @return String
	 */    
    public static String getTempPassword(int length) {
    	String alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    	String numbers   = "0123456789";
    	String specials  = "~`!@#$%^&*()-_+=|\\;:,.?"; // 몇가지만. 
    	
    	if (length < 8) length = 8; // 기본 8 자리.
    	int lenAlphabets = (int)(length * 0.5);
    	int lenNumbers   = (int)(length * 0.4);
    	int lenSpecials  = length - lenAlphabets - lenNumbers;

    	StringBuffer sb = new StringBuffer();
    	int random = 0;

    	while (sb.length() < length) {
    		// 첫번째는 영문자. (random = 0)
    		switch (random) {
    			case 0:
    				if (lenAlphabets-- > 0) {
	    	    		random = (int)(Math.random() * alphabets.length());
	    	    		sb.append(alphabets.charAt(random));
    				}
    	    		break;
    			case 1:
    				if (lenNumbers-- > 0) {    				
	    	    		random = (int)(Math.random() * numbers.length());
	    	    		sb.append(numbers.charAt(random));
    				}
    	    		break;    				
    			default:
    				if (lenSpecials-- > 0) {
	    	    		random = (int)(Math.random() * specials.length());
			    		sb.append(specials.charAt(random));
    				}
		    		break;       				
    		}
    		random = (int)(Math.random() * 3); // 순서 결정.
    	}
    	
    	return sb.toString();
    }
    
    /**
     * 36 자의 UUID.randomUUID() -> 25자의 "-" 하이픈이 있는 문자열로 바꾸기.
     * ex) 3e04b0e3-7ffe-4b8c-a3fe-6185c6d3bbc5 -> FWImu-t_~Iuo-Z_c65-njExnM
     * 
	 * @return String
     * @since 2023-05-08
	 */
    public static String generateRandomHyphenId() {
    	String text = generateRandomId();
    	return text.substring(0, 5) + "-" + text.substring(5, 11) + "-" + text.substring(11, 16) + "-" + text.substring(16);
    }
    
    /**
     * 36 자의 UUID.randomUUID() -> 22자의 문자열로 바꾸기.
     * ex) 3e04b0e3-7ffe-4b8c-a3fe-6185c6d3bbc5 -> FWImut_~IuoZ_c65njExnM
     * 
	 * @return String
     * @since 2023-05-08
	 */
    public static String generateRandomId() {
    	String last = String.valueOf( (int)(Math.random() * 10) ); // 0~9
    	UUID uuid = UUID.randomUUID(); 		// 36자 ex) 3e04b0e3-7ffe-4b8c-a3fe-6185c6d3bbc5
    	String text = uuid.toString().replace("-", "") + last; // 33 자 (3의 배수 만들기)
    	return encodeMy64(text);
    }
    
    /**
     * 길이가 3의 배수이고 0~f 까지로만 되어 있는 문자열을 내 맘대로인 64자로 인코딩. (3 * n 길이 -> 2 * n 길이)
     * 
	 * @param text
	 * @return String
     * @since 2023-05-08
	 */
    public static String encodeMy64(String text) {
    	String hexs  = "0123456789abcdef"; // 16진수
    	String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~_"; // 64개
    	
    	StringBuilder sb = new StringBuilder();
    	for (int i = 0; i < text.length(); i += 3) {
    		int num = hexs.indexOf(text.charAt(i)) * 256 + hexs.indexOf(text.charAt(i + 1)) * 16 + hexs.indexOf(text.charAt(i + 2));
    	    sb.append(chars.charAt( num / 64 )); // quotient
    	    sb.append(chars.charAt( num % 64 )); // remainder
    	}
    	return sb.toString();
    }
    
    /**
     * encodeMy64 로 인코딩한 문자열을 디코딩. (2 * n 길이 -> 3 * n 길이)
     * 
     * @param encoded
     * @return String
     * @since 2023-05-08
     */
    public static String decodeMy64(String encoded) {
    	String hexs  = "0123456789abcdef"; // 16진수
    	String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~_"; // 64개
    	
    	StringBuilder sb = new StringBuilder();
    	for (int i = 0; i < encoded.length(); i += 2) {
    		int num = chars.indexOf(encoded.charAt(i)) * 64 + chars.indexOf(encoded.charAt(i + 1));
    	    sb.append(hexs.charAt( num / 256 )); 	  // quotient1
    	    sb.append(hexs.charAt( num % 256 / 16 )); // quotient2
    	    sb.append(hexs.charAt( num % 16 )); 	  // remainder
    	}
    	return sb.toString();    	
    }

}
