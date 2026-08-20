package kr.co.e8ight.auth.entity.converter;

import kr.co.e8ight.auth.type.MemberStatus;

import javax.persistence.AttributeConverter;

public class MemberStatusConverter implements AttributeConverter<MemberStatus, String> {

    @Override
    public String convertToDatabaseColumn(MemberStatus attribute) {
        return attribute !=null ? attribute.getKey() : null;
    }

    @Override
    public MemberStatus convertToEntityAttribute(String dbData) {
        return dbData != null ? MemberStatus.getEnum(dbData) : null;
    }
}
