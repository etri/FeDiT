package kr.co.e8ight.auth.service;

import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RegularExpression {
    public static final String pattern1 = "^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[$@$!%*#?&])[A-Za-z[0-9]$@$!%*#?&]{8,20}$"; // 영문, 숫자, 특수문자
    public static final String pattern2 = "^[A-Za-z[0-9]]{10,20}$"; // 영문, 숫자
    public static final String pattern3 = "^[[0-9]$@$!%*#?&]{10,20}$"; //영문,  특수문자
    public static final String pattern4 = "^[[A-Za-z]$@$!%*#?&]{10,20}$"; // 특수문자, 숫자
    public static final String pattern5 = "(\\w)\\1\\1\\1"; // 같은 문자, 숫자

    Matcher match;
/**

 * 비밀번호 정규식 체크
 * @return
 */

    public boolean pwdRegularExpressionChk(String newPwd, String oldPwd, String userId, String patternType) {
        boolean chk = false;

        match = Pattern.compile(patternType).matcher(newPwd);
        if(match.find()) chk = true;

        if(chk) {
            // 연속문자 4자리
            if(samePwd(newPwd)) return false;

            // 같은문자 4자리
            if(continuousPwd(newPwd)) return false;

            // 이전 아이디 4자리
            if(oldPwd != null && newPwd.equals(oldPwd)) return false;

            // 아이디와 동일 문자 4자리
            if(sameId(newPwd, userId)) return false;
        }

        return true;
    }

    /**
     * 같은 문자, 숫자 4자리 체크
     * @param pwd
     * @return
     */
    public boolean samePwd(String pwd) {
        match = Pattern.compile(pattern5).matcher(pwd);
        return match.find() ? true : false;
    }

    /**
     * 연속 문자, 숫자 4자리 체크
     * @param pwd
     * @return
     */
    public boolean continuousPwd(String pwd) {
        int o = 0;
        int d = 0;
        int p = 0;
        int n = 0;
        int limit = 4;

        for(int i=0; i<pwd.length(); i++) {
            char tempVal = pwd.charAt(i);

            if(i > 0 && (p = o - tempVal) > -2 && (n = p == d ? n + 1 :0) > limit -3) {
                return true;
            }

            d = p;
            o = tempVal;
        }
        return false;
    }

    /**
     * 아이디와 동일 문자 4자리 체크
     * @param pwd
     * @param id
     * @return
     */
    public boolean sameId(String pwd, String id) {
        for(int i=0; i<pwd.length()-3; i++) {

            if(id.contains(pwd.substring(i, i+4))) {
               return true;
            }
        }
        return false;
    }
}