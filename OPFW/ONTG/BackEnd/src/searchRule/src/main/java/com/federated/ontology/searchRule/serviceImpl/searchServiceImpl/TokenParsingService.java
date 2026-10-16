package com.federated.ontology.searchRule.serviceImpl.searchServiceImpl;

import com.federated.ontology.searchRule.dto.relationshipDto.TokenDicCache;
import com.federated.ontology.searchRule.dto.searchDTO.MatchedSubKeyDTO;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TokenParsingService {

    public MatchedSubKeyDTO tokenDicParse(String query) {
        if (query == null || query.isEmpty()) {
            return new MatchedSubKeyDTO();
        }

        String lowerQuery = query.toLowerCase();

        Set<String> nameSet = TokenDicCache.getNames();
        Set<String> subjectSet = TokenDicCache.getSubjects();
        Set<String> keywordSet = TokenDicCache.getKeywords();

        Set<String> matchedNames = new HashSet<>();
        Set<String> matchedSubjects = new HashSet<>();
        Set<String> matchedKeywords = new HashSet<>();

        for (String name : nameSet) {
            if (lowerQuery.contains(name.toLowerCase())) {
                matchedNames.add(name);
                subjectSet.remove(name);
                keywordSet.remove(name);
            }
        }

        for (String subject : subjectSet) {
            if (lowerQuery.contains(subject.toLowerCase())) {
                matchedSubjects.add(subject);
                keywordSet.remove(subject);
            }
        }

        for (String keyword : keywordSet) {
            if (lowerQuery.contains(keyword.toLowerCase())) {
                matchedKeywords.add(keyword);
            }
        }

        return new MatchedSubKeyDTO(matchedNames, matchedSubjects, matchedKeywords);
    }

    @SuppressWarnings("unchecked")
    public Set<String> extractStringValues(Object attr) {
        Set<String> result = new LinkedHashSet<>();
        if (attr == null) {
            return result;
        }

        if (attr instanceof Map<?, ?> map) {
            Object value = map.get("value");
            if (value instanceof Collection<?> col) {
                for (Object v : col) {
                    if (v != null) result.add(v.toString());
                }
            } else if (value != null) {
                result.add(value.toString());
            }
            return result;
        }

        if (attr instanceof Collection<?> col) {
            for (Object v : col) {
                if (v != null) result.add(v.toString());
            }
            return result;
        }

        result.add(attr.toString());
        return result;
    }

    public Set<String> collectConsumableTokens(Map<String, Object> entity) {
        Set<String> tokens = new LinkedHashSet<>();

        Object dn = entity.get("detectedNames");
        if (dn instanceof Collection<?> col) {
            for (Object v : col) if (v != null) tokens.add(v.toString());
        }

        Object ds = entity.get("detectedSubjects");
        if (ds instanceof Collection<?> col) {
            for (Object v : col) if (v != null) tokens.add(v.toString());
        }

        Object dk = entity.get("detectedKeywords");
        if (dk instanceof Collection<?> col) {
            for (Object v : col) if (v != null) tokens.add(v.toString());
        }

        return tokens;
    }

    public Set<String> intersectWithTokenSet(Set<String> tokenSet, Set<String> consumable) {
        Set<String> hit = new LinkedHashSet<>();
        if (tokenSet == null || tokenSet.isEmpty()) return hit;
        if (consumable == null || consumable.isEmpty()) return hit;

        for (String t : consumable) {
            if (tokenSet.contains(t)) {
                hit.add(t);
            }
        }
        return hit;
    }

    public String joinForInQuery(Set<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .filter(v -> v != null && !v.isEmpty())
                .map(v -> "\"" + v + "\"")
                .collect(Collectors.joining(","));
    }
}
