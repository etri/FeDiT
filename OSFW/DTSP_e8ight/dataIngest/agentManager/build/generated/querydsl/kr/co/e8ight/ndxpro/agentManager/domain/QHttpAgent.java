package kr.co.e8ight.ndxpro.agentManager.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QHttpAgent is a Querydsl query type for HttpAgent
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QHttpAgent extends EntityPathBase<HttpAgent> {

    private static final long serialVersionUID = 209453228L;

    public static final QHttpAgent httpAgent = new QHttpAgent("httpAgent");

    public final QAgent _super = new QAgent(this);

    public final StringPath body = createString("body");

    //inherited
    public final StringPath configFileName = _super.configFileName;

    //inherited
    public final StringPath configPath = _super.configPath;

    public final StringPath connTerm = createString("connTerm");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    //inherited
    public final ListPath<DataModel, QDataModel> dataModels = _super.dataModels;

    //inherited
    public final NumberPath<Long> id = _super.id;

    //inherited
    public final BooleanPath isCustomTopic = _super.isCustomTopic;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> lastSinkSignalDatetime = _super.lastSinkSignalDatetime;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> lastSourceSignalDatetime = _super.lastSourceSignalDatetime;

    public final StringPath method = createString("method");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> modifiedAt = _super.modifiedAt;

    //inherited
    public final StringPath name = _super.name;

    //inherited
    public final NumberPath<Long> pid = _super.pid;

    //inherited
    public final EnumPath<kr.co.e8ight.ndxpro.agentManager.service.AgentStatus> status = _super.status;

    //inherited
    public final StringPath topic = _super.topic;

    //inherited
    public final EnumPath<AgentType> type = _super.type;

    public final StringPath urlAddress = createString("urlAddress");

    public QHttpAgent(String variable) {
        super(HttpAgent.class, forVariable(variable));
    }

    public QHttpAgent(Path<? extends HttpAgent> path) {
        super(path.getType(), path.getMetadata());
    }

    public QHttpAgent(PathMetadata metadata) {
        super(HttpAgent.class, metadata);
    }

}

