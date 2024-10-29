package kr.co.n2m.platform.admin.feature.group.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.group.entity.Group;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long>{

}
