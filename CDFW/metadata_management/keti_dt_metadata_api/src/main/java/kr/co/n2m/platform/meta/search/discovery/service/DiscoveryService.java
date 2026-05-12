package kr.co.n2m.platform.meta.search.discovery.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.search.discovery.domain.DiscoverySearchVo;
import kr.co.n2m.platform.meta.search.discovery.mapper.DiscoveryMapper;
import lombok.extern.slf4j.Slf4j;

/**
 * 메타데이터 탐색(Discovery) 서비스.
 *
 * Step 1 : tb_meta_dataset + tb_meta_data 통합 OR ILIKE + 폴리곤/DT/유형 필터 + 페이징.
 * Step 2 : matched_fields 산출 (백엔드 식별자 반환, 프론트 라벨 매핑).
 * Step 3 : breadcrumb 산출 (object_type 속성 추적 ancestor 일괄 조회).
 *
 * @author n2m
 */
@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager", readOnly = true)
public class DiscoveryService {

	private static final String BREADCRUMB_SEPARATOR = " / ";

	/** Twin 계열 타입 — 연속 시 1개만 유지(leaf 쪽 = 더 구체적인 것). */
	private static final java.util.Set<String> TWIN_TYPE_IDS = new java.util.HashSet<>(java.util.Arrays.asList(
			"DigitalTwin", "FederatedDigitalTwin", "SingleDigitalTwin"
	));

	@Autowired
	private DiscoveryMapper discoveryMapper;

	@Autowired
	private kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService metadataSetService;

	@Autowired
	private kr.co.n2m.platform.meta.schema.model.service.ModelService modelService;

	@Autowired
	private kr.co.n2m.platform.meta.rdf.neo4j.service.Neo4jService neo4jService;

	/** object_type 속성 prpty_id 들 — 스키마가 바뀌지 않는 한 결과 영구 동일. lazy + 1회 캐시.
	 *  스키마 변경 시 백엔드 재시작으로 리프레시. */
	private volatile java.util.List<String> cachedObjectPrptyIds;
	private java.util.List<String> getCachedObjectPrptyIds() {
		java.util.List<String> cur = cachedObjectPrptyIds;
		if (cur == null) {
			synchronized (this) {
				cur = cachedObjectPrptyIds;
				if (cur == null) {
					cur = discoveryMapper.selectObjectPrptyIds();
					cachedObjectPrptyIds = cur;
				}
			}
		}
		return cur;
	}

	public SearchResultListVo searchDiscovery(DiscoverySearchVo searchVo) {
		log.debug("[디스커버리 검색] 시작 q={} dtId={} typeId={} polygon={}",
				searchVo.getQ(), searchVo.getDigitalTwinId(), searchVo.getTypeModelId(),
				searchVo.getPolygon());

		searchVo.setDigitalTwinId(toFilterableId(searchVo.getDigitalTwinId()));
		if (searchVo.getCurPage() <= 0) searchVo.setCurPage(1);
		if (searchVo.getPageListSize() <= 0) searchVo.setPageListSize(10);

		int totalSize = discoveryMapper.selectDiscoveryCount(searchVo);
		searchVo.setTotalListSize(totalSize);

		List<CamelCaseMap> list = (totalSize > 0)
				? discoveryMapper.selectDiscoveryList(searchVo)
				: Collections.emptyList();

		fillBreadcrumb(list);

		// Step 4: 유형별 카운트 (typeModelId 필터 제외한 동일 WHERE)
		List<CamelCaseMap> typeCounts = (totalSize > 0)
				? discoveryMapper.selectTypeCounts(searchVo)
				: Collections.emptyList();

		SearchResultListVo result = new SearchResultListVo();
		result.setList(list);
		result.setPage(new PageVo(searchVo));
		// SearchResultListVo 가 추가 필드를 못 담으니 list 외에 typeCounts 는 별도로 putExtra 식 처리.
		// 일단 응답 wrapping 을 위해 Map 으로 감싸 반환.
		// (REST 응답 측면에서 그대로 직렬화되도록 service 가 Map 반환하는 패턴이 더 깔끔하지만,
		//  기존 SearchResultListVo 패턴 유지 위해 임시로 page 객체에 totalListSize 만 넘김.
		//  typeCounts 는 페이지 응답을 감싸는 별도 메서드에서 같이 반환.)

		// 응답에 typeCounts 포함을 위해 별도 wrapper 필요 — searchDiscoveryWithCounts 사용 권장.
		// 현재 메서드는 호환성 유지용. 새 수요에 맞게 별도 응답 객체로 확장.
		log.debug("[디스커버리 검색] 종료 total={} returned={} types={}",
				totalSize, list.size(), typeCounts.size());
		return result;
	}

	/** 검색 + 유형별 카운트 한 번에 응답.
	 *  countsOnly=true 면 결과 list/breadcrumb 스킵하고 글로벌 분포만 반환.
	 *  일반 검색이면: list + page + typeCountsResult (필터 적용) + typeCountsGlobal (필터 무관). */
	public java.util.Map<String, Object> searchDiscoveryWithCounts(DiscoverySearchVo searchVo) {
		searchVo.setDigitalTwinId(toFilterableId(searchVo.getDigitalTwinId()));
		if (searchVo.getCurPage() <= 0) searchVo.setCurPage(1);
		if (searchVo.getPageListSize() <= 0) searchVo.setPageListSize(10);

		// DT scope 사용 시 object_type 속성 prpty_id 들을 미리 조회해서 SearchVo 에 set.
		// (재귀 CTE 안에서 다른 CTE 참조 시 PG 에서 "relation does not exist" 발생 회피)
		if (org.apache.commons.lang3.StringUtils.isNotEmpty(searchVo.getDigitalTwinId())) {
			searchVo.setObjectPrptyIds(getCachedObjectPrptyIds());
		}

		java.util.Map<String, Object> resp = new java.util.HashMap<>();

		if (searchVo.isCountsOnly()) {
			// 첫 로드 — 글로벌 분포만
			List<CamelCaseMap> globalCounts = discoveryMapper.selectGlobalTypeCounts(searchVo.getIncludeDisuseYn());
			searchVo.setTotalListSize(0);
			resp.put("list", Collections.emptyList());
			resp.put("page", new PageVo(searchVo));
			resp.put("typeCountsGlobal", globalCounts);
			resp.put("typeCountsResult", Collections.emptyList());
			return resp;
		}

		log.info("[DBG searchDiscovery] q='{}' dtId='{}' typeId='{}' polygon='{}'",
				searchVo.getQ(), searchVo.getDigitalTwinId(),
				searchVo.getTypeModelId(), searchVo.getPolygon());

		int totalSize = discoveryMapper.selectDiscoveryCount(searchVo);
		searchVo.setTotalListSize(totalSize);
		log.info("[DBG searchDiscovery] totalSize={}", totalSize);

		List<CamelCaseMap> list = (totalSize > 0)
				? discoveryMapper.selectDiscoveryList(searchVo)
				: Collections.emptyList();
		fillBreadcrumb(list);

		List<CamelCaseMap> typeCountsResult = (totalSize > 0)
				? discoveryMapper.selectTypeCounts(searchVo)
				: Collections.emptyList();
		List<CamelCaseMap> typeCountsGlobal = discoveryMapper.selectGlobalTypeCounts(searchVo.getIncludeDisuseYn());

		resp.put("list", list);
		resp.put("page", new PageVo(searchVo));
		resp.put("typeCountsResult", typeCountsResult);
		resp.put("typeCountsGlobal", typeCountsGlobal);
		return resp;
	}

	/**
	 * 우측 상세용 통합 요약 — 카드 클릭 1회로 필요한 모든 데이터 수집:
	 * - medataSet, modelInfo, dataList (= 기존 getPageData)
	 * - composition (자기 제외 descendant 유형별 카운트)
	 * - keywords/subjects (modelInfo 의 array 목록에 있을 때만)
	 * - objectJson (DigitalTwinObject 의 digitalTwinObjectData 값, 있을 때만)
	 * 내부에서 기존 서비스들 재사용.
	 */
	public java.util.Map<String, Object> summary(String id) {
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		if (id == null || id.trim().isEmpty()) return resp;
		String dsid = id.trim();

		kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto setDto =
				metadataSetService.getMetadataSet(dsid);
		if (setDto == null) {
			resp.put("medataSet", null);
			return resp;
		}

		kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto modelInfo =
				modelService.getModelInfoByNameFromCache(setDto.getModelNm());
		java.util.List<kr.co.n2m.platform.meta.resource.metadata.domain.MetadataDto> dataList =
				metadataSetService.getMetadataListWithSetIdForSave(dsid, "");

		// composition (재귀 CTE)
		List<String> prptyIds = getCachedObjectPrptyIds();
		List<CamelCaseMap> composition = discoveryMapper.selectComposition(dsid, prptyIds);

		// 1-depth neighbors via Neo4j (parents + medata children + keyword children)
		Map<String, Object> neighbors = neo4jService.getDiscoveryNeighbors(dsid);
		List<Map<String, Object>> rawParents  = neighbors == null ? Collections.emptyList()
				: (List<Map<String, Object>>) neighbors.getOrDefault("parents",  Collections.emptyList());
		List<Map<String, Object>> rawChildren = neighbors == null ? Collections.emptyList()
				: (List<Map<String, Object>>) neighbors.getOrDefault("children", Collections.emptyList());
		List<Map<String, Object>> rawKeywords = neighbors == null ? Collections.emptyList()
				: (List<Map<String, Object>>) neighbors.getOrDefault("keywords", Collections.emptyList());

		// Neo4j 가 ID 만 줬으니 PG 에서 이름·유형 일괄 보강
		java.util.Set<String> nodeIds = new java.util.LinkedHashSet<>();
		for (Map<String, Object> p : rawParents)  if (p.get("id") != null) nodeIds.add((String) p.get("id"));
		for (Map<String, Object> c : rawChildren) if (c.get("id") != null) nodeIds.add((String) c.get("id"));
		Map<String, CamelCaseMap> summaryById = new HashMap<>();
		if (!nodeIds.isEmpty()) {
			List<CamelCaseMap> summaries = discoveryMapper.selectDatasetSummariesByIds(new ArrayList<>(nodeIds));
			for (CamelCaseMap s : summaries) summaryById.put((String) s.get("id"), s);
		}
		List<Map<String, Object>> parents  = enrichNeighbors(rawParents,  summaryById);
		List<Map<String, Object>> children = enrichNeighbors(rawChildren, summaryById);

		// keywords/subjects/digitalTwinObjectData — modelInfo 목록에 있을 때만 호출
		List<String> arrayList = (modelInfo != null && modelInfo.getArrayPropertyNmList() != null)
				? modelInfo.getArrayPropertyNmList() : Collections.emptyList();
		List<String> jsonList = (modelInfo != null && modelInfo.getJsonEtcPropertyNmList() != null)
				? modelInfo.getJsonEtcPropertyNmList() : Collections.emptyList();

		List<String> keywords = arrayList.contains("keywords") ? fetchPropertyValues(dsid, "keywords") : Collections.emptyList();
		List<String> subjects = arrayList.contains("subjects") ? fetchPropertyValues(dsid, "subjects") : Collections.emptyList();
		String objectJson = null;
		if (jsonList.contains("digitalTwinObjectData")) {
			List<String> rows = fetchPropertyValues(dsid, "digitalTwinObjectData");
			if (!rows.isEmpty()) objectJson = rows.get(0);
		}

		resp.put("medataSet", setDto);
		resp.put("modelInfo", modelInfo);
		resp.put("dataList", dataList);
		resp.put("composition", composition);
		resp.put("keywords", keywords);
		resp.put("subjects", subjects);
		resp.put("objectJson", objectJson);
		resp.put("neighbors", new java.util.HashMap<String, Object>() {{
			put("parents", parents);
			put("children", children);
			put("keywordChildren", rawKeywords);
		}});
		return resp;
	}

	/** Neo4j neighbor row 에 PG dataset summary(name/type/typeId) 를 합쳐 반환.
	 *  PG 매칭 실패 시 Neo4j 노드 자체의 name / metaModel 을 fallback 으로 사용. */
	private List<Map<String, Object>> enrichNeighbors(List<Map<String, Object>> raw, Map<String, CamelCaseMap> summaryById) {
		List<Map<String, Object>> out = new ArrayList<>(raw.size());
		for (Map<String, Object> r : raw) {
			String nid = (String) r.get("id");
			Map<String, Object> n = new HashMap<>();
			n.put("id",  nid);
			n.put("via", r.get("via"));
			CamelCaseMap s = summaryById.get(nid);
			String pgName   = (s != null) ? (String) s.get("name")   : null;
			String pgType   = (s != null) ? (String) s.get("type")   : null;
			String pgTypeId = (s != null) ? (String) s.get("typeId") : null;
			String neoName  = nullIfBlank((String) r.get("name"));
			String neoModel = nullIfBlank((String) r.get("metaModel"));
			// name 비우면 프론트 captionFromNode 가 metaModel → id 로 알아서 fallback.
			n.put("name",   firstNonBlank(pgName,  neoName,  ""));
			n.put("type",   firstNonBlank(pgType,  neoModel, ""));
			n.put("typeId", firstNonBlank(pgTypeId, neoModel, ""));
			out.add(n);
		}
		return out;
	}

	private String nullIfBlank(String s) {
		return (s == null || s.isEmpty()) ? null : s;
	}
	private String firstNonBlank(String... vals) {
		for (String v : vals) {
			if (v != null && !v.isEmpty()) return v;
		}
		return "";
	}

	/** 한 자원의 특정 속성 값들(medataVal) 조회 — 기존 getMetadataListBySetPropertyNm 재사용. */
	private List<String> fetchPropertyValues(String medataSetId, String prptyNm) {
		kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo vo =
				new kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo();
		vo.setMedataSetId(medataSetId);
		vo.setPrptyNm(prptyNm);
		vo.setIsPaging(false);
		SearchResultListVo res = metadataSetService.getMetadataListBySetPropertyNm(vo);
		List<String> values = new ArrayList<>();
		if (res != null && res.getList() != null) {
			for (Object item : res.getList()) {
				String v = extractMedataVal(item);
				if (v != null && !v.isEmpty()) values.add(v);
			}
		}
		return values;
	}

	private String extractMedataVal(Object item) {
		if (item == null) return null;
		if (item instanceof CamelCaseMap) {
			Object v = ((CamelCaseMap) item).get("medataVal");
			return v == null ? null : String.valueOf(v);
		}
		try {
			Object v = item.getClass().getMethod("getMedataVal").invoke(item);
			return v == null ? null : String.valueOf(v);
		} catch (Exception ignore) {
			return null;
		}
	}

	/** 자원 하위 구성 — descendant 유형별 카운트. Leaf 자원은 빈 list 반환. */
	public java.util.Map<String, Object> composition(String id) {
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		if (id == null || id.trim().isEmpty()) {
			resp.put("list", Collections.emptyList());
			return resp;
		}
		List<String> prpty = getCachedObjectPrptyIds();
		resp.put("list", discoveryMapper.selectComposition(id.trim(), prpty));
		return resp;
	}

	/** 자동완성 (prefix 매칭, LIMIT 10). */
	public java.util.Map<String, Object> suggest(String q) {
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		if (q == null || q.trim().length() < 1) {
			resp.put("list", Collections.emptyList());
			return resp;
		}
		List<CamelCaseMap> list = discoveryMapper.selectSuggestions(q.trim());
		resp.put("list", list);
		return resp;
	}

	/**
	 * 결과 페이지 자원의 직속 부모 일괄 조회 후 breadcrumb 채움.
	 * - SQL 은 자손 ID 를 참조하는 모든 dataset 을 부모로 반환 (멀티-부모 가능)
	 * - Java 에서 Twin 타입(연합/단일/디지털트윈)만 유지 → 진짜 소속 컨테이너만 표시
	 * - Twin 부모가 여러 개면 이름 dedup 후 join (드문 케이스)
	 * - Twin 부모 없으면 breadcrumb 없음
	 */
	private void fillBreadcrumb(List<CamelCaseMap> list) {
		if (list == null || list.isEmpty()) return;

		List<String> ids = list.stream()
				.map(row -> (String) row.get("id"))
				.filter(Objects::nonNull)
				.collect(Collectors.toList());
		if (ids.isEmpty()) return;

		List<CamelCaseMap> ancestorRows = discoveryMapper.selectAncestorsForIds(ids);

		// descendant_id → Twin-type 직속 부모 이름들 (dedup)
		Map<String, java.util.LinkedHashSet<String>> twinParentsByDesc = new HashMap<>();
		for (CamelCaseMap row : ancestorRows) {
			String descId = (String) row.get("descendantId");
			String ancNm  = (String) row.get("ancestorNm");
			String typeId = (String) row.get("ancestorTypeId");
			if (descId == null || ancNm == null) continue;
			if (!TWIN_TYPE_IDS.contains(typeId)) continue; // 진짜 소속 컨테이너(Twin)만
			twinParentsByDesc
					.computeIfAbsent(descId, k -> new java.util.LinkedHashSet<>())
					.add(ancNm);
		}

		for (CamelCaseMap row : list) {
			String id = (String) row.get("id");
			java.util.LinkedHashSet<String> parents = twinParentsByDesc.get(id);
			if (parents == null || parents.isEmpty()) continue;
			row.put("breadcrumb", String.join(BREADCRUMB_SEPARATOR, parents));
		}
	}

	/** 프론트의 "all" placeholder는 빈 값으로 정규화. */
	private String toFilterableId(String value) {
		if (value == null || value.isEmpty() || "all".equalsIgnoreCase(value)) {
			return "";
		}
		return value;
	}
}
