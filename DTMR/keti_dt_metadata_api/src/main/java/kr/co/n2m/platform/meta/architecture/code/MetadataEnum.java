package kr.co.n2m.platform.meta.architecture.code;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.riot.RDFFormat;

public interface MetadataEnum {

	abstract String code();
	
	abstract String koName();
	
	/**
	 * XxxType xxxType = MetadataEnum.getValue("codeValue", XxxType.class);
	 */
	public static <T extends Enum<T> & MetadataEnum> T getValue(String code, Class<T> enumType) {
		for (T t : enumType.getEnumConstants()) {
			if (t.code().equals(code)) {
				return (T) t;
			}
		}
		return null;
	}
	
	/**
	 * [MCG00013] 메타데이터 셋 용 데이터유형.
	 * 메타데이터 셋 에 들어갈 범위 모델(값 모델). 각 메타데이터 셋 에 1건만 존재하기로 함.
	 */
    public static enum MetadataSetRangeModelId implements MetadataEnum {
    	idString           ("idString"			, "메타데이터 셋 ID"		 , false, "medataSetId"			, PropertyRequired.readonly),
    	nameString         ("nameString"		, "메타데이터 셋 명"		 , true , "medataSetNm"			, PropertyRequired.required), // 믈리명
    	logicNameStringKo  ("logicNameStringKo"	, "메타데이터 셋 논리명(한글)" , true , "medataSetLogicNm"		, PropertyRequired.recommended),
    	descStringKo       ("descStringKo"		, "메타데이터 셋 설명(한글)"	 , true , "medataSetDesc"		, PropertyRequired.required),
    	statusCode         ("statusCode"		, "메타데이터 셋 상태 코드"	 , true , "medataSetSttusMtcd"	, PropertyRequired.readonly),
    	statusCodeName     ("statusCodeName"	, "메타데이터 셋 상태 코드명"	 , false, "medataSetSttusMtcdNm", PropertyRequired.readonly),
    	createUserId       ("createUserId"		, "생성자 사용자ID"         , false, "medataSetRegrId"		, PropertyRequired.readonly),
    	createUserName     ("createUserName"	, "생성자 명"       		, false, "medataSetRegrNm"		, PropertyRequired.readonly),
    	createDateTime     ("createDateTime"	, "생성일시"        		, false, "medataSetRegDt"		, PropertyRequired.readonly),
    	updateUserId       ("updateUserId"		, "수정자 사용자ID"     	, false, "medataSetAmdrId"		, PropertyRequired.readonly),
    	updateUserName     ("updateUserName"	, "수정자 명"        		, false, "medataSetAmdrNm"		, PropertyRequired.readonly),
    	updateDateTime     ("updateDateTime"	, "수정일시"           	, false, "medataSetAmdDt"		, PropertyRequired.readonly),
    	idSchmCountryCode  ("idSchmCountryCode" , "식별체계 국가코드"        , true , "idSchmCntryCd"        , PropertyRequired.readonly), // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	idSchmType         ("idSchmType"        , "식별체계 분류코드 종류"    , true , "idSchmType"           , PropertyRequired.readonly), // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	idSchmCode         ("idSchmCode"        , "식별체계 코드"           , true , "idSchmCd"             , PropertyRequired.readonly), // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	idSchmCode2        ("idSchmCode2"       , "식별체계 코드2"          , true , "idSchmCd2"            , PropertyRequired.readonly)  // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	;
    	
    	private String code;
    	private String koName;
    	private boolean isWritable;
    	private String metadataSetCol;
    	private PropertyRequired prptyMandMtcd;

        private MetadataSetRangeModelId(String code, String koName, boolean isWritable, String metadataSetCol, PropertyRequired prptyMandMtcd) {
            this.code = code;
            this.koName = koName;
            this.isWritable = isWritable;
            this.metadataSetCol = metadataSetCol;
            this.prptyMandMtcd = prptyMandMtcd;
        }

        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
	
		public boolean isWritable() {
			return isWritable;
		}
	 
		public String getMetadataSetCol() {
			return metadataSetCol;
		}		
		
		public String getPrptyMandMtcd() {
			return prptyMandMtcd.code();
		}
		
    }
	
    /**
     * [MCG00004] 메타데이터 프라퍼티 필수 구분
     */
    public static enum PropertyRequired implements MetadataEnum {
    	required    ("required"   , "필수"),
    	recommended ("recommended", "권장"),
    	optional    ("optional"   , "선택"),
    	readonly    ("readonly"   , "조회전용")
    	;
    	
    	private String code;
    	private String koName;

        private PropertyRequired(String code, String koName) {
            this.code = code;
            this.koName = koName;
        }

        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
        
    }

    /**
     * [MCG00007] 메타데이터 데이터 유형 (DataType 모델 매핑) (data type)
     */
    public static enum RangeDataTypeMtcd implements MetadataEnum {
    	idString			("idString"				, "메타데이터 셋 ID"),
    	nameString			("nameString"			, "메타데이터 셋 명"),
    	logicNameStringKo	("logicNameStringKo"	, "메타데이터 셋 논리명(한글)"),
    	descStringKo		("descStringKo"			, "메타데이터 셋 설명(한글)"),
    	statusCode			("statusCode"			, "메타데이터 셋 상태 코드"),
    	statusCodeName		("statusCodeName"		, "메타데이터 셋 상태 코드명"),
    	createUserId		("createUserId"			, "생성자 사용자ID"),
    	createUserName		("createUserName"		, "생성자 명"),
    	createDateTime		("createDateTime"		, "생성일시"),
    	updateUserId		("updateUserId"			, "수정자 사용자ID"),
    	updateUserName		("updateUserName"		, "수정자 명"),
    	updateDateTime		("updateDateTime"		, "수정일시"),
    	string				("string"				, "문자열"),
    	stringKo			("stringKo"				, "문자열(한글)"),
    	stringEn			("stringEn"				, "문자열(영문)"),
    	langString			("langString"			, "언어구분 필수 문자열"),
    	date				("date"					, "일자"),
    	dateTime			("dateTime"				, "일시"),
    	year				("year"					, "년도"),
    	yearMonth			("yearMonth"			, "년월"),
    	integer				("integer"				, "Interger"),
    	long_				("long"					, "Long"),
    	positiveInteger		("positiveInteger"		, "Positive Integer"),
    	nonNegativeInteger	("nonNegativeInteger"	, "Non Negative Integer"),
    	nonPositiveInteger	("nonPositiveInteger"	, "Non Positive Integer"),
    	negativeInteger		("negativeInteger"		, "Negative Integer"),
    	float_				("float"				, "Float"),
    	double_				("double"				, "Double"),
    	boolean_			("boolean"				, "Boolean"),
    	anyURI				("anyURI"				, "AnyURI"),
    	json				("json"					, "JSON"),
    	geoJson				("geoJson"				, "GeoJSON"),
    	keywordsKo			("keywordsKo"			, "키워드(한글)"),
    	keywordsEn			("keywordsEn"			, "키워드(영문)"),
    	code_				("code"					, "코드"),
		codeName			("codeName"             , "코드명"),
		categoryId          ("categoryId"           , "카테고리ID"),
		categoryConcept     ("categoryConcept"      , "카테고리 개념명"),
	    categoryName		("categoryName"         , "카테고리명"),
	    refSetName          ("refSetName"           , "참조한 메타데이터 셋 명"),
    	idSchmCountryCode   ("idSchmCountryCode"    , "식별체계 국가코드"),      // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	idSchmType          ("idSchmType"           , "식별체계 분류코드 종류"),  // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	idSchmCode          ("idSchmCode"           , "식별체계 코드"),         // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요.
    	idSchmCode2         ("idSchmCode2"          , "식별체계 코드2"),        // 식별체계가 사용되는 셋에만 필요. 등록시에만 필요. 2025-09 추가.
    	address             ("address"              , "주소 정보"),           // 2025-07 표준문서 관련 데이터타입 추가. 
    	dataInfo            ("dataInfo"             , "데이터정보")	          // 2025-07 표준문서 관련 데이터타입 추가. 
    	;
    	
    	private String code;
    	private String koName;

        private RangeDataTypeMtcd(String code, String koName) {
            this.code = code;
            this.koName = koName;
        }

        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
        
    }
    
    /**
     * 참조 프라퍼티가 필요한 참조하는 프라퍼티의 데이터 유형 
     * codeName - code 참조
     * categoryName - categoryId 참조, categoryConcept 참조
     * refSetName - 메타데이터 셋 ID 참조
     */
    public static enum DerivedDataTypeMtcd implements MetadataEnum {
		codeName			("codeName"				, "코드명"),
	    categoryName		("categoryName"			, "카테고리명"),
	    refSetName          ("refSetName"           , "참조한 메타데이터 셋 명")
    	;
    	
    	private String code;
    	private String koName;

        private DerivedDataTypeMtcd(String code, String koName) {
            this.code = code;
            this.koName = koName;
        }

        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
        
    }
    
    /**
     * SQL Date Format (TO_CHAR, DATE_TRUNC 등에 사용)
     */
    public static enum SqlDatePart implements MetadataEnum {
    	year     ("year"        , "년"      , "YYYY"),
    	month    ("month"       , "월"      , "YYYY-MM"),
    	day      ("day"         , "일"      , "YYYY-MM-DD"),
    	hour     ("hour"        , "시"      , "YYYY-MM-DD HH24"),
    	minute   ("minute"      , "분"      , "YYYY-MM-DD HH24:MI"),
    	second   ("second"      , "초"      , "YYYY-MM-DD HH24:MI:SS"),
    	millisec ("milliseconds", "밀리초"   , "YYYY-MM-DD HH24:MI:SS.MS"),
    	microsec ("microseconds", "마이크로초", "YYYY-MM-DD HH24:MI:SS.US"),
    	iso      ("iso"         , "ISO"    , "YYYY-MM-DD\"T\"HH24:MI:SS"),
    	isoz     ("isoz"        , "ISOZ"   , "YYYY-MM-DD\"T\"HH24:MI:SS%s"), // YYYY-MM-DD\"T\"HH24:MI:SS+09:00
    	iso6z    ("iso6z"       , "ISO6Z"  , "YYYY-MM-DD\"T\"HH24:MI:SS.US%s"), // YYYY-MM-DD\"T\"HH24:MI:SS.US+09:00
    	;
    	
    	private String code;
    	private String koName;    	
    	private String format;

        private SqlDatePart(String code, String koName, String format) {
            this.code = code;
            this.koName = koName;            
            this.format = format;
            
            // 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
            if (StringUtils.equals(code, "isoz") || StringUtils.equals(code, "iso6z")) {
	        	ZonedDateTime zonedDateTime = ZonedDateTime.of(LocalDateTime.now(), ZoneId.systemDefault());
	        	String localZone = DateTimeFormatter.ofPattern("XXXXX").format(zonedDateTime); // XXXXX 출력 포맷 경우만
	        	this.format = String.format(format, localZone);
            }
        }
        
        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
        
        public String format() {
            return format;
        }        
    }
    
    /**
	 * [MCG00009] RDF 형식. - RDF 매핑 정의 형식
     */
    public static enum RdfFormMtcd implements MetadataEnum {
    	DCAT				("dcat"			, "DCAT"			, RdfWriteLangMtcd.RDF_XML),
    	RDF_XML				("xml"			, "RDF/XML"			, RdfWriteLangMtcd.RDF_XML)
    	;
    	
    	private String code;
    	private String koName;
    	private RdfWriteLangMtcd rdfLangEnum; // 기본값 출력 어휘 매핑

        private RdfFormMtcd(String code, String koName, RdfWriteLangMtcd rdfLangEnum) {
            this.code = code;
            this.koName = koName;
            this.rdfLangEnum = rdfLangEnum;
        }

        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
        
		public String rdfLang() {
			return rdfLangEnum.rdfLang();
		}
        
    }
	
    /**
     * [MCG00017] RDF 출력 어휘(형식) - Jena 지원 형식
     */
    public static enum RdfWriteLangMtcd implements MetadataEnum {
    	RDF_XML				("xml"			, "RDF/XML"			, "RDF/XML"			, RDFFormat.RDFXML		, "RDF/XML"),
    	RDF_XML_ABBREV		("xml_abbrev"	, "RDF/XML-ABBREV"	, "RDF/XML-ABBREV"	, RDFFormat.RDFXML_PLAIN, "RDF/XML"),
    	TURTLE				("turtle"		, "TURTLE"			, "TURTLE"			, RDFFormat.TURTLE		, "Turtle"),
    	N_TRIPLE			("n_triple"		, "N-TRIPLE"    	, "N-TRIPLE"		, RDFFormat.NTRIPLES	, "N-Triples"),
//    	N3					("n3"			, "N3"				, "N3"				, RDFFormat.N3), // TODO : 추후 수정 혹은 삭제 필요
    	JSON_LD				("json_ld"		, "JSON-LD"			, "JSON-LD"			, RDFFormat.JSONLD		, "JSON-LD"),
    	RDF_JSON			("json"			, "RDF/JSON"		, "RDF/JSON"		, RDFFormat.RDFJSON		, "RDF/JSON"),
    	/* -- */
    	TURTLE_FLAT			("turtle_flat"  , "TURTLE (FLAT)"   , "TURTLE"			, RDFFormat.TURTLE_FLAT	, "Turtle")
    	;  
    	
    	private String code;
    	private String koName;
    	private String rdfLang; // Jena writer name
    	private RDFFormat rdfFormat; // Jena RDF format
    	private String neo4jRdfFormmat; // for Neo4j

        private RdfWriteLangMtcd(String code, String koName, String rdfLang, RDFFormat rdfFormat, String neo4jRdfFormmat) {
            this.code = code;
            this.koName = koName;
            this.rdfLang = rdfLang;
            this.rdfFormat = rdfFormat;
            this.neo4jRdfFormmat = neo4jRdfFormmat;
        }

        @Override
		public String code() {
			return code;
		}

        @Override
		public String koName() {
			return koName;
		}
        
		public String rdfLang() {
			return rdfLang;
		}
		
		public RDFFormat rdfFormat() {
			return rdfFormat;
		}
		
		public String neo4jRdfFormmat() {
			return neo4jRdfFormmat;
		}		
        
    }
    
}
