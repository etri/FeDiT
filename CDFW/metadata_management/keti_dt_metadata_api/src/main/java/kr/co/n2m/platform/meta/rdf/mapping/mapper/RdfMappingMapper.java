package kr.co.n2m.platform.meta.rdf.mapping.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingTreeSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingTreeVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingVo;

@Mapper
public interface RdfMappingMapper {
	
	/** RDF 매핑 현황 목록 건수 조회 */
	int selectRdfMappingStatusCount(RdfMappingSearchVo searchVo);
	
	/** RDF 매핑 현황 목록 조회 */
	List<RdfMappingVo> selectRdfMappingStatusList(RdfMappingSearchVo searchVo);

	/** RDF 매핑 목록 건수 조회 */
	int selectRdfMappingCount(RdfMappingSearchVo searchVo);
	
	/** RDF 매핑 목록 조회 */
	List<RdfMappingVo> selectRdfMappingList(RdfMappingSearchVo searchVo);
	
	/** RDF 매핑 등록 시 중복 체크 */
	boolean validationDuringMappingEditMode(RdfMappingVo rdfMappingVo);

	/** RDF 매핑 등록 */
	int insertRdfMapping(RdfMappingVo rdfMappingVo);
	
	/** RDF 매핑 단일 조회 */
	RdfMappingVo selectRdfMapping(RdfMappingVo rdfMappingVo);
	
	/** RDF 매핑 수정 */
	int updateRdfMapping(RdfMappingVo rdfMappingVo);
	
	/** RDF 매핑 삭제 (상태코드 변경) */
	int deleteRdfMapping(RdfMappingVo rdfMappingVo);
	
	/** RDF 매핑 모델 목록 조회 */
	List<RdfMappingModelVo> selectRdfMappingModelList(RdfMappingModelSearchVo searchVo);
	
	/** RDF 매핑 모델 순서 MAX값 조회 */
	int selectRdfMappingModelMaxOdrg(RdfMappingModelSearchVo searchVo);
	
	/** RDF 매핑 모델 순서 변경 */
	int updateRdfMappingModelOdrg(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 모델 조회 */
	RdfMappingModelVo selectRdfMappingModel(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 모델 등록 시 중복 체크 */
	boolean validationDuringMappingModelEditMode(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 모델 수정 시 중복 체크 */
	boolean validationDuringMappingModelModifyMode(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 모델 등록 */
	int insertRdfMappingModel(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 모델 수정 */
	int updateRdfMappingModel(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 모델 삭제 */
	int deleteRdfMappingModel(RdfMappingModelVo rdfMappingModelVo);
	
	/** RDF 매핑 tree 목록 조회 */
	List<RdfMappingTreeVo> selectRdfMappingTreeList(RdfMappingTreeSearchVo searchVo);
	
}
