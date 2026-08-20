package kr.co.e8ight.ndxpro.agentManager.service.conf;

import java.io.IOException;
import java.io.StringReader;
import java.util.Properties;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;

/**
 * 사용자가 직접 편집한 conf 파일을 검증할 때 쓰는 공통 로직.
 * 어떤 키가 필수인지는 타입마다 다르므로 구현체에서 정한다.
 */
public abstract class AbstractConfFileProvider implements ConfFileProvider {

    @Override
    public void validateConfFileContents(Agent agent, String contents) {
        if ( contents == null || contents.trim().isEmpty() ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Config file contents are required.");
        }

        Properties properties = parse(contents);
        requireAgentNamePrefix(properties, agent.getName());
        validateRequiredEntries(agent, properties);
    }

    /** 타입별 필수 키 검증 */
    protected abstract void validateRequiredEntries(Agent agent, Properties properties);

    protected Properties parse(String contents) {
        Properties properties = new Properties();
        try {
            properties.load(new StringReader(contents));
        } catch (IOException e) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Config file contents are not a valid flume config.");
        }
        return properties;
    }

    /**
     * flume-ng 은 '-n {agent name}' 으로 기동하므로 conf 의 prefix 가 agent 이름과 달라지면
     * 설정을 찾지 못한 채 아무 일도 하지 않고 종료한다. 에러도 남지 않아 반드시 막아야 한다.
     */
    protected void requireAgentNamePrefix(Properties properties, String agentName) {
        boolean hasPrefix = properties.stringPropertyNames().stream()
                .anyMatch(key -> key.startsWith(agentName + "."));
        if ( !hasPrefix ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA,
                    "Config file must use the agent name '" + agentName + "' as its prefix.");
        }
    }

    protected void requireKey(Properties properties, String key) {
        if ( properties.getProperty(key) == null ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Config file must contain '" + key + "'.");
        }
    }

    protected void requireValue(Properties properties, String key, String expected) {
        requireKey(properties, key);
        String actual = properties.getProperty(key).trim();
        if ( !actual.equals(expected) ) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA,
                    "Config file '" + key + "' must be '" + expected + "' but was '" + actual + "'.");
        }
    }
}
