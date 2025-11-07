package kr.co.n2m.platform.meta.search.vector.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.search.vector.service.VectorSearchService;

@Tag(name = "Vector 검색", description = "Vector 검색 API")
@RestController
public class VectorSearchController extends ResponseComponent {
	
	@Autowired
    private VectorSearchService vectorSearchService;

    /**
     * 벡터 저장 요청
     * @param dto 벡터 메타데이터
     * @param authorization Authorization 헤더의 JWT
     */
	/* 내부에서 비동기로 처리되어 이걸 호출할 일이 없을 듯
    @PostMapping("/api/v1/search/vector/store")
    public ResponseEntity<Void> storeVector(@RequestBody VectorStoreDto dto, @RequestHeader("Authorization") String authorization) {
        String jwtToken = authorization.replace("Bearer ", "").trim();
        vectorSearchService.sendToVectorServer(dto, jwtToken);
        return ResponseEntity.ok().build();
    } */

    /**
     * 벡터 검색 질문
     * @param question 검색 질문
     * @param authorization Authorization 헤더의 JWT
     * @return 응답 결과
     */
    @PostMapping("/api/v1/search/vector/prompt")
    public ResponseEntity<String> askVector(@RequestBody String question, @RequestHeader("Authorization") String authorization) {
        String jwtToken = authorization.replace("Bearer ", "").trim();
        String response = vectorSearchService.askToVector(question, jwtToken);
        return ResponseEntity.ok(response);
    }
	
}
