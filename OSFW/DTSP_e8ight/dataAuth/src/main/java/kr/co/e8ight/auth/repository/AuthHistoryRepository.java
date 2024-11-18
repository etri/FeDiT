package kr.co.e8ight.auth.repository;

import kr.co.e8ight.auth.entity.AuthHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthHistoryRepository extends JpaRepository<AuthHistory, Integer> {
}
