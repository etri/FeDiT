package kr.co.e8ight.ndxpro.translatorManager.exception;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.apache.commons.lang3.StringUtils;

/**
 * 타 서비스(빌더/인증/게이트웨이 등)가 내려주는 에러 본문.
 * 서비스마다 원인 메시지를 담는 필드가 달라(detail / message / error) 모두 받아둔 뒤
 * {@link #resolveDetail()} 로 하나를 골라 쓴다.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class BuildErrorResult {
    private String type;
    private String title;
    private String detail;
    private int code;

    // Spring Boot 기본 에러 포맷 / 게이트웨이 에러 포맷
    private String message;
    private String error;
    private String exception;
    private String path;
    private int errorCode;

    /**
     * 원인 메시지를 담고 있을 법한 필드를 우선순위대로 훑는다. 전부 비어 있으면 null.
     */
    public String resolveDetail() {
        if (StringUtils.isNotBlank(detail)) {
            return detail;
        }
        if (StringUtils.isNotBlank(message)) {
            return StringUtils.isNotBlank(exception) ? exception + ": " + message : message;
        }
        if (StringUtils.isNotBlank(error)) {
            return error;
        }
        if (StringUtils.isNotBlank(title)) {
            return title;
        }
        return null;
    }
}
