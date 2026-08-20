package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.PriorityQueue;

@Component
@Getter
public class FileWriteQueue extends PriorityQueue<PhysicalFile> {

    @Value("${file-service.queue.size}")
    private Long capacity;

    private Long usedSize;

    public FileWriteQueue() {
        super(Comparator.comparing(PhysicalFile::getSize));
        this.usedSize = 0L;
    }

    @Override
    public boolean offer(PhysicalFile physicalFile) {
        if ( usedSize + physicalFile.getSize() > capacity ) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file upload failed because system is busy.");
        }

        usedSize += physicalFile.getSize();
        return super.offer(physicalFile);
    }

    @Override
    public PhysicalFile poll() {
        PhysicalFile physicalFile = super.poll();
        if (physicalFile != null) {
            usedSize -= physicalFile.getSize();
        }
        return physicalFile;
    }
}
