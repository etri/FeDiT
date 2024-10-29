package kr.co.n2m.platform.meta.rdf.property.controller;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineSearchVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertySearchVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyVo;
import kr.co.n2m.platform.meta.rdf.property.service.RdfPropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "RDF 프라퍼티", description = "RDF 프라퍼티 API")
@Slf4j
@RestController
@RequiredArgsConstructor
public class RdfPropertyController extends ResponseComponent {
    private final RdfPropertyService rdfPropertyService;

    /** RDF 프라퍼티 목록 조회 */
    @Operation(summary = "RDF 프라퍼티 목록 조회")
    @GetMapping("/api/v1/rdf/properties")
    public ResponseEntity<Object> getRdfPropertyList(RdfPropertySearchVo searchVo) {
        return makeResponseEntity(rdfPropertyService.getRdfPropertyList(searchVo), HttpStatus.OK);
    }

    /** RDF 프라퍼티 상세 조회 */
    @Operation(summary = "RDF 프라퍼티 상세 조회")
    @GetMapping("/api/v1/rdf/properties/{rdfPrptyId}")
    public ResponseEntity<Object> getRdfProperty(@PathVariable String rdfPrptyId) {
    	RdfPropertyVo vo = rdfPropertyService.getRdfPropertyDetail(rdfPrptyId);
    	if (vo == null) throw new ResNotFoundException("RDF 프라퍼티가 존재하지 않습니다.");
        return makeResponseEntity(vo);
    }

    /** RDF 프라퍼티 등록 */
    @Operation(summary="RDF 프라퍼티 등록")
    @PostMapping("/api/v1/rdf/properties")
    public ResponseEntity<Object> createRdfProperty(@RequestBody RdfPropertyVo rdfPropertyVo){
        String rdfPrptyId = rdfPropertyService.createRdfProperty(rdfPropertyVo);
        return makeResponseEntity(new ResultIdVo(rdfPrptyId), HttpStatus.CREATED, "/api/v1/rdf/properties/" + rdfPrptyId);
    }

    /** RDF 프라퍼티 수정 */
    @Operation(summary="RDF 프라퍼티 수정")
    @PutMapping("/api/v1/rdf/properties/{rdfPrptyId}")
    public ResponseEntity<Object> modifyRdfProperty(@PathVariable String rdfPrptyId, @RequestBody RdfPropertyVo rdfPropertyVo) {
        rdfPropertyService.modifyRdfProperty(rdfPropertyVo);
        return makeResponseEntity(new ResultIdVo(rdfPrptyId));
    }

    /** RDF 프라퍼티 삭제 */
    @Operation(summary="RDF 프라퍼티 삭제")
    @DeleteMapping("/api/v1/rdf/properties/{rdfPrptyId}")
    public ResponseEntity<Object> deleteRdfProperty(@PathVariable String rdfPrptyId) {
        rdfPropertyService.deleteRdfProperty(rdfPrptyId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }

     /*************************************************** RDF 프라퍼티 정의 **********************************************************/

    /** RDF 프라퍼티 정의 목록 조회 */
    @Operation(summary = "RDF 프라퍼티 정의 목록 조회")
    @GetMapping("/api/v1/rdf/propertydefines")
    public ResponseEntity<Object> getRdfPropertyDefineList(RdfPropertyDefineSearchVo searchVo) {
        return makeResponseEntity(rdfPropertyService.getRdfPropertyDefineList(searchVo), HttpStatus.OK);
    }

     /** RDF 프라퍼티 정의 등록 */
    @Operation(summary="RDF 프라퍼티 정의 등록 (Multi)")
    @PostMapping("/api/v1/rdf/propertydefines")
    public ResponseEntity<Object> createRdfPropertyDefine(@RequestBody List<RdfPropertyDefineVo> list){
        List<String> result = rdfPropertyService.createRdfPropertyDefine(list);
        return makeResponseEntity(result, HttpStatus.CREATED, "/api/v1/rdf/propertydefines");
    }

    /** RDF 프라퍼티 정의 삭제 */
    @Operation(summary="RDF 프라퍼티 정의 삭제 (Multi)")
    @DeleteMapping("/api/v1/rdf/propertydefines")
    public ResponseEntity<Object> deleteRdfPropertyDefine(@RequestParam("id") List<String> list){
        rdfPropertyService.deleteRdfPropertyDefine(list);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
}