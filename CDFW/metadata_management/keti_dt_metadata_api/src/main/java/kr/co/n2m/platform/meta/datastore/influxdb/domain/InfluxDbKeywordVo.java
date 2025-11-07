package kr.co.n2m.platform.meta.datastore.influxdb.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.util.KeywordUtil;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InfluxDbKeywordVo {
		
	/* tag (key=value)
	   tag 값은 인덱싱 됨. 검색 시 사용됨. (태그 값이 너무 많아도 좋지 않다?)
	   tag 값 - String 문자열
	         - 기본적으로 문자(a-z, A-Z, 0-9) 허용.
	         - 허용되는 특수 문자: 언더스코어(_), 대시(-), 점(.), 슬래시(/) 등이 허용
			 - 공백(space), 등호(=), 쉼표(,), 큰따옴표("), 괄호( (,),{,},[,] ), 콜론(:), 세미콜론(;), 앰퍼샌드(&) 등 일부 특수 문자는 제한
			 - 공백은 큰따옴표로 감싸면 가능
	         - 숫자, 불리언은 직접 사용 불가
             - 태그 값의 최대 길이는 255자 
    */
	
	private String word;	// 배열이 아닌 키워드 하나하나, 허용되지 않는 특수문자 제외
	private String lang;	// langMtcd ko/en
	private String prptyId;
	private String id;		// medataSetId
    private String value;	// string field
    
    public void setValue(String value) throws IllegalArgumentException {
    	this.checkTag(value);
        this.value = KeywordUtil.toInfluxStringField(value);
        this.word = KeywordUtil.toInfluxWordTag(value);
    }    
	
	public void setLang(String lang) throws IllegalArgumentException {
		this.checkTag(lang);
		this.lang = KeywordUtil.toInfluxTag(lang);
	}
	
	public void setPrptyId(String prptyId) throws IllegalArgumentException {
		this.checkTag(prptyId);
		this.prptyId = KeywordUtil.toInfluxTag(prptyId);
	}
	
	public void setId(String id) throws IllegalArgumentException {
		this.checkTag(id);
		this.id = KeywordUtil.toInfluxTag(id);
	}	
	
	/* field (key=value) */
	// value = this.word; 필드의 값으로 키워드를 넣기로 하자.
	
	/* timestamp(기본 나노초) ex) 1632777600000000000 */ 
	private String nanosec;
	
	public void setNanosec(String nanosec) throws IllegalArgumentException {
		if (nanosec == null) {
			throw new IllegalArgumentException("나노초 값이 아닙니다. 947212800000000000 보다 커야 합니다.");
		}
		nanosec = nanosec.replaceAll("[^0-9]", "");
		if (nanosec.length() < 10 || Long.valueOf(nanosec.substring(0, nanosec.length() - 9)) < KeywordUtil.UTCSEC20000101) { 
			throw new IllegalArgumentException("나노초 값이 아닙니다. 947212800000000000 보다 커야 합니다.");
		}
		this.nanosec = nanosec;
	}
	
	
	public InfluxDbKeywordVo() { /* default 생성자 */ }
	
	public InfluxDbKeywordVo(InfluxDbKeywordDto dto) throws IllegalArgumentException {
		this(dto.getKeyword(), dto.getLangMtcd(), dto.getPrptyId(), dto.getMedataSetId(), dto.toNanosec());
	}
	
	public InfluxDbKeywordVo(String value, String lang, String prpryId, String id, String nanosec) throws IllegalArgumentException {
		StringBuilder sb = new StringBuilder();
		try { 
			this.setValue(value);
		} catch(IllegalArgumentException e) {
			sb.append("value: ").append(e.getMessage()).append("\n");
		}
		try { 
			this.setLang(lang);
		} catch(IllegalArgumentException e) {
			sb.append("lang: ").append(e.getMessage()).append("\n");
		}
		try { 
			this.setPrptyId(prpryId);
		} catch(IllegalArgumentException e) {
			sb.append("prpryId: ").append(e.getMessage()).append("\n");
		}
		try { 
			this.setId(id);
		} catch(IllegalArgumentException e) {
			sb.append("id: ").append(e.getMessage()).append("\n");
		}		
		try { 
			this.setNanosec(nanosec);
		} catch(IllegalArgumentException e) {
			sb.append("nanosec: ").append(e.getMessage()).append("\n");
		}
		
		if (sb.length() > 0) {
			throw new IllegalArgumentException(sb.toString());
		}
	}
	

	/**
	 * influxdb2 line protocol 에 맞게 문자열.
	 */
	public String toLineProtocol() {
		// measurement,tag1=value1,tag2=value2 field1=value1,field2=value2 timestamp(기본 나노초)
		return String.format("keyword,word=%s,lang=%s,prptyId=%s,id=%s value=\"%s\" %s", word, lang, prptyId, id, value, nanosec);
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
	private void checkTag(String val) throws IllegalArgumentException {
		if (val == null) {
			throw new IllegalArgumentException("유효하지 않은 태그 값입니다.");
		}
		if (val.indexOf(",") != -1) {
			throw new IllegalArgumentException("유효하지 않은 태그 값입니다. ',' 문자를 제거하여 주세요.");
		}
		if (val.getBytes().length > 255) {
			throw new IllegalArgumentException("유효하지 않은 태그 값입니다. 255bytes 이하여야 합니다.");
		}
	}    

}
