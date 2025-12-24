package kr.co.n2m.platform.admin.feature.platform.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.platform.entity.Platform;

@Repository
public interface PlatformRepository extends JpaRepository<Platform, Long> {

}
