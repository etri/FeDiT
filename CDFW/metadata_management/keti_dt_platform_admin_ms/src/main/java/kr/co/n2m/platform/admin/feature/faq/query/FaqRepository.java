package kr.co.n2m.platform.admin.feature.faq.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.faq.entity.Faq;

@Repository
public interface FaqRepository extends JpaRepository<Faq, String> {

}
