package kr.co.e8ight.ndxpro.fileservice.repository;

import kr.co.e8ight.ndxpro.fileservice.domain.FileUploadHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileUploadHistoryRepository extends JpaRepository<FileUploadHistory, Long> {
}
