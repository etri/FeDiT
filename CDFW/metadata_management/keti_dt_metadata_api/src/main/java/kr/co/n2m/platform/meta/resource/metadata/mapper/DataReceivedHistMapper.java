package kr.co.n2m.platform.meta.resource.metadata.mapper;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.resource.metadata.domain.IfLogVo;

@Mapper
public interface DataReceivedHistMapper {
	
	/**
	 * 인터페이스 로그 등록
	 * @Author      : tklee
	 * @Date        : 2024. 03. 21.
	 * @param ifLogVo
	 * @return
	 */
	public int insertIfLog(IfLogVo ifLogVo);
	
	/**
	 * 인터페이스 결과 수정
	 * @Author      : tklee
	 * @Date        : 2024. 03. 21.
	 * @param ifLogVo
	 * @return
	 */
	public int updateIfLog(IfLogVo ifLogVo);	
}
