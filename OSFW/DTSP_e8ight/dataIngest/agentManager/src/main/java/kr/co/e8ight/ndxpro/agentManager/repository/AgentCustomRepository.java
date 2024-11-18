package kr.co.e8ight.ndxpro.agentManager.repository;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface AgentCustomRepository {
    PageImpl<Agent> findByStatusAndNameContainsAndNotDeletedOrderByName(AgentStatus status, String name, Pageable pageable);

    Optional<Agent> findByIdFetchJoinDataModel(Long id);

    Optional<Agent> findByNameFetchJoinDataModel(String name);
}
