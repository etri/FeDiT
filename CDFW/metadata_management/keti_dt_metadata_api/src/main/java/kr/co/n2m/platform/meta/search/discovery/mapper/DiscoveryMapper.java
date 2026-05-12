package kr.co.n2m.platform.meta.search.discovery.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.search.discovery.domain.DiscoverySearchVo;

@Mapper
public interface DiscoveryMapper {

	/** 디스커버리 검색 결과 카운트 */
	int selectDiscoveryCount(DiscoverySearchVo searchVo);

	/** 디스커버리 검색 결과 페이지 (카드 행) */
	List<CamelCaseMap> selectDiscoveryList(DiscoverySearchVo searchVo);

	/**
	 * Ancestor 경로 일괄 조회.
	 * 입력 ID 각각에 대해 root까지의 부모 체인을 (descendant_id, ancestor_id, ancestor_name, depth) 행으로 반환.
	 * 자식 참조 속성 식별: range_model.model_type_mtcd = 'object_type' (active/non-deleted/non-changed).
	 */
	List<CamelCaseMap> selectAncestorsForIds(@Param("ids") List<String> ids);

	/**
	 * 자동완성용 prefix 매칭. name/logic_nm 의 앞부터 시작하는 항목 LIMIT 10.
	 */
	List<CamelCaseMap> selectSuggestions(@Param("q") String q);

	/**
	 * 결과 유형별 카운트 — 검색 필터 모두 적용 (typeModelId 포함). 합계 = 결과 카운트.
	 */
	List<CamelCaseMap> selectTypeCounts(DiscoverySearchVo searchVo);

	/**
	 * 글로벌 유형별 카운트 — 검색 필터는 무관, 단 includeDisuseYn 토글은 따라감
	 * (검색 결과와 합계 어긋나지 않도록).
	 */
	List<CamelCaseMap> selectGlobalTypeCounts(@Param("includeDisuseYn") String includeDisuseYn);

	/**
	 * 자원의 하위 구성 — 자기 제외 모든 descendant 를 유형별로 그룹핑한 카운트.
	 * 자식 참조 식별: object_type 속성. 우측 상세에 "센서 25 · 디지털트윈객체 5" 형태로 표시.
	 * objectPrptyIds 는 Service 가 selectObjectPrptyIds 로 미리 조회해서 넘김 (재귀 CTE inline).
	 */
	List<CamelCaseMap> selectComposition(@Param("id") String id, @Param("objectPrptyIds") List<String> objectPrptyIds);

	/**
	 * object_type 속성 prpty_id 전체 목록 — DT scope/composition 재귀 CTE 안에서 inline 으로 사용.
	 * (재귀 CTE 안에서 별도 CTE 참조 시 PG 에서 "relation does not exist" 발생 회피용)
	 */
	List<String> selectObjectPrptyIds();

	/**
	 * 다수 dataset id 의 이름/유형 일괄 조회 — Neo4j neighbors 결과 보강용.
	 * 결과 컬럼: id, name, type_id, type
	 */
	List<CamelCaseMap> selectDatasetSummariesByIds(@Param("ids") List<String> ids);
}
