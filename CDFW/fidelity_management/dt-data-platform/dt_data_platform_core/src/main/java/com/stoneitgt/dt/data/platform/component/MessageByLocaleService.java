package com.stoneitgt.dt.data.platform.component;

/**
 * 로컬 메시지 처리 클래스.
 *
 * @author yh.kim
 */
public interface MessageByLocaleService {
	/**
	 * 해당 id에 해당되는 내용을 가져온다.
	 *
	 * @param id
	 * @return
	 */
	String getMessage(String messageId);
}
