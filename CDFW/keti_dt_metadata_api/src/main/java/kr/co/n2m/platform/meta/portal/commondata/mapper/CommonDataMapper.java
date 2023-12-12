package kr.co.n2m.platform.meta.portal.commondata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.portal.commondata.domain.CommonAuthApiUrlDto;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonAuthDto;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonSearchVo;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonUserDto;

@Mapper
public interface CommonDataMapper {

	/**
	 * 내 권한 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 24.
	 * @param commonSearchVo
	 * @return
	 */
	public List<CommonAuthDto> selectMyAuthList(CommonSearchVo commonSearchVo);
	
	/**
	 * 권한 사용자 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 24.
	 * @param notifcMySearchVo
	 * @return
	 */
	public int selectDistinctAuthUserCount(CommonSearchVo commonSearchVo);
	
	/**
	 * 권한 사용자 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 24.
	 * @param commonSearchVo
	 * @return
	 */
	public List<CommonUserDto> selectDistinctAuthUserList(CommonSearchVo commonSearchVo);
	
	/**
	 * 권한 API URL 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 10. 11.
	 * @param commonSearchVo
	 * @return
	 */
	public List<CommonAuthApiUrlDto> selectDistinctAuthApiUrlList(CommonSearchVo commonSearchVo);
	
}
