package kr.co.n2m.platform.admin.feature.apigroup.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.apigroup.entity.Api;

@Repository
public interface ApiRepository extends JpaRepository<Api, Long> {

}
