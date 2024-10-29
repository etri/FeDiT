package kr.co.n2m.platform.meta.portal.notifc.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자별 알림 설정 정보 Dto
 *
 * @author n2m
 */
@Schema(description = "사용자별 알림 설정 정보 Dto")
@Getter
@Setter
public class NotifcSettingDto extends NotifcSettingVo {

    @Schema(description = "알림 유형 명")
    private String notifcTypeNm;	
	
    @Schema(description = "알림 메시지 제한 길이")
    private int notifcMsgRstrtnLen;

    @Schema(description = "알림 메시지 템플릿")
    private String notifcMsgTmplt;

    @Schema(description = "알림 링크 템플릿 URL")
    private String notifcLinkTmpltUrl;
    
    @Schema(description = "알림 대상 유형 코드 명 나열")
    private String notifcTgtTypeMtcdNmStr;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
}
