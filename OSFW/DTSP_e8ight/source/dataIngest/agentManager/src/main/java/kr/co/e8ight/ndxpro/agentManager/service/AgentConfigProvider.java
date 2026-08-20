package kr.co.e8ight.ndxpro.agentManager.service;


import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentType;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.service.conf.ConfFileProvider;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Agent 타입에 맞는 ConfFileProvider 로 위임한다.
 * 타입별 conf 생성 로직은 service.conf 패키지의 구현체에 있다.
 */
@Component
public class AgentConfigProvider {

    @Value("${flume.conf-dir}")
    private String flumeConfPath;

    private final Map<AgentType, ConfFileProvider> providerMap = new EnumMap<>(AgentType.class);

    @Autowired
    public AgentConfigProvider(List<ConfFileProvider> confFileProviders) {
        for (ConfFileProvider provider : confFileProviders) {
            for (AgentType type : provider.getSupportedTypes()) {
                providerMap.put(type, provider);
            }
        }
    }

    public String getConfFileContents(Agent agent, AgentRequestDto requestDto) {
        ConfFileProvider provider = getProvider(requestDto.getType());
        provider.validate(requestDto);
        return provider.getConfFileContents(agent, requestDto);
    }

    public void validateConfFileContents(Agent agent, String contents) {
        getProvider(agent.getType()).validateConfFileContents(agent, contents);
    }

    public String getConfFilePath() {
        return flumeConfPath + "files/";
    }

    private ConfFileProvider getProvider(AgentType type) {
        ConfFileProvider provider = providerMap.get(type);
        if ( provider == null ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Agent type : " + type + " is not supported.");
        }
        return provider;
    }
}
