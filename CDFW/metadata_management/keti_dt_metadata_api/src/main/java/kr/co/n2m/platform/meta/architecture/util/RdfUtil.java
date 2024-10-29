package kr.co.n2m.platform.meta.architecture.util;

import java.net.URI;
import java.net.URISyntaxException;

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
	
}
