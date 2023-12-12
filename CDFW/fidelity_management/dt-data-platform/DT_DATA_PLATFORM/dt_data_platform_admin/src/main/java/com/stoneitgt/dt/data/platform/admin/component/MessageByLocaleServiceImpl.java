package com.stoneitgt.dt.data.platform.admin.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import com.stoneitgt.dt.data.platform.component.MessageByLocaleService;


/**
 * 로컬 메세지 처리 클래스.
 *
 * @author yh.kim
 */
@Component
public class MessageByLocaleServiceImpl implements MessageByLocaleService {
	/**
	 * 메세지 처리.
	 */
	@Autowired
	private MessageSource messageSource;

	@Override
	public String getMessage(String messageId) {
		return messageSource.getMessage(messageId, null, LocaleContextHolder.getLocale());
	}
}
