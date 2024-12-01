package net.jcms.framework.base.tag;

import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.tags.RequestContextAwareTag;

import java.io.IOException;
import java.util.Locale;

@SuppressWarnings("serial")
public abstract class BaseTag extends  RequestContextAwareTag  {
	
	private String type;
	private String id;
	private String name;
	private String value;
	private String cd;
	private String headerText;
	private String headerValue;
	private String styleClass;
	private String labelYn;
	private Boolean snsYn;
	private String event;
	
	private String menuId;
	private String siteId;
	
	public Boolean getSnsYn() {
		return snsYn;
	}

	public void setSnsYn(Boolean snsYn) {
		this.snsYn = snsYn;
	}

	public String getMenuId() {
		return menuId;
	}

	public void setMenuId(String menuId) {
		this.menuId = menuId;
	}

	public String getSiteId() {
		return siteId;
	}

	public void setSiteId(String siteId) {
		this.siteId = siteId;
	}

	public String getEvent() {
		return event;
	}

	public void setEvent(String event) {
		this.event = event;
	}

	public String getLabelYn() {
		return labelYn;
	}

	public void setLabelYn(String labelYn) {
		this.labelYn = labelYn;
	}

	public String getStyleClass() {
		return styleClass;
	}

	public void setStyleClass(String styleClass) {
		this.styleClass = styleClass;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getValue() {
		return value;
	}

	public WebApplicationContext getWac() {
		return wac;
	}

	public void setWac(WebApplicationContext wac) {
		this.wac = wac;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public String getCd() {
		return cd;
	}

	public void setCd(String cd) {
		this.cd = cd;
	}
	
	public String getHeaderText() {
		return headerText;
	}

	public void setHeaderText(String headerText) {
		this.headerText = headerText;
	}

	public String getHeaderValue() {
		return headerValue;
	}

	public void setHeaderValue(String headerValue) {
		this.headerValue = headerValue;
	}

	


	WebApplicationContext wac = null;
	@Override
	protected int doStartTagInternal () throws IOException {
		wac = getRequestContext ().getWebApplicationContext ();
		AutowireCapableBeanFactory acbf = wac.getAutowireCapableBeanFactory ();
		acbf.autowireBean (this);
		
		return doProcessTag ();
	}
	
	protected String getMessage (String code, Object[] args, String defaultMessage, Locale locale) {
		if (wac != null)
			return wac.getMessage (code, args, defaultMessage, locale);
		
		return defaultMessage;
	}
	
	protected abstract  int doProcessTag () throws IOException;
	
}
