package kr.co.e8ight.auth.util;


import org.apache.tomcat.util.codec.binary.Base64;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;


public class AES256Util {

	 private static String iv;
	 private static Key keySpec;
	 
	 //private static volatile AES256Util INSTANCE;
	 
	 private static volatile AES256Util INSTANCE;

	 
	 public static void getInstance(String key) throws UnsupportedEncodingException{
	     if(INSTANCE==null){
	         synchronized(AES256Util.class){
	             if(INSTANCE == null)
	                 INSTANCE = new AES256Util(key);
	         }
	     }
	 }
	 
	 private AES256Util(String key) throws UnsupportedEncodingException{
		 	AES256Util.iv = key.substring(0, 16);
	        
	        byte[] keyBytes = new byte[16];
	        byte[] b = key.getBytes(StandardCharsets.UTF_8);
	        int len = b.length;
	        if (len > keyBytes.length) {
	            len = keyBytes.length;
	        }
	        System.arraycopy(b, 0, keyBytes, 0, len);
		 	AES256Util.keySpec = new SecretKeySpec(keyBytes, "AES");
	 }
	 

	// 암호화
    public static String aesEncode(String str) throws UnsupportedEncodingException,
                                                    NoSuchAlgorithmException, 
                                                    NoSuchPaddingException, 
                                                    InvalidKeyException, 
                                                    InvalidAlgorithmParameterException, 
                                                    IllegalBlockSizeException, 
                                                    BadPaddingException {
    	if(INSTANCE == null) return null;

        Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
        c.init(Cipher.ENCRYPT_MODE, keySpec, new IvParameterSpec(iv.getBytes()));
 
        byte[] encrypted = c.doFinal(str.getBytes(StandardCharsets.UTF_8));
		return new String(Base64.encodeBase64(encrypted));
    }
 
    //복호화
    public static String aesDecode(String str) throws UnsupportedEncodingException,
                                                        NoSuchAlgorithmException,
                                                        NoSuchPaddingException, 
                                                        InvalidKeyException, 
                                                        InvalidAlgorithmParameterException,
                                                        IllegalBlockSizeException, 
                                                        BadPaddingException {
    	if(INSTANCE == null) return null;

        Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
        c.init(Cipher.DECRYPT_MODE, keySpec, new IvParameterSpec(iv.getBytes("UTF-8")));
 
        byte[] byteStr = Base64.decodeBase64(str.getBytes());
 
        return new String(c.doFinal(byteStr), StandardCharsets.UTF_8);
    }
}