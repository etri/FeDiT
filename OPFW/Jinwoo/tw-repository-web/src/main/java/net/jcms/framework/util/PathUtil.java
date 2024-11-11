package net.jcms.framework.util;

import javax.servlet.http.HttpServletRequest;

public class PathUtil {

	public static String getWebRoot(HttpServletRequest request){
		return request.getSession().getServletContext().getRealPath("");
	}
	
	public static String getImagesPath(HttpServletRequest request){
		return getWebRoot(request)+"/images/";
	}
	
}
