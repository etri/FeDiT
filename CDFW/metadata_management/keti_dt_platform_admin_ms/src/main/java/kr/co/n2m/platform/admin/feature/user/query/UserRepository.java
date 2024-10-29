package kr.co.n2m.platform.admin.feature.user.query;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.n2m.platform.admin.feature.user.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

}
