package kr.co.n2m.platform.meta.resource.keyword.mapper;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.resource.keyword.domain.KeywordVo;

@Mapper
public interface KeywordMapper {

	/**
	 * 키워드 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param keywordVo
	 * @return
	 */
	public int insertKeyword(KeywordVo keywordVo);
	
	/**
	 * 키워드 최근 일시 수정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param keywordVo
	 * @return
	 */
	public int updateKeywordRecntDt(KeywordVo keywordVo);

}
