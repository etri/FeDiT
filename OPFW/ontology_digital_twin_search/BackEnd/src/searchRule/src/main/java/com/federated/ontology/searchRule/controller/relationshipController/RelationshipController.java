package com.federated.ontology.searchRule.controller.relationshipController;

import com.federated.ontology.searchRule.dto.relationshipDto.RelationshipRequest;
import com.federated.ontology.searchRule.service.relationshipService.RelationshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/digital-twins")
public class RelationshipController {

    private final RelationshipService relationshipService;

    public RelationshipController(RelationshipService relationshipService) {
        this.relationshipService = relationshipService;
    }

    @PostMapping("/{twinId}/relationships")
    public ResponseEntity<?> registerRelationship(
            @PathVariable String twinId,
            @RequestBody RelationshipRequest request) {

        relationshipService.registerRelationship(
                twinId,
                request.getDigitalObjectId(),
                request.getCategory()
        );

        return ResponseEntity.ok("Relationship registered successfully (Stellio synced)");
    }

}
