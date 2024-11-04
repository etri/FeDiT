package kr.co.e8ight.ndxpro.agentManager.repository;

import kr.co.e8ight.ndxpro.agentManager.domain.AgentHistory;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

public interface AgentHistoryCustomRepository {
    PageImpl<AgentHistory> findByStatusAndAgentIdOrderByOperatedAt(AgentStatus status, Long agentId, Pageable pageable);
}
