package kr.co.e8ight.ndxpro.agentManager.config;

import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.apache.commons.lang3.EnumUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.convert.converter.Converter;

public class StringToAgentStatusConverter implements Converter<String, AgentStatus> {
    @Override
    public AgentStatus convert(String source) {
        if (StringUtils.isBlank(source)) {
            return null;
        }
        return EnumUtils.getEnum(AgentStatus.class, source.toUpperCase());
    }
}
