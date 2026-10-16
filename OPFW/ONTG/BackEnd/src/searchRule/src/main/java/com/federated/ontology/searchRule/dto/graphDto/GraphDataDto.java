package com.federated.ontology.searchRule.dto.graphDto;

import java.util.ArrayList;
import java.util.List;

public class GraphDataDto {

    private String status;
    private String message;
    private List<GraphNodeDto> nodes = new ArrayList<>();
    private List<GraphEdgeDto> edges = new ArrayList<>();
    private String reloadedAt;

    public GraphDataDto() {
    }

    public GraphDataDto(String status, String message, List<GraphNodeDto> nodes, List<GraphEdgeDto> edges, String reloadedAt) {
        this.status = status;
        this.message = message;
        this.nodes = nodes;
        this.edges = edges;
        this.reloadedAt = reloadedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<GraphNodeDto> getNodes() {
        return nodes;
    }

    public void setNodes(List<GraphNodeDto> nodes) {
        this.nodes = nodes;
    }

    public List<GraphEdgeDto> getEdges() {
        return edges;
    }

    public void setEdges(List<GraphEdgeDto> edges) {
        this.edges = edges;
    }

    public String getReloadedAt() {
        return reloadedAt;
    }

    public void setReloadedAt(String reloadedAt) {
        this.reloadedAt = reloadedAt;
    }
}
