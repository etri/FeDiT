package kr.co.e8ight.fdttwinservice.util;

import java.util.List;

public class ValidateUtil {

    public static boolean isEmptyData(Object ob) {
        return ob == null || "".equals(ob.toString()) || "{}".equals(ob.toString());
    }

    public static boolean isEmptyData(List<?> ob) {
        return ob == null || ob.size() == 0;
    }


}