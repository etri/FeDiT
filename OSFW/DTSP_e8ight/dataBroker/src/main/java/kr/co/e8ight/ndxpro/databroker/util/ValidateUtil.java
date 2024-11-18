package kr.co.e8ight.ndxpro.databroker.util;

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

    public static boolean isInteger(String value) {
        if (value == null)
            return false;
        try {
            int parsedValue = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
    }

    public static boolean isDouble(String value) {
        if (value == null)
            return false;
        try {
            double parsedValue = Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return false;
        }
        return true;
    }
}
