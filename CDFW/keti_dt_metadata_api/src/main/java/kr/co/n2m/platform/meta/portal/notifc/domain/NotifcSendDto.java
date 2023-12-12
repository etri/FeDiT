package kr.co.n2m.platform.meta.portal.notifc.domain;

import java.io.Serializable;
import java.util.Map;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 알림 발송 정보 Dto
 *
 * @author n2m
 */
@Schema(description = "알림 발송 정보 Dto")
@Getter
@Setter
public class NotifcSendDto implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

    @Schema(description = "알림 유형 ID")
    private String notifcTypeId;
    
	@Schema(description = "접속 사용자 ID")
	private String connUserId;
	
	@Schema(description = "접속 사용자 명")
	private String connUserNm;
	
	@Schema(description = "알림 요청자 구분 코드")
	private String notifcRqtrDivMtcd;
	
	@Schema(description = "알림 요청자 ID / 요청 권한 ID")
	private String notifcRqtrId;
	
	@Schema(description = "알림 요청자 명 / 요청 권한 명")
	private String notifcRqtrNm;
	
	@Schema(description = "알림 파라미터들")
	private Map<String, Object> notifcParams;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.NO_CLASS_NAME_STYLE, true, true);
    }	
}
