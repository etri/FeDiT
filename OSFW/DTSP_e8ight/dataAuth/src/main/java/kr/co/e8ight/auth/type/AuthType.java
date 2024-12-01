package kr.co.e8ight.auth.type;

import kr.co.e8ight.auth.exception.AuthorizationException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;

import java.util.Arrays;

public enum AuthType implements EnumType {
	USER("MB", "사용자"),
	ADMIN("AM", "관리자");

	private String key;
	private String value;

	AuthType(String key, String value) {
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

	public static AuthType getEnum(String key) {
		return Arrays.stream(values()).filter(p -> p.key.equals(key)).findAny()
				.orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED,"AuthType : No code. code="+key));
	}

	public static AuthType getEnumFromValue(String value) {
		if ( value == null || value.isEmpty() ) {
			return null;
		}
		return Arrays.stream(values()).filter(p -> p.value.equals(value)).findAny()
				.orElseThrow(() -> {
					String message = "AuthType : No value '" + value +"'";
					return new AuthorizationException(ErrorCode.UNAUTHORIZED,message);
				});
	}

	public static String searchValue(String key) {
		AuthType enumData = Arrays.stream(values()).filter(p -> p.key.equals(key)).findAny()
				.orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED));
		String value = enumData == null ? "UNKNOWN" : enumData.getValue();
		return value;
	}

}
