package com.federated.ontology.searchRule.component;

import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdTokenLoader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@ConditionalOnProperty(
        name = "searchRule.tokens.preload-on-startup",
        havingValue = "true",
        matchIfMissing = true
)
public class TokenCacheStartupLoader implements ApplicationRunner {

    private final NgsiLdTokenLoader tokenLoader;

    public TokenCacheStartupLoader(NgsiLdTokenLoader tokenLoader) {
        this.tokenLoader = tokenLoader;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("[TokenCache] 기동 시 토큰 사전 자동 적재 시작...");
        try {
            Map<String, Set<String>> result = tokenLoader.loadLocalTokens();
            int names = result.getOrDefault("names", Set.of()).size();
            int subjects = result.getOrDefault("subjects", Set.of()).size();
            int keywords = result.getOrDefault("keywords", Set.of()).size();
            log.info("[TokenCache] 자동 적재 완료. names={}, subjects={}, keywords={}",
                    names, subjects, keywords);
        } catch (Exception e) {
            log.error("[TokenCache] 자동 적재 실패. 검색 사용 전 POST /api/v1/tokens/reload 수동 호출 필요. error={}",
                    e.getMessage());
        }
    }
}
