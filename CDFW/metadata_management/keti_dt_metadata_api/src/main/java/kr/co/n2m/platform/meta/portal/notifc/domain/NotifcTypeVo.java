package kr.co.n2m.platform.meta.portal.notifc.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 알림 유형 기본 정보 Vo
 *
 * @author n2m
 */
@Schema(description = "알림 유형 기본 정보 Vo")
@Getter
@Setter
@Alias("notifcTypeVo")
public class NotifcTypeVo extends BaseVo {

    @Schema(description = "알림 유형 ID")
    private String notifcTypeId;

    @Schema(description = "알림 유형 명")
    private String notifcTypeNm;

    @Schema(description = "알림 사용 여부")
    private String notifcUseYn;

    @Schema(description = "알림 유형 설명")
    private String notifcTypeDesc;

    @Schema(description = "알림 메시지 제한 길이")
    private int notifcMsgRstrtnLen;

    @Schema(description = "알림 메시지 템플릿")
    private String notifcMsgTmplt;

    @Schema(description = "알림 링크 템플릿 URL")
    private String notifcLinkTmpltUrl;

    @Schema(description = "알림 유형 등록자 ID")
    private String notifcTypeRegrId;

    @Schema(description = "알림 유형 등록자 명")
    private String notifcTypeRegrNm;

    @Schema(description = "알림 유형 등록 일시")
    private String notifcTypeRegDt;

    @Schema(description = "알림 유형 수정자 ID")
    private String notifcTypeAmdrId;

    @Schema(description = "알림 유형 수정자 명")
    private String notifcTypeAmdrNm;

    @Schema(description = "알림 유형 수정 일시")
    private String notifcTypeAmdDt;

    @Schema(description = "알림 유형 정렬 순서")
    private Integer notifcTypeSortOdrg;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
}
