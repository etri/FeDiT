package kr.co.n2m.platform.meta.portal.code.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupDto;
import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeSearchVo;

@Mapper
public interface CodeGroupMapper {
	
	/** 코드그룹 건수 조회 */
	int selectCodeGroupCount(CodeSearchVo searchVo);
	
	/** 코드그룹 목록 조회 */
	List<CodeGroupVo> selectCodeGroupList(CodeSearchVo searchVo);
	
	/** 코드그룹 단일 조회 */
	CodeGroupDto selectCodeGroup(CodeGroupVo codeGrouopVo);
	
	/** 코드그룹 등록 */
	int insertCodeGroup(CodeGroupVo codeGrouopVo);
	
	/** 코드그룹 등록 - mtcdGrpId 없을 시 자동생성 */
	int insertCodeGroupAutoKey(CodeGroupVo codeGrouopVo);
	
	/** 코드그룹 수정 */
	int updateCodeGroup(CodeGroupVo codeGrouopVo);
	
	/** 코드그룹ID 중복 확인 */
	boolean selectCodeGroupById(CodeGroupVo codeGroupVo);
	
	/** 코드그룹 table data 존재여부 확인 */
	boolean selectCodeGroupExistence();
}
