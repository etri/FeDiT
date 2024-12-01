package kr.co.e8ight.auth.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import kr.co.e8ight.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import static kr.co.e8ight.auth.entity.QRefreshToken.refreshToken;

@Repository
public class RefreshTokenRepositoryQdsl extends QuerydslRepositorySupport {

    private final JPAQueryFactory jpaQueryFactory;

    public RefreshTokenRepositoryQdsl(JPAQueryFactory jpaQueryFactory){
        super(RefreshToken.class);
        this.jpaQueryFactory = jpaQueryFactory;
    }

    public Optional<RefreshToken> findByRegId(Integer regId){

        RefreshToken oRefreshToken = jpaQueryFactory
                .selectFrom(refreshToken)
                .where(refreshToken.member.id.eq(regId))
                .fetchOne();

        return Optional.ofNullable(oRefreshToken);
    }

    public Optional<RefreshToken> findByToken(String token){

        RefreshToken oRefreshToken = jpaQueryFactory
                .selectFrom(refreshToken)
                .where(refreshToken.token.eq(token))
                .fetchOne();

        return Optional.ofNullable(oRefreshToken);
    }

/*    public long deleteAllByRegIdAndDeviceId(Integer regId, String deviceId){

        return jpaQueryFactory
                .delete(refreshToken)
                .where(refreshToken.regId.eq(regId),
                        refreshToken.deviceId.eq(deviceId))
                .execute();

    }*/

}
