package kr.co.e8ight.ndxpro.agentManager.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import javax.annotation.PostConstruct;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.repository.AgentRepository;
import kr.co.e8ight.ndxpro.agentManager.service.operater.Operater;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentInspectorService {

    @Value("${agent-manager.inspector.threshold}")
    private Long threshold;

    private final AgentRepository agentRepository;
    private final AgentHistoryService agentHistoryService;

    @PostConstruct
    public void allToStop() {
        List<Agent> agentList = agentRepository.findAll();
        agentList.forEach(agent -> {
            agent.setStatus(AgentStatus.STOP);
            agentRepository.save(agent);
        });
    }

    @Scheduled(fixedDelayString = "${agent-manager.inspector.inspect-delay}")
    @Transactional
    public void inspectAgents() {
        List<Agent> runningAgentList = agentRepository.findAllByStatus(AgentStatus.RUN);

        runningAgentList.stream()
                .filter(agent -> agent.getType().isSignalable())
                .filter(agent -> agent.getLastSourceSignalDatetime().isBefore(signalDeadline(agent)) ||
                        agent.getLastSinkSignalDatetime().isBefore(signalDeadline(agent)))
                .forEach(agent -> {
                    if ( isAlive(agent.getId()) ) {
                        log.error("agent" + agent.getId() + "(" + agent.getPid() + ") status is hang. lastSourceSignal="
                                + agent.getLastSourceSignalDatetime() + ", lastSinkSignal=" + agent.getLastSinkSignalDatetime()
                                + ", threshold=" + agent.getSignalThresholdMillis(threshold) + "ms. Check agent log.");
                        agent.setStatus(AgentStatus.HANG);
                        agentRepository.save(agent);
                    } else {
                        markDied(agent);
                    }
                    agentHistoryService.recordHistory(agent, "SYSTEM");
                });

        // 생존 신호를 보내지 않는 타입(KAFKA)은 프로세스 생존 여부로만 판정한다. HANG 판정 대상이 아니다.
        runningAgentList.stream()
                .filter(agent -> !agent.getType().isSignalable())
                .filter(agent -> !isAlive(agent.getId()))
                .forEach(agent -> {
                    markDied(agent);
                    agentHistoryService.recordHistory(agent, "SYSTEM");
                });

        List<Agent> hangAgentList = agentRepository.findAllByStatus(AgentStatus.HANG);
        hangAgentList.stream()
                .filter(agent -> agent.getType().isSignalable())
                .filter(agent -> agent.getLastSourceSignalDatetime().isAfter(signalDeadline(agent)) &&
                        agent.getLastSinkSignalDatetime().isAfter(signalDeadline(agent)))
                .forEach(agent -> {
                    agent.setStatus(AgentStatus.RUN);
                    agentRepository.save(agent);
                });
    }

    /**
     * 이 시각 이전의 signal 은 만료된 것으로 본다. 폴링 주기가 긴 agent 는 그만큼 기준이 늘어난다.
     */
    private LocalDateTime signalDeadline(Agent agent) {
        return LocalDateTime.now().minus(agent.getSignalThresholdMillis(threshold), ChronoUnit.MILLIS);
    }

    private void markDied(Agent agent) {
        log.error("agent" + agent.getId() + "(" + agent.getPid() + ") status is died. Check agent log.");
        agent.setPid(null);
        agent.setStatus(AgentStatus.DIED);
        if ( Operater.processMap.containsKey(agent.getId()) ) {
            Operater.processMap.get(agent.getId()).destroy();
            Operater.processMap.remove(agent.getId());
        }
        agentRepository.save(agent);
    }

    protected boolean isAlive(long agentId) {
        Process process = Operater.processMap.get(agentId);
        if ( process == null ) {
            return false;
        }
        return process.isAlive();
    }

//    protected boolean isAlive(long pid) {
//        try {
//            String[] commands = {"/bin/sh", "-c", "ls /proc | grep " + pid};
//
//            Process checker = Runtime.getRuntime().exec(commands);
//            checker.waitFor();
//
//            BufferedReader bufferedReader =
//                    new BufferedReader(new InputStreamReader(checker.getInputStream()));
//            BufferedReader errorReader =
//                    new BufferedReader(new InputStreamReader(checker.getErrorStream()));
//            boolean isRunning = bufferedReader.readLine() != null;
//
//            bufferedReader.close();
//            errorReader.close();
//
//            return isRunning;
//
//        } catch (Exception e) {
//            throw new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, "error occurred on ps process cause : " + e.getCause());
//        }
//    }
}
