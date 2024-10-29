package kr.co.n2m.platform.admin.feature.faq.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;

@Repository
public interface FaqAttachFileRepository extends JpaRepository<AttachFile, Long> {

}
