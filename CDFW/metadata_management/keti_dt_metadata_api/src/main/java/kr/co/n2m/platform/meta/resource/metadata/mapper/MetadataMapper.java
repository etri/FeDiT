package kr.co.n2m.platform.meta.resource.metadata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertyDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataVo;

@Mapper
public interface MetadataMapper {
	
	/**
	 * 메타데이터 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public int selectMetadataCount(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 메타데이터 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataList(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 메타데이터 셋 ID로 메타데이터 목록 조회 (Simple)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<MetadataVo> selectMetadataSimpleListBySetId(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 저장을 위한 메타데이터 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<MetadataDto> selectMetadataListForSave(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 프라퍼티명으로 메타데이터 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 22.
	 * @param metadataPropertySearchVo
	 * @return
	 */
	public int selectMetadataCountByPropertyNm(MetadataPropertySearchVo metadataPropertySearchVo);
	
	/**
	 * 프라퍼티명으로 메타데이터 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 22.
	 * @param metadataPropertySearchVo
	 * @return
	 */
	public List<MetadataPropertyDto> selectMetadataListByPropertyNm(MetadataPropertySearchVo metadataPropertySearchVo);
	
	/**
	 * 프라퍼티명으로 메타데이터 건수와 ID 조회 (중복 체크용)
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param metadataPropertySearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataListByPropertyNmForDupCheck(MetadataPropertySearchVo metadataPropertySearchVo);
	
	/**
	 * 필수 체크를 위한 메타데이터 셋의 프라퍼티 목록 조회 (유효하지 못한 프라퍼티들)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataPropertyListBySetIdForRequiredCheck(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 배열이 아닌 프라퍼티에 대한 건수 체크를 위한 메타데이터 셋의 프라퍼티 목록 조회 (유효하지 못한 프라퍼티들)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataPropertyListBySetIdForCountCheck(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 유효성 체크를 위한 메타데이터 셋의 ObjectType 비정형 모델 상태 목록 조회 (유효하지 못한 상태의 값들)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataValStatusListBySetIdForObjectTypeCheck(MetadataSearchVo metadataSearchVo);

	/**
	 * 메타데이터 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataVo
	 * @return
	 */
	public MetadataDto selectMetadata(MetadataVo metadataVo);

	/**
	 * 메타데이터 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataVo
	 * @return
	 */
	public int insertMetadataAutoKey(MetadataVo metadataVo);

	/**
	 * 메타데이터 수정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataVo
	 * @return
	 */
	public int updateMetadata(MetadataVo metadataVo);
	
	/**
	 * 메타데이터 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataVo
	 * @return
	 */
	public int deleteMetadata(MetadataVo metadataVo);
	
	/**
	 * 메타데이터 셋 ID로 메타데이터 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @return
	 */
	public int deleteMetadataAllBySetId(String medataSetId);
	
	/**
	 * 메타데이터 셋 ID와 프라퍼티 ID로 메타데이터 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param metadataPropertySearchVo
	 * @return
	 */
	public int deleteMetadataAllByPropertyId(MetadataPropertySearchVo metadataPropertySearchVo);
	
	/**
	 * 메타데이터 셋 ID와 프라퍼티 ID를 참조하는 프라터피 ID의 메타데이터 전체 삭제  (위의 것 실행 후 성공시에만 호출)
	 * @Author      : heenim
	 * @Date        : 2023. 06. 22.
	 * @param metadataPropertySearchVo
	 * @return
	 */
	public int deleteMetadataAllByRefPropertyId(MetadataPropertySearchVo metadataPropertySearchVo);
	
	/**
	 * 메타데이터 셋 에 있는 유형 모델별 건수 목록 조회 (numberOf 프라퍼티 용)
	 * @Author      : heenim
	 * @Date        : 2023. 10. 20.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataValModelCntListBySetId(MetadataSearchVo metadataSearchVo);

}
