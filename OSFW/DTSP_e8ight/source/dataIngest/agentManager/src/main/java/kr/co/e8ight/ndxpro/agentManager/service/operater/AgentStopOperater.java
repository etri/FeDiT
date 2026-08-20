package kr.co.e8ight.ndxpro.agentManager.service.operater;

import java.util.Map;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.JsonField;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.springframework.stereotype.Component;

@Component
public class AgentStopOperater extends Operater {
    @Override
    public Agent operate(Agent agent, Map<String, JsonField> bodyInfo) {
        if (agent.getStatus().equals(AgentStatus.RUN) || agent.getStatus().equals(AgentStatus.HANG) || agent.getStatus().equals(AgentStatus.DIED) ) {
            killAgent(agent);

            agent.setStatus(AgentStatus.STOP);
            agent.setPid(null);
            return agent;
        } else {
            return agent;
        }
    }
}
