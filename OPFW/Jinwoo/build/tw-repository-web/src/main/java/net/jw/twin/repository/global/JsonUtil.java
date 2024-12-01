package net.jw.twin.repository.global;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.math.BigDecimal;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Date;

public class JsonUtil {
    public static String getString(JsonObject json, String memberName){
        JsonElement element = json.get(memberName);
        if( null == element ){
            return null;
        }
        if( element.isJsonNull() ){
            return null;
        }
        return element.getAsString();
    }

    public static String getUpperString(JsonObject json, String memberName){
        JsonElement element = json.get(memberName);
        if( null == element ){
            return null;
        }
        if( element.isJsonNull() ){
            return null;
        }
        return element.getAsString().toUpperCase();
    }

    public static Date getDate(JsonObject json, String memberName) throws ParseException {
        String str = getString(json, memberName);
        if (null == str || str.isEmpty()) {
            return null;
        }
        return FrontGlobal.dateFormat.parse(str);
    }

    public static LocalDateTime getLocalDateTime(JsonObject json, String memberName) {
        String str = getString(json, memberName);
        if (null == str || str.isEmpty()) {
            return null;
        }
        LocalDateTime localDateTime = null;
        try {
            localDateTime = LocalDateTime.parse(str, FrontGlobal.dateTimeFormatter);
        }catch (DateTimeParseException e){
            localDateTime = LocalDateTime.parse(str, FrontGlobal.dateTimeFormatterNoSeconds);
        }
        return localDateTime;
    }

    public static Integer getInteger(JsonObject json, String memberName) {
        JsonElement element = json.get(memberName);
        if( null == element ){
            return null;
        }
        if( element.isJsonNull() ){
            return null;
        }

        if( element.getAsString().isEmpty() ){
            return null;
        }

        Integer value = null;

        try {
            value = element.getAsInt();
        }catch (Exception e){

        }

        return value;
    }

    public static Long getLong(JsonObject json, String memberName) {
        JsonElement element = json.get(memberName);
        if( null == element ){
            return null;
        }
        if( element.isJsonNull() ){
            return null;
        }

        if( element.getAsString().isEmpty() ){
            return null;
        }

        Long value = null;

        try {
            value = element.getAsLong();
        }catch (Exception e){

        }

        return value;
    }

    public static Float getFloat(JsonObject json, String memberName){
        JsonElement element = json.get(memberName);
        if( null == element ){
            return null;
        }
        if( element.isJsonNull() ){
            return null;
        }

        if( element.getAsString().isEmpty() ){
            return null;
        }

        Float value = null;

        try {
            value = element.getAsFloat();
        }catch (Exception e){

        }

        return value;
    }

    public static BigDecimal getBigDecimal(JsonObject json, String memberName){
        JsonElement element = json.get(memberName);
        if( null == element ){
            return null;
        }
        if( element.isJsonNull() ){
            return null;
        }

        if( element.getAsString().isEmpty() ){
            return null;
        }

        BigDecimal value = null;

        try {
            value = element.getAsBigDecimal();
        }catch (Exception e){

        }

        return value;
    }
}
