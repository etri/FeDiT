package kr.co.n2m.platform.meta.resource.category.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.resource.category.domain.CategorySearchVo;
import kr.co.n2m.platform.meta.resource.category.domain.CategoryVo;
import kr.co.n2m.platform.meta.resource.category.service.CategoryService;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "카테고리", description = "카테고리 관리 API")
@Slf4j
@RestController
public class CategoryController extends ResponseComponent {

	@Autowired
	private CategoryService categoryService;

	/** 카테고리 관리 페이징 목록 조회 */
	@Operation(summary="카테고리 관리 페이징 목록 조회")
	@GetMapping("/api/v1/resource/categories")
	public ResponseEntity<Object> getCategoryList(CategorySearchVo searchVo) {

		log.debug(searchVo.toString());
		return makeResponseEntity(categoryService.getCategoryList(searchVo));
	}

	/** 카테고리 상세 조회 */
	@Operation(summary="카테고리 상세 조회")
	@GetMapping("/api/v1/resource/categories/{ctgryId}")
	public ResponseEntity<Object> getCategory(
			@Parameter(name="ctgryId", description="카테고리ID") @PathVariable String ctgryId) {

		CategoryVo vo = categoryService.getCategory(ctgryId);
		if (vo == null) throw new ResNotFoundException("카테고리 데이터가 존재하지 않습니다.");

		return makeResponseEntity(vo);
	}

	/** 카테고리 등록 */
	@Operation(summary="카테고리 등록")
	@PostMapping("/api/v1/resource/categories")
	public ResponseEntity<Object> createCategory(@RequestBody CategoryVo categoryVo) {

		log.debug(categoryVo.toString());
		String newId = categoryService.createCategory(categoryVo);
		return makeResponseEntity(new ResultIdVo(newId), HttpStatus.CREATED, "/api/v1/resource/category/" + newId);
	}

	/** 카테고리 수정 */
	@Operation(summary="카테고리 수정")
	@PutMapping("/api/v1/resource/categories/{ctgryId}")
	public ResponseEntity<Object> modifyCategory(
			@Parameter(name="ctgryId", description="카테고리ID") @PathVariable String ctgryId, @RequestBody CategoryVo categoryVo) {

		log.debug(categoryVo.toString());
		compareUniqueId(ctgryId, categoryVo.getCtgryId());
		categoryService.modifyCategory(categoryVo);
		return makeResponseEntity(new ResultIdVo(ctgryId));
	}

	/** 카테고리 삭제 */
	@Operation(summary="카테고리 삭제")
	@DeleteMapping("/api/v1/resource/categories/{ctgryId}")
	public ResponseEntity<Object> deleteCategory(@PathVariable String ctgryId) {

		categoryService.deleteCategory(ctgryId);
		return makeResponseEntity(null, HttpStatus.NO_CONTENT);
	}

	/** 카테고리 RDF 개념 명 중복 조회 */
	@Operation(summary="카테고리 RDF 개념 명 중복 조회")
	@GetMapping("/api/v1/resource/categories/check")
	public ResponseEntity<Object> isNmDuplicated(
			@Parameter(name="ctgryRdfCncptNm", description="카테고리 RDF 개념 명") @RequestParam String ctgryRdfCncptNm,
            @Parameter(name="ctgryId", description="카테고리ID") @RequestParam String ctgryId) {
		return makeResponseEntity(categoryService.isCtgryRdfCncptNmExist(ctgryRdfCncptNm, ctgryId));
	}

}
