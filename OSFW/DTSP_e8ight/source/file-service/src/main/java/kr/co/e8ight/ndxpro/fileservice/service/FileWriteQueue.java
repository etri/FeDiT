package kr.co.e8ight.ndxpro.fileservice.service;

import static java.util.Comparator.comparingLong;

import java.util.Comparator;
import java.util.PriorityQueue;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class FileWriteQueue {

    @Value("${file-service.queue.size}")
    private Long capacity;

    private Long usedSize;

    PriorityQueue<PhysicalFile> fileQueue;


    public FileWriteQueue() {
        fileQueue = new PriorityQueue<>(Comparator.nullsLast(comparingLong(PhysicalFile::getSize)));
        this.usedSize = 0L;
    }

    public synchronized boolean offer(PhysicalFile physicalFile) {
        if ( usedSize + physicalFile.getSize() > capacity ) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file upload failed because system is busy.");
        }

        usedSize += physicalFile.getSize();
        return this.fileQueue.offer(physicalFile);
    }

    public synchronized PhysicalFile poll() {
        PhysicalFile physicalFile = this.fileQueue.poll();
        if (physicalFile != null) {
            usedSize -= physicalFile.getSize();
        }
        return physicalFile;
    }

    public synchronized boolean isEmpty() {
        return this.fileQueue.isEmpty();
    }
}
