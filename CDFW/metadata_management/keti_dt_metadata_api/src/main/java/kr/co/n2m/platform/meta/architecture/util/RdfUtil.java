package kr.co.n2m.platform.meta.architecture.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.atlas.json.JSON;
import org.apache.jena.atlas.json.JsonObject;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * RdfUtil
 * 
 * @author  n2m
 */
@Component
@Slf4j
public class RdfUtil {

	/**
	 * JSON 형식인지 여부
	 * @param jsonStr
	 * @return
	 */
	public static boolean isJson(String jsonStr) {
		if (StringUtils.isBlank(jsonStr)) return false;
		try {
			JSON.parse(jsonStr);
		} catch (Exception e) {
			//log.error("RdfUtil.isJson - JSON parse ERROR!", e);
			return false;
		}
		return true;
	}
	
	/** 
	 * GeoJSON 형식인지 여부
	<pre>
	 * 
	 * 주의! 이 시스템에서 GeoJson 을 저장하는 칼럼은 geometry 형식이기 떄문에
	 *      실제로 geometry JSON 인지 여부를 반환
 
[시스템] 우리는 geometry 안의 내용만 있다고 가정.
{
    "type": "Polygon",
    "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],[100.0, 1.0], [100.0, 0.0]]]
}


[참고] GeoJSON Format(형식)
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [102.0, 0.5]
            },
            "properties": {
                "prop0": "value0"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]
            },
            "properties": {
                "prop0": "value0",
                "prop1": 0.0
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],[100.0, 1.0], [100.0, 0.0]]]
            },
            "properties": {
                "prop0": "value0",
                "prop1": { "this": "that" }
            }
        }
    ]
}

	</pre>
	*/
	public static boolean isGeoJson(String jsonStr) {
		if (StringUtils.isBlank(jsonStr)) return false;
		try {
			JsonObject jsonObj = JSON.parse(jsonStr);
			if (StringUtils.isEmpty(jsonObj.getString("type"))) return false;
			if (jsonObj.get("coordinates") == null || !jsonObj.get("coordinates").isArray()) return false;
		} catch (Exception e) {
			//log.error("RdfUtil.isGeoJson - JSON parse ERROR!", e);
			return false;
		}
		return true;
	}
	
	/**
	 * 임의의 URI (URI 패턴인지 여부)
	<pre>
임의의 URI
[정의:] anyURI는 URI(Uniform Resource Identifier Reference)를 나타냅니다. 
anyURI 값은 절대적이거나 상대적일 수 있으며 선택적 조각 식별자를 가질 수 있습니다(예: URI 참조일 수 있음) .
이 유형은 값이 [RFC 2732] 에 의해 수정된 대로 [RFC 2396] 에 정의된 URI의 역할을 이행하려는 의도를 지정하는 데 사용되어야 합니다 .
=> 유효성을 검사하지 않으며 · 최소한으로 준수하는 · 프로세서 에 의해 검사되지 않습니다 .
=> 합법적인 URI인 문자열이 되는 유한 길이 문자 시퀀스
	</pre>
	 */
	public static boolean isAnyURI(String uri) {
		if (StringUtils.isBlank(uri)) return false;
	    try {
	        new URI(uri);
	    } catch (URISyntaxException e) {
	        return false;
	    }
		return true;		
	}
    
    /**
     * HTTP / HTTPS 구분 없이 URI 문자열이 동일한지 비교한다.
     * 예: http://example.org/foo 와 https://example.org/foo → true
     *
     * @param uri1 비교할 URI 문자열 1
     * @param uri2 비교할 URI 문자열 2
     * @return 동일하면 true, 다르면 false
     */
    public static boolean equalsUriIgnoreScheme(String uri1, String uri2) {
        if (uri1 == null || uri2 == null) return false;

        // 양쪽 공백 제거 및 NFC 정규화 (URI에 한글 있을 수 있으므로)
        String u1 = KeywordUtil.nfcTrim(uri1);
        String u2 = KeywordUtil.nfcTrim(uri2);

        // 스킴 제거 (http://, https://, 대소문자 무시)
        u1 = u1.replaceFirst("(?i)^https?://", "");
        u2 = u2.replaceFirst("(?i)^https?://", "");

        // 마지막 슬래시 정규화 (optional)
        if (u1.endsWith("/")) u1 = u1.substring(0, u1.length() - 1);
        if (u2.endsWith("/")) u2 = u2.substring(0, u2.length() - 1);

        return u1.equals(u2);
    }	

    /** 
     * RFC 3966 기반 tel IRI. 
     * 단일 번호 → tel: IRI
     * 예: input "064-123-4567" → "tel:+82641234567"
     */
    public static String toTelIri(String raw, String defaultCountry) {
        if (StringUtils.isBlank(raw)) return null;
        String digits = raw.replaceAll("[^+0-9]", ""); // 숫자/플러스만 유지
        if (digits.isBlank()) return null;

        String cc = (defaultCountry == null ? "KR" : defaultCountry.trim().toUpperCase(Locale.ROOT));

        if (digits.startsWith("+")) return "tel:" + digits; // 이미 국제형

        if ("KR".equals(cc) && digits.startsWith("0")) {
            String rest = digits.replaceFirst("^0+", "");
            return "tel:+82" + rest;
        }
        return "tel:" + digits;
    }
    
    // "6000~3" / "6000–3" / "6000-3" 패턴 (마지막 4자리 기준 범위)
    private static final Pattern PHONE_RANGE_TILDE =
            Pattern.compile("^(.*?)(\\d{4})\\s*(?:~|\\u2013|-)\\s*(\\d{1,4})$");

    // "6000/1" / "6000–1" / "6000-1" 패턴 (끝 숫자를 보정해서 범위)
    private static final Pattern PHONE_RANGE_SLASH =
            Pattern.compile("^(.*?)(\\d{4})\\s*(?:/|\\u2013|-)\\s*(\\d{1,4})$");

    /**
     * "064-740-6000~1" 같은 범위 표기를 개별 번호 문자열 목록으로 확장.
     * - 콤마(,)로 다중 구간 분리 지원.
     * - EN DASH(U+2013)와 하이픈(-) 모두 허용.
     * - 마지막 4자리 기준으로 범위를 계산 (예: "6000~3" -> 6000, 6001, 6002, 6003).
     * - 입력 순서 보존, 중복 제거.
     * - 범위가 아니면 원문을 그대로 반환 목록에 포함.
     */
    public static List<String> expandPhoneRangeLabels(String input) {
        if (input == null) return java.util.Collections.emptyList();

        String norm = kr.co.n2m.platform.meta.architecture.util.KeywordUtil.nfcTrim(input);
        if (norm.isEmpty()) return java.util.Collections.emptyList();

        String[] parts = norm.split("\\s*,\\s*");
        List<String> out = new ArrayList<>();

        for (String part : parts) {
            String p = part.trim();
            if (p.isEmpty()) continue;

            Matcher m1 = PHONE_RANGE_TILDE.matcher(p);
            if (m1.find()) {
                String head    = m1.group(1);   // 예: "064-740-"
                String start4  = m1.group(2);   // "6000"
                String endPart = m1.group(3);   // "1" or "6001"

                int start = Integer.parseInt(start4);
                int end = parseEndWithPadding(start4, endPart);
                if (end < start) { int t = start; start = end; end = t; }

                for (int i = start; i <= end; i++) {
                    out.add(head + String.format("%04d", i));
                }
                continue;
            }

            Matcher m2 = PHONE_RANGE_SLASH.matcher(p);
            if (m2.find()) {
                String head    = m2.group(1);
                String start4  = m2.group(2);
                String endPart = m2.group(3);

                int start = Integer.parseInt(start4);
                int end = parseEndWithPadding(start4, endPart);
                if (end < start) { int t = start; start = end; end = t; }

                for (int i = start; i <= end; i++) {
                    out.add(head + String.format("%04d", i));
                }
                continue;
            }

            // 범위가 아니면 단일 번호로 취급
            out.add(p);
        }

        // 중복 제거 + 입력 순서 보존
        return new ArrayList<>(new LinkedHashSet<>(out));
    }

    // "start4=6000, endPart=1" -> 6001 처럼 뒤 자릿수 채워서 정수 변환
    private static int parseEndWithPadding(String start4, String endPart) {
        if (endPart.length() < 4) {
            String padded = start4.substring(0, 4 - endPart.length()) + endPart;
            return Integer.parseInt(padded);
        } else {
            return Integer.parseInt(endPart);
        }
    }    
    
}
