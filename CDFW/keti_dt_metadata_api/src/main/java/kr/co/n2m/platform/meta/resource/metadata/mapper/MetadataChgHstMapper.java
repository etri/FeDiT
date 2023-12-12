package kr.co.n2m.platform.meta.resource.metadata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;

@Mapper
public interface MetadataChgHstMapper {
	
	/**
	 * 메타데이터 변경이력 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 21.
	 * @param metadataChgHstSearchVo
	 * @return
	 */
	public int selectMetadataChgHstCount(MetadataChgHstSearchVo metadataChgHstSearchVo);
	
	/**
	 * 메타데이터 변경이력 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 21.
	 * @param metadataChgHstSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataChgHstList(MetadataChgHstSearchVo metadataChgHstSearchVo);

	/**
	 * 메타데이터 변경이력 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataChgHstVo
	 * @return
	 */
	public int insertMetadataChgHstAutoKey(MetadataChgHstVo metadataChgHstVo);
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 목록을 조회하여 메타데이터 변경이력 등록
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param metadataChgHstSaveDto
	 * @return
	 */
	public int insertMetadataChgHstAutoKeyListBySelectingBySetId(MetadataChgHstSaveDto metadataChgHstSaveDto);

	/**
	 * 변경이력 등록을 위한 메타데이터 셋 값 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 20.
	 * @param metadataSetVo
	 * @return
	 */
	public List<MetadataChgHstSaveDto> selectSelValueListBySetIdForChgHst(MetadataSetVo metadataSetVo);

}
