package kr.co.e8ight.auth.entity.converter;

import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;

import javax.persistence.AttributeConverter;

public class ApproveLevelConverter implements AttributeConverter<ApproveLevel, String> {
    @Override
    public String convertToDatabaseColumn(ApproveLevel attribute) {
        return attribute !=null ? attribute.getKey() : null;
    }

    @Override
    public ApproveLevel convertToEntityAttribute(String dbData) {
        return dbData != null ? ApproveLevel.getEnum(dbData) : null;
    }
}
