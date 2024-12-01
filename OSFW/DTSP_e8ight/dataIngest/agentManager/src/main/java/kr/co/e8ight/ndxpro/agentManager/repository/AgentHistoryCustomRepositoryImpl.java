package kr.co.e8ight.ndxpro.agentManager.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import kr.co.e8ight.ndxpro.agentManager.domain.AgentHistory;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

import static kr.co.e8ight.ndxpro.agentManager.domain.QAgentHistory.agentHistory;

@Repository
public class AgentHistoryCustomRepositoryImpl implements AgentHistoryCustomRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public AgentHistoryCustomRepositoryImpl(JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    @Override
    public PageImpl<AgentHistory> findByStatusAndAgentIdOrderByOperatedAt(AgentStatus status, Long agentId, Pageable pageable) {
        int total = jpaQueryFactory.selectFrom(agentHistory)
                .where(
                        statusEq(status),
                        agentIdEq(agentId)
                ).fetch().size();

        List<AgentHistory> content = jpaQueryFactory.selectFrom(agentHistory)
                .where(
                        statusEq(status),
                        agentIdEq(agentId)
                )
                .orderBy(agentHistory.operatedAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(content, pageable, total);
    }

    private BooleanExpression agentIdEq(Long agentId) {
        return agentId != null ? agentHistory.agentId.eq(agentId) : null;
    }

    private BooleanExpression statusEq(AgentStatus status) {
        return status != null ? agentHistory.agentStatus.eq(status) : null;
    }
}
