package kr.co.e8ight.ndxpro.fileservice.repository;

import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PhysicalFileRepository extends JpaRepository<PhysicalFile, Long> {
    Optional<PhysicalFile> findByChecksum(String checksum);

    List<PhysicalFile> findByStatus(FileStatus fail);

    Optional<PhysicalFile> findByChecksumAndStatusNot(String checksum, FileStatus fileStatus);
}
