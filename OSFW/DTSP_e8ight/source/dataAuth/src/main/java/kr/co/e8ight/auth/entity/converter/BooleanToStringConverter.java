package kr.co.e8ight.auth.entity.converter;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

/**
 * "Y" | "N" <-> true | false
 */
@Converter(autoApply=true)
public class BooleanToStringConverter implements AttributeConverter<Boolean, String> {

	@Override
	public String convertToDatabaseColumn(Boolean attribute) {
	    if (attribute == null) return "N";
		return attribute == true ? "Y":"N";
	}

	@Override
	public Boolean convertToEntityAttribute(String n) {
	    if (n == null) return false;
		return n.toUpperCase().equals("Y") ? true : false;
	}
}
