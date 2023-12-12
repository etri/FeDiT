package kr.co.n2m.platform.meta.resource.metadata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiInnerSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSetPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataJsonMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;

@Mapper
public interface MetadataApiMapper {
	
	/**
	 * 유형 모델별 메타데이터 셋 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 22.
	 * @param metadataApiInnerSearchVo
	 * @return
	 */
	public int selectMetadataSetCountByTypeModel(MetadataApiInnerSearchVo metadataApiInnerSearchVo);
	
	/**
	 * 유형 모델별 메타데이터 셋 목록 조회 (배열은 건수와 10건 이하만) 하여 JSON to Map 으로 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 22.
	 * @param metadataApiInnerSearchVo
	 * @return
	 */
	public List<MetadataJsonMap> selectMetadataSetListToJsonStrByTypeModel(MetadataApiInnerSearchVo metadataApiInnerSearchVo);
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 조회 (배열은 건수와 10건 이하만) 하여 JSON to Map 으로 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
	 * @param metadataSetVo
	 * @return 
	 */
	public MetadataJsonMap selectMetadataToJsonStrBySetId(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 조회 (배열 제한 없이) 하여 JSON to Map 으로 반환.
	 * @Author      : tklee
	 * @Date        : 2023. 09. 18.
	 * @param metadataSetVo
	 * @return 
	 */
	public MetadataJsonMap selectMetadataToJsonStrUnlimitedBySetId(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 조회 (배열 없이) 하여 JSON to Map 으로 반환.
	 * @Author      : tklee
	 * @Date        : 2023. 09. 18.
	 * @param metadataSetVo
	 * @return 
	 */
	public MetadataJsonMap selectMetadataToJsonStrNoArrayBySetId(MetadataSetVo metadataSetVo);
	
	/**
	 * 셋 ID 와 프라퍼티명으로 메타데이터 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 01.
	 * @param metadataApiSetPropertySearchVo
	 * @return
	 */
	public int selectMetadataCountBySetPropertyNm(MetadataApiSetPropertySearchVo metadataApiSetPropertySearchVo);
	
	/**
	 * 셋 ID 와 프라퍼티명으로 메타데이터 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 01.
	 * @param metadataApiSetPropertySearchVo
	 * @return
	 */
	public List<MetadataJsonMap> selectMetadataListBySetPropertyNm(MetadataApiSetPropertySearchVo metadataApiSetPropertySearchVo);

}
