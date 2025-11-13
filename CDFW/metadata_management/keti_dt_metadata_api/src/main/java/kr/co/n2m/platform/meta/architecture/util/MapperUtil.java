package kr.co.n2m.platform.meta.architecture.util;

import java.beans.PropertyDescriptor;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class MapperUtil {

    private static final ObjectMapper mapper = new ObjectMapper();          // 기본 매퍼 (null 제외)
    private static final ObjectMapper mapperWithNull = new ObjectMapper();  // null 포함 매퍼

    static {
        // 기본 mapper: null 생략
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // null 포함 + pretty
        mapperWithNull.enable(SerializationFeature.INDENT_OUTPUT);
        mapperWithNull.setSerializationInclusion(JsonInclude.Include.ALWAYS);
    }

    /** 기본 ObjectMapper 반환 (null 제외) */
    public static ObjectMapper getObjectMapper() {
        return mapper;
    }

    /** ObjectMapper 반환 (withNull=true: null 포함) */
    public static ObjectMapper getObjectMapper(boolean withNull) {
        return withNull ? mapperWithNull : mapper;
    }

    /** 객체를 JSON 문자열로 변환 (null 제외) */
    public static String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("toJson 오류", e);
        }
    }

    /** 객체를 JSON 문자열로 변환 (null 포함, pretty) */
    public static String toJsonWithNull(Object obj) {
        try {
            return mapperWithNull.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("toJsonWithNull 오류", e);
        }
    }

    /** JSON 문자열 → Map 변환 */
    public static Map<String, Object> toMap(String jsonStr) {
        try {
            return mapper.readValue(jsonStr, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("toMap 오류", e);
        }
    }

    /** JSON 문자열 → List<Map> 변환 */
    public static List<Map<String, Object>> toList(String jsonStr) {
        try {
            return mapper.readValue(jsonStr, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("toList 오류", e);
        }
    }

    /** JSON 문자열 → DTO 객체로 변환 */
    public static <T> T toObject(String jsonStr, Class<T> clazz) {
        try {
            return mapper.readValue(jsonStr, clazz);
        } catch (Exception e) {
            throw new RuntimeException("toObject 오류", e);
        }
    }

    /** JSON 문자열 → DTO (TypeReference 활용) */
    public static <T> T toObject(String jsonStr, TypeReference<T> typeRef) {
        try {
            return mapper.readValue(jsonStr, typeRef);
        } catch (Exception e) {
            throw new RuntimeException("toObject(TypeRef) 오류", e);
        }
    }

    /** JSON 문자열 → List<DTO> 변환 */
    public static <T> List<T> toObjectList(String jsonStr, Class<T> clazz) {
        try {
            return mapper.readValue(jsonStr,
                    mapper.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (Exception e) {
            throw new RuntimeException("toObjectList 오류", e);
        }
    }

    /** DTO → Map<String, Object> 변환 (null 제외) */
    public static Map<String, Object> dtoToMap(Object dto) {
        try {
            return mapper.convertValue(dto, new TypeReference<Map<String, Object>>() {});
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("dtoToMap 변환 오류", e);
        }
    }

    /** DTO → Map<String, Object> 변환 (null 포함) */
    public static Map<String, Object> dtoToMapWithNull(Object dto) {
        try {
            return mapperWithNull.convertValue(dto, new TypeReference<Map<String, Object>>() {});
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("dtoToMapWithNull 변환 오류", e);
        }
    }

    /** Map → DTO 변환 */
    public static <T> T mapToDto(Map<String, Object> map, Class<T> clazz) {
        try {
            return mapper.convertValue(map, clazz);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("mapToDto 변환 오류", e);
        }
    }

    /** List<Map> → List<DTO> 변환 */
    public static <T> List<T> mapListToDtoList(List<Map<String, Object>> mapList, Class<T> clazz) {
        try {
            return mapList.stream()
                    .map(map -> mapToDto(map, clazz))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("mapListToDtoList 오류", e);
        }
    }

    /** List<DTO> → List<Map> 변환 */
    public static List<Map<String, Object>> dtoListToMapList(List<?> dtoList) {
        try {
            return dtoList.stream()
                    .map(MapperUtil::dtoToMap)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("dtoListToMapList 오류", e);
        }
    }
    
    /** 들여쓰기/줄바꿈 없는 compact JSON 문자열로 변환 (값 내부 줄바꿈은 유지됨)
     * "{\n \"aaa\": \"아하하\",\n \"bbb\": \"좋아\n좋아요\" \n}"
     * -> "{\"aaa\": \"아하하\", "bbb": \"좋아\n좋아요\"}"   
     */
    public static String stringify(String jsonStr) {
        try {
            Object jsonObj = mapper.readValue(jsonStr, Object.class);
            return mapper.writeValueAsString(jsonObj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("stringify 오류", e);
        }
    }
    
    /**
     * 타깃에서 null 이 아닌(이미 값 있는) 프로퍼티 이름 수집
     * 사용법)         
     * 		String[] ignoreProps = MapperUtil.getNonNullPropertyNames(target);
     *   	BeanUtils.copyProperties(source, target, ignoreProps);
     * @param target
     * @return
     */
    public static String[] getNonNullPropertyNames(Object target) {
        BeanWrapper bw = new BeanWrapperImpl(target);
        return Arrays.stream(bw.getPropertyDescriptors())
                .map(PropertyDescriptor::getName)
                .filter(name -> !"class".equals(name))
                .filter(bw::isReadableProperty) // getter 있는 것만
                .filter(name -> bw.getPropertyValue(name) != null)
                .toArray(String[]::new);
    }
    
} 
