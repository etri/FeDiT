package com.federated.ontology.searchRule.serviceImpl.searchServiceImpl;

import com.federated.ontology.searchRule.component.KeywordGraph;
import com.federated.ontology.searchRule.dto.searchDTO.MatchedSubKeyDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class SearchGraphService {

    private final TokenParsingService tokenParsingService;
    private final EntityMatchingService entityMatchingService;
    private final KeywordGraph keywordGraph;

    public SearchGraphService(TokenParsingService tokenParsingService,
                              EntityMatchingService entityMatchingService,
                              KeywordGraph keywordGraph) {
        this.tokenParsingService = tokenParsingService;
        this.entityMatchingService = entityMatchingService;
        this.keywordGraph = keywordGraph;
    }

    public Map<String, Object> getSearchGraph(String searchQuery) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("command", searchQuery);

        MatchedSubKeyDTO matchedSubKey = tokenParsingService.tokenDicParse(searchQuery);
        Set<String> matchedKeywords = matchedSubKey.getKeywords();

        if (matchedKeywords == null || matchedKeywords.isEmpty()) {
            result.put("recommendCombination", Collections.emptyList());
            result.put("recommendTwins", Collections.emptyList());
            return result;
        }

        if (!keywordGraph.isInitialized()) {
            log.warn("KeywordGraph is not initialized. Returning empty combination.");
            result.put("recommendCombination", Collections.emptyList());
            result.put("recommendTwins", Collections.emptyList());
            return result;
        }

        Set<String> candidateObjectIds = new HashSet<>();
        for (String kw : matchedKeywords) {
            Set<String> objs = keywordGraph.getObjectIdsByKeyword(kw);
            if (objs != null && !objs.isEmpty()) {
                candidateObjectIds.addAll(objs);
            }
        }

        if (candidateObjectIds.isEmpty()) {
            result.put("recommendCombination", Collections.emptyList());
            result.put("recommendTwins", Collections.emptyList());
            return result;
        }

        List<ScoredObject> scored = new ArrayList<>();
        for (String objectId : candidateObjectIds) {
            Set<String> objectKeywords = keywordGraph.getKeywordsByObjectId(objectId);
            if (objectKeywords == null || objectKeywords.isEmpty()) continue;

            Set<String> intersection = new HashSet<>(objectKeywords);
            intersection.retainAll(matchedKeywords);

            if (intersection.isEmpty()) continue;

            ScoredObject s = new ScoredObject();
            s.objectId = objectId;
            s.matchedKeywordCount = intersection.size();
            s.matchedKeywords = intersection;
            scored.add(s);
        }

        if (scored.isEmpty()) {
            result.put("recommendCombination", Collections.emptyList());
            result.put("recommendTwins", Collections.emptyList());
            return result;
        }

        scored.sort((a, b) -> Integer.compare(b.matchedKeywordCount, a.matchedKeywordCount));

        Set<String> covered = new HashSet<>();
        List<String> bestCombinationObjectIds = new ArrayList<>();
        int maxCombinationSize = 3;

        for (ScoredObject s : scored) {
            Set<String> newTokens = new HashSet<>(s.matchedKeywords);
            newTokens.removeAll(covered);

            if (newTokens.isEmpty()) {
                continue;
            }

            bestCombinationObjectIds.add(s.objectId);
            covered.addAll(newTokens);

            if (covered.containsAll(matchedKeywords)
                    || bestCombinationObjectIds.size() >= maxCombinationSize) {
                break;
            }
        }

        List<Map<String, Object>> recommendCombination = new ArrayList<>();
        List<Map<String, Object>> recommendTwins = new ArrayList<>();
        Set<String> twinIdSet = new HashSet<>();

        for (String objectId : bestCombinationObjectIds) {
            Map<String, Object> objectEntity = entityMatchingService.fetchEntityById(objectId);
            if (objectEntity != null) {
                recommendCombination.add(objectEntity);
            }

            String twinId = keywordGraph.getTwinIdByObjectId(objectId);
            if (twinId != null && !twinIdSet.contains(twinId)) {
                Map<String, Object> twinEntity = entityMatchingService.fetchEntityById(twinId);
                if (twinEntity != null) {
                    recommendTwins.add(twinEntity);
                    twinIdSet.add(twinId);
                }
            }
        }

        result.put("recommendCombination", recommendCombination);
        result.put("recommendTwins", recommendTwins);

        log.debug("searchQuery={}, result={}", searchQuery, result);

        return result;
    }

    private static class ScoredObject {
        String objectId;
        int matchedKeywordCount;
        Set<String> matchedKeywords;
    }
}
