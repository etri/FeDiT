package kr.co.e8ight.ndxpro.agentManager.service.operater;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class AgentRerunOperater extends Operater {
    @Override
    public Agent operate(Agent agent) {
        if (agent.getStatus().equals(AgentStatus.RUN) || agent.getStatus().equals(AgentStatus.HANG)) {
            killAgent(agent);
            long pid = runAgent(agent);

            agent.initializeSignalDatetime();
            agent.setStatus(AgentStatus.RUN);
            agent.setPid(pid);
            return agent;
        } else {
            throw new AgentException(ErrorCode.OPERATION_NOT_SUPPORTED, "Agent is not running");
        }
    }
}
