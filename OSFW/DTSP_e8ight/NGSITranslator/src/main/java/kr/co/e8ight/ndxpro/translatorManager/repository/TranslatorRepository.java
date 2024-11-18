package kr.co.e8ight.ndxpro.translatorManager.repository;

import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;

import javax.persistence.LockModeType;
import javax.persistence.QueryHint;
import java.util.Optional;

public interface TranslatorRepository extends JpaRepository<Translator, Long> {
    Optional<Translator> findByAgentIdAndModelTypeAndNameIsNotNull(Long agentId, String modelType);

    PageImpl<Translator> findByAgentIdAndNameIsNotNull(Long agentId, Pageable pageable);

    Optional<Object> findByName(String name);

    PageImpl<Translator> findByNameIsNotNull(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value = "3000")})
    @Query(value = "select t from Translator t where t.id = :translatorId")
    Optional<Translator> findByIdForUpdate(Long translatorId);
}
