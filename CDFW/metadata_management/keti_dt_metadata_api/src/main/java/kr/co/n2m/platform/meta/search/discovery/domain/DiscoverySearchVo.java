package kr.co.n2m.platform.meta.search.discovery.domain;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 탐색(Discovery) 검색 Vo
 *
 * @author n2m
 */
@Schema(description="메타데이터 탐색 검색 Vo")
@Getter
@Setter
public class DiscoverySearchVo extends SearchVo implements Serializable {

	private static final long serialVersionUID = 2026L;

	@Schema(description="통합 검색어 (이름·키워드·주제어 동시 매칭)")
	private String q;

	@Schema(description="디지털트윈 ID 한정 (전체 시 null/all)")
	private String digitalTwinId;

	@Schema(description="유형 모델 ID 필터 (전체 시 null/empty)")
	private String typeModelId;

	@Schema(description="공간 (WKT polygon)")
	private String polygon;

	@Schema(description="카운트만 조회 (true면 list/breadcrumb 스킵, typeCounts만 반환)")
	private boolean countsOnly = false;

	@Schema(description="제외(폐기) 상태 데이터 포함 여부 (Y/N). 기본 N — 폐기 데이터 검색 결과에 미포함.")
	private String includeDisuseYn;

	/** Service 가 채워서 mapper 로 넘기는 내부 필드 — DT scope 재귀 CTE 안에서 사용할 object_type 속성 prpty_id 들. */
	@Schema(hidden=true)
	private java.util.List<String> objectPrptyIds;
}
