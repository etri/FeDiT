package kr.co.n2m.platform.meta.architecture.util;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

/**
 * JSON Util
 * 
 * @author  n2m
 */
public class JsonUtil {
	
	private static final Gson gson = new GsonBuilder().create();
	
	// null 값도 표현하는 gson
	private static final Gson gson2 = new GsonBuilder()
	        .setPrettyPrinting()
	        .serializeNulls()
	        .create(); 
	
	/**
	 * Object to JSON String
	 */
	public static String toJson(Object obj) {
		return gson.toJson(obj);
	}
	
	public static String toJsonWithNull(Object obj) {
		return gson2.toJson(obj);
	}
	
	/**
	 * JSON String to Map
	 */
	@SuppressWarnings("unchecked")
	public static Map<String, Object> toMap(String jsonStr) {
		return gson.fromJson(jsonStr, Map.class);
	}
	
	/**
	 * JSON String to List<Map>
	 */	
	@SuppressWarnings("unchecked")
	public static List<Map<String, Object>> toList(String jsonStr) {
		return gson.fromJson(jsonStr, List.class);
	}
		
	/**
	 * JSON String to Object
	 */
	public static <T> T toObject(String jsonStr, Class<T> classOfT) {
	    return gson.fromJson(jsonStr, classOfT);
	}   
	
	public static <T> T toObject(String jsonStr, Type typeOfT) {
	    return gson.fromJson(jsonStr, typeOfT);
	} 

	/**
	 * JSON String to List<Object>
	 */
	public static <T> List<T> toObjectList(String jsonStr, Class<T> classOfT) {
		Type typeOfT = TypeToken.getParameterized(List.class, classOfT).getType();
		return gson.fromJson(jsonStr, typeOfT);
	}
	
}
