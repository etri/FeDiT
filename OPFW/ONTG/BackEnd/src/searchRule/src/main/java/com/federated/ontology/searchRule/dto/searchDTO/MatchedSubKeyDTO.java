package com.federated.ontology.searchRule.dto.searchDTO;

import java.util.HashSet;
import java.util.Set;

public class MatchedSubKeyDTO {
    private Set<String> names;
    private Set<String> subjects;
    private Set<String> keywords;

    public MatchedSubKeyDTO() {
        this.names = new HashSet<>();
        this.subjects = new HashSet<>();
        this.keywords = new HashSet<>();
    }

    public MatchedSubKeyDTO(Set<String> names, Set<String> subjects, Set<String> keywords) {
        this.names = names;
        this.subjects = subjects;
        this.keywords = keywords;
    }

    public Set<String> getNames() {
        return names;
    }

    public Set<String> getSubjects() {
        return subjects;
    }

    public Set<String> getKeywords() {
        return keywords;
    }
}
