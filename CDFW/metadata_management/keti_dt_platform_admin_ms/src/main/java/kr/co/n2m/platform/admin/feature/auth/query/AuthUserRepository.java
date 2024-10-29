package kr.co.n2m.platform.admin.feature.auth.query;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.auth.entity.AuthUser;


@Repository
public interface AuthUserRepository extends JpaRepository<AuthUser, Long>{


}
