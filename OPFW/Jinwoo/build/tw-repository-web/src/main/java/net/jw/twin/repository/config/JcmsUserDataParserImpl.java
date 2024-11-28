package net.jw.twin.repository.config;

import net.jcms.framework.base.JcmsUserDataParser;
import net.jcms.framework.security.util.UserDetailsHelper;
import net.jcms.framework.security.model.User;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;

import java.util.Optional;

public class JcmsUserDataParserImpl implements JcmsUserDataParser {
    @Override
    public Long getUserId() {
        if("anonymousUser".equals(UserDetailsHelper.getAuthenticatedUser())) {
            return null;
        }
        User user = Optional.ofNullable((User)UserDetailsHelper.getAuthenticatedUser()).orElseThrow(() -> new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "failed to get authenticated user"));
        if(user.getUserId () == null) {
            throw new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "user is null.");
        }
        return user.getUserId ();
    }
}
