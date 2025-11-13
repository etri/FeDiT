package kr.co.n2m.platform.meta.portal.code.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.portal.code.domain.CodeSearchVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeVo;

@Mapper
public interface CodeMapper {
	
	/** 코드 건수 조회 */
	int selectCodeCount(CodeSearchVo codeSearchVo);
	
	/** 코드 목록 조회 */
	List<CodeVo> selectCodeList(CodeSearchVo codeSearchVo);
	
	/** 코드 상세 조회 */
	CodeVo selectCode(CodeVo codeVo);
	
	/** 코드 등록 */
	int insertCode(CodeVo codeVo);
	
	/** 코드 수정 */
	int updateCode(CodeVo codeVo);
	
	/** 코드ID 중복확인 */
	boolean selectCodeById(CodeVo codeVo);
}
