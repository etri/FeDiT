package net.jw.twin.repository.config.converter;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import net.jw.twin.repository.global.FrontGlobal;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class GsonLocalDateTimeDeserializer implements JsonDeserializer<LocalDateTime> {
    @Override
    public LocalDateTime deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        String regex = "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$";
        String jsonString = json.getAsString();
        if(jsonString.matches(regex)) {
            return LocalDateTime.parse(jsonString + "T00:00:00");
        }
        return LocalDateTime.parse(json.getAsString(),
                DateTimeFormatter.ofPattern(FrontGlobal.dateTimePattern).withLocale(Locale.KOREA));
    }
}
