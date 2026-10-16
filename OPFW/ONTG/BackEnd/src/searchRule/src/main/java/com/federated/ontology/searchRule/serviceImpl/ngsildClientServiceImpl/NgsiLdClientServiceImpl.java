package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import com.federated.ontology.searchRule.component.OwlGenerator;
import com.federated.ontology.searchRule.dto.kafkaDto.InitResultDto;
import com.federated.ontology.searchRule.dto.relationshipDto.TokenDicCache;
import com.federated.ontology.searchRule.neo4j.sync.CypherBulkSyncService;
import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import com.federated.ontology.searchRule.service.ngsildClientService.NgsildClientService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;

@Slf4j
@Service
public class NgsiLdClientServiceImpl implements NgsildClientService {

    private final NgsiLdBrokerClient brokerClient;
    private final NgsiLdTokenLoader tokenLoader;
    private final NgsiLdTwinDataSource twinDataSource;
    private final NgsiLdEntityBuilder entityBuilder;
    private final NgsiLdOntologyService ontologyService;
    private final NgsiLdKeywordGraphService keywordGraphService;
    private final OwlGenerator owlGenerator;
    private final CypherBulkSyncService cypherBulkSyncService;
    private final Neo4jRepositoryHolder neo4jRepos;

    private static final String OUTPUT_DIR = "output";
    private static final DateTimeFormatter FILE_NAME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd_HHmm");

    @Value("${setInit.dataSource:http}")
    private String dataSourceType;

    public NgsiLdClientServiceImpl(NgsiLdBrokerClient brokerClient,
                                   NgsiLdTokenLoader tokenLoader,
                                   NgsiLdTwinDataSource twinDataSource,
                                   NgsiLdEntityBuilder entityBuilder,
                                   NgsiLdOntologyService ontologyService,
                                   NgsiLdKeywordGraphService keywordGraphService,
                                   OwlGenerator owlGenerator,
                                   CypherBulkSyncService cypherBulkSyncService,
                                   Neo4jRepositoryHolder neo4jRepos) {
        this.brokerClient = brokerClient;
        this.tokenLoader = tokenLoader;
        this.twinDataSource = twinDataSource;
        this.entityBuilder = entityBuilder;
        this.ontologyService = ontologyService;
        this.keywordGraphService = keywordGraphService;
        this.owlGenerator = owlGenerator;
        this.cypherBulkSyncService = cypherBulkSyncService;
        this.neo4jRepos = neo4jRepos;
    }

    public void init() {
        loadLocalTokens();
        try {
            keywordGraphService.buildKeywordGraphFromBroker();
            keywordGraphService.markInitialized();
            log.info("KeywordGraph init success.");
        } catch (Exception e) {
            log.error("KeywordGraph 초기화 실패", e);
        }
    }

    @Override
    public void saveNgsiLdEntity(String jsonEntity) {
        brokerClient.saveNgsiLdEntity(jsonEntity);
    }

    @Override
    @Async
    public void exportEntitiesToOwl() {
        try {
            log.info("OWL Export process started...");
            String json = brokerClient.getEntities();
            if (json == null || json.isEmpty()) {
                log.warn("No entities found from broker. Export cancelled.");
                return;
            }
            File directory = new File(OUTPUT_DIR);
            if (!directory.exists()) directory.mkdirs();

            String timestamp = LocalDateTime.now().format(FILE_NAME_FORMATTER);
            File outputFile = new File(directory, "all-entities-" + timestamp + ".ttl");
            owlGenerator.generate(json, outputFile);
            log.info("OWL Export completed: {}", outputFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to export entities to OWL", e);
        }
    }

    @Override
    public Map<String, Set<String>> loadLocalTokens() { return tokenLoader.loadLocalTokens(); }

    @Override
    public String getEntity(String entityId) { return brokerClient.getEntity(entityId); }

    @Override
    public String getEntities() { return brokerClient.getEntities(); }

    @Override
    public String deleteEntities() {
        cypherBulkSyncService.deleteAllNeo4j();

        return brokerClient.deleteEntities();
    }

    @Override
    public String updateEntity(Map<String, Object> metaInfo) {
        try {
            String twinId = entityBuilder.getStringField(metaInfo, "id", "UNKNOWN_ID");
            Map<String, Object> twinEntity = entityBuilder.buildDigitalTwinEntity(metaInfo, twinId);
            brokerClient.updateEntity(twinEntity, "DigitalTwin 업데이트 실패: " + twinId);
            return "SUCCESS";
        } catch (Exception e) {
            log.error("업데이트 처리 중 오류 발생: {}", metaInfo, e);
            return "FAIL";
        }
    }

    @Override
    public String updateDigitalTwinEntity(Map<String, Object> metadata, String key) {
        try {
            Map<String, Object> entity = entityBuilder.buildDigitalTwinEntityFromKafka(metadata, key);
            brokerClient.updateEntity(entity, "DigitalTwin 업데이트 실패: " + key);
            return "SUCCESS";
        } catch (Exception e) {
            log.error("DigitalTwin 업데이트 중 오류. key={}", key, e);
            return "FAIL";
        }
    }

    @Override
    public String updateDigitalObjectEntity(Map<String, Object> metadata, String key, String parentTwinId) {
        try {
            Map<String, Object> entity = entityBuilder.buildDigitalObjectEntityFromKafka(metadata, key, parentTwinId);
            brokerClient.updateEntity(entity, "DigitalObject 업데이트 실패: " + key);
            return "SUCCESS";
        } catch (Exception e) {
            log.error("DigitalObject 업데이트 중 오류. key={}", key, e);
            return "FAIL";
        }
    }

    @Override
    @Transactional("jpaTransactionManager")
    public InitResultDto setInit() {
        log.info("setInit 시작...");

        int twinCount = 0;
        int objectCount = 0;
        InitResultDto result = new InitResultDto();

        try {
            deleteEntities();
        } catch (Exception e) {
            log.error("Stellio 전체 삭제 실패", e);
            return InitResultDto.fail("Stellio 전체 삭제 실패: " + e.getMessage());
        }

        boolean useHttp = "http".equalsIgnoreCase(dataSourceType);
        List<Map<String, Object>> twinList = twinDataSource.loadDigitalTwins(useHttp);

        for (Map<String, Object> twin : twinList) {
            String twinId = entityBuilder.getStringField(twin, "digital_twin_id", "UNKNOWN_ID");

            try {
                Map<String, Object> twinEntity = entityBuilder.buildDigitalTwinEntity(twin, twinId);
                brokerClient.replaceEntity(twinEntity, "DigitalTwin JSON 직렬화 실패: " + twinEntity.get("id"));
                twinCount++;
            } catch (Exception e) {
                log.error("DigitalTwin Stellio 등록 실패. twinId={}", twinId, e);
                result.addError("DigitalTwin Stellio 실패: " + twinId + " - " + e.getMessage());
            }

            List<Map<String, Object>> twinObjectList = twinDataSource.loadDigitalObjects(useHttp, twinId);
            for (Map<String, Object> tObject : twinObjectList) {
                try {
                    Map<String, Object> objEntity = entityBuilder.buildDigitalObjectEntity(twin, tObject, twinId);
                    brokerClient.replaceEntity(objEntity, "DigitalObject JSON 직렬화 실패: " + objEntity.get("id"));
                    objectCount++;
                } catch (Exception e) {
                    String objId = entityBuilder.getStringField(tObject, "digital_object_id", "UNKNOWN");
                    log.error("DigitalObject Stellio 등록 실패. objId={}", objId, e);
                    result.addError("DigitalObject Stellio 실패: " + objId + " - " + e.getMessage());
                }
            }
        }

        log.info("Phase 1 완료. Stellio 적재: twin={}, object={}, errors={}",
                twinCount, objectCount, result.getErrors().size());

        int neo4jSyncCount = 0;
        try {
            neo4jSyncCount = cypherBulkSyncService.syncFromStellio();
            log.info("Phase 2 완료. Neo4j 저장: {}", neo4jSyncCount);
        } catch (Exception e) {
            log.error("Phase 2 실패. Stellio → Neo4j 동기화 중 오류", e);
            result.addError("Neo4j 동기화 실패: " + e.getMessage());
        }

        if (result.hasErrors()) {
            return InitResultDto.partial(twinCount, objectCount, neo4jSyncCount, result.getErrors());
        }
        return InitResultDto.success(twinCount, objectCount, neo4jSyncCount);
    }

    @Override
    @Transactional("jpaTransactionManager")
    public InitResultDto setOntologyInit() {
        log.info("Starting Ontology Initialization...");
        try {
            InitResultDto initResult = setInit();

            Map<String, Set<String>> tokens = prepareTokens();
            createTerms(tokens.get("subjects"), "SubjectTerm");
            createTerms(tokens.get("keywords"), "KeywordTerm");

            ontologyService.patchDigitalObjectsWithTerms();
            ontologyService.createDuplicateObjectNames();

            log.info("Ontology Initialization 완료. status={}", initResult.getStatus());
            return initResult;
        } catch (Exception e) {
            log.error("Critical error during ontology initialization", e);
            return InitResultDto.fail("온톨로지 초기화 실패: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> rawDataDownload() { return twinDataSource.rawDataDownload(); }

    @Override
    public List<Map<String, Object>> getHttpDigitalTwin() { return twinDataSource.getHttpDigitalTwin(); }

    @Override
    public List<Map<String, Object>> getFileIODigitalTwin() { return twinDataSource.getFileIODigitalTwin(); }

    @Override
    public List<Map<String, Object>> getHttpDigitalObject(String twinId) { return twinDataSource.getHttpDigitalObject(twinId); }

    @Override
    public List<Map<String, Object>> getFileIODigitalObject(String twinId) { return twinDataSource.getFileIODigitalObject(twinId); }

    private Map<String, Set<String>> prepareTokens() {
        Set<String> subjects = TokenDicCache.getSubjects();
        Set<String> keywords = TokenDicCache.getKeywords();
        if (CollectionUtils.isEmpty(subjects) && CollectionUtils.isEmpty(keywords)) {
            log.info("Cache is empty. Loading tokens from local...");
            return loadLocalTokens();
        }
        return Map.of("subjects", subjects, "keywords", keywords);
    }

    private void createTerms(Set<String> terms, String termType) {
        if (!CollectionUtils.isEmpty(terms)) {
            ontologyService.createOntologyTerms(terms, termType, termType + " JSON 직렬화 실패: ");
        }
    }
}
