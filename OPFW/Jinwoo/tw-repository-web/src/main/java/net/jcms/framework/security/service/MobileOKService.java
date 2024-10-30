package net.jcms.framework.security.service;

import com.dreamsecurity.mobileOK.mobileOKKeyManager;

import javax.servlet.http.HttpSession;

public interface MobileOKService {
    Object mobileOkStdRequest(mobileOKKeyManager mobileOK, HttpSession session, String clientPrefix, String hostUrl);
    Object mobileOkStdResult(String result, mobileOKKeyManager mobileOK, HttpSession session);
}
