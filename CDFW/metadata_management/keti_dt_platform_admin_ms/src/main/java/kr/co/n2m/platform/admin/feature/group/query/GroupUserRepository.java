package kr.co.n2m.platform.admin.feature.group.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.group.entity.GroupUser;


@Repository
public interface GroupUserRepository extends JpaRepository<GroupUser, Long>{


}
