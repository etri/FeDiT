package kr.co.n2m.platform.meta.portal.notifc.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

@Getter
@Setter
@Alias("notifcTypeDto")
public class NotifcTypeDto {

    @Schema(description = "알림 유형 ID")
    private String notifcTypeId;

    @Schema(description = "알림 유형 명")
    private String notifcTypeNm;

    @Schema(description = "알림 사용 여부")
    private String notifcUseYn;

    private String notifcTgtrNmsStr;    // 알림 유형에 대한 여러 개의 알림 대상의 알림 대상자 NM를 이어붙인 형태

    private String notifcTgtrIdsStr;    // 알림 유형에 대한 여러 개의 알림 대상의 알림 대상자 ID를 이어붙인 형태

    @Schema(description = "알림 메시지 템플릿")
    private String notifcMsgTmplt;


    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
}
