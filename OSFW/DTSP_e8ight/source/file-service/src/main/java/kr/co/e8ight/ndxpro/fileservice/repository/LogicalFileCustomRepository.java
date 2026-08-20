package kr.co.e8ight.ndxpro.fileservice.repository;

import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;

import java.util.List;

public interface LogicalFileCustomRepository {
    List<LogicalFile> findWithFilenameAndChecksum(String filename, String checksum);
    LogicalFile findOneWithUfId(String ufId);
}
