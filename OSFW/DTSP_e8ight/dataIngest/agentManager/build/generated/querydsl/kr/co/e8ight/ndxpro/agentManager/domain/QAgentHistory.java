package kr.co.e8ight.ndxpro.agentManager.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAgentHistory is a Querydsl query type for AgentHistory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAgentHistory extends EntityPathBase<AgentHistory> {

    private static final long serialVersionUID = -451321312L;

    public static final QAgentHistory agentHistory = new QAgentHistory("agentHistory");

    public final NumberPath<Long> agentId = createNumber("agentId", Long.class);

    public final StringPath agentName = createString("agentName");

    public final EnumPath<kr.co.e8ight.ndxpro.agentManager.service.AgentStatus> agentStatus = createEnum("agentStatus", kr.co.e8ight.ndxpro.agentManager.service.AgentStatus.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final DateTimePath<java.time.LocalDateTime> operatedAt = createDateTime("operatedAt", java.time.LocalDateTime.class);

    public final StringPath operatedBy = createString("operatedBy");

    public QAgentHistory(String variable) {
        super(AgentHistory.class, forVariable(variable));
    }

    public QAgentHistory(Path<? extends AgentHistory> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAgentHistory(PathMetadata metadata) {
        super(AgentHistory.class, metadata);
    }

}

