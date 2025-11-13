package kr.co.n2m.platform.meta.resource.metadata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiInnerSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSetPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataElasticJsonMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataJsonMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
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
	 * @param metadataSetDto
	 * @return 
	 */
	public MetadataJsonMap selectMetadataToJsonStrBySetId(MetadataSetDto metadataSetDto);
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 조회 (배열은 건수와 10건 이하만) 하여 JSON to Map 으로 반환. 데이터 유형이 json인 경우 text로 출력
	 * @Author      : tklee
	 * @Date        : 2024. 06. 11.
	 * @param metadataSetDto
	 * @return 
	 */
	public MetadataElasticJsonMap selectMetadataToJsonStrBySetIdAsText(MetadataSetDto metadataSetDto);
	
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
	
	/**
	 * 셋 ID 로 Geometry 정보 조회
	 * @Author      : heenim
	 * @Date        : 2025. 09.18.
	 * @param metadataSearchVo
	 * @return
	 */
	public CamelCaseMap selectGeometryInfoBySetId(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 레지스트리 API 용 메타데이터 목록 건수 조회
	 * @Author      : heenim
	 * @Date        : 2025. 08. 11.
	 * @param metadataApiInnerSearchVo
	 * @return
	 */
	public int selectMetadataSetCountForApi(MetadataApiInnerSearchVo metadataApiInnerSearchVo);

	/**
	 * 레지스트리 API 용 메타데이터 목록 조회 (배열은 건수와 10건 이하만) 하여 JSON to Map 으로 반환. 
	 * 디지털트윈 목록의 경우 1depth 참조 object_type ID 는 JSON 으로 변환하여 반환.
	 * @Author      : heenim
	 * @Date        : 2025. 08. 11.
	 * @param metadataApiInnerSearchVo
	 * @return
	 */
	public List<MetadataJsonMap> selectMetadataSetListForApiWithChildren(MetadataApiInnerSearchVo metadataApiInnerSearchVo);
	
}
