package kr.co.e8ight.auth.util;

import java.nio.ByteBuffer;
import java.util.UUID;

public class StringUtil {

    public static String getToken(){
        UUID uuid = UUID.randomUUID();
        long l = ByteBuffer.wrap(uuid.toString().getBytes()).getLong();
        return Long.toString(l, Character.MAX_RADIX);
    }

    public static String camelToUnderscore(String str){
        String regex = "([a-z])([A-Z])";
        String replacement = "$1_$2";
        return str.replaceAll(regex, replacement).toLowerCase();
    }
}
