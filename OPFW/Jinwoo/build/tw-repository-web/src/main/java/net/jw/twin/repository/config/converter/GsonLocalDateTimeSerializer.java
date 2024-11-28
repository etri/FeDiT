package net.jw.twin.repository.config.converter;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import net.jw.twin.repository.global.FrontGlobal;

import java.lang.reflect.Type;
import java.time.LocalDateTime;

public class GsonLocalDateTimeSerializer implements JsonSerializer<LocalDateTime> {
    @Override
    public JsonElement serialize(LocalDateTime src, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(FrontGlobal.dateTimeFormatter.format(src));
    }
}
