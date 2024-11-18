package kr.co.e8ight.auth.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.type.MemberStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static kr.co.e8ight.auth.entity.QMember.member;

@Repository
public class MemberRepositoryQdsl extends QuerydslRepositorySupport {
    private final JPAQueryFactory jpaQueryFactory;

    public MemberRepositoryQdsl(JPAQueryFactory jpaQueryFactory){
        super(Member.class);
        this.jpaQueryFactory = jpaQueryFactory;
    }

    public Optional<Member> findByMemberId(String memberId){
        Member rMember = jpaQueryFactory
                .selectFrom(member)
                .where(member.memberId.eq(memberId))
                .fetchOne();

        return Optional.ofNullable(rMember);
    }

    public List<Member> findByMemberIdAndStatus(String email, MemberStatus status){
        return jpaQueryFactory
                .selectFrom(member)
                .where(member.status.eq(status))
                .fetch();
    }

    public List<Member> findByMemberIdAndAndHp(String email, String name, String mbPhone){
        return jpaQueryFactory
                .selectFrom(member)
                .where(member.name.eq(name),
                        member.hp.eq(mbPhone))
                .fetch();
    }

    public List<Member> findAllBy(Pageable pageable){
        return jpaQueryFactory
                .selectFrom(member)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }



    public Boolean existsByMemberId(String memberId){
        Member existMember = jpaQueryFactory
                .selectFrom(member)
                .where(member.memberId.eq(memberId))
                .fetchOne();

        if (member == null)
            return Boolean.FALSE;

        return Boolean.TRUE;
    }
}
