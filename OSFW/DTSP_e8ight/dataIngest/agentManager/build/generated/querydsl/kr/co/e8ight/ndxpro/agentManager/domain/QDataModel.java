package kr.co.e8ight.ndxpro.agentManager.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QDataModel is a Querydsl query type for DataModel
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDataModel extends EntityPathBase<DataModel> {

    private static final long serialVersionUID = -322439442L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QDataModel dataModel = new QDataModel("dataModel");

    public final QAgent agent;

    public final StringPath context = createString("context");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath modelType = createString("modelType");

    public QDataModel(String variable) {
        this(DataModel.class, forVariable(variable), INITS);
    }

    public QDataModel(Path<? extends DataModel> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QDataModel(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QDataModel(PathMetadata metadata, PathInits inits) {
        this(DataModel.class, metadata, inits);
    }

    public QDataModel(Class<? extends DataModel> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.agent = inits.isInitialized("agent") ? new QAgent(forProperty("agent")) : null;
    }

}

