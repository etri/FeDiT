package com.federated.ontology.searchRule.dto.relationshipDto;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class TokenDicCache {
    private static final Map<String, Set<String>> TAGS =
            new ConcurrentHashMap<>();

    public static void updateTags(Map<String, Set<String>> newTags) {
        TAGS.clear();
        TAGS.putAll(newTags);
    }

    public static Set<String> getSubjects() {
        return TAGS.getOrDefault("subjects", Set.of());
    }

    public static Set<String> getKeywords() {
        return TAGS.getOrDefault("keywords", Set.of());
    }

    public static Set<String> getNames() { return TAGS.getOrDefault("names", Set.of()); }

}
