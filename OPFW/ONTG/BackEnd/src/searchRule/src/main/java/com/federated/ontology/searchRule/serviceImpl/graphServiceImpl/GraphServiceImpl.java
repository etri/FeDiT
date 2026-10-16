package com.federated.ontology.searchRule.serviceImpl.graphServiceImpl;

import com.federated.ontology.searchRule.config.GraphProperties;
import com.federated.ontology.searchRule.dto.graphDto.GraphDataDto;
import com.federated.ontology.searchRule.dto.graphDto.GraphEdgeDto;
import com.federated.ontology.searchRule.dto.graphDto.GraphNodeDto;
import com.federated.ontology.searchRule.service.graphService.GraphService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GraphServiceImpl implements GraphService {

    private static final String STATUS_LOADING = "LOADING";
    private static final String STATUS_READY = "READY";
    private static final String STATUS_ERROR = "ERROR";

    private static final String NODE_QUERY = """
            MATCH (n)
            RETURN elementId(n) AS id,
                   coalesce(n.name, n.uri, n.id, head(labels(n))) AS label,
                   head(labels(n)) AS type
            ORDER BY label
            """;

    private static final String EDGE_QUERY = """
            MATCH (a)-[r]->(b)
            RETURN elementId(r) AS id,
                   elementId(a) AS source,
                   elementId(b) AS target,
                   type(r) AS label
            ORDER BY label
            """;

    private final Neo4jClient neo4jClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final GraphProperties graphProperties;

    public GraphServiceImpl(Neo4jClient neo4jClient,
                            SimpMessagingTemplate messagingTemplate,
                            GraphProperties graphProperties) {
        this.neo4jClient = neo4jClient;
        this.messagingTemplate = messagingTemplate;
        this.graphProperties = graphProperties;
    }

    @Override
    public GraphDataDto getCurrentGraph() {
        return buildGraphData(STATUS_READY, "Current graph loaded.");
    }

    @Override
    public GraphDataDto reloadGraphFromTtl() {
        broadcast(buildStatusPayload(STATUS_LOADING, "Graph reload started."));

        try {
            Path sourcePath = Path.of(graphProperties.getTtl().getSourcePath());
            Path importDirectory = Path.of(graphProperties.getTtl().getImportHostDir());
            Path importFilePath = importDirectory.resolve(graphProperties.getTtl().getImportFileName());

            validateSourceFile(sourcePath);
            Files.createDirectories(importDirectory);
            Files.copy(sourcePath, importFilePath, StandardCopyOption.REPLACE_EXISTING);

            clearGraph();
            resetGraphConfig();
            initGraphConfig();
            importTtl();

            GraphDataDto payload = buildGraphData(STATUS_READY, "Graph reloaded successfully.");
            broadcast(payload);
            return payload;
        } catch (Exception e) {
            log.error("Failed to reload graph from TTL", e);
            GraphDataDto errorPayload = buildStatusPayload(STATUS_ERROR, e.getMessage());
            broadcast(errorPayload);
            throw new IllegalStateException("Failed to reload graph from TTL: " + e.getMessage(), e);
        }
    }

    private void validateSourceFile(Path sourcePath) {
        if (!Files.exists(sourcePath) || !Files.isRegularFile(sourcePath)) {
            throw new IllegalStateException("TTL source file not found: " + sourcePath);
        }
    }

    private void clearGraph() {
        neo4jClient.query("MATCH (n) DETACH DELETE n").run();
    }

    private void resetGraphConfig() {
        try {
            neo4jClient.query("CALL n10s.graphconfig.drop()").run();
        } catch (RuntimeException e) {
            log.info("Skipping n10s.graphconfig.drop(): {}", e.getMessage());
        }
    }

    private void initGraphConfig() {
        neo4jClient.query("CALL n10s.graphconfig.init({ handleVocabUris: 'SHORTEN' })").run();
    }

    private void importTtl() {
        neo4jClient.query("CALL n10s.rdf.import.fetch($uri, 'Turtle')")
                .bind(graphProperties.getTtl().getImportNeo4jUri()).to("uri")
                .run();
    }

    private GraphDataDto buildGraphData(String status, String message) {
        GraphDataDto dto = new GraphDataDto();
        dto.setStatus(status);
        dto.setMessage(message);
        dto.setNodes(fetchNodes());
        dto.setEdges(fetchEdges());
        dto.setReloadedAt(OffsetDateTime.now().toString());
        return dto;
    }

    private GraphDataDto buildStatusPayload(String status, String message) {
        GraphDataDto dto = new GraphDataDto();
        dto.setStatus(status);
        dto.setMessage(message);
        dto.setNodes(Collections.emptyList());
        dto.setEdges(Collections.emptyList());
        dto.setReloadedAt(OffsetDateTime.now().toString());
        return dto;
    }

    private List<GraphNodeDto> fetchNodes() {
        Collection<Map<String, Object>> rows = neo4jClient.query(NODE_QUERY).fetch().all();
        List<GraphNodeDto> nodes = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            nodes.add(new GraphNodeDto(
                    asString(row.get("id")),
                    asString(row.get("label")),
                    asString(row.get("type"))
            ));
        }
        return nodes;
    }

    private List<GraphEdgeDto> fetchEdges() {
        Collection<Map<String, Object>> rows = neo4jClient.query(EDGE_QUERY).fetch().all();
        List<GraphEdgeDto> edges = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            edges.add(new GraphEdgeDto(
                    asString(row.get("id")),
                    asString(row.get("source")),
                    asString(row.get("target")),
                    asString(row.get("label"))
            ));
        }
        return edges;
    }

    private void broadcast(GraphDataDto payload) {
        messagingTemplate.convertAndSend(graphProperties.getWebsocket().getTopic(), payload);
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
