package kr.co.n2m.platform.meta.portal.notifc.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 알림 정보 Dto
 *
 * @author n2m
 */
@Schema(description = "알림 정보 Dto")
@Getter
@Setter
public class NotifcDto extends NotifcVo {
	
//	@Schema(description = "알림 요청자 구분 코드 명")
//	private String notifcRqtrDivMtcdNm;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
}
