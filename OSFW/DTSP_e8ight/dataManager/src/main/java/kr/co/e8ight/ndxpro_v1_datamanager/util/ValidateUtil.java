package kr.co.e8ight.ndxpro_v1_datamanager.util;

import java.util.List;
import org.apache.commons.validator.routines.UrlValidator;

public class ValidateUtil {

    public static boolean isEmptyData(Object ob) {
        return ob == null || "".equals(ob.toString()) || "{}".equals(ob.toString());
    }

    public static boolean isEmptyData(List<?> ob) {
        return ob == null || ob.size() == 0;
    }

    public static boolean urlValidator(String url) {
        UrlValidator defaultValidator = new UrlValidator();
        return defaultValidator.isValid(url);
    }

}
