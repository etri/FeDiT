package kr.co.e8ight.ndxpro.agentManager.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import kr.co.e8ight.ndxpro.agentManager.domain.Agent;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static kr.co.e8ight.ndxpro.agentManager.domain.QAgent.agent;
import static kr.co.e8ight.ndxpro.agentManager.domain.QDataModel.dataModel;

@Repository
public class AgentCustomRepositoryImpl implements AgentCustomRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public AgentCustomRepositoryImpl(JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    @Override
    public PageImpl<Agent> findByStatusAndNameContainsAndNotDeletedOrderByName(AgentStatus status, String name, Pageable pageable) {
        int total = jpaQueryFactory.selectFrom(agent)
                .where(
                        statusEq(status),
                        nameLike(name)
                ).fetch().size();

        List<Agent> content = jpaQueryFactory.selectFrom(agent)
                .where(
                        statusEq(status),
                        nameLike(name)
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(agent.name.asc())
                .fetch();

        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public Optional<Agent> findByIdFetchJoinDataModel(Long id) {
        return Optional.ofNullable(jpaQueryFactory.selectFrom(agent)
                .where(
                        idEq(id)
                )
                .innerJoin(agent.dataModels, dataModel)
                .fetchJoin()
                .fetchOne());
    }

    @Override
    public Optional<Agent> findByNameFetchJoinDataModel(String name) {
        return Optional.ofNullable(jpaQueryFactory.selectFrom(agent)
                .where(
                        nameEq(name)
                )
                .innerJoin(agent.dataModels, dataModel)
                .fetchJoin()
                .fetchOne());
    }

    private BooleanExpression nameLike(String name) {
        return name != null ? agent.name.containsIgnoreCase(name) : null;
    }

    private BooleanExpression idEq(Long id) {
        return agent.id.eq(id);
    }

    private BooleanExpression nameEq(String name) {
        return agent.name.eq(name);
    }

    private BooleanExpression statusEq(AgentStatus status) {
        if ( status == null ) {
            return agent.status.ne(AgentStatus.DELETED);
        }

        if ( status.equals(AgentStatus.DELETED) ) {
            return agent.status.eq(status);
        } else {
            return agent.status.eq(status).and(agent.status.ne(AgentStatus.DELETED));
        }
    }
}
