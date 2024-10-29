package kr.co.n2m.platform.meta.rdf.mapping.mapper;

import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleDto;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleVo;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface RdfMappingRuleMapper {

	/**
	 * RDF 모델 ID 로 RDF 매핑 규칙 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 07. 07.
	 * @param rdfMappingRuleSearchVo
	 * @return
	 */
	public List<RdfMappingRuleDto> selectRdfMappingRuleListByRdfModelId(RdfMappingRuleSearchVo rdfMappingRuleSearchVo);
	
	/**
	 * RDF 모델 ID 로 RDF 매핑 규칙 삭제
	 * @Author      : tklee
	 * @Date        : 2023. 07. 18.
	 * @param rdfMappingModelVo
	 * @return
	 */
	int deleteRdfMappingRuleByRdfModelId(RdfMappingModelVo rdfMappingModelVo);
	
	/**
	 * RDF 모델 ID 로 RDF 네임스페이스 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 07. 11.
	 * @param rdfMappingRuleSearchVo
	 * @return
	 */
	public List<RdfNamespaceVo> selectRdfNamespaceListByRdfModelId(RdfMappingRuleSearchVo rdfMappingRuleSearchVo);
	
	/**
	 * RDF 매핑 규칙 MAX 순서 조회
	 * @Author      : tklee
	 * @Date        : 2023. 07. 13.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	
	int selectRdfMappingRuleMaxOdrg(RdfMappingRuleVo rdfMappingRuleVo);
	
	/**
	 * RDF 매핑 규칙 생성
	 * @Author      : tklee
	 * @Date        : 2023. 07. 13.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	int insertRdfMappingRule(RdfMappingRuleVo rdfMappingRuleVo);
	
	/**
	 * RDF 매핑 규칙 목적어 프라퍼티 ID 존재 여부
	 * @Author      : tklee
	 * @Date        : 2023. 07. 20.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	int selectRdfMappingRuleObjtPrptyIdExist(RdfMappingRuleVo rdfMappingRuleVo);
	
	/**
	 * 프라퍼티 ID로 RDF 매핑 ID 조회
	 * @Author      : tklee
	 * @Date        : 2023. 08. 01.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	String selectRdfMappingIdByObjtPrptyId(RdfMappingRuleVo rdfMappingRuleVo);
	
	/**
	 * RDF 매핑 규칙 수정
	 * @Author      : tklee
	 * @Date        : 2023. 07. 12.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	int updateRdfMappingrule(RdfMappingRuleVo rdfMappingRuleVo);
	
	/**
	 * RDF 매핑 규칙 삭제
	 * @Author      : tklee
	 * @Date        : 2023. 07. 18.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	int deleteMappingrule(RdfMappingRuleVo rdfMappingRuleVo);

	/**
	 * RDF 매핑 규칙 상세 조회
	 * @Author      : Ran
	 * @Date        : 2023. 09. 13.
	 * @param rdfMappingRuleVo
	 * @return
	 */
	RdfMappingRuleVo selectRdfMappingRule(RdfMappingRuleVo rdfMappingRuleVo);

}
	