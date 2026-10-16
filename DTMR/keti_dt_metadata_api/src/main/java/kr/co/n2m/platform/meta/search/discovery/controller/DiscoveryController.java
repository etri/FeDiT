package kr.co.n2m.platform.meta.search.discovery.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.search.discovery.domain.DiscoverySearchVo;
import kr.co.n2m.platform.meta.search.discovery.service.DiscoveryService;

import java.util.Map;

/**
 * 메타데이터 탐색(Discovery) API.
 *
 * 마스터-디테일 형태의 신규 검색 페이지를 위한 통합 검색 API.
 * Phase 1: 더미 응답. Phase 2: ES + Neo4j 통합 검색 + breadcrumb + 매칭 근거.
 *
 * @author n2m
 */
@Tag(name = "메타데이터 탐색", description = "메타데이터 탐색(Discovery) API")
@RestController
public class DiscoveryController extends ResponseComponent {

	@Autowired
	DiscoveryService discoveryService;

	/**
	 * 메타데이터 탐색 검색.
	 */
	@Operation(summary="메타데이터 탐색 검색 (카드 + 유형별 카운트)")
	@GetMapping("/api/v1/public/search/discovery")
	public ResponseEntity<Object> searchDiscovery(DiscoverySearchVo searchVo) {
		Map<String, Object> resp = discoveryService.searchDiscoveryWithCounts(searchVo);
		return makeResponseEntity(resp);
	}

	@Operation(summary="메타데이터 탐색 자동완성 (prefix 매칭, LIMIT 10)")
	@GetMapping("/api/v1/public/search/discovery/suggest")
	public ResponseEntity<Object> suggest(@RequestParam("q") String q) {
		return makeResponseEntity(discoveryService.suggest(q));
	}

	@Operation(summary="자원 하위 구성 요약 (자기 제외 모든 descendant 유형별 카운트)")
	@GetMapping("/api/v1/public/search/discovery/composition")
	public ResponseEntity<Object> composition(@RequestParam("id") String id) {
		return makeResponseEntity(discoveryService.composition(id));
	}

	@Operation(summary="우측 상세용 통합 요약 — info+modelInfo+dataList+composition+keywords/subjects/digitalTwinObjectData 한 번에")
	@GetMapping("/api/v1/public/search/discovery/summary")
	public ResponseEntity<Object> summary(@RequestParam("id") String id) {
		return makeResponseEntity(discoveryService.summary(id));
	}
}
