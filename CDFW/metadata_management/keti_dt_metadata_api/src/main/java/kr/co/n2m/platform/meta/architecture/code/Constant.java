package kr.co.n2m.platform.meta.architecture.code;

/**
 * 상수
 * 
 * @author  n2m
 */
public class Constant {
	
    /** 기본 패키지 경로 */
    public static final String BASE_PACKAGE = "kr.co.n2m.platform.meta";
    
    /** HTTP MediaType **/
    public static final String HTTP_MEDIA_TYPE__APPLICATION_JSON_UTF8_VALUE       = "application/json;charset=UTF-8";
    public static final String HTTP_MEDIA_TYPE__APPLICATION_JSON_VALUE            = "application/json";
    public static final String HTTP_MEDIA_TYPE__APPLICATION_FORM_URLENCODED_VALUE = "application/x-www-form-urlencoded";
    public static final String HTTP_MEDIA_TYPE__MULTIPART_FORM_DATA_VALUE         = "multipart/form-data";
    
    /**
     * Authorization
     * */
    public final static String AUTHTOKEN_HEADER 			= "Authorization";
    public final static String AUTH_TOKEN_PREFIX 			= "Bearer ";
    
    public final static String SESSION_ATTR_TOKEN         	= "token";
    public final static String SESSION_ATTR_TOKEN_EXPIRES 	= "expires";
    public final static String SESSION_ATTR_USER_ID       	= "userId";
    public final static String SESSION_ATTR_USER_NM       	= "nickname";
    
    /** 메타데이터 키워드 */
	public final static String KEYWORD_META_MODEL    = "metaModel";
	public final static String KEYWORD_META_JSON_STR = "metaJsonStr";	
	
	/** 디지털트윈 */
	public final static String DIGITAL_TWIN_MODEL_NM = "DigitalTwin"; // model_id 와 model_nm 은 동일함.
	
	/** 디지털트윈 종류 프라퍼티 명 */
	// 2025-07-28 디지털트윈 표준문서에 정의된 디지털 트윈의 종류 (연합/단일) 속성명
	public static final String DIGITAL_TWIN_TYPE_PROPERTY_NM = "type"; // prpty_id 와 prpty_nm 은 동일함.
	
	/** 메타데이터 셋 상태 코드 */
	public static final String SET_STATUS_REG = "regist";	// 등록
	public static final String SET_STATUS_USE = "use";		// 사용
	public static final String SET_STATUS_UN  = "unused";	// 미사용
	public static final String SET_STATUS_DIS = "disuse";	// 폐기
	
	/** 에러 메세지 제한 건수 */
	public static final int ERR_MSG_LIMIT_CNT = 30;
	
	/** RDF */
	public final static String RDF_FORM_MTCD_DEFAULT	= "dcat"; // rdf 형식 코드 기본값
	
	/** 수집 비동기 처리시 로그인 사용자 정보용 */
	public final static String LOGIN_USER_VO = "__LOGIN_USER_VO__";
		
	/** 디지털트윈 연합 식별체계 */
	public static final String ID_SCHM_DT                 = "id_schm_dt";
	public static final String ID_SCHM_OBJECT             = "id_schm_object";
	public static final String ID_SCHM_OBJECT_VM          = "id_schm_object_vm"; // 객체 식별체계에서 조금 변형. 시각화 모델 식별체계.
	public static final String ID_SCHM_TYPE_KSIC          = "01"; // (한국)표준산업분류체계
	public static final String ID_SCHM_TYPE_PBRC          = "02"; // 공공자원분류체계
	public static final String ID_SCHM_TYPE_PRODUCT  	  = "1"; // 물품
	public static final String ID_SCHM_TYPE_FACILITY      = "2"; // 시설
	public static final String ID_SCHM_TYPE_FEATURE       = "3"; // 지형지물
}
