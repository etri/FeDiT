package com.federated.ontology.searchRule.repository.jpa;

public enum ProcessingStatus {
    PENDING,
    STELLIO_DONE,
    RETRYING,
    FAILED,
    DEAD_LETTER
}
