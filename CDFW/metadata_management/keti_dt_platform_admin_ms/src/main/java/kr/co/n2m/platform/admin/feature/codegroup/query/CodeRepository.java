package kr.co.n2m.platform.admin.feature.codegroup.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.codegroup.entity.Code;

@Repository
public interface CodeRepository extends JpaRepository<Code, String>{

}
