package net.jcms.framework.util;

import org.springframework.context.support.MessageSourceAccessor;

import java.util.Locale;

/**
 * message-common.properties에 있는 내용을 조회한다. 
 */
public class MessageUtil {

	private static MessageSourceAccessor msAcc = null;

	public void setMessageSourceAccessor(MessageSourceAccessor msAcc) {
		MessageUtil.msAcc = msAcc;
	}
	
	public static String getMessage(String key) {
		return msAcc.getMessage(key, Locale.getDefault());
	}

	public static String getMessage(String key, Object[] objs) {
		return msAcc.getMessage(key, objs, Locale.getDefault());
	}
}
