package net.jcms.framework.security.util;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.security.springExt.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@Slf4j
public class UserDetailsHelper {
    public static Object getAuthenticatedUser() {
        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context.getAuthentication();
        if (null == authentication) {
            log.debug("## authentication object is null!!");
            return null;
        } else if (authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl details = (UserDetailsImpl)authentication.getPrincipal();
            log.debug("## UserDetailsHelper.getAuthenticatedUser : AuthenticatedUser is {}", details.getUsername());
            return details.getUser();
        } else {
            return authentication.getPrincipal();
        }
    }
}
