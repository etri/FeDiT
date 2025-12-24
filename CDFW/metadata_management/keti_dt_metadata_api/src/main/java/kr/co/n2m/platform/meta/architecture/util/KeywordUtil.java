package kr.co.n2m.platform.meta.architecture.util;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

/**
 * Keyword Util
 *
 * @author n2m
 */
@Slf4j
public class KeywordUtil {

	public final static long UTCSEC20000101 = 947212800; // 2000년 1월 1일 UTC 초
	
	public static String nfcTrim(String s) {
	    String v = Normalizer.normalize(s, Normalizer.Form.NFC);
	    return v.trim();
	}
	
	/**
	 * 공백만 정리한 텍스트로 변환한다.
	 *
	 * - 앞뒤 공백 제거
	 * - 모든 연속 공백/탭/개행을 단일 스페이스(" ")로 축약
	 * - 그 외 문자(대소문자, 특수문자 등)는 손대지 않음
	 *
	 * 예)
	 *   "   스마트   농업  \n 플랫폼 " -> "스마트 농업 플랫폼"
	 */
	public static String toCleanText(String raw) {
	    if (raw == null) return null;

	    String v = nfcTrim(raw);
	    if (v.isEmpty()) return null;

	    v = v.replaceAll("\\s+", " ").trim();

	    return v.isEmpty() ? null : v;
	}
	
	/**
	 * 콤마로 구분된 문자열을 받아 각 항목을 {@link #toCleanText(String)}로 정리한 뒤,
	 * null 또는 빈 항목을 제외하고 다시 콤마로 이어붙인다.
	 *
	 * 콤마가 없는 경우에도 정상 처리된다.
	 *
	 * 예)
	 *   "  사과 ,  바나나,  , 오렌지  " → "사과,바나나,오렌지"
	 *   "   사과 바나나   " → "사과 바나나"
	 *   "   " → null
	 */
	public static String toCleanCommaSeparated(String raw) {
	    if (raw == null || raw.trim().isEmpty()) return null;

	    // 콤마가 없을 경우 단일 문자열로 처리
	    if (!raw.contains(",")) {
	        return toCleanText(raw);
	    }

	    // 콤마가 있을 경우만 split + 정리
	    String result = Arrays.stream(raw.split(","))
	            .map(String::trim)
	            .map(KeywordUtil::toCleanText)
	            .filter(Objects::nonNull)
	            .filter(s -> !s.isEmpty())
	            .collect(Collectors.joining(","));

	    return result.isEmpty() ? null : result;
	}	

	/**
	 * 공통 텍스트 정규화 (DB 무관, 개념키워드 등 공통으로 사용)
	 *
	 * 규칙:
	 * 1. 앞뒤 공백 제거
	 * 2. 허용된 문자만 남기고 나머지는 전부 제거
	 *    - 한글 가-힣
	 *    - 영문 대/소문자 A-Z a-z
	 *    - 숫자 0-9
	 *    - 공백
	 *    - 언더스코어(_), 대시(-), 점(.), 슬래시(/)
	 * 3. 연속 공백은 한 칸으로 축소
	 * 4. 다시 trim
	 * 5. 결과가 빈 문자열이면 null 리턴
	 *
	 * 주의:
	 * - '#' 같은 해시태그 마커는 날아간다. "#미나리" -> "미나리"
	 * - 의미적으로 하이픈(-), 언더스코어(_) 등은 유지한다.
	 */
	public static String toNormText(String raw) {
	    if (raw == null) return null;

	    // 1. 1차 trim
	    String v = nfcTrim(raw);
	    if (v.isEmpty()) return null;

	    // 2. 허용 문자만 남기고 나머지는 제거
	    //    [^ 허용문자 ] 를 "" 로 치환
	    //    허용: 한글 가-힣 / 숫자 / 영문 / 공백 / _ . / -
	    v = v.replaceAll("[^0-9A-Za-z가-힣_./\\-\\s]", "");

	    // 3. 여러 공백 -> 한 칸
	    v = v.replaceAll("\\s+", " ").trim();

	    // 4. 빈 문자열이면 null
	    if (v.isEmpty()) return null;

	    return v;
	}
	
	/**
	 * 개념 키워드(semantic canonical key)를 만든다.
	 *
	 * 목적:
	 * - "K-POP", "k pop", "K_POP" 등을 같은 키로 보고 싶을 때 사용하는
	 *   의미 통합 키.
	 *
	 * 어디서 쓰나?
	 * - Influx 'word' 태그 값 생성에 활용 가능
	 * - Neo4j 노드/릴레이션에서 conceptKey 같은 속성으로도 재사용 가능
	 *
	 * 규칙:
	 * - toNormText()로 기본 정리
	 * - 대문자로 통일 (대소문자 차이 제거)
	 * - 공백(" "), 하이픈("-"), 언더바("_") -> 전부 "_"
	 * - 연속 "_" 하나로 축소
	 * - 앞뒤 "_" 제거
	 */
	public static String toNormKeyword(String raw) {
	    String v = toNormText(raw);
	    if (v == null) return null;

	    v = v.toUpperCase(Locale.ROOT);

	    v = v.replace(" ", "_");
	    v = v.replace("-", "_");

	    v = v.replaceAll("_+", "_");
	    v = v.replaceAll("^_+|_+$", "");

	    if (v.isEmpty()) return null;
	    return v;
	}

	/**
	 * InfluxDB의 word 태그에 넣을 최종 문자열.
	 *
	 * - 비즈니스 레벨 정규화(toNormKeyword)로 개념 키를 만든 다음
	 * - Influx 태그 제한(255 bytes)도 적용한다.
	 *
	 * 즉 이건 Influx 전용 + word 전용.
	 */
	public static String toInfluxWordTag(String raw) {
	    String concept = toNormKeyword(raw); // DB 비의존 정규화
	    if (concept == null) return null;

	    byte[] bytes = concept.getBytes(StandardCharsets.UTF_8);
	    if (bytes.length > 255) {
	        return new String(bytes, 0, 255, StandardCharsets.UTF_8);
	    }
	    return concept;
	}	
	
	/**
	 * InfluxDB 태그 값으로 넣을 문자열을 만든다.
	 *
	 * - lang, prptyId, id 등에서 사용.
	 * - toNormText()로 한 번 정리해서 (= 등 위험한 문자 제거) 안전하게 만들고
	 *   의미 있는 구분(대소문자, '-', '_')은 유지한다.
	 * - InfluxDB 태그 제한을 고려해 UTF-8 기준 255바이트를 초과하면 잘라낸다.
	 *
	 * 중요:
	 * - 이건 Influx 전용. Neo4j에는 이 함수를 쓸 필요가 없다.
	 * - 'word' 태그에 바로 쓰지 말고, word용은 toNormKeyword()를 써서 개념화를 먼저 하고
	 *   (필요하다면 그 결과를 여기서 잘라줄 수도 있음)
	 */
	public static String toInfluxTag(String raw) {
	    String v = toNormText(raw);
	    if (v == null) return null;

	    byte[] bytes = v.getBytes(StandardCharsets.UTF_8);
	    if (bytes.length > 255) {
	        return new String(bytes, 0, 255, StandardCharsets.UTF_8);
	    }
	    return v;
	}

	/**
	 * InfluxDB의 string field 값을 안전하게 이스케이프한다.
	 *
	 * 목적:
	 * - 라인 프로토콜에서 value="..." 형태로 문자열을 넣을 때
	 *   역슬래시(\)와 큰따옴표(")로 인해 구문 오류가 발생하지 않도록 처리한다.
	 *
	 * 규칙:
	 * - 역슬래시(\)는 두 번(\\)으로 이스케이프
	 * - 큰따옴표(")는 백슬래시와 함께(\"")로 이스케이프
	 *
	 * 예시:
	 *  raw:  Hello "World"\Test
	 *  → 결과:  Hello \"World\"\\Test
	 *
	 * 반환값:
	 * - 이스케이프된 문자열
	 * - 입력이 null인 경우 빈 문자열("") 반환
	 */
    public static String toInfluxStringField(String s) {
        if (s == null) return "";
        String v = s.replace("\\", "\\\\").replace("\"", "\\\"");
        return v;
    }
	
}
