package kr.co.n2m.platform.meta.resource.metadata.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.apicatalog.jsonld.StringUtils;

import kr.co.n2m.platform.meta.architecture.code.MetadataEnum;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RangeDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.util.DateUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyDataTypeDto;
import kr.co.n2m.platform.meta.schema.property.service.PropertyService;
import lombok.extern.slf4j.Slf4j;

/**
 * 검색조건 query Parser
 * 
 * query=propertyNm1==val;propertyNm2>=val2;propertyNm3^=val3
 * 
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm1'
		      AND d.medata_val    = 'val'
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm2'
		      AND d.medata_val::int >= 123
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm3'
		      AND d.medata_val ILIKE CONCAT('val3', '%')
		  )
 * @author n2m
 */
@Slf4j
@Service
public class ApiQueryParser {
	
	@Autowired
	private PropertyService propertyService;
	
	public static final String QUERY_SEPARATOR = ";";
	
    public static enum QueryOperator {
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

        private QueryOperator(String code, String regEx, String desc, String sql) {
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
	
    /**
     * 2025-08-13
          --AND EXISTS (... INTERSECT 사용하는 쿼리에서 개별 EXISTS로 변경.
				--SELECT medata_set_id FROM dtmeta.tb_meta_data WHERE prpty_id = 'propertyNm1' and medata_val = 'val'
				--INTERSECT
				--SELECT medata_set_id FROM dtmeta.tb_meta_data WHERE prpty_id = 'propertyNm2' and medata_val::int >= 'val'::int
				--INTERSECT 
				--SELECT medata_set_id FROM dtmeta.tb_meta_data WHERE prpty_id = 'propertyNm3' and medata_val ILIKE CONCAT('val3', '%')
				-- ... )
				
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm1'
		      AND d.medata_val    = 'val'
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm2'
		      AND d.medata_val::int >= 123
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM dtmeta.tb_meta_data d
		    WHERE d.medata_set_id = t4.medata_set_id
		      AND d.prpty_id      = 'propertyNm3'
		      AND d.medata_val ILIKE CONCAT('val3', '%')
		  )
     * @param query
     * @return
     */
	public String getQuerySql(String query) {
		if (StringUtils.isBlank(query)) return "";
		
		StringBuilder sb = new StringBuilder();
		try {
		
			String[] arrStmt = query.split(QUERY_SEPARATOR);
			
			if (arrStmt.length > 0) {
				for (String stmt : arrStmt) {
					for (QueryOperator op : QueryOperator.values()) {
						if (stmt.indexOf(op.code()) != -1) {
							String[] arrTemp = stmt.split(op.regEx());
							this.appendConditionSql(sb, arrTemp[0], op, arrTemp[1]);
							break;
						}
					}
				}
			}
			
		} catch (ResBadRequestException e) {
			log.error("getQuerySql (정보성) 실패/오류", e.getReason());
			throw e;
			
		} catch (Exception e) {
			log.error("getQuerySql 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("getQuerySql : {}", sb.toString());
		return sb.toString();
	}
	
	private static String sqlQuote(String str) { 
		return "'" + str.replace("'", "''") + "'"; 
	}
	
	private void appendConditionSql(StringBuilder sb, String prptyNm, QueryOperator op, String value) {
		PropertyDataTypeDto typeDto = propertyService.getPropertyDataTypeDtoFromCache(prptyNm);
		if (typeDto == null) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티가 존재하지 않거나 사용할 수 없습니다.");
		
		log.debug("{} {} {}", prptyNm, op.code(), value);
		
		// value 에서 쿼리 보안성 문제를 야기할 만한 부분 제거
		String val = sqlQuote(value); 
		
		// ex) SELECT medata_set_id FROM dtmeta.tb_meta_data WHERE prpty_id = 'dtType' AND medata_val = 'single'
		//sb.append(" SELECT medata_set_id FROM dtmeta.tb_meta_data WHERE prpty_id = '").append(prptyNm).append("' AND ");
		
        sb.append("AND EXISTS (\n");
        sb.append("  SELECT 1 FROM dtmeta.tb_meta_data d\n");
        sb.append("  WHERE d.medata_set_id = t4.medata_set_id\n");        	
        sb.append("    AND d.prpty_id = ").append( sqlQuote(prptyNm) ).append("\n    AND ");
		
		RangeDataTypeMtcd dataTypeEnum = MetadataEnum.getValue(typeDto.getRangeDataTypeMtcd(), RangeDataTypeMtcd.class);
		switch (dataTypeEnum) {
		case createDateTime :
		case updateDateTime :
		case dateTime :
			
			if (!DateUtil.isDateStr(val)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식이 아닙니다.");
			sb.append("d.medata_val").append(op.sql(val));
			break;
			
		case date :
			
			if (!ValueUtil.isValidDd(val)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식(yyyy-MM-dd)이 아닙니다.");
			sb.append("d.medata_val").append(op.sql(val));
			break;		
			
		case year :
			
			if (!ValueUtil.isValidYear(val)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식(yyyy)이 아닙니다.");
			sb.append("d.medata_val").append(op.sql(val));
			break;
			
		case yearMonth :
			
			if (!ValueUtil.isValidYearMonth(val)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 날짜 형식(yyyy-MM)이 아닙니다.");
			sb.append("d.medata_val").append(op.sql(val));
			break;			
			
		case integer:
		case positiveInteger:
		case nonNegativeInteger:
		case nonPositiveInteger:
		case negativeInteger:
			
			AssertLikeOperators(prptyNm, op);
			if (!ValueUtil.isInteger(value)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 Integer 형식의 숫자가 아닙니다.");
			sb.append("d.medata_val::int").append(op.sql(value));
			break;	
			
			
		case long_:			
			
			AssertLikeOperators(prptyNm, op);
			if (!ValueUtil.isLong(value)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 Long 형식의 숫자가 아닙니다.");
			sb.append("d.medata_val::numeric").append(op.sql(value));
			break;	
			
		case float_:
			
			AssertLikeOperators(prptyNm, op);
			if (!ValueUtil.isFloat(value)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 Float 형식의 숫자가 아닙니다.");
			sb.append("d.medata_val::numeric").append(op.sql(value));
			break;	
			
		case double_:
			
			AssertLikeOperators(prptyNm, op);
			if (!ValueUtil.isDouble(value)) throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티 의 비교값이 Double 형식의 숫자가 아닙니다.");
			sb.append("d.medata_val::numeric").append(op.sql(value));
			break;	
			
		case boolean_ :
			
			AssertLikeOperators(prptyNm, op);
			sb.append("d.medata_val").append(op.sql(val.toLowerCase())); // // 소문자로 true/false 만
			break;
			
		case geoJson : // TODO 어떤 방식으로 검색할지 정의 필요
			
			AssertLikeOperators(prptyNm, op);
			sb.append("dtmeta.ST_AsGeoJson(d.geodata_val)").append(op.sql(val)); // TODO 쿼리 실행되지 않음, 추후 수정 혹은 삭제 필요
			break;			
			
		// TODO 우선 case json: case address: case dataInfo: 으로, 추후 별도 검색 처리가 필요할 수 있음 
		// TODO 우선 case keywordsKo: case keywordsEn: 으로, 추후 키워드 경우 따로 OR 또는 IN 조건 같은 형식으로 변경 처리가 필요할 수 있음
		default:
			
			sb.append("d.medata_val").append(op.sql(val));
			break;
				
		}

		sb.append("\n)\n");
		
	}
	
	private void AssertLikeOperators(String prptyNm, QueryOperator op) {
		if (op.equals(QueryOperator.swith) || op.equals(QueryOperator.like) || op.equals(QueryOperator.ewith)) {
			throw new ResBadRequestException("[" + prptyNm + "] 프라퍼티는 LIKE 검색을 할 수 없습니다.");
		}
	}
	
}
