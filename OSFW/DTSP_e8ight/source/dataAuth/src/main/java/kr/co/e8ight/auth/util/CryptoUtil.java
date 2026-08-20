package kr.co.e8ight.auth.util;



import org.springframework.util.ObjectUtils;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import java.io.UnsupportedEncodingException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;


public class CryptoUtil {
	public static final String encrptyKey = "20211112222ndxpro3213213134542";

   public static String  ase256EncodeDefaultVal(String data){
	   try {
		   if(ObjectUtils.isEmpty(data)) return null;
		   
		   AES256Util.getInstance(encrptyKey);
		   return AES256Util.aesEncode(data);
	   } catch (UnsupportedEncodingException | InvalidKeyException | NoSuchAlgorithmException | NoSuchPaddingException
			   | InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
		   // TODO Auto-generated catch block
		   //e.printStackTrace();
		   return data;
	   }
   }
   
   public static String  ase256DecodeDefaultVal(String data){
	   try {
		   AES256Util.getInstance(encrptyKey);
		   return AES256Util.aesDecode(data);
		} catch (UnsupportedEncodingException | InvalidKeyException | NoSuchAlgorithmException | NoSuchPaddingException
				| InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
			return data;
		}
   }
}

