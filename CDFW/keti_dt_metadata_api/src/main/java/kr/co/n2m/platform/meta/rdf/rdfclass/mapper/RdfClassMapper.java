package kr.co.n2m.platform.meta.rdf.rdfclass.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDto;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassDto;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassSearchVo;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassVo;

@Mapper
public interface RdfClassMapper {

	/** RDF 클래스 목록 건수 조회 */
	int selectRdfClassCount(RdfClassSearchVo rdfClassSearchVo);

	/** RDF 클래스 목록 조회 */
	List<RdfClassDto> selectRdfClassList(RdfClassSearchVo rdfClassSearchVo);
	
	/** RDF 클래스 목록 건수 조회 (range 모드) */
	int selectRangeRdfClassCount(RdfClassSearchVo rdfClassSearchVo);

	/** RDF 클래스 목록 조회 (range 모드) */
	List<RdfClassDto> selectRangeRdfClassList(RdfClassSearchVo rdfClassSearchVo);

	/** RDF 클래스 상세 조회 */
	RdfClassDto selectRdfClass(RdfClassVo rdfClassVo);

	/** RDF 클래스 등록 */
	void insertRdfClass(RdfClassVo rdfClassVo);

	/** RDF 클래스 수정 */
	void updateRdfClass(RdfClassVo rdfClassVo);

	/** RDF 클래스 삭제 */
	void deleteRdfClass(String rdfClassId);

	/** RDF 프라퍼티 목록 건수 조회 (rdfClassId 일치 & domn_range_div_mtcd ='domain') */
	int selectPrptyListByClassCount(RdfClassSearchVo rdfClassSearchVo);

	/** RDF 프라퍼티 목록 조회 (rdfClassId 일치 & domn_range_div_mtcd ='domain') */
	List<RdfPropertyDto> selectPrptyListByClass(RdfClassSearchVo rdfClassSearchVo);

	/***************************************** 유효성 검사 - 등록 or 수정 ***************************************** /
	/** RDF 네임스페이스, RDF 클래스명  중복 확인 - 등록 */
	boolean validationDuringEditMode(RdfClassVo rdfClassVo);

	/** RDF 네임스페이스, RDF 클래스명  중복 확인 - 수정  */
	boolean validationDuringModifyMode(RdfClassVo rdfClassVo);

	/** RDF 네임스페이스 ID 존재 여부 확인 - RDF namespace */
	boolean isRdfNmspIdExist(String rdfNmspId);

	/******************************************** 유효성 검사 - 삭제 ******************************************** /
	/** RDF 클래스 data 존재 여부 확인 - RDF property define, RDF mapping, RDF mapping */
	boolean validationDuringDeleteMode(String rdfClassId);
}