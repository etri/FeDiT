package kr.co.e8ight.auth.entity.converter;

import kr.co.e8ight.auth.type.AuthType;

import javax.persistence.AttributeConverter;

public class AuthTypeConverter implements AttributeConverter<AuthType, String> {
    @Override
    public String convertToDatabaseColumn(AuthType attribute) {
        return attribute !=null ? attribute.getKey() : null;
    }

    @Override
    public AuthType convertToEntityAttribute(String dbData) {
        return dbData != null ? AuthType.getEnum(dbData) : null;
    }
}
