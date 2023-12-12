package kr.co.n2m.platform.meta.rdf.virtuoso.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfTripleLogSearchVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfTripleLogVo;

@Mapper
public interface RdfTripleLogMapper {

	/**
	 * RDF 트리플 로그 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param rdfTripleLogSearchVo
	 * @return
	 */
	public int selectRdfTripleLogCount(RdfTripleLogSearchVo rdfTripleLogSearchVo);
	
	/**
	 * RDF 트리플 로그 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param rdfTripleLogSearchVo
	 * @return
	 */
	public List<RdfTripleLogVo> selectRdfTripleLogList(RdfTripleLogSearchVo rdfTripleLogSearchVo);

	/**
	 * RDF 트리플 로그 등록
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param rdfTripleLogVo
	 * @return
	 */
	public int insertRdfTripleLog(RdfTripleLogVo rdfTripleLogVo);
	
	/**
	 * RDF 트리플 로그 목록 등록
	 * @Author      : heenim
	 * @Date        : 2023. 07. 24.
	 * @param listMap
	 * @return
	 */
	@SuppressWarnings("rawtypes")
	public int insertRdfTripleLogList(Map listMap);
	
}
