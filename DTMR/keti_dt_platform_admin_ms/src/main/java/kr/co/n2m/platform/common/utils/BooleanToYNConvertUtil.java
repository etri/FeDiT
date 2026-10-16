package kr.co.n2m.platform.common.utils;

import javax.persistence.AttributeConverter;

public class BooleanToYNConvertUtil implements AttributeConverter<Boolean, String> {

	/** Boolean 값을 Y or N 으로 변경 */
	@Override
	public String convertToDatabaseColumn(Boolean useYN) {
		return (useYN != null && useYN) ? "Y" : "N";
	}
	
	/** Y or N 을 Boolean 값 으로 변경 */
	@Override
	public Boolean convertToEntityAttribute(String useYN) {
		return "Y".equalsIgnoreCase(useYN);
	}
}
