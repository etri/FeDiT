package kr.co.n2m.platform.meta.portal.notifc.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 알림 기본 정보 Vo
 *
 * @author n2m
 */
@Schema(description = "알림 기본 정보 Vo")
@Getter
@Setter
public class NotifcVo extends BaseVo {

	@Schema(description = "알림 ID")
	private String notifcId;
	
	@Schema(description = "사용자 ID")
	private String userId;
	
	@Schema(description = "알림 메시지")
	private String notifcMsg;
	
	@Schema(description = "알림 링크 URL")
	private String notifcLinkUrl;
	
	@Schema(description = "알림 유형 ID")
	private String notifcTypeId;
	
	@Schema(description = "알림 요청자 구분 코드")
	private String notifcRqtrDivMtcd;
	
	@Schema(description = "알림 요청자 ID")
	private String notifcRqtrId;
	
	@Schema(description = "알림 요청자 명")
	private String notifcRqtrNm;
	
	@Schema(description = "알림 등록 일시")
	private String notifcRegDt;

	@Schema(description = "알림 확인 일시")	
	private String notifcConfDt;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
}
