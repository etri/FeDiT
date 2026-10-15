package kr.co.e8ight.ndxpro.fileservice.repository;

import kr.co.e8ight.ndxpro.fileservice.domain.FileUploadHistory;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface FileUploadHistoryRepository extends JpaRepository<FileUploadHistory, Long> {

  @Transactional
  void deleteAllByPhysicalFile(PhysicalFile physicalFile);
}
