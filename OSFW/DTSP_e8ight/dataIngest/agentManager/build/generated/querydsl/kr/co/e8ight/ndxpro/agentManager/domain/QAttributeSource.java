package kr.co.e8ight.ndxpro.agentManager.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAttributeSource is a Querydsl query type for AttributeSource
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAttributeSource extends EntityPathBase<AttributeSource> {

    private static final long serialVersionUID = -1864252442L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QAttributeSource attributeSource = new QAttributeSource("attributeSource");

    public final StringPath attributeName = createString("attributeName");

    public final QDataModel dataModel;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath sourceName = createString("sourceName");

    public QAttributeSource(String variable) {
        this(AttributeSource.class, forVariable(variable), INITS);
    }

    public QAttributeSource(Path<? extends AttributeSource> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QAttributeSource(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QAttributeSource(PathMetadata metadata, PathInits inits) {
        this(AttributeSource.class, metadata, inits);
    }

    public QAttributeSource(Class<? extends AttributeSource> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.dataModel = inits.isInitialized("dataModel") ? new QDataModel(forProperty("dataModel"), inits.get("dataModel")) : null;
    }

}

