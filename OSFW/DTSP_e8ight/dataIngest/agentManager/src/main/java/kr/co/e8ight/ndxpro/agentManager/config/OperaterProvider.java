package kr.co.e8ight.ndxpro.agentManager.config;

import kr.co.e8ight.ndxpro.agentManager.domain.AgentOperation;
import kr.co.e8ight.ndxpro.agentManager.service.operater.Operater;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class OperaterProvider {

    private static Logger log = LoggerFactory.getLogger(OperaterProvider.class);

    private Map<AgentOperation, Operater> operaterMap = new HashMap<>();

    @Autowired
    public OperaterProvider(ApplicationContext applicationContext) {
        for (AgentOperation operation : AgentOperation.values()) {
            log.debug(operation.name() + "Operation set Operater : " + operation.getOperaterName());
            operaterMap.put(operation, (Operater) applicationContext.getBean(operation.getOperaterName()));
        }
    }

    public Operater getOperater(AgentOperation operation) {
        return this.operaterMap.get(operation);
    }
}
