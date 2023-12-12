package kr.co.n2m.platform.meta.rdf.namespace.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceSearchVo;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;

@Mapper
public interface RdfNamespaceMapper {

	/** RDF 네임스페이스 목록 건수 조회 */
	int selectRdfNamespaceCount(RdfNamespaceSearchVo searchVo);
	
	/** RDF 네임스페이스 목록 조회 */
	List<RdfNamespaceVo> selectRdfNamespaceList(RdfNamespaceSearchVo searchVo);
	
	/** RDF 네임스페이스 단일 조회 */
	RdfNamespaceVo selectRdfNamespace(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 등록 */
	int insertRdfNamespace(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 수정 */
	int updateRdfNamespace(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 삭제 */
	int deleteRdfNamespace(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 URI 중복 확인 */
	boolean isDuplicatedNamespaceUri(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 Prefix 중복 확인 */
	boolean isDuplicatedNamespacePfix(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 data 존재 여부 확인 - RDF class */
	boolean isNamespaceExistInRdfClass(RdfNamespaceVo rdfNamespaceVo);
	
	/** RDF 네임스페이스 data 존재 여부 확인 - RDF property */
	boolean isNamespaceExistInRdfProperty(RdfNamespaceVo rdfNamespaceVo);
}
