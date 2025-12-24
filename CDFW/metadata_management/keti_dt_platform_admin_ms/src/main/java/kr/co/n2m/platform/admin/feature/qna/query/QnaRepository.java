package kr.co.n2m.platform.admin.feature.qna.query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.n2m.platform.admin.feature.qna.entity.Qna;

@Repository
public interface QnaRepository extends JpaRepository<Qna, Long> {

}
