package com.federated.ontology.searchRule.service.graphService;

import com.federated.ontology.searchRule.dto.graphDto.GraphDataDto;

public interface GraphService {

    GraphDataDto getCurrentGraph();

    GraphDataDto reloadGraphFromTtl();
}
