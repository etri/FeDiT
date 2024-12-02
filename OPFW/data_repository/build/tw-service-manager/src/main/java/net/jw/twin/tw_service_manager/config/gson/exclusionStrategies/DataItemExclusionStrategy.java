package net.jw.twin.tw_service_manager.config.gson.exclusionStrategies;

import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;
import net.jw.twin.repository.db.dataItem.model.DataItem;

public class DataItemExclusionStrategy implements ExclusionStrategy {
    @Override
    public boolean shouldSkipField(FieldAttributes f) {
        // DataItem 클래스에서만 regDt 필드를 포함시킴
        Class<?> declaringClass = f.getDeclaringClass();
        if(!DataItem.class.isAssignableFrom(declaringClass)) {
            return false;
        }

        if(!f.getName().equals("regDt")) {
            return false;
        }

        return true;
//        return f.getName().equals("regDt") && !DataItem.class.isAssignableFrom(f.getDeclaringClass());
    }

    @Override
    public boolean shouldSkipClass(Class<?> clazz) {
        return false;
    }
}
