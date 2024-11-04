package kr.co.e8ight.ndxpro.agentManager.repository;

import kr.co.e8ight.ndxpro.agentManager.domain.AgentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentHistoryRepository extends JpaRepository<AgentHistory, Long>, AgentHistoryCustomRepository {
}
