package kr.co.n2m.platform.meta.rdf.rdfclass.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineSearchVo;
import kr.co.n2m.platform.meta.rdf.property.service.RdfPropertyService;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassSearchVo;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassVo;
import kr.co.n2m.platform.meta.rdf.rdfclass.service.RdfClassService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "RDF 클래스", description = "RDF 클래스 API")
@Slf4j
@RestController
@RequiredArgsConstructor
public class RdfClassController extends ResponseComponent {

    private final RdfClassService rdfClassService;

    private final RdfPropertyService rdfPropertyService;


    /** RDF 클래스 목록 조회 */
    @Operation(summary = "RDF 클래스 목록 조회")
    @GetMapping("/api/v1/rdf/classes")
    public ResponseEntity<Object> getRdfClassList(RdfClassSearchVo searchVo) {
        return makeResponseEntity(rdfClassService.getRdfClassList(searchVo), HttpStatus.OK);
    }

    /** RDF 클래스 상세 조회 */
    @Operation(summary="RDF 클래스 상세 조회")
    @GetMapping("/api/v1/rdf/classes/{rdfClassId}")
    public ResponseEntity<Object> getRdfClassDetail(@PathVariable String rdfClassId) {
    	RdfClassVo rdfClassVo = rdfClassService.getRdfClassDetail(rdfClassId);
    	if (rdfClassVo == null) throw new ResNotFoundException("RDF 클래스가 존재하지 않습니다.");
        return makeResponseEntity(rdfClassVo);
    }

    /** RDF 클래스 등록 */
    @Operation(summary="RDF 클래스 등록")
    @PostMapping("/api/v1/rdf/classes")
    public ResponseEntity<Object> createRdfClass(@RequestBody RdfClassVo rdfClassVo){
        String rdfClassId = rdfClassService.createRdfClass(rdfClassVo);
        return makeResponseEntity(new ResultIdVo(rdfClassId), HttpStatus.CREATED, "/api/v1/rdf/classes/" + rdfClassId);
    }

    /** RDF 클래스 수정 */
    @Operation(summary="RDF 클래스 수정")
    @PutMapping("/api/v1/rdf/classes/{rdfClassId}")
    public ResponseEntity<Object> modifyRdfClass(@PathVariable String rdfClassId, @RequestBody RdfClassVo rdfClassVo) {
        rdfClassService.modifyRdfClass(rdfClassVo);
        return makeResponseEntity(new ResultIdVo(rdfClassId));
    }

    /** RDF 클래스 삭제 */
    @Operation(summary="RDF 클래스 삭제")
    @DeleteMapping("/api/v1/rdf/classes/{rdfClassId}")
    public ResponseEntity<Object> deleteRdfClass(@PathVariable String rdfClassId) {
        rdfClassService.deleteRdfClass(rdfClassId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }

    /** RDF 클래스에 대한 RDF 프라퍼티 목록 조회 */
    @Operation(summary = "RDF 클래스에 대한 RDF 프라퍼티 목록 조회")
    @GetMapping("/api/v1/rdf/classes/{rdfClassId}/properties")
    public ResponseEntity<Object> getRdfPropertyListByRdfClassId(@PathVariable String rdfClassId, RdfPropertyDefineSearchVo searchVo) {
    	searchVo.setRdfClassId(rdfClassId);
    	searchVo.setDomnRangeDivMtcd("domain");
        return makeResponseEntity(rdfPropertyService.getRdfPropertyDefineList(searchVo), HttpStatus.OK);
    }
    
}