package kr.co.n2m.platform.meta.federation.api.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.architecture.code.MetadataEnum;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RangeDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.DateUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyDataTypeDto;
import kr.co.n2m.platform.meta.schema.property.service.PropertyService;
import lombok.extern.slf4j.Slf4j;

/**
 * 디지털 트윈 연합 - 제7부: 레지스트리 인터페이스 및 프로토콜
 * 검색조건 query Parser
 * @author n2m
 */
@Slf4j
@Service
public class DigitalTwinRegistryApiQueryParser {
	
	@Autowired
	private PropertyService propertyService;
	
	public static final String QUERY_SEPARATOR = ";";
	
    public static enum ApiQueryOperator {
    	eq    ("==", "=="  , "equal"                   , " =  %s "),
    	ne    ("!=", "!="  , "not equal"               , " != %s "),
    	gteq  (">=", ">="  , "greater than or equal to", " >= %s "),
    	gt    (">" , ">"   , "greater than"            , " >  %s "),
    	lteq  ("<=", "<="  , "less than or equal to"   , " <= %s "),
    	lt    ("<" , "<"   , "less than"               , " <  %s "),
    	swith ("^=", "\\^=", "starts with"             , " ILIKE CONCAT(%s, '%%') "),       // like 'aaa%' 
    	like  ("*=", "\\*=", "like"                    , " ILIKE CONCAT('%%', %s, '%%') "), // like '%aaa%'
    	ewith ("$=", "\\$=", "ends with"               , " ILIKE CONCAT('%%', %s) "),       // like '%aaa'
    	;
    	
    	private String code;
    	private String regEx;
    	private String desc;
    	private String sql;

        private ApiQueryOperator(String code, String regEx, String desc, String sql) {
            this.code = code;
            this.regEx = regEx;
            this.desc = desc;
            this.sql = sql;
        }
        
        public String code() {
            return code;
        }
        
        public String regEx() {
            return regEx;
        }        
        
        public String desc() {
            return desc;
        }
        
        public String sql(String val) {
            return String.format(sql, val);
        }        
    }
    
	private static boolean isLikeOperators(ApiQueryOperator op) {
		if (op.equals(ApiQueryOperator.swith) || op.equals(ApiQueryOperator.like) || op.equals(ApiQueryOperator.ewith)) {
			return true;
		}
		return false;
	}    
	
	private static String sqlQuote(String str) { 
		return "'" + str.replace("'", "''") + "'"; 
	}

	/**
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm1'
		      AND d.medata_val    ILIKE CONCAT('%', 'val', '%') 
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm2'
		      AND d.medata_val::int = 123
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm3'
		      AND d.medata_val   >= '2025-07-30T16:53:32.788926+09:00'
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm_addr'
		      AND (d.medata_val::jsonb)->>'addressCountry' ILIKE CONCAT('%', 'KR', '%')
		      AND (d.medata_val::jsonb)->>'addressRegion'  ILIKE CONCAT('%', '제주도', '%') 
		  )
	 */
	public String getDigitalTwinQuerySql(Map<String, String> dtwAttrFilters, String dtwObjsAttr, Map<String, String> objAttrFilters) {
		if (dtwAttrFilters == null || dtwAttrFilters.size() == 0) return "";
		
		StringBuilder sb = new StringBuilder();
		try {
		
			for (Map.Entry<String, String> e : dtwAttrFilters.entrySet()) {
	            String rawVal = e.getValue();
	            if (rawVal == null || rawVal.trim().isEmpty()) continue;

	            String key = e.getKey().trim();
	            String val = rawVal.trim();
	            
	            // "creationTimeAfter","creationTimeBefore" -> creationTime
	            // "modifyTimeAfter","modifyTimeBefore"     -> modificationTime
	            if ("creationTimeAfter".equals(key)) {
	            	this.appendConditionSql(sb, "creationTime", ApiQueryOperator.gteq, val, "main");
	            } else if ("creationTimeBefore".equals(key)) {
	            	this.appendConditionSql(sb, "creationTime", ApiQueryOperator.lteq, val, "main");
	            } else if ("modifyTimeAfter".equals(key)) {
	            	this.appendConditionSql(sb, "modificationTime", ApiQueryOperator.gteq, val, "main");
	            } else if ("modifyTimeBefore".equals(key)) {
	            	this.appendConditionSql(sb, "modificationTime", ApiQueryOperator.lteq, val, "main");
	            } else {
	            	// 그 외는 like 로 하자. 아래에서 like 안되는 경우는 eq로 변경.
	            	this.appendConditionSql(sb, key, ApiQueryOperator.like, val, "main",  dtwObjsAttr, objAttrFilters);
	            }
			}
		
		} catch (ResBizInfoException e) {
			log.error("getDigitalTwinQuerySql (정보성) 실패/오류", e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("getDigitalTwinQuerySql 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		//log.debug("getDigitalTwinQuerySql : {}", sb.toString());
		return sb.toString();
	}
    
	/**
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t1.medata_val
		      AND d.prpty_id      = 'propertyNm1'
		      AND d.medata_val    ILIKE CONCAT('%', 'val', '%') 
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t1.medata_val
		      AND d.prpty_id      = 'propertyNm2'
		      AND d.medata_val::int = 123
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t1.medata_val
		      AND d.prpty_id      = 'propertyNm3'
		      AND d.medata_val   >= '2025-07-30T16:53:32.788926+09:00'
		  )
	 */
	public String getRefObjectQuerySql(Map<String, String> objAttrFilters) {
		if (objAttrFilters == null || objAttrFilters.size() == 0) return "";
		
		StringBuilder sb = new StringBuilder();
		try {
		
			for (Map.Entry<String, String> e : objAttrFilters.entrySet()) {
	            String rawVal = e.getValue();
	            if (rawVal == null || rawVal.trim().isEmpty()) continue;

	            String key = e.getKey().trim();
	            String val = rawVal.trim();
	            
	            // "creationTimeAfter","creationTimeBefore" -> creationTime
	            // "modifyTimeAfter","modifyTimeBefore"     -> modificationTime
	            if ("creationTimeAfter".equals(key)) {
	            	this.appendConditionSql(sb, "creationTime", ApiQueryOperator.gteq, val, "ref");
	            } else if ("creationTimeBefore".equals(key)) {
	            	this.appendConditionSql(sb, "creationTime", ApiQueryOperator.lteq, val, "ref");
	            } else if ("modifyTimeAfter".equals(key)) {
	            	this.appendConditionSql(sb, "modificationTime", ApiQueryOperator.gteq, val, "ref");
	            } else if ("modifyTimeBefore".equals(key)) {
	            	this.appendConditionSql(sb, "modificationTime", ApiQueryOperator.lteq, val, "ref");
	            } else {
	            	// 그 외는 like 로 하자. 아래에서 like 안되는 경우는 eq로 변경.	            
	            	this.appendConditionSql(sb, key, ApiQueryOperator.like, val, "ref");
	            }
			}
		
		} catch (ResBizInfoException e) {
			log.error("getRefObjectQuerySql (정보성) 실패/오류", e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("getRefObjectQuerySql 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		//log.debug("getRefObjectQuerySql : {}", sb.toString());
		return sb.toString();
	}
	
	private void appendConditionSql(StringBuilder sb, String prptyNm, ApiQueryOperator op, String value, String mainRef) {
		this.appendConditionSql(sb, prptyNm, op, value, mainRef, null, null);
	}
	
	private void appendConditionSql(StringBuilder sb, String prptyNm, ApiQueryOperator op, String value, String mainRef, String dtwObjsAttr, Map<String, String> objAttrFilters) {
		PropertyDataTypeDto typeDto = propertyService.getPropertyDataTypeDtoFromCache(prptyNm);
		if (typeDto == null) throw new ResBizInfoException(5000, "[" + prptyNm + "] 프라퍼티가 존재하지 않거나 사용할 수 없습니다.");
		
		//log.debug("{} {} {}", prptyNm, op.code(), value);
		
        sb.append("AND EXISTS (\n");
        sb.append("  SELECT 1 FROM dtmeta.tb_meta_data d\n");
        if ("main".equals(mainRef)) {
        	sb.append("  WHERE d.medata_set_id = t4.medata_set_id\n");        	
        } else { // ref
        	sb.append("  WHERE d.medata_set_id = t1.medata_val\n");
        }
        sb.append("    AND d.prpty_id = ").append( sqlQuote(prptyNm) ).append("\n");
		
		String val = sqlQuote(value);
		
		RangeDataTypeMtcd dataTypeEnum = MetadataEnum.getValue(typeDto.getRangeDataTypeMtcd(), RangeDataTypeMtcd.class);
		switch (dataTypeEnum) {
		case createDateTime :
		case updateDateTime :
		case dateTime :
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;			
			if (!DateUtil.isDateStr(val)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식이 아닙니다.");
			sb.append("    AND d.medata_val").append(op.sql(val)).append("\n");
			break;
			
		case date :
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;			
			if (!ValueUtil.isValidDd(val)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식(yyyy-MM-dd)이 아닙니다.");
			sb.append("    AND d.medata_val").append(op.sql(val)).append("\n");
			break;		
			
		case year :
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;			
			if (!ValueUtil.isValidYear(val)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식(yyyy)이 아닙니다.");
			sb.append("    AND d.medata_val").append(op.sql(val)).append("\n");
			break;
			
		case yearMonth :
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;			
			if (!ValueUtil.isValidYearMonth(val)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식(yyyy-MM)이 아닙니다.");
			sb.append("    AND d.medata_val").append(op.sql(val)).append("\n");
			break;			
			
		case integer:
		case positiveInteger:
		case nonNegativeInteger:
		case nonPositiveInteger:
		case negativeInteger:
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;
			if (!ValueUtil.isInteger(value)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 Integer 형식의 숫자가 아닙니다.");
			sb.append("    AND d.medata_val::int").append(op.sql(value)).append("\n");
			break;	
			
		case long_:			
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;
			if (!ValueUtil.isLong(value)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 Long 형식의 숫자가 아닙니다.");
			sb.append("    AND d.medata_val::numeric").append(op.sql(value)).append("\n");
			break;	
			
		case float_:
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;
			if (!ValueUtil.isFloat(value)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 Float 형식의 숫자가 아닙니다.");
			sb.append("    AND d.medata_val::numeric").append(op.sql(value)).append("\n");
			break;	
			
		case double_:
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;
			if (!ValueUtil.isDouble(value)) throw new ResBizInfoException(4004, "[" + prptyNm + "] 프라퍼티 의 비교값이 Double 형식의 숫자가 아닙니다.");
			sb.append("    AND d.medata_val::numeric").append(op.sql(value)).append("\n");
			break;	
			
		case boolean_ :
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;
			sb.append("    AND d.medata_val").append(op.sql(val.toLowerCase())).append("\n"); // 소문자로 true/false 만
			break;
			
		case geoJson : // TODO 어떤 방식으로 검색할지 정의 필요
			
			if (isLikeOperators(op)) op = ApiQueryOperator.eq;
			sb.append("    AND dtmeta.ST_AsGeoJson(d.geodata_val)").append(op.sql(val)).append("\n"); // TODO 쿼리 실행되지 않음, 추후 수정 혹은 삭제 필요
			break;			
			
		case json: 
		case address:
		case dataInfo:
			
			// JSON 인 경우 dtwObjsAttr 와 현재 프라퍼티명이 같다면 속성 조건 조건 추가.
			if (prptyNm.equals(dtwObjsAttr) && objAttrFilters != null && objAttrFilters.size() > 0) {
				for (Map.Entry<String, String> e : objAttrFilters.entrySet()) {
		            String subVal = e.getValue();
		            if (subVal == null || subVal.trim().isEmpty()) continue;
		            
		            String subKey = e.getKey().trim();
				
		            // AND (d.medata_val::jsonb)->>'addressRegion'  = '제주도'
		            sb.append("    AND (d.medata_val::jsonb)->>").append( sqlQuote(subKey) ).append(op.sql( sqlQuote(subVal) )).append("\n");
				}
			} else {
				sb.append("    AND d.medata_val").append(op.sql(val)).append("\n");
			}
			
			break;
			
		// TODO 우선 case keywordsKo: case keywordsEn: 으로, 추후 키워드 경우 따로 OR 또는 IN 조건 같은 형식으로 변경 처리가 필요할 수 있음
		default:
			
			sb.append("    AND d.medata_val").append(op.sql(val)).append("\n");
			break;
				
		}
		
		sb.append(")\n");
		
	}
	
}
