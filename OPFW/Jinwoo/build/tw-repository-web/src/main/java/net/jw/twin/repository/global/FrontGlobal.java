package net.jw.twin.repository.global;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.text.SimpleDateFormat;
import java.time.format.DateTimeFormatter;

public class FrontGlobal {

    public static SimpleDateFormat dateTimeFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public static final String dateTimePattern = "yyyy-MM-dd HH:mm:ss";
    public static final String dateTimePatternNoSeconds = "yyyy-MM-dd HH:mm";
    public static final SimpleDateFormat dateFormat = new SimpleDateFormat(dateTimePattern);
    public static final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(dateTimePattern);
    public static final DateTimeFormatter dateTimeFormatterNoSeconds = DateTimeFormatter.ofPattern(dateTimePatternNoSeconds);

    public static Boolean hasWritePermissionAsManager(HttpServletRequest request) {
        HttpSession session = request.getSession();
        String userRole = (session.getAttribute("userRole")).toString();
        if(userRole != null){
            if( userRole.equals(CodeValue.ROLE_AUTH.ROLE_SYSTEM.toString())
                 || userRole.equals(CodeValue.ROLE_AUTH.ROLE_MANAGER.toString()) ) {
                return true;
            }
        }
        return false;
    }

    public static Boolean isCurrentUserSystemUser(HttpServletRequest request){
        HttpSession session = request.getSession();
        String userRole = (session.getAttribute("userRole")).toString();
        if(userRole != null){
            if( userRole.equals(CodeValue.ROLE_AUTH.ROLE_SYSTEM.toString()) ) {
                return true;
            }
        }
        return false;
    }
}
