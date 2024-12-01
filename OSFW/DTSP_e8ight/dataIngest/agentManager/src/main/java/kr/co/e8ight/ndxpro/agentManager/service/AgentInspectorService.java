package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.repository.AgentRepository;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentInspectorService {

    @Value("${agent-manager.inspector.threshold}")
    private Long threshold;

    private final AgentRepository agentRepository;
    private final AgentHistoryService agentHistoryService;

    @Scheduled(fixedDelayString = "${agent-manager.inspector.inspect-delay}")
    @Transactional
    public void inspectAgents() {
        List<Agent> runningAgentList = agentRepository.findAllByStatus(AgentStatus.RUN);

        runningAgentList.stream()
                .filter(agent -> agent.getLastSourceSignalDatetime().isBefore(LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS)) ||
                        agent.getLastSinkSignalDatetime().isBefore(LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS)))
                .forEach(agent -> {
                    if ( isAlive(agent.getPid()) ) {
                        log.error("agent" + agent.getId() + "(" + agent.getPid() + ") status is hang. Check agent log.");
                        agent.setStatus(AgentStatus.HANG);
                        agentRepository.save(agent);
                    } else {
                        log.error("agent" + agent.getId() + "(" + agent.getPid() + ") status is died. Check agent log.");
                        agent.setPid(null);
                        agent.setStatus(AgentStatus.DIED);
                        agentRepository.save(agent);
                    }
                    agentHistoryService.recordHistory(agent, "SYSTEM");
                });

        List<Agent> hangAgentList = agentRepository.findAllByStatus(AgentStatus.HANG);
        hangAgentList.stream()
                .filter(agent -> agent.getLastSourceSignalDatetime().isAfter(LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS)) &&
                        agent.getLastSinkSignalDatetime().isAfter(LocalDateTime.now().minus(threshold, ChronoUnit.MILLIS)))
                .forEach(agent -> {
                    agent.setStatus(AgentStatus.RUN);
                    agentRepository.save(agent);
                });
    }

    protected boolean isAlive(long pid) {
        try {
            String[] commands = {"/bin/sh", "-c", "ls /proc | grep " + pid};

            Process checker = Runtime.getRuntime().exec(commands);
            checker.waitFor();

            BufferedReader bufferedReader =
                    new BufferedReader(new InputStreamReader(checker.getInputStream()));
            BufferedReader errorReader =
                    new BufferedReader(new InputStreamReader(checker.getErrorStream()));
            boolean isRunning = bufferedReader.readLine() != null;

            bufferedReader.close();
            errorReader.close();

            return isRunning;

        } catch (Exception e) {
            throw new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, "error occurred on ps process cause : " + e.getCause());
        }
    }
}
