package kr.co.n2m.platform.meta.search.metadata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.search.metadata.domain.DataSearchVo;

@Mapper
public interface MetadataSearchMapper {
	
	/**
	 * 메타데이터 목록 카운트 조회
	 * @Author      : tklee
	 * @Date        : 2024. 08. 06.
	 * @param metadataSearchVo
	 * @return
	 */
	public int selectMetadataCount(DataSearchVo metadataSearchVo);
	
	/**
	 * 메타데이터 목록 조회
	 * @Author      : tklee
	 * @Date        : 2024. 08. 06.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataList(DataSearchVo metadataSearchVo);
	
	/**
	 * 디지털트윈 하위 메타데이터 셋 ID 목록 조회
	 * @Author      : tklee
	 * @Date        : 2024. 08. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<String> selectDigitalTwinLowerList(DataSearchVo metadataSearchVo);
	
	/**
	 * geometry 유효성 검사 
	 * @Author      : tklee
	 * @Date        : 2024. 08. 13.
	 * @param metadataSearchVo
	 * @return
	 */
	public int selectGeom(DataSearchVo metadataSearchVo);

}
