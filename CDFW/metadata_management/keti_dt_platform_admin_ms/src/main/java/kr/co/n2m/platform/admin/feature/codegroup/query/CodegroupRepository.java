package kr.co.n2m.platform.admin.feature.codegroup.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.codegroup.entity.Codegroup;

@Repository
public interface CodegroupRepository extends JpaRepository<Codegroup, String>{

}
