package kr.co.e8ight.ndxpro.agentManager.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QHttpsAgent is a Querydsl query type for HttpsAgent
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QHttpsAgent extends EntityPathBase<HttpsAgent> {

    private static final long serialVersionUID = -700469909L;

    public static final QHttpsAgent httpsAgent = new QHttpsAgent("httpsAgent");

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

    public QHttpsAgent(String variable) {
        super(HttpsAgent.class, forVariable(variable));
    }

    public QHttpsAgent(Path<? extends HttpsAgent> path) {
        super(path.getType(), path.getMetadata());
    }

    public QHttpsAgent(PathMetadata metadata) {
        super(HttpsAgent.class, metadata);
    }

}

