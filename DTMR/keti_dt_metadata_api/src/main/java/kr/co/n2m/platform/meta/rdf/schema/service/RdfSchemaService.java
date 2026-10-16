package kr.co.n2m.platform.meta.rdf.schema.service;

import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.geosparql.implementation.vocabulary.GeoSPARQL_URI;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.vocabulary.OWL;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.apache.jena.vocabulary.SKOS;
import org.apache.jena.vocabulary.XSD;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.mapper.RdfMappingRuleMapper;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineDto;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDefineSearchVo;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertyDto;
import kr.co.n2m.platform.meta.rdf.property.domain.RdfPropertySearchVo;
import kr.co.n2m.platform.meta.rdf.property.mapper.RdfPropertyMapper;
import kr.co.n2m.platform.meta.rdf.property.service.RdfPropertyService;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassDto;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassSearchVo;
import kr.co.n2m.platform.meta.rdf.rdfclass.mapper.RdfClassMapper;
import kr.co.n2m.platform.meta.resource.category.domain.CategorySearchVo;
import kr.co.n2m.platform.meta.resource.category.domain.CategoryVo;
import kr.co.n2m.platform.meta.resource.category.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "rdbTransactionManager")
public class RdfSchemaService {

    private final RdfClassMapper rdfClassMapper;
    
    private final RdfPropertyMapper rdfPropertyMapper;
    
	private final RdfMappingRuleMapper rdfMappingRuleMapper;
	
	private final CategoryMapper categoryMapper;
	
	private final RdfPropertyService rdfPropertyService;
	
	private final DtmetaProperty dtmetaProperty;
	

	public Model createRdfNsTtlModel() {
		String ketidtNs = dtmetaProperty.getRdfSchemaBaseUrl();
    	String rdfNsId = "";
    	
    	List<RdfNamespaceVo> nsList = null;
    	
    	// 메모리 GRAPH (모델) 생성
    	Model model = ModelFactory.createDefaultModel();
    	// 모델에 네임스페이스 PREFIX 설정
        List<String> defNsList = new ArrayList<>();
        defNsList.add(RDF.getURI());
        defNsList.add(XSD.getURI());
        defNsList.add(GeoSPARQL_URI.GEO_URI);
        defNsList.add(OWL.getURI());
        if (StringUtils.isNotBlank(dtmetaProperty.getRdfSchemaBaseUrl())) defNsList.add(dtmetaProperty.getRdfSchemaBaseUrl());
        if (StringUtils.isNotBlank(dtmetaProperty.getRdfSchemaSkosUrl())) defNsList.add(dtmetaProperty.getRdfSchemaSkosUrl());
        if (StringUtils.isNotBlank(dtmetaProperty.getResourceBaseUrl())) defNsList.add(dtmetaProperty.getResourceBaseUrl());
        if (StringUtils.isNotBlank(dtmetaProperty.getResourceDataUrl())) defNsList.add(dtmetaProperty.getResourceDataUrl());
        
        RdfMappingRuleSearchVo searchVo = new RdfMappingRuleSearchVo();
        searchVo.setDefaultNamespaceUriList(defNsList);
        nsList = rdfMappingRuleMapper.selectRdfNamespaceListByRdfModelId(searchVo);
		if (nsList != null && nsList.size() > 0) {
			for (RdfNamespaceVo nsVo : nsList) {
				String rdfPrefix = nsVo.getRdfNmspPfix();
		        String rdfUri = nsVo.getRdfNmspUri();
	            model.setNsPrefix(rdfPrefix, rdfUri);
		        if (ketidtNs.equals(rdfUri)) {
		            rdfNsId = nsVo.getRdfNmspId();
		         }
			}
		}
		
		if(StringUtils.isNotEmpty(rdfNsId)) {
			// ketidt class 조회
			RdfClassSearchVo rdfClassSearchVo = new RdfClassSearchVo();
			rdfClassSearchVo.setRdfNmspId(rdfNsId);
			rdfClassSearchVo.setIsPaging(false);
			List<RdfClassDto> classList = rdfClassMapper.selectRdfClassList(rdfClassSearchVo);
			
			// ketidt property 조회
			RdfPropertySearchVo rdfPropertySearchVo = new RdfPropertySearchVo();
			rdfPropertySearchVo.setRdfNmspId(rdfNsId);
			rdfPropertySearchVo.setIsPaging(false);
			List<RdfPropertyDto> propertyList = rdfPropertyMapper.selectRdfPropertyList(rdfPropertySearchVo);
			
			
			for(int i=0; i<classList.size(); i++) {
				Resource resource = model.createResource(ketidtNs + classList.get(i).getRdfClassNm())
						.addProperty(RDF.type, OWL.Class)
						.addProperty(RDFS.label, model.createLiteral(classList.get(i).getRdfClassLogicNm(), "ko"));
				
				if (!StringUtils.isEmpty(classList.get(i).getRdfClassDesc())) {
					resource.addProperty(RDFS.comment, model.createLiteral(classList.get(i).getRdfClassDesc(), "ko"));
				}
				
				if (!StringUtils.isEmpty(classList.get(i).getUpRdfClassNm())) {
					resource.addProperty(RDFS.subClassOf, model.createResource(ketidtNs + classList.get(i).getUpRdfClassNm()));
				}
			}
			
			for(int i=0; i<propertyList.size(); i++) {
				Resource resource = model.createResource(ketidtNs + propertyList.get(i).getRdfPrptyNm())
						.addProperty(RDFS.label, model.createLiteral(propertyList.get(i).getRdfPrptyLogicNm(), "ko"));
				
				if (!StringUtils.isEmpty(propertyList.get(i).getRdfPrptyDesc())) {
					resource.addProperty(RDFS.comment, model.createLiteral(propertyList.get(i).getRdfPrptyDesc(), "ko"));
				}
				
				// TODO sub property of 를 하기가 쉽지 않을듯...
//				if (!StringUtils.isEmpty(propertyList.get(i).getUpRdfPrpty())) {
//					resource.addProperty(RDFS.subPropertyOf, ????));
//				}
				
				RdfPropertyDefineSearchVo rdfPropertyDefineSearchVo = new RdfPropertyDefineSearchVo();
				rdfPropertyDefineSearchVo.setRdfPrptyId(propertyList.get(i).getRdfPrptyId());
				rdfPropertyDefineSearchVo.setDomnRangeDivMtcd("range");
				SearchResultListVo rdfPropertyDefineResultVo = rdfPropertyService.getRdfPropertyDefineList(rdfPropertyDefineSearchVo);
				int dataTypeCnt = 0;
				for(int j=0; j<rdfPropertyDefineResultVo.getList().size(); j++) {
					RdfPropertyDefineDto dto = (RdfPropertyDefineDto) rdfPropertyDefineResultVo.getList().get(j);
					String rdfRange = dto.getRdfClass();
					resource.addProperty(RDFS.range, model.createResource(rdfRange));
					if("rdfs:Literal".equals(rdfRange)) {
						resource.addProperty(RDF.type, OWL.DatatypeProperty);
						dataTypeCnt++;
					}
				}
				if(dataTypeCnt == 0) {
					resource.addProperty(RDF.type, OWL.ObjectProperty);
				}
				
				rdfPropertyDefineSearchVo.setDomnRangeDivMtcd("domain");
				rdfPropertyDefineResultVo = rdfPropertyService.getRdfPropertyDefineList(rdfPropertyDefineSearchVo);
				for(int j=0; j<rdfPropertyDefineResultVo.getList().size(); j++) {
					RdfPropertyDefineDto dto = (RdfPropertyDefineDto) rdfPropertyDefineResultVo.getList().get(j);
					String rdfDomain = dto.getRdfClass();
					resource.addProperty(RDFS.domain, model.createResource(rdfDomain));
				}
			}
		}
		
		return model;
	}
    
    /**
     * ketidt의 RDF Class, RDF Property 정보를 Turtle로 변환하여 조회
     *
     * @return
     * @Author : tklee
     * @Date : 2023. 10. 30.
     */
	public String getRdfNsTtlStr() {
        log.debug("[ketidt의 RDF Class, RDF Property 정보를 Turtle로 변환하여 조회] 서비스 시작");
        
        String rdfStr = "";
        
        try {
        	
    		Model model = createRdfNsTtlModel();
    		StringWriter stringWriter = new StringWriter();
    		model.write(stringWriter, "TTL");
    		rdfStr = stringWriter.toString();
        	
        } catch (Exception e) {
            log.error("[ketidt의 RDF Class, RDF Property 정보를 Turtle로 변환하여 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[ketidt의 RDF Class, RDF Property 정보를 Turtle로 변환하여 조회] 서비스 종료");
        return rdfStr;
    }
	
	
	
	
	
	
	
	public Model createRdfSkosTtlModel() {
		String ketidtSkos = dtmetaProperty.getRdfSchemaSkosUrl();
    	
    	List<RdfNamespaceVo> nsList = null;
    	
    	// 메모리 GRAPH (모델) 생성
    	Model model = ModelFactory.createDefaultModel();
    	// 모델에 네임스페이스 PREFIX 설정
        List<String> defNsList = new ArrayList<>();
        defNsList.add(RDF.getURI());
        defNsList.add(XSD.getURI());
        defNsList.add(GeoSPARQL_URI.GEO_URI);
        defNsList.add(SKOS.getURI());
        if (StringUtils.isNotBlank(dtmetaProperty.getRdfSchemaBaseUrl())) defNsList.add(dtmetaProperty.getRdfSchemaBaseUrl());
        if (StringUtils.isNotBlank(dtmetaProperty.getRdfSchemaSkosUrl())) defNsList.add(dtmetaProperty.getRdfSchemaSkosUrl());
        if (StringUtils.isNotBlank(dtmetaProperty.getResourceBaseUrl())) defNsList.add(dtmetaProperty.getResourceBaseUrl());
        if (StringUtils.isNotBlank(dtmetaProperty.getResourceDataUrl())) defNsList.add(dtmetaProperty.getResourceDataUrl());
        
        RdfMappingRuleSearchVo searchVo = new RdfMappingRuleSearchVo();
        searchVo.setDefaultNamespaceUriList(defNsList);
        nsList = rdfMappingRuleMapper.selectRdfNamespaceListByRdfModelId(searchVo);
		if (nsList != null && nsList.size() > 0) {
			for (RdfNamespaceVo nsVo : nsList) {
				String rdfPrefix = nsVo.getRdfNmspPfix();
		        String rdfUri = nsVo.getRdfNmspUri();
	            model.setNsPrefix(rdfPrefix, rdfUri);
			}
		}
		
		CategorySearchVo categorySearchVo = new CategorySearchVo();
		categorySearchVo.setIsPaging(false);
		List<CategoryVo> categoryList = categoryMapper.selectCategoryList(categorySearchVo);
		
		for(int i=0; i<categoryList.size(); i++) {
			Resource resource = model.createResource(ketidtSkos + categoryList.get(i).getCtgryRdfCncptNm())
									 .addProperty(RDF.type, SKOS.Concept);
			
			if(!StringUtils.isEmpty(categoryList.get(i).getCtgryNm())) {				
				resource.addProperty(SKOS.prefLabel, model.createLiteral(categoryList.get(i).getCtgryNm(), "ko"));
			}
			if(!StringUtils.isEmpty(categoryList.get(i).getCtgryEngNm())) {				
				resource.addProperty(SKOS.prefLabel, model.createLiteral(categoryList.get(i).getCtgryEngNm(), "en"));
			}
			if(!StringUtils.isEmpty(categoryList.get(i).getCtgryDesc())) {
				resource.addProperty(SKOS.definition, model.createLiteral(categoryList.get(i).getCtgryDesc(), "ko"));
			}
			if(!StringUtils.isEmpty(categoryList.get(i).getCtgryEngDesc())) {				
				resource.addProperty(SKOS.definition, model.createLiteral(categoryList.get(i).getCtgryEngDesc(), "en"));
			}
			if(!StringUtils.isEmpty(categoryList.get(i).getUpCtgryId())) {				
				CategoryVo paramVo = new CategoryVo();
				paramVo.setCtgryId(categoryList.get(i).getUpCtgryId());
				CategoryVo vo = categoryMapper.selectCategory(paramVo);
				resource.addProperty(SKOS.broader, model.createResource(ketidtSkos + vo.getCtgryRdfCncptNm()));
			}
		}
		
		return model;
	}
	
	/**
     * 카테고리 정보를 Turtle로 변환하여 조회 (ketidtskos)
     *
     * @return
     * @Author : tklee
     * @Date : 2023. 11. 13.
     */
	public String getRdfSkosTtlStr() {
        log.debug("[카테고리 정보를 Turtle로 변환하여 조회 (ketidtskos)] 서비스 시작");
        
        String rdfStr = "";
        
        try {
        	
    		Model model = createRdfSkosTtlModel();
    		StringWriter stringWriter = new StringWriter();
    		model.write(stringWriter, "TTL");
    		rdfStr = stringWriter.toString();
        	
        } catch (Exception e) {
            log.error("[카테고리 정보를 Turtle로 변환하여 조회 (ketidtskos)] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[카테고리 정보를 Turtle로 변환하여 조회 (ketidtskos)] 서비스 종료");
        return rdfStr;
    }
}