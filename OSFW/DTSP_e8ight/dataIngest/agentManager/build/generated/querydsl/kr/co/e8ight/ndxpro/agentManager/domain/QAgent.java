package kr.co.e8ight.ndxpro.agentManager.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAgent is a Querydsl query type for Agent
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAgent extends EntityPathBase<Agent> {

    private static final long serialVersionUID = 342025172L;

    public static final QAgent agent = new QAgent("agent");

    public final StringPath configFileName = createString("configFileName");

    public final StringPath configPath = createString("configPath");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final ListPath<DataModel, QDataModel> dataModels = this.<DataModel, QDataModel>createList("dataModels", DataModel.class, QDataModel.class, PathInits.DIRECT2);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final BooleanPath isCustomTopic = createBoolean("isCustomTopic");

    public final DateTimePath<java.time.LocalDateTime> lastSinkSignalDatetime = createDateTime("lastSinkSignalDatetime", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> lastSourceSignalDatetime = createDateTime("lastSourceSignalDatetime", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> modifiedAt = createDateTime("modifiedAt", java.time.LocalDateTime.class);

    public final StringPath name = createString("name");

    public final NumberPath<Long> pid = createNumber("pid", Long.class);

    public final EnumPath<kr.co.e8ight.ndxpro.agentManager.service.AgentStatus> status = createEnum("status", kr.co.e8ight.ndxpro.agentManager.service.AgentStatus.class);

    public final StringPath topic = createString("topic");

    public final EnumPath<AgentType> type = createEnum("type", AgentType.class);

    public QAgent(String variable) {
        super(Agent.class, forVariable(variable));
    }

    public QAgent(Path<? extends Agent> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAgent(PathMetadata metadata) {
        super(Agent.class, metadata);
    }

}

