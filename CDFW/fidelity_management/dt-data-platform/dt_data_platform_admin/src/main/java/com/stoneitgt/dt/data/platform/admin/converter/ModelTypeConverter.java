package com.stoneitgt.dt.data.platform.admin.converter;

import com.stoneitgt.dt.data.platform.enums.ModelType;
import org.springframework.core.convert.converter.Converter;

public class ModelTypeConverter implements Converter<String, ModelType> {
    /**
     * 문자열을 Role 열거형으로 변환합니다.
     *
     * @param source 변환할 문자열
     * @return Role 열거형
     */
    @Override
    public ModelType convert(String source) {
        try {
            // 대문자로 변환 후 Grant 열거형으로 변환
            return ModelType.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(e);
        }
    }
}
