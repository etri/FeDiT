package kr.co.e8ight.ndxpro.agentManager.repository;

import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;

import javax.persistence.LockModeType;
import javax.persistence.QueryHint;
import java.util.List;
import java.util.Optional;

public interface AgentRepository extends JpaRepository<Agent, Long>, AgentCustomRepository {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value = "3000")})
    @Query(value = "select a from Agent a where a.id = :agentId")
    Optional<Agent> findByIdForUpdate(Long agentId);

    Optional<Agent> findByName(String name);

    List<Agent> findAllByStatus(AgentStatus status);
}
