package net.jcms.framework.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Random;

@Slf4j
public class StrUtil {

	/**
	 * String에서 HTML코드를 제거한다.
	 */
	public static String removeHtmlCd(String str) {
		if(StrUtil.isEmpty(str))return "";
		return str.replaceAll("<(/)?([a-zA-Z]*)(\\s[a-zA-Z]*=[^>]*)?(\\s)*(/)?>", "");
	}
	
	/**
	 * null 혹은 empty인지 검사
	 */
	public static boolean isEmpty(String str) {
		if (str == null || str.trim().length() == 0) return true;
		return false;
	}
	
	public static boolean isNotEmpty(String s){
        return !isEmpty(s);
    }

	/**
	 * (length - str.length) 만큼 앞에 0을 추가한다.
	 */
	public static String addZero(String str, int length) {
		String temp = "";
		for (int i = str.length(); i < length; i++)
			temp += "0";
		temp += str;
		return temp;
	}
	
	/**
	 * 숫자를 한글로 리턴한다.
	 */
	public static String convertHangul(String money){
		String[] han1 = {"","일","이","삼","사","오","육","칠","팔","구"};
		String[] han2 = {"","십","백","천"};
		String[] han3 = {"","만","억","조","경"};

		StringBuffer result = new StringBuffer();
		int len = money.length();
		for(int i=len-1; i>=0; i--){
			result.append(han1[Integer.parseInt(money.substring(len-i-1, len-i))]);
			if(Integer.parseInt(money.substring(len-i-1, len-i)) > 0)
				result.append(han2[i%4]);
			if(i%4 == 0)
				result.append(han3[i/4]);
		}
		
		return result.toString();
	}
	
	
    /**
     * 비밀번호를 암호화하는 기능(복호화가 되면 안되므로 SHA-512 인코딩 방식 적용)
     * 
     * @param password 암호화될 패스워드
     * @param id salt로 사용될 사용자 ID 지정
     * @return
     * @throws Exception
     */
    public static String encryptSha512(String password, String id) {
		if (StringUtils.isBlank (password) || StringUtils.isBlank (id)) {	// 아이디 또는 비밀번호가 제대로 입력되지 않은 경우 예외 처리
		    throw new RuntimeException("id & password is blank");
		}
		MessageDigest md = null;
		try {
			md = MessageDigest.getInstance("SHA-512");
		} catch (NoSuchAlgorithmException e) {
			// TODO_bocos
			//throw new CustomException(ErrorCode.NO_SUCH_ALGORITHM);
			throw new RuntimeException(e);
		}
		md.reset();
		md.update(new StringBuffer (id).reverse ().append (id).toString ().getBytes());
		byte[] hashValue = md.digest(password.getBytes()); //  해쉬 값
		String result = "";
		for (int i = 0; i < hashValue.length; i++) {
            byte temp = hashValue[i];
            String s = Integer.toHexString(new Byte(temp));
            while (s.length() < 2) {
                s = "0" + s;
            }
            s = s.substring(s.length() - 2);
            result += s;
        }
		return result;
    }
    
    /*
    final static char[] digits = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c',
    	      'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
    	      'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    	      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'};
   	*/
    
    final static char[] digits = {'a', 'b', 'c',
	      'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
	      'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'};
    
    /**
     * 고유의 Hash값을 생성한다. 
     */
    public static String getDigits(Long v) {
    	if(v < 0) {
    		return "";
    	}
    	char buf[] = new char[33];
    	int charPos = buf.length - 1;
    	int radix = digits.length;
    	
    	while(v > -1) {
    		buf[charPos--] = digits[(int) (v % radix)];
    		v = v / radix;
    		if(v == 0) {
    			break;
    		}
    	}
    	return new String(buf, charPos + 1, (buf.length - 1 - charPos));
    }
    
    public static String unescape(String inp) {
		if(StrUtil.isEmpty(inp)) {
		    return "";
		}else {
			String rtnStr = new String();
			char[] arrInp = inp.toCharArray();
			int i;
			for (i = 0; i < arrInp.length; i++) {
				if (arrInp[i] == '%') {
					String hex;
					String str;
					if (arrInp[i + 1] == 'u') {
						hex = inp.substring(i + 2, i + 6);
						i += 5;
					} else {    //ascii
						hex = inp.substring(i + 1, i + 3);
						i += 2;
					}
					try {
						byte[] b;
						if (hex.length() == 2) {
							b = new byte[1];
							b[0] = (byte) (Integer.parseInt(hex, 16));
							str = new String(b, "ASCII");
						} else {
							b = new byte[2];
							b[0] = (byte) (Integer.parseInt(hex.substring(0, 2), 16));
							b[1] = (byte) (Integer.parseInt(hex.substring(2, 4), 16));
							str = new String(b, "UTF-16");
						}
						rtnStr += str;
					} catch (NumberFormatException e) {
						//e.printStackTrace();
						rtnStr += "%";
						i -= (hex.length() > 2 ? 5 : 2);
					} catch (Exception e) {
						// TODO_bocos
						//throw new CustomException(ErrorCode.NOT_CLASSIFIED);
						throw new RuntimeException(e);
					}
				} else {
					rtnStr += arrInp[i];
				}
			}

			return rtnStr;
		}
	}
	
	public static String escape(String src) {
		if(StrUtil.isEmpty(src)) {
			return "";
		}else {
			int i;
			char j;
			StringBuffer tmp = new StringBuffer();
			tmp.ensureCapacity(src.length() * 6);
			for (i = 0; i < src.length(); i++) {
				j = src.charAt(i);
				if (Character.isDigit(j) || Character.isLowerCase(j)
						|| Character.isUpperCase(j))
					tmp.append(j);
				else if (j < 256) {
					tmp.append("%");
					if (j < 16)
						tmp.append("0");
					tmp.append(Integer.toString(j, 16));
				} else {
					tmp.append("%u");
					tmp.append(Integer.toString(j, 16));
				}
			}
			return tmp.toString();
		}
	}
	
	
	public static String tempPwd(int size) {
		
		StringBuffer buffer = new StringBuffer();
		Random random = new Random();
				
			for (int i = 0; i < size; i++) {
				buffer.append(digits[random.nextInt(digits.length)]);
			}
		
		return buffer.toString();
	}

	public static boolean match(String first, String second)
	{

		// If we reach at the end of both strings,
		// we are done
		if (first.length() == 0 && second.length() == 0)
			return true;

		// Make sure to eliminate consecutive '*'
		if (first.length() > 1 &&first.charAt(0) == '*') {
			int i=0;
			while (i+1<first.length() && first.charAt(i+1) == '*')
				i++;
			first=first.substring(i);
		}

		// Make sure that the characters after '*'
		// are present in second string.
		// This function assumes that the first
		// string will not contain two consecutive '*'
		if (first.length() > 1 && first.charAt(0) == '*' &&
				second.length() == 0)
			return false;

		// If the first string contains '?',
		// or current characters of both strings match
		if ((first.length() > 1 && first.charAt(0) == '?') ||
				(first.length() != 0 && second.length() != 0 &&
						first.charAt(0) == second.charAt(0)))
			return match(first.substring(1),
					second.substring(1));

		// If there is *, then there are two possibilities
		// a) We consider current character of second string
		// b) We ignore current character of second string.
		if (first.length() > 0 && first.charAt(0) == '*')
			return match(first.substring(1), second) ||
					match(first, second.substring(1));
		return false;
	}
}
