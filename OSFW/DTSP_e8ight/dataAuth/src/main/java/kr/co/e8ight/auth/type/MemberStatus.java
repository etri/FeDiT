package kr.co.e8ight.auth.type;

import kr.co.e8ight.auth.exception.AuthorizationException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;

import java.util.Arrays;

public enum MemberStatus implements EnumType {
	READY ("R", "대기"),
	ACTIVE ("A","활동"),
	STOP ("S", "정지");

	private String key;
	private String value;

	MemberStatus(String key, String value) {
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

	public static MemberStatus getEnum(String key) {
		return Arrays.stream(values()).filter(p -> p.key.equals(key)).findAny()
				.orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED,"MemberStatus : No code. code="+key));
	}

	public static MemberStatus getEnumFromValue(String value) {
		if ( value == null || value.isEmpty() ) {
			return null;
		}
		return Arrays.stream(values()).filter(p -> p.value.equals(value)).findAny()
				.orElseThrow(() -> {
					String message = "MemberStatus : No value '" + value +"'";
					return new AuthorizationException(ErrorCode.UNAUTHORIZED,message);
				});
	}

	public static String searchValue(String key) {
		MemberStatus enumData = Arrays.stream(values()).filter(p -> p.key.equals(key)).findAny()
				.orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED));
		String value = enumData == null ? "UNKNOWN" : enumData.getValue();
		return value;
	}
}
