package net.jw.twin.tw_service_manager.config.gson.typeAdapter;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import net.jcms.framework.base.model.BaseModel;
import net.jw.twin.common.global.Global;
import net.jw.twin.repository.db.dataItem.model.DataItem;

import java.lang.reflect.Type;

public class DataItemSerializer implements JsonSerializer<DataItem> {

    @Override
    public JsonElement serialize(DataItem src, Type type, JsonSerializationContext jsonSerializationContext) {
        // 기본 직렬화 수행
        JsonObject jsonObject = jsonSerializationContext.serialize(src, BaseModel.class).getAsJsonObject();

        if (src.getId() != null) {
            jsonObject.addProperty("id", Global.dateTimeFormatter.format(src.getRegDt()));
        }

        // regDt 필드 추가
        if (src.getRegDt() != null) {
            jsonObject.addProperty("regDt", Global.dateTimeFormatter.format(src.getRegDt()));
        }

        return jsonObject;
    }
}
