package kr.co.n2m.platform.meta.portal.notifc.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.*;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

/**
 * 알림 대상 기본 정보 Vo
 *
 * @author n2m
 */
@Schema(description = "알림 대상 기본 정보 Vo")
@Getter
@Setter
@Alias("notifcTargetVo")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotifcTargetVo extends BaseVo {

    @Schema(description = "알림 대상 ID")
    private String notifcTgtId;

    @Schema(description = "알림 유형 ID")
    private String notifcTypeId;

    @Schema(description = "알림 대상 유형 코드")
    private String notifcTgtTypeMtcd;

    @Schema(description = "알림 대상 구분 코드")
    private String notifcTgtDivMtcd;

    @Schema(description = "알림 대상자 IDS")
    private String notifcTgtrIds;

    @Schema(description = "알림 대상자 명S")
    private String notifcTgtrNms;

    @Schema(description = "알림 대상 등록 일시")
    private String notifcTgtRegDt;

    @Schema(description = "알림 대상 수정 일시")
    private String notifcTgtAmdDt;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
}