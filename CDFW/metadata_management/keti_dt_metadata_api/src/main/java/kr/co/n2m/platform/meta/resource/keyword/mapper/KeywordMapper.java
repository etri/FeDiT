package kr.co.n2m.platform.meta.resource.keyword.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.resource.keyword.domain.KeywordSearchVo;
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

	/**
	 * 키워드 목록 조회
	 * @Author      : heenim
	 * @Date        : 2025. 10. 29.
	 * @param keywordSearchVo
	 * @return
	 */
	public List<KeywordVo> selectKeywordList(KeywordSearchVo keywordSearchVo);
	
}
