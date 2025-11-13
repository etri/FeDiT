package kr.co.n2m.platform.meta.portal.notifc.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.*;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import java.io.Serializable;

/**
 *  알림 검색 Vo
 *
 * @author  n2m
 */
@Schema(description="알림 검색 Vo")
@Getter
@Setter
@Alias("notifcSearchVo")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotifcSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

    @Schema(description = "알림 유형 검색어")
	private String searchTypeKeyword;  // 알림 유형: notifcTypeId or notifcTypeNm

    @Schema(description = "알림 대상자 검색어")
	private String searchTargetKeyword;	// 알림 대상자: notifc_tgtr_ids or notifc_tgtr_nms

    @Schema(description = "알림 메시지 템플릿")
	private String notifcMsgTmplt;	// 알림 메시지 템플릿 (type 테이블)

    @Schema(description = "알림 사용 여부")
	private String notifcUseYn;    // 알림 사용 여부

    @Schema(description = "알림 유형 ID")
	private String notifcTypeId;

    @Schema(description = "알림 대상 ID")
    private String notifcTgtId;  

	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
