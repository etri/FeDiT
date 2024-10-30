package net.jcms.framework.security.web;

import com.dreamsecurity.mobileOK.MobileOKException;
import com.dreamsecurity.mobileOK.mobileOKKeyManager;
import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.service.MobileOKService;
import net.jcms.framework.util.PropertiesUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.net.URLDecoder;

@Controller
@Slf4j
public class MobileOKController extends BaseController {
    @Autowired
    private ServletContext servletContext;
    @Autowired
    private MobileOKService mobileOKService;

    @ResponseBody
    @RequestMapping (value="/mok/mok-request.json", method = RequestMethod.POST)
    public Object mobileOKRequest(HttpServletRequest request, HttpSession session) {
        String mokKeyPwd = PropertiesUtil.getProperty("AppConf.mok.pwd");
        String mokKeyPath = PropertiesUtil.getProperty("AppConf.mok.path");
        String mokClientId = PropertiesUtil.getProperty("AppConf.mok.clientId");

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();

        String hostUrl = scheme + "://" + serverName + ":" + serverPort;

        try {
            mobileOKKeyManager mobileOK = new mobileOKKeyManager();
            mobileOK.keyInit(mokKeyPath, mokKeyPwd);

            return mobileOKService.mobileOkStdRequest(mobileOK, session, mokClientId, hostUrl);
        } catch (MobileOKException e) {
            return e.getErrorCode() + "|" + e.getMessage();
        }
    }

    @ResponseBody
    @RequestMapping (value = "/mok/mok-result.json")
    public Object mobileOKResult(HttpServletRequest request, HttpSession session) {
        String mokKeyPwd = PropertiesUtil.getProperty("AppConf.mok.pwd");
        String mokKeyPath = PropertiesUtil.getProperty("AppConf.mok.path");

        try {
            mobileOKKeyManager mobileOK = new mobileOKKeyManager();
            mobileOK.keyInit(mokKeyPath, mokKeyPwd);

            String data = request.getParameter("data");
            data = URLDecoder.decode(data, "UTF-8");

            return mobileOKService.mobileOkStdResult(data, mobileOK, session);
        } catch (MobileOKException e) {
            return e.getErrorCode() + "|" + e.getMessage();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
