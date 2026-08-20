package kr.co.e8ight.ndxpro.fileservice.repository;

import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LogicalFileRepository extends JpaRepository<LogicalFile, Long>, LogicalFileCustomRepository {
    Optional<LogicalFile> findByUfId(String ufId);

    Optional<LogicalFile> findByUfIdAndDeletedFalse(String ufId);

    boolean existsByDeletedIsFalseAndPhysicalFile(PhysicalFile physicalFile);
}
