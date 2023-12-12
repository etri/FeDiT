package kr.co.n2m.platform.meta.collection.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Alias("collectionWorkDto")
public class CollectionWorkDto extends CollectionWorkVo {

	private String colecWrkSttusMtcdNm;

	@Getter(AccessLevel.NONE)
	@Setter(AccessLevel.NONE)
	@Schema(description = "생성 메타데이터셋 아이디 목록")
	private List<String> medataSetIdList;

	/**
	 * 메타데이터 셋 아이지 나열 문자열을 List 로 변환해서 반환
	 * ex) "[\"a\", \"b\", \"c\", \"d\"]" => [a, b, c, d]
	 * @param
	 * @return
	 */
	public List<String> getMedataSetIdList() { // cretMedataSetIdList 가 isnotblank 라면 List<String> 로 변환. 아니면 null
		List<String> medataSetIdList = new ArrayList<>();
		if(this.getCretMedataSetIdList() == null){
			return null;
		}
		StringTokenizer st = new StringTokenizer(this.getCretMedataSetIdList(), "\"");
		while(st.hasMoreTokens()){
			String token = st.nextToken().trim();
			if(!token.isEmpty() && !token.equals("[") &&
			   !token.equals("]") && !token.equals(",")){
				medataSetIdList.add(token);
			}
		}
		return medataSetIdList;
	}

}