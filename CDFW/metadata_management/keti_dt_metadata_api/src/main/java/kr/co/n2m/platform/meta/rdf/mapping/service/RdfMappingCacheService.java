package kr.co.n2m.platform.meta.rdf.mapping.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.geosparql.implementation.vocabulary.GeoSPARQL_URI;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.XSD;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleDto;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingVo;
import kr.co.n2m.platform.meta.rdf.mapping.mapper.RdfMappingMapper;
import kr.co.n2m.platform.meta.rdf.mapping.mapper.RdfMappingRuleMapper;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * RDF 모델을 위한 RDF 매핑 Cache
 * 
 * @author n2m
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RdfMappingCacheService {

    private final RdfMappingMapper rdfMappingMapper;

    private final RdfMappingRuleMapper rdfMappingRuleMapper;
    
    private final DtmetaProperty dtmetaProperty;


    /************************** RDF 매핑 캐시 서비스 (by rdfMappgId)**************************/

    @Cacheable(cacheNames = "rdfMapping", key = "#rdfMappgId", unless = "#result == null")
    public RdfMappingVo getRdfMapping(String rdfMappgId) {
        long startMillis = System.currentTimeMillis();
        log.info(">>>>>>>>>> Call rdfMapping");
        RdfMappingVo vo = null;
        
        try {
	        if (StringUtils.isBlank(rdfMappgId)) throw new ResBadRequestException("rdfMappgId 값은 필수입니다.");

            RdfMappingVo rdfMappingVo = new RdfMappingVo();
            rdfMappingVo.setRdfMappgId(rdfMappgId);
            vo = rdfMappingMapper.selectRdfMapping(rdfMappingVo);
        } catch (Exception e) {
			log.error("rdfMapping DB 조회 실패!", e);
			throw e;
        }
        
        log.info(">>>>>>>>>> rdfMapping");
        log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis) + "ms");
        return vo;
    }

    /**
     * cache key(rdfMappgId)를 통해 Cache에 저장된 RDF 매핑 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfMapping", key = "#rdfMappgId")
    public void removeRdfMapping(String rdfMappgId) {
        log.info("Remove Cache Rdf Mapping. : " + rdfMappgId);
    }

    /**
     * Cache에 저장된 RDF 매핑 전체 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfMapping", allEntries = true)
    public void removeAllRdfMapping() {
        log.info("Remove Cache All Rdf Mapping.");
    }


    /************************** RDF 매핑 캐시 서비스 (by key)**************************/

    public String getRdfMappingKey(String rdfFormMtcd, String typeModelId) {
        if (StringUtils.isEmpty(rdfFormMtcd) || StringUtils.isEmpty(typeModelId)) {
            throw new ResBadRequestException("rdfFormMtcd 또는 typeModelId가 null입니다.");
        }
        return rdfFormMtcd + ':' + typeModelId;
    }    

    /**
     * cache key를 통해 RDF 매핑을 Cache에 저장
     *
     * @Date : 2023. 09. 07.
     */
    @Cacheable(cacheNames = "rdfMappingBySearching", key = "#key", unless = "#result == null")
    public RdfMappingVo getRdfMappingBySearching(String key) {
        long startMillis = System.currentTimeMillis();
        log.info(">>>>>>>>>> Call rdfMappingBySearching");
        RdfMappingVo rdfMapping = null;
        
        try {
            RdfMappingSearchVo searchVo = new RdfMappingSearchVo();
            searchVo.setRdfMappgDataSttusMtcd("use");
            searchVo.setRdfFormMtcd(key.substring(0, key.indexOf(":")));
            searchVo.setTypeModelId(key.substring(key.indexOf(":") + 1));
            List<RdfMappingVo> list = rdfMappingMapper.selectRdfMappingList(searchVo); // 1건 나와야 정상.
            rdfMapping = list != null ? list.get(0) : null;
        } catch (Exception e) {
            log.error("rdfMappingBySearching DB 조회 실패!", e);
            throw e;
        }
        
        log.info(">>>>>>>>>> rdfMappingBySearching");
        log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis) + "ms");
        return rdfMapping;
    }

    /**
     * cache key를 통해 Cache에 저장된 RDF 매핑 삭제
     *
     * @Date : 2023. 09. 07.
     */
    @CacheEvict(cacheNames = "rdfMappingBySearching", key = "#key")
    public void removeRdfMappingBySearching(String key) {
        log.info("Remove Cache Rdf Mapping By Searching. : " + key);
    }

    /**
     * Cache에 저장된 RDF 매핑 전체 삭제
     *
     * @Date : 2023. 09. 07.
     */
    @CacheEvict(cacheNames = "rdfMappingBySearching", allEntries = true)
    public void removeAllRdfMappingBySearching() {
        log.info("Remove Cache All Rdf Mapping By Searching.");
    }

    /************************** RDF 매핑 모델 캐시 서비스 **************************/

    /**
     * cache key(rdfMappgId)를 통해 RDF 매핑 모델을 Cache에 저장
     *
     * @Date : 2023. 09. 11.
     */
    @Cacheable(cacheNames = "rdfMappingModelList", key = "#rdfMappgId", unless = "#result == null")
    public List<RdfMappingModelVo> getRdfMappingModelList(String rdfMappgId) {
        long startMillis = System.currentTimeMillis();
        log.info(">>>>>>>>>> Call rdfMappingModelList");
        List<RdfMappingModelVo> list = null;
        
        try {
            RdfMappingModelSearchVo searchVo = new RdfMappingModelSearchVo();
            searchVo.setRdfMappgId(rdfMappgId);
            list = rdfMappingMapper.selectRdfMappingModelList(searchVo);
        } catch (Exception e) {
            log.error("rdfMappingModelList DB 조회 실패!", e);
            throw e;
        }
        
        log.info(">>>>>>>>>> rdfMappingModelList");
        log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis) + "ms");
        return list;
    }

    /**
     * cache key를 통해 Cache에 저장된 RDF 매핑 모델 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfMappingModelList", key = "#rdfMappgId")
    public void removeRdfMappingModelList(String rdfMappgId) {
        log.info("Remove Cache Rdf Mapping Model List. : " + rdfMappgId);
    }

    /**
     * Cache에 저장된 RDF 매핑 모델 전체 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfMappingModelList", allEntries = true)
    public void removeAllRdfMappingModelList() {
        log.info("Remove Cache All Rdf Mapping Model List.");
    }

    /************************** RDF 매핑 규칙 캐시 서비스 **************************/

    /**
     * cache key(rdfMappgModelId)를 통해 RDF 매핑 규칙을 Cache에 저장
     *
     * @Date : 2023. 09. 11.
     */
    @Cacheable(cacheNames = "rdfMappingRuleList", key = "#rdfMappgModelId", unless = "#result == null")
    public List<RdfMappingRuleDto> getRdfMappingRuleList(String rdfMappgModelId) {
        long startMillis = System.currentTimeMillis();
        log.info(">>>>>>>>>> Call rdfMappingRuleList");
        List<RdfMappingRuleDto> list = null;
        
        try {
            RdfMappingRuleSearchVo searchVo = new RdfMappingRuleSearchVo();
            searchVo.setRdfMappgModelId(rdfMappgModelId);
            list = rdfMappingRuleMapper.selectRdfMappingRuleListByRdfModelId(searchVo);
        } catch (Exception e) {
            log.error("rdfMappingRuleList DB 조회 실패!", e);
            throw e;
        }
        
        log.info(">>>>>>>>>> rdfMappingRuleList");
        log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis) + "ms");
        return list;
    }

    /**
     * cache key를 통해 Cache에 저장된 RDF 매핑 규칙 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfMappingRuleList", key = "#rdfMappgModelId")
    public void removeRdfMappingRuleList(String rdfMappgModelId) {
        log.info("Remove Cache Rdf Mapping Rule List. : " + rdfMappgModelId);
    }

    /**
     * Cache에 저장된 RDF 매핑 규칙 전체 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfMappingRuleList", allEntries = true)
    public void removeAllRdfMappingRuleList() {
        log.info("Remove Cache All Rdf Mapping Rule List.");
    }

    /************************** RDF 네임스페이스 캐시 서비스 (by rdfMappgModelId)**************************/

    /**
     * cache key(rdfMappgModelId)를 통해 RDF 네임스페이스를 Cache에 저장
     *
     * @param rdfMappgModelId
     * @return
     */
    @Cacheable(cacheNames = "rdfNamespaceListByRdfModelId", key = "#rdfMappgModelId", unless = "#result == null")
    public List<RdfNamespaceVo> getRdfNamespaceListByRdfModelId(String rdfMappgModelId) {
        long startMillis = System.currentTimeMillis();
        log.info(">>>>>>>>>> Call rdfNamespaceListByRdfModelId");
        List<RdfNamespaceVo> nsList = null;
        
        try {
	        // 모델에 네임스페이스 PREFIX 설정
	        List<String> defNsList = new ArrayList<>();
	        defNsList.add(RDF.getURI());
	        defNsList.add(XSD.getURI());
	        defNsList.add(GeoSPARQL_URI.GEO_URI);
	        if (StringUtils.isNotBlank(dtmetaProperty.getRdfSchemaBaseUrl())) defNsList.add(dtmetaProperty.getRdfSchemaBaseUrl());
	        if (StringUtils.isNotBlank(dtmetaProperty.getRdfSchemaSkosUrl())) defNsList.add(dtmetaProperty.getRdfSchemaSkosUrl());
	        if (StringUtils.isNotBlank(dtmetaProperty.getResourceBaseUrl())) defNsList.add(dtmetaProperty.getResourceBaseUrl());
	        if (StringUtils.isNotBlank(dtmetaProperty.getResourceDataUrl())) defNsList.add(dtmetaProperty.getResourceDataUrl());
	        
	        RdfMappingRuleSearchVo searchVo = new RdfMappingRuleSearchVo();
	        searchVo.setRdfMappgModelId(rdfMappgModelId);
	        searchVo.setDefaultNamespaceUriList(defNsList);
	        nsList = rdfMappingRuleMapper.selectRdfNamespaceListByRdfModelId(searchVo);
        } catch (Exception e) {
            log.error("rdfNamespaceListByRdfModelId DB 조회 실패!", e);
            throw e;
        }
        
        log.info(">>>>>>>>>> rdfNamespaceListByRdfModelId");
        log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis) + "ms");
        return nsList;
    }

    /**
     * cache key(rdfMappgModelId)를 통해 Cache에 저장된 RDF 네임스페이스 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfNamespaceListByRdfModelId", key = "#rdfMappgModelId")
    public void removeRdfNamespaceList(String rdfMappgModelId) {
        log.info("Remove Cache Rdf Namespace List By RDF Mapping Model. : " + rdfMappgModelId);
    }

    /**
     * Cache에 저장된 RDF 매핑 네임스페이스 전체 삭제
     *
     * @Date : 2023. 09. 11.
     */
    @CacheEvict(cacheNames = "rdfNamespaceListByRdfModelId", allEntries = true)
    public void removeAllRdfNamespaceList() {
        log.info("Remove Cache All Rdf Namespace List By RDF Mapping Model.");
    }

}