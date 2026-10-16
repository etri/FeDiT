package com.federated.ontology.searchRule.controller.graphController;

import com.federated.ontology.searchRule.dto.graphDto.GraphDataDto;
import com.federated.ontology.searchRule.service.graphService.GraphService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/graph")
public class GraphController {

    private final GraphService graphService;

    public GraphController(GraphService graphService) {
        this.graphService = graphService;
    }

    @GetMapping
    public ResponseEntity<GraphDataDto> getCurrentGraph() {
        return ResponseEntity.ok(graphService.getCurrentGraph());
    }

    @PutMapping
    public ResponseEntity<GraphDataDto> reloadGraph() {
        return ResponseEntity.ok(graphService.reloadGraphFromTtl());
    }
}
