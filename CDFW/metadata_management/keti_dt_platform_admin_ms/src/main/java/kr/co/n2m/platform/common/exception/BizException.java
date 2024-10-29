package kr.co.n2m.platform.common.exception;

import java.text.MessageFormat;
import java.util.Locale;

import org.springframework.context.MessageSource;

public class BizException extends BaseException {

	private static final long serialVersionUID = -8957086337058695636L;

	/**
	 * BizException 생성자
	 */
	public BizException() {
		this("BaseException without message", null, null);
	}

	/**
	 * BizException 생성자
	 * 
	 * @param defaultMessage 메세지 지정
	 */
	public BizException(String defaultMessage) {
		this(defaultMessage, null, null);
	}

	/**
	 * BizException 생성자
	 * 
	 * @param defaultMessage   메세지 지정
	 * @param wrappedException 발생한 Exception 내포함
	 */
	public BizException(String defaultMessage, Exception wrappedException) {
		this(defaultMessage, null, wrappedException);
	}

	/**
	 * BizException 생성자
	 * 
	 * @param defaultMessage    메세지 지정(변수지정)
	 * @param messageParameters 치환될 메세지 리스트
	 * @param wrappedException  발생한 Exception 내포함.
	 */
	public BizException(String defaultMessage, Object[] messageParameters, Exception wrappedException) {
		String userMessage = defaultMessage;
		if (messageParameters != null) {
			userMessage = MessageFormat.format(defaultMessage, messageParameters);
		}
		this.message = userMessage;
		this.wrappedException = wrappedException;
	}

	/**
	 * BizException 생성자
	 * 
	 * @param messageSource 메세지 리소스
	 * @param messageKey    메세지키값
	 */
	public BizException(MessageSource messageSource, String messageKey) {
		this(messageSource, messageKey, null, null, Locale.getDefault(), null);
	}

	/**
	 * BizException 생성자
	 * 
	 * @param messageSource    메세지 리소스
	 * @param messageKey       메세지키값
	 * @param wrappedException 발생한 Exception 내포함.
	 */
	public BizException(MessageSource messageSource, String messageKey, Exception wrappedException) {
		this(messageSource, messageKey, null, null, Locale.getDefault(), wrappedException);
	}

	public BizException(MessageSource messageSource, String messageKey, Locale locale, Exception wrappedException) {
		this(messageSource, messageKey, null, null, locale, wrappedException);
	}

	public BizException(MessageSource messageSource, String messageKey, Object[] messageParameters, Locale locale, Exception wrappedException) {
		this(messageSource, messageKey, messageParameters, null, locale, wrappedException);
	}

	public BizException(MessageSource messageSource, String messageKey, Object[] messageParameters, Exception wrappedException) {
		this(messageSource, messageKey, messageParameters, null, Locale.getDefault(), wrappedException);
	}

	public BizException(MessageSource messageSource, String messageKey, Object[] messageParameters, String defaultMessage, Exception wrappedException) {
		this(messageSource, messageKey, messageParameters, defaultMessage, Locale.getDefault(), wrappedException);
	}

	public BizException(MessageSource messageSource, String messageKey, Object[] messageParameters, String defaultMessage, Locale locale, Exception wrappedException) {
		this.messageKey = messageKey;
		this.messageParameters = messageParameters;
		this.message = messageSource.getMessage(messageKey, messageParameters, defaultMessage, locale);
		this.wrappedException = wrappedException;
	}
}
