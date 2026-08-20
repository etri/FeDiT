package kr.co.e8ight.ndxpro.fileservice.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import org.springframework.stereotype.Repository;

import java.util.List;

import static kr.co.e8ight.ndxpro.fileservice.domain.QLogicalFile.logicalFile;
import static kr.co.e8ight.ndxpro.fileservice.domain.QPhysicalFile.physicalFile;

@Repository
public class LogicalFileCustomRepositoryImpl implements LogicalFileCustomRepository{

    private final JPAQueryFactory jpaQueryFactory;

    public LogicalFileCustomRepositoryImpl(JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    public List<LogicalFile> findWithFilenameAndChecksum(String filename, String checksum) {
        return jpaQueryFactory.selectFrom(logicalFile)
                .where(
                        filenameEq(filename),
                        checksumEq(checksum)
                )
                .fetch();
    }

    @Override
    public LogicalFile findOneWithUfId(String ufId) {
        return jpaQueryFactory
                .selectFrom(logicalFile)
                .where(logicalFile.ufId.eq(ufId))
                .innerJoin(logicalFile.physicalFile, physicalFile)
                .fetchJoin()
                .fetchOne();
    }

    private BooleanExpression filenameEq(String filename) {
        return filename != null ? logicalFile.originalName.eq(filename) : null;
    }

    private BooleanExpression checksumEq(String checksum) {
        return checksum != null ? logicalFile.physicalFile.checksum.eq(checksum) : null;
    }
}
