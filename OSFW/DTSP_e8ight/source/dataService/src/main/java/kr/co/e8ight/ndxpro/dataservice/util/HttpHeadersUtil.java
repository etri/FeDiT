package kr.co.e8ight.ndxpro.dataservice.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class HttpHeadersUtil {

    private static Pattern LINK_URI_PATTERN = Pattern.compile("<(?<link>[^<>]*)>");

    public static String parseLinkURI(String link) {
        if(link == null || link.equals(""))
            return null;
        String result = null;
        Matcher matcherForUpdate = LINK_URI_PATTERN.matcher(link);

        while(matcherForUpdate.find()) {
            String linkString = matcherForUpdate.group();
            result = linkString.replace("<", "").replace(">", "");
        }
        return result;
    }
}
