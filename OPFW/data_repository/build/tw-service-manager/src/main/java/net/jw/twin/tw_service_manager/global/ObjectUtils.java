package net.jw.twin.tw_service_manager.global;

import java.lang.reflect.Field;

public class ObjectUtils {
    public static void copyFields(Object source, Object target) {
        Field[] fields = getAllFields(source.getClass());

        for (Field field : fields) {
            try {
                field.setAccessible(true);
                Field targetField = target.getClass().getDeclaredField(field.getName());
                targetField.setAccessible(true);
                targetField.set(target, field.get(source));
            } catch (NoSuchFieldException | IllegalAccessException e) {
                e.printStackTrace();
            }
        }
    }

    public static Field[] getAllFields(Class<?> clazz) {
        // 해당 클래스와 상위 클래스의 모든 필드를 가져오기 위한 리스트
        Field[] fields = clazz.getDeclaredFields();

        // 상위 클래스가 있다면 재귀적으로 필드를 가져옴
        if (clazz.getSuperclass() != null) {
            Field[] parentFields = getAllFields(clazz.getSuperclass());
            Field[] allFields = new Field[fields.length + parentFields.length];
            System.arraycopy(fields, 0, allFields, 0, fields.length);
            System.arraycopy(parentFields, 0, allFields, fields.length, parentFields.length);
            return allFields;
        }

        return fields;
    }
}
