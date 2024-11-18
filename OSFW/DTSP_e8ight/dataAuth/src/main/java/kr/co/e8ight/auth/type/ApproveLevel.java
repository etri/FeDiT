package kr.co.e8ight.auth.type;

import kr.co.e8ight.auth.exception.AuthorizationException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;

import java.util.Arrays;

public enum ApproveLevel implements EnumType{
    NONE("NN", "없음"),
    APPLY("AP", "신청"),
    APPROVE("AV", "승인"),
    REJECT("RJ", "반려");

    private String key;
    private String value;

    ApproveLevel(String key, String value) {
        this.key = key;
        this.value = value;
    }

    @Override
    public String getKey() {
        return key;
    }

    @Override
    public String getValue() {
        return value;
    }

    public static ApproveLevel getEnum(String key) {
        return Arrays.stream(values()).filter(p -> p.key.equals(key)).findAny()
                .orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED,"ApproveLevel : No code. code="+key));
    }

    public static ApproveLevel getEnumFromValue(String value) {
        if ( value == null || value.isEmpty() ) {
            return null;
        }
        return Arrays.stream(values()).filter(p -> p.value.equals(value)).findAny()
                .orElseThrow(() -> {
                    String message = "ApproveLevel : No value '" + value +"'";
                    return new AuthorizationException(ErrorCode.UNAUTHORIZED,message);
                });
    }

    public static String searchValue(String key) {
        ApproveLevel enumData = Arrays.stream(values()).filter(p -> p.key.equals(key)).findAny()
                .orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED));
        String value = enumData == null ? "UNKNOWN" : enumData.getValue();
        return value;
    }
}
