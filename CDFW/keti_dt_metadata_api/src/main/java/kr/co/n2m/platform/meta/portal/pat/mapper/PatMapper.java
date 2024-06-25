package kr.co.n2m.platform.meta.portal.pat.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.portal.pat.domain.PatSearchVo;
import kr.co.n2m.platform.meta.portal.pat.domain.PatVo;

@Mapper
public interface PatMapper {
	
	/**
	 * PAT 목록 카운트 조회
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patSearchVo
	 * @return
	 */
	public int selectPatCount(PatSearchVo patSearchVo);
	
	/**
	 * PAT 목록 조회
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectPatList(PatSearchVo patSearchVo);
	
	/**
	 * PAT 조회
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patVo
	 * @return
	 */
	public PatVo selectPat(PatVo patVo);
	
	/**
	 * PAT 삭제
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patVo
	 * @return
	 */
	public int deletePat(PatVo patVo);
	
	/** 
	 * PAT 등록 
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patVo
	 * @return 
	 */
	int insertPat(PatVo patVo);

	/** 
	 * PAT id 생성 
	 * @Author      : tklee
	 * @Date        : 2024. 02. 06.
	 * @param patVo
	 * @return 
	 */
	public String selectPatKey();

}
