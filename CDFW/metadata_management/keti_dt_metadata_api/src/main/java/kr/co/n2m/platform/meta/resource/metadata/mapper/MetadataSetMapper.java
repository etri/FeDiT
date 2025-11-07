package kr.co.n2m.platform.meta.resource.metadata.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;
import kr.co.n2m.platform.meta.search.vector.domain.VectorStoreDto;

@Mapper
public interface MetadataSetMapper {
	
	/**
	 * 메타데이터 셋 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public int selectMetadataSetCount(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataSetList(MetadataSearchVo metadataSearchVo);

	/**
	 * 메타데이터 셋 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSetVo
	 * @return
	 */
	public MetadataSetDto selectMetadataSet(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 셋 명 조회. (작고 빠르게 조회하기 위함)
	 * @Author      : heenim
	 * @Date        : 2023. 07. 28.
	 * @param medataSetId
	 * @return
	 */
	public String selectMetadataSetNameById(String medataSetId);

	/**
	 * 메타데이터 셋 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSetVo
	 * @return
	 */
	public int insertMetadataSet(MetadataSetVo metadataSetVo);
	
	/**
	 * 디지털트윈 연합 식별체계로 ID 생성 및 메타데이터 셋 등록
	 * @Author      : heenim
	 * @Date        : 2024. 02. 19.
	 * @param metadataSetVo
	 */
	public int insertMetadataSetAutoKey(MetadataSetVo metadataSetVo);

	/**
	 * 메타데이터 셋 수정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSetVo
	 * @return
	 */
	public int updateMetadataSet(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 상태 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSetVo
	 * @return
	 */
	public int updateMetadataSetStatus(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 최신 리비전 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataSetVo
	 * @return
	 */
	public int updateMetadataSetNwstRvsn(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSetVo
	 * @return
	 */
	public int deleteMetadataSet(MetadataSetVo metadataSetVo);
	
	/**
	 * 메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param metadataSearchVo
	 * @return
	 */
	public List<CamelCaseMap> selectMetadataSetDtwListBySubSetId(MetadataSearchVo metadataSearchVo);
	
//	/**
//	 * 벡터 저장을 위한 메타데이터 셋 과 커스텀필드 조회
//	 * @Author      : heenim
//	 * @Date        : 2025. 05. 22.
//	 * @param metadataSearchVo
//	 * @return
//	 */
//	public VectorStoreDto selectMetadataSetForVectorStore(MetadataSearchVo metadataSearchVo);
	
	/**
	 * 지형지물 코드 - 메타데이터 셋 등록 시, 중복 확인 여부 조회
	 * ( 메타데이터 유형 모델, 식별체계 - 국가코드, 식별체계 - 분류코드, 식별체계 - 코드(지형지물) )
	 * @param metadataSetVo
	 * @return boolean
	 */
	// 2025-08-08 로직 변경으로 사용할 일이 없어짐. 지형지물도 일련번호 자동생성.
//	public boolean checkMetadatasetsIdByIdSchms(MetadataSetSaveDto metadataSetSaveDto);
}
