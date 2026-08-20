package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class MimeTypeDetector {

    private final Tika tika = new Tika();

    public String getMimeTypeFromLogicalFile(LogicalFile logicalFile) {
        File file = new File(logicalFile.getPhysicalFile().getPath());
        try {
            return tika.detect(file);
        } catch (IOException e) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file can not be read.");
        }
    }
}
