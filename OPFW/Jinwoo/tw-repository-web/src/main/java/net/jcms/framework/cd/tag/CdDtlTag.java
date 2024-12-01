package net.jcms.framework.cd.tag;

import net.jcms.framework.base.tag.BaseTag;
import net.jcms.framework.cd.model.CdDtl;
import net.jcms.framework.cd.service.CdDtlService;
import net.jcms.framework.util.StrUtil;

import javax.servlet.jsp.JspWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class CdDtlTag extends BaseTag{

	private CdDtlService cdDtlService;
	
	@Override
	protected int doProcessTag() throws IOException {
		cdDtlService = getRequestContext().getWebApplicationContext().getBean(CdDtlService.class);
		
		JspWriter out = pageContext.getOut ();
		StringBuffer sb = new StringBuffer();
		Map<String, List<CdDtl>> cdDtlMap = cdDtlService.selectJson();
		List<CdDtl> cdDtlList = cdDtlMap.get(getCd());
			
		if("radio".equals(getType())) {
			for(CdDtl cdDtl : cdDtlList) {
				sb.append("<label class='mr10'>");
				sb.append("<input type='radio' ");
				if(!StrUtil.isEmpty(getName())) {
					sb.append(" name='"+getName()+"' ");
				}
				sb.append(" value='"+cdDtl.getCdDtlId()+"' ");
				if(!StrUtil.isEmpty(getValue())) {
					if(cdDtl.getCdDtlId().equals(getValue())) sb.append(" checked='checked' ");
				}
				if(!StrUtil.isEmpty(getEvent())) {
					sb.append(getEvent());
				}
				sb.append(">&nbsp;");
				if("Y".equals(getLabelYn())) sb.append("<span class='label label-"+cdDtl.getCdDtlLabel()+"'>"); 
				sb.append(cdDtl.getCdDtlNm());
				if("Y".equals(getLabelYn())) sb.append("</span>");
				sb.append("</label>");
			}
		}else {
			sb.append("<select");
			if(!StrUtil.isEmpty(getId())) sb.append(" id='"+getId()+"' ");
			if(!StrUtil.isEmpty(getName())) sb.append(" name='"+getName()+"' ");
			if(!StrUtil.isEmpty(getStyleClass())) sb.append(" class='"+getStyleClass()+"' ");
			sb.append(">");
			if(!StrUtil.isEmpty(getHeaderText())) {
				sb.append("<option value='");
				if(!StrUtil.isEmpty(getHeaderValue())) {
					sb.append(getHeaderValue());
				}
				sb.append("'>");
				sb.append(getHeaderText());
				sb.append("</option>");
			}
			
			for(CdDtl cdDtl : cdDtlList) {
				sb.append("<option value='"+cdDtl.getCdDtlId()+"'");
				if("Y".equals(getLabelYn())) {
					sb.append(" data-content='<span class=\"label label-"+cdDtl.getCdDtlLabel()+"\">"+cdDtl.getCdDtlNm()+"</span>' ");
				}
				if(!StrUtil.isEmpty(getValue())) {
					if(getValue().equals(cdDtl.getCdDtlId())) sb.append(" selected ");
				}
				sb.append(">");
				sb.append(cdDtl.getCdDtlNm());
				sb.append("</option>");
			}
			sb.append("</select>");
		}
		
		out.print(sb.toString());
		return SKIP_BODY;
	}

}
