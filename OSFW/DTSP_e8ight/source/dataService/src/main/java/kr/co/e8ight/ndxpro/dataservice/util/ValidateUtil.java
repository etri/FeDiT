package kr.co.e8ight.ndxpro.dataservice.util;

import java.util.List;

public class ValidateUtil {
    public static boolean isEmptyData(Object object) {
        if (object == null || "".equals(object.toString()))
            return true;
        return false;
    }

    public static boolean isEmptyData(List<?> object) {
        if (object == null || object.size() == 0)
            return true;
        return false;
    }
}
