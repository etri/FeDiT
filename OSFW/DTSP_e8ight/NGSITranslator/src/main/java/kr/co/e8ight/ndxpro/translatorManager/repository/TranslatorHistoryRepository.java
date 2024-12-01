package kr.co.e8ight.ndxpro.translatorManager.repository;

import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranslatorHistoryRepository extends JpaRepository<TranslatorHistory, Long> {
}
