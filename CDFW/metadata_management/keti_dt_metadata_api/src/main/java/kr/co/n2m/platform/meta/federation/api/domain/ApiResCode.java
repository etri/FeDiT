package kr.co.n2m.platform.meta.federation.api.domain;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "API 응답 코드")
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum ApiResCode {
	
	// 디지털 트윈 연합 - 제7부: 레지스트리 인터페이스 및 프로토콜 --- 기준 오류 코드 ---
	
    // 2NNN: 성공
    SUCCESS(2000, "Success", "성공"),
    CREATED(2001, "Created", "생성 성공"),
    DELETED(2002, "Deleted", "삭제 성공"),
    CHANGED(2004, "Changed", "갱신 성공"),

    // 3NNN: Body 오류
    BODY_PARSE_ERROR(3001, "Body parse error", "요청 메시지 Body에 대한 Parsing(JSON) 오류"),
    BODY_ERROR(3002, "Body error", "요청 메시지의 기본 구조 등 오류"),

    // 4NNN: 파라미터 오류
    MANDATORY_PARAM_MISSING(4001, "Mandatory parameter missing", "필수 파라미터가 존재하지 않음"),
    UNKNOWN_PARAMETER(4002, "Unknown parameter", "알 수 없는 파라미터가 포함됨"),
    PARAM_TYPE_ERROR(4003, "Parameter type error", "파라미터 유형이 올바르지 않음"),
    PARAM_VALUE_ERROR(4004, "Parameter value error", "범위를 벗어난 등 파라미터 값이 올바르지 않음"),
    CLASSIFICATION_ERROR(4005, "Classification error", "범위를 벗어나는 등 식별자 값이 올바르지 않음"),

    // 5NNN: 인증/권한 오류
    UNKNOWN_USER(5001, "Unknown user", "알 수 없는 사용자"),
    AUTH_ERROR(5002, "Authentication error", "인증 오류"),
    PERMISSION_ERROR(5003, "Permission error", "요청 권한이 존재하지 않음"),
    REQUEST_REJECTED(5004, "Request rejected", "요청이 거절됨"),

    // 6NNN: 레지스트리 오류
    UNKNOWN_QUERY(6001, "Unknown query", "알 수 없는 Query 파라미터"),
    UNKNOWN_DTID(6002, "Unknown dtid", "존재하지 않는 디지털 트윈 식별자"),
    
    // 디지털 트윈 연합 - 제12부: 적합성 시험방법 기준 오류 코드 --- 기준 오류 코드 ---
    
    //2000~2004 OK 성공
    BAD_REQUEST(4000, "Bad Request", "요청 파라미터 오류"),
    //4005 CLASSIFICATION_ERROR - IDENTIFIER_VALUE_ERROR(4005, "Identifier Value Error", "식별자 값 오류"),
    UNAUTHORIZED(4010, "Unauthorized", "요청 사용자 인증 토큰 정보 오류"), // TODO 5002??? 4010???
    NOT_FOUND(4040, "Not Found", "잘못된 URI값(잘못된 URI 구성)"),
    
    // --- 기타 ---
    // 5000: 서버 내부 오류 (n2m 추가)
    INTERNAL_SERVER_ERROR(5000, "Internal server error", "서버 내부 오류가 발생했습니다")
    ;

    private final int code;
    private final String message;
    private final String description;

    ApiResCode(int code, String message, String description) {
        this.code = code;
        this.message = message;
        this.description = description;
    }

    public int code() {
        return code;
    }

    public String message() {
        return message;
    }

    public String description() {
        return description;
    }
    
    private static final Map<Integer, ApiResCode> CODE_MAP = Arrays.stream(values())
    	    .collect(Collectors.toMap(ApiResCode::code, Function.identity()));

	public static ApiResCode fromCode(int code) {
	    return CODE_MAP.get(code);
	}
	
	public static String getMessageByCode(int code) {
	    ApiResCode res = fromCode(code);
	    return res != null ? res.message : "Unknown Code";
	}

	public static String getDescriptionByCode(int code) {
	    ApiResCode res = fromCode(code);
	    return res != null ? res.description : "설명 없음";
	}    

}
