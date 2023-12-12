package kr.co.n2m.platform.meta.rdf.schema.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;
import kr.co.n2m.platform.meta.rdf.schema.service.RdfSchemaService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;

@Tag(name = "RDF Schema")
@RestController
public class RdfSchemaController extends ResponseComponent {
	
	@Autowired
	MetadataSetService metadataSetService;
	
	@Autowired
	private RdfSchemaService rdfSchemaService;
	
	/**
	 * ketidt의 RDF Class, RDF Property 정보를 Turtle로 변환하여 조회
	 * @Author      : tklee
	 * @Date        : 2023. 10. 30.
	 * @return
	 */	
	@Operation(summary="TODO ketidt의 RDF Class, RDF Property 정보를 Turtle로 변환하여 조회 (우선 권한 체크안하고 공개)")
    @GetMapping("/api/v1/public/ns/ttl")
    public ResponseEntity<Object> getRdfNsTtlStr() {
        return makeResponseEntity(rdfSchemaService.getRdfNsTtlStr(), HttpStatus.OK);
    }
	
	/**
	 * 카테고리 정보를 Turtle로 변환하여 조회 (ketidtskos)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 13.
	 * @return
	 */	
	@Operation(summary="TODO 카테고리 정보를 Turtle로 변환하여 조회 (ketidtskos) (우선 권한 체크안하고 공개)")
    @GetMapping("/api/v1/public/skos/ttl")
    public ResponseEntity<Object> getRdfSkosTtlStr() {
        return makeResponseEntity(rdfSchemaService.getRdfSkosTtlStr(), HttpStatus.OK);
    }
	
}
