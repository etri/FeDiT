package kr.co.n2m.platform.meta.portal.notifc.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자별 알림 설정 기본 정보 Vo
 *
 * @author n2m
 */
@Schema(description = "사용자별 알림 설정 기본 정보 Vo")
@Getter
@Setter
@Alias("notifcSettingVo")
public class NotifcSettingVo extends BaseVo {

    @Schema(description = "알림 설정 ID")
    private String notifcSetupId;

    @Schema(description = "사용자 ID")
    private String userId;

    @Schema(description = "알림 유형 ID")
    private String notifcTypeId;

    @Schema(description = "알림 수신 여부")
    private String notifcRcvYn;
    
    @Schema(description = "알림 팝업 여부")
    private String notifcPopupYn;

    @Schema(description = "알림 설정 등록 일시")
    private String notifcSetupRegDt;

    @Schema(description = "알림 설정 수정 일시")
    private String notifcSetupAmdDt;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
}