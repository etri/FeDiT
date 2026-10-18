package com.federated.ontology.searchRule.serviceImpl.searchServiceImpl;

import com.federated.ontology.searchRule.dto.searchDTO.MatchedEntitiesDTO;
import com.federated.ontology.searchRule.dto.searchDTO.MatchedSubKeyDTO;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationService {

    private final TokenParsingService tokenParsingService;
    private final EntityMatchingService entityMatchingService;

    public RecommendationService(TokenParsingService tokenParsingService,
                                 EntityMatchingService entityMatchingService) {
        this.tokenParsingService = tokenParsingService;
        this.entityMatchingService = entityMatchingService;
    }

    public Map<String, Object> getSearchCombination(String searchQuery) {

        MatchedSubKeyDTO matchedSubKey = tokenParsingService.tokenDicParse(searchQuery);

        Set<String> matchedNameTokens = matchedSubKey.getNames();
        Set<String> matchedSubjectTokens = matchedSubKey.getSubjects();
        Set<String> matchedKeywordTokens = matchedSubKey.getKeywords();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("command", searchQuery);

        boolean hasNames = matchedNameTokens != null && !matchedNameTokens.isEmpty();
        boolean hasSubjects = matchedSubjectTokens != null && !matchedSubjectTokens.isEmpty();
        boolean hasKeywords = matchedKeywordTokens != null && !matchedKeywordTokens.isEmpty();

        if (!hasNames && !hasSubjects && !hasKeywords) {
            result.put("recommendCombination", Collections.emptyList());
            result.put("recommendTwins", Collections.emptyList());
            result.put("detectCheck", buildEmptyDetectCheck(matchedSubKey));
            return result;
        }

        MatchedEntitiesDTO matchedNameEntities = new MatchedEntitiesDTO();
        MatchedEntitiesDTO matchedSubjectEntities = new MatchedEntitiesDTO();
        MatchedEntitiesDTO matchedKeywordEntities = new MatchedEntitiesDTO();

        entityMatchingService.fetchMatchedEntitiesByNames(matchedNameTokens, matchedNameEntities);
        entityMatchingService.fetchMatchedEntitiesBySubjects(matchedSubjectTokens, matchedSubjectEntities);
        entityMatchingService.fetchMatchedEntitiesByKeywords(matchedKeywordTokens, matchedKeywordEntities);

        List<Map<String, Object>> nameEntities = matchedNameEntities.getMatchedEntities();
        List<Map<String, Object>> subjectEntities = matchedSubjectEntities.getMatchedEntities();
        List<Map<String, Object>> keywordEntities = matchedKeywordEntities.getMatchedEntities();

        entityMatchingService.attachDetectedForList(nameEntities, matchedNameTokens, matchedSubjectTokens, matchedKeywordTokens);
        entityMatchingService.attachDetectedForList(subjectEntities, matchedNameTokens, matchedSubjectTokens, matchedKeywordTokens);
        entityMatchingService.attachDetectedForList(keywordEntities, matchedNameTokens, matchedSubjectTokens, matchedKeywordTokens);

        if (nameEntities != null) {
            nameEntities.sort(sortBySubjectsThenKeywordsDesc());
        }
        if (subjectEntities != null) {
            subjectEntities.sort(sortBySubjectsThenKeywordsDesc());
        }
        if (keywordEntities != null) {
            keywordEntities.sort(sortByKeywordsDesc());
        }

        Set<String> tokenSet = new LinkedHashSet<>();
        if (matchedNameTokens != null) tokenSet.addAll(matchedNameTokens);
        if (matchedSubjectTokens != null) tokenSet.addAll(matchedSubjectTokens);
        if (matchedKeywordTokens != null) tokenSet.addAll(matchedKeywordTokens);

        Set<String> initialTokenSet = new LinkedHashSet<>(tokenSet);

        List<Map<String, Object>> recommendCombination = new ArrayList<>();
        Set<String> usedEntityIds = new HashSet<>();

        int maxCombinationSize = 100;

        consumeByList(nameEntities, tokenSet, usedEntityIds, recommendCombination, maxCombinationSize);
        consumeByList(subjectEntities, tokenSet, usedEntityIds, recommendCombination, maxCombinationSize);
        consumeByList(keywordEntities, tokenSet, usedEntityIds, recommendCombination, maxCombinationSize);

        List<Map<String, Object>> recommendTwins = entityMatchingService.fetchTwinEntitiesForObjects(recommendCombination);

        result.put("recommendCombination", recommendCombination);
        result.put("recommendTwins", recommendTwins);
        result.put("detectCheck", buildDetectCheckByTokenSet(initialTokenSet, tokenSet));
        result.put("remainingTokenSet", tokenSet);

        return result;
    }

    private Comparator<Map<String, Object>> sortBySubjectsThenKeywordsDesc() {
        return (e1, e2) -> {
            int s1 = entityMatchingService.getCollectionSize(e1.get("detectedSubjects"));
            int s2 = entityMatchingService.getCollectionSize(e2.get("detectedSubjects"));
            if (s1 != s2) return Integer.compare(s2, s1);

            int k1 = entityMatchingService.getCollectionSize(e1.get("detectedKeywords"));
            int k2 = entityMatchingService.getCollectionSize(e2.get("detectedKeywords"));
            if (k1 != k2) return Integer.compare(k2, k1);

            String id1 = e1.get("id") == null ? "" : e1.get("id").toString();
            String id2 = e2.get("id") == null ? "" : e2.get("id").toString();
            return id1.compareTo(id2);
        };
    }

    private Comparator<Map<String, Object>> sortByKeywordsDesc() {
        return (e1, e2) -> {
            int k1 = entityMatchingService.getCollectionSize(e1.get("detectedKeywords"));
            int k2 = entityMatchingService.getCollectionSize(e2.get("detectedKeywords"));
            if (k1 != k2) return Integer.compare(k2, k1);

            String id1 = e1.get("id") == null ? "" : e1.get("id").toString();
            String id2 = e2.get("id") == null ? "" : e2.get("id").toString();
            return id1.compareTo(id2);
        };
    }

    private void consumeByList(
            List<Map<String, Object>> source,
            Set<String> tokenSet,
            Set<String> usedEntityIds,
            List<Map<String, Object>> outRecommend,
            int maxSize
    ) {
        if (source == null || source.isEmpty()) return;
        if (tokenSet == null || tokenSet.isEmpty()) return;
        if (outRecommend.size() >= maxSize) return;

        for (Map<String, Object> entity : source) {
            if (entity == null) continue;
            if (outRecommend.size() >= maxSize) break;
            if (tokenSet.isEmpty()) break;

            Object idObj = entity.get("id");
            String id = (idObj == null) ? null : idObj.toString();
            if (id == null) continue;

            if (usedEntityIds.contains(id)) continue;

            Set<String> consumable = tokenParsingService.collectConsumableTokens(entity);
            Set<String> hit = tokenParsingService.intersectWithTokenSet(tokenSet, consumable);

            if (hit.isEmpty()) continue;

            outRecommend.add(entity);
            usedEntityIds.add(id);
            tokenSet.removeAll(hit);
            entity.put("consumedTokens", hit);
        }
    }

    private Map<String, Object> buildEmptyDetectCheck(MatchedSubKeyDTO matchedSubKey) {
        Map<String, Object> result = new LinkedHashMap<>();

        Map<String, Object> truePart = new LinkedHashMap<>();
        truePart.put("names", Collections.emptySet());
        truePart.put("subjects", Collections.emptySet());
        truePart.put("keywords", Collections.emptySet());

        Map<String, Object> falsePart = new LinkedHashMap<>();
        falsePart.put("names",
                matchedSubKey.getNames() == null
                        ? Collections.emptySet()
                        : new LinkedHashSet<>(matchedSubKey.getNames()));
        falsePart.put("subjects",
                matchedSubKey.getSubjects() == null
                        ? Collections.emptySet()
                        : new LinkedHashSet<>(matchedSubKey.getSubjects()));
        falsePart.put("keywords",
                matchedSubKey.getKeywords() == null
                        ? Collections.emptySet()
                        : new LinkedHashSet<>(matchedSubKey.getKeywords()));

        result.put("true", truePart);
        result.put("false", falsePart);

        return result;
    }

    private Map<String, Object> buildDetectCheckByTokenSet(Set<String> initialTokenSet, Set<String> remainingTokenSet) {
        Set<String> init = (initialTokenSet == null) ? Collections.emptySet() : new LinkedHashSet<>(initialTokenSet);
        Set<String> remain = (remainingTokenSet == null) ? Collections.emptySet() : new LinkedHashSet<>(remainingTokenSet);

        Set<String> used = new LinkedHashSet<>(init);
        used.removeAll(remain);

        Map<String, Object> truePart = new LinkedHashMap<>();
        truePart.put("tokens", used);

        Map<String, Object> falsePart = new LinkedHashMap<>();
        falsePart.put("tokens", remain);

        Map<String, Object> detectCheck = new LinkedHashMap<>();
        detectCheck.put("true", truePart);
        detectCheck.put("false", falsePart);

        return detectCheck;
    }
}
