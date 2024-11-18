package kr.co.e8ight.auth.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import kr.co.e8ight.auth.entity.AuthHistory;
import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;
import kr.co.e8ight.auth.type.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static kr.co.e8ight.auth.entity.QAuthHistory.authHistory;
import static kr.co.e8ight.auth.entity.QMember.member;

@Repository
public class AuthHistoryRepositoryQdsl extends QuerydslRepositorySupport {
    private final JPAQueryFactory jpaQueryFactory;

    public AuthHistoryRepositoryQdsl(JPAQueryFactory jpaQueryFactory) {
        super(AuthHistory.class);
        this.jpaQueryFactory = jpaQueryFactory;
    }

    public Optional<AuthHistory> findLatestById(Integer id){

        return Optional.ofNullable(jpaQueryFactory
                .selectFrom(authHistory)
                .where(authHistory.member.id.eq(id))
                .orderBy(authHistory.createAt.desc())
                .fetchFirst());
    }
    public Page<AuthHistory> findAllByApplyStatus(Pageable pageable){

        List<AuthHistory> authHistories = jpaQueryFactory
                .selectFrom(authHistory)
                .innerJoin(authHistory.member, member)
                .on(authHistory.member.id.eq(member.id))
                .where(authHistory.approveLevel.eq(ApproveLevel.APPLY)
                        .and(member.authType.eq(AuthType.USER))
                        .and(member.status.eq(MemberStatus.ACTIVE)))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(authHistory.member.id.asc())
                .orderBy(authHistory.id.asc())
                .fetch();

        Long count = jpaQueryFactory
                .select(authHistory.count())
                .from(authHistory)
                .innerJoin(authHistory.member, member)
                .on(authHistory.member.id.eq(member.id))
                .where(authHistory.approveLevel.eq(ApproveLevel.APPLY)
                        .and(member.authType.eq(AuthType.USER))
                        .and(member.status.eq(MemberStatus.ACTIVE)))
                .fetchOne();



        return new PageImpl<AuthHistory>(authHistories, pageable, count);
    }

    public Optional<List<AuthHistory>> findAllById(Integer id){
        List<AuthHistory> authHistories = jpaQueryFactory
                .selectFrom(authHistory)
                .where(authHistory.member.id.eq(id))
                .orderBy(authHistory.id.asc())
                .fetch();

        return Optional.ofNullable(authHistories);
    }
}
