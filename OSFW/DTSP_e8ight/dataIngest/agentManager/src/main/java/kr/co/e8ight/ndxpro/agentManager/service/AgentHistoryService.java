package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentHistory;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.HistoryListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.HistoryResponseDto;
import kr.co.e8ight.ndxpro.agentManager.repository.AgentHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgentHistoryService {

    private final AgentHistoryRepository agentHistoryRepository;

    public HistoryListResponseDto getHistories(AgentStatus status, Long agentId, Pageable pageable) {
        PageImpl<AgentHistory> agentHistoryPage = agentHistoryRepository.findByStatusAndAgentIdOrderByOperatedAt(status, agentId, pageable);

        List<HistoryResponseDto> historyResponseDtoList = new ArrayList<>();

        agentHistoryPage.forEach(agentHistory -> historyResponseDtoList.add(
                HistoryResponseDto.of(agentHistory)
        ));

        return new HistoryListResponseDto(historyResponseDtoList, agentHistoryPage.getTotalElements(), agentHistoryPage.getTotalPages());
    }

    @Transactional
    public AgentHistory recordHistory(Agent agent, String memberId) {
        AgentHistory agentHistory = AgentHistory.builder()
                .agentId(agent.getId())
                .agentName(agent.getName())
                .agentStatus(agent.getStatus())
                .operatedBy(memberId)
                .build();

        return agentHistoryRepository.save(agentHistory);
    }
}
