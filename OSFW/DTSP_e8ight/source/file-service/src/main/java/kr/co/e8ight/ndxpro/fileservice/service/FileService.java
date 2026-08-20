package kr.co.e8ight.ndxpro.fileservice.service;

import jakarta.annotation.PostConstruct;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.*;
import kr.co.e8ight.ndxpro.fileservice.repository.PhysicalFileRepository;
import kr.co.e8ight.ndxpro.fileservice.repository.LogicalFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileService {

    private final PhysicalFileRepository physicalFileRepository;
    private final LogicalFileRepository logicalFileRepository;
    private final UFIDBuilder ufIdBuilder;
    private final FilePathBuilder filePathBuilder;
    private final FileWriteQueue fileWriteQueue;
    private final FileUploadEvent fileUploadEvent;

    @PostConstruct
    private void setUp() {
        List<PhysicalFile> terminatedPhysicalFiles = physicalFileRepository.findByStatus(FileStatus.WAIT);
        terminatedPhysicalFiles.forEach(f -> f.setStatus(FileStatus.FAIL));
        physicalFileRepository.saveAll(terminatedPhysicalFiles);
    }

    public LogicalFileResponseDto uploadFile(MultipartFile multipartFile, String checksum) {
        if ( checksum == null ) {

        }

        String ufId = ufIdBuilder.buildUFID(checksum, multipartFile.getOriginalFilename());

        logicalFileRepository.findByUfId(ufId).ifPresent(file -> {
            throw new FileException(ErrorCode.ALREADY_EXISTS, "File with the same UFID already exists.");
        });

        Optional<PhysicalFile> optionalFile = physicalFileRepository.findByChecksum(checksum);
        PhysicalFile physicalFile = getPhysicalFile(multipartFile, checksum, optionalFile);

        LogicalFile logicalFile = logicalFileRepository.save(LogicalFile.create(ufId, multipartFile, physicalFile));
        return LogicalFileResponseDto.from(logicalFile);
    }

    private PhysicalFile getPhysicalFile(MultipartFile multipartFile, String checksum, Optional<PhysicalFile> optionalFile) {
        if ( optionalFile.isPresent() ) {
            return useExistingFile(multipartFile, optionalFile.get());
        } else {
            return createNewFile(multipartFile, checksum);
        }
    }

    private PhysicalFile createNewFile(MultipartFile multipartFile, String checksum) {
        PhysicalFile physicalFile = physicalFileRepository.save(PhysicalFile.create(multipartFile, checksum));
        String path = filePathBuilder.buildPath(physicalFile.getId());
        physicalFile.setPath(path + UUID.randomUUID());

        Observer<PhysicalFile> observer = registerObserver(physicalFile);
        fileWriteQueue.offer(physicalFile);
        physicalFile = waitFileUploadToComplete(observer);

        physicalFileRepository.save(physicalFile);

        if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "exceeded max file upload try count.");
        }

        return physicalFile;
    }

    private PhysicalFile useExistingFile(MultipartFile multipartFile, PhysicalFile physicalFile) {
        Observer<PhysicalFile> observer;

        if ( physicalFile.isDeleted() ) {
            physicalFile.restore();
            physicalFileRepository.save(physicalFile);
        }

        if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
            physicalFile.setStatus(FileStatus.WAIT);
            physicalFile.setMultipartFile(multipartFile);
            observer = registerObserver(physicalFile);
            fileWriteQueue.offer(physicalFile);
            physicalFile = waitFileUploadToComplete(observer);
            physicalFileRepository.save(physicalFile);
        }

        if ( physicalFile.getStatus().equals(FileStatus.WAIT) ) {
            observer = registerObserver(physicalFile);
            physicalFile = waitFileUploadToComplete(observer);
        }

        if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "exceeded max file upload try count.");
        }
        return physicalFile;
    }

    private PhysicalFile waitFileUploadToComplete(Observer<PhysicalFile> observer) {
        try {
            return observer.getFuture().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file upload waiting thread interrupt.");
        }
    }

    private Observer<PhysicalFile> registerObserver(PhysicalFile physicalFile) {
        FutureObserver<PhysicalFile> observer = new FutureObserver<>(physicalFile.getId(), new CompletableFuture<>());
        return fileUploadEvent.registerObserver(observer);
    }

    public LogicalFileListResponseDto getLogicalFile(String filename, String checksum) {
        List<LogicalFile> logicalFiles =
                logicalFileRepository.findWithFilenameAndChecksum(filename, checksum);

        return LogicalFileListResponseDto.from(logicalFiles);
    }

    public PhysicalFileResponseDto getPhysicalFile(String checksum) {
        PhysicalFile physicalFile = physicalFileRepository.findByChecksum(checksum).orElseThrow(
                () -> new FileException(ErrorCode.RESOURCE_NOT_FOUND, "file not found.")
        );
        return PhysicalFileResponseDto.from(physicalFile);
    }

    public LogicalFileResponseDto registerLogicalFile(LogicalFileRegisterDto registerDto) {
        String ufId = ufIdBuilder.buildUFID(registerDto.getChecksum(), registerDto.getFilename());

        logicalFileRepository.findByUfId(ufId).ifPresent(
                logicalFile -> {
                    throw new FileException(ErrorCode.ALREADY_EXISTS, "logical file(ufId:" + logicalFile.getUfId() + ") is already exists.");
                }
        );

        PhysicalFile physicalFile = physicalFileRepository.findByChecksumAndStatusNot(registerDto.getChecksum(), FileStatus.FAIL).orElseThrow(
                () -> new FileException(ErrorCode.RESOURCE_NOT_FOUND, "file not found.")
        );

        Observer<PhysicalFile> observer;
        if ( physicalFile.isDeleted() ) {
            physicalFile.restore();
        }
        if ( physicalFile.getStatus().equals(FileStatus.WAIT) ) {
            observer = registerObserver(physicalFile);
            physicalFile = waitFileUploadToComplete(observer);

            if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
                throw new FileException(FileErrorCode.FILE_IO_ERROR, "exceeded max file upload try count.");
            }
        }

        LogicalFile logicalFile = logicalFileRepository.save(LogicalFile.create(ufId, registerDto.getFilename(), physicalFile));
        return LogicalFileResponseDto.from(logicalFile);
    }

    public LogicalFile getLogicalFileWithUfIdAndNotDeleted(String ufId) {
        return logicalFileRepository.findByUfIdAndDeletedFalse(ufId).orElseThrow(
                () -> new FileException(ErrorCode.RESOURCE_NOT_FOUND, "logical file not found."));
    }

    @Transactional
    public LogicalFileResponseDto deleteFile(String ufId) {
        LogicalFile logicalFile = getLogicalFileWithUfIdAndNotDeleted(ufId);
        logicalFile.delete();

        if ( !isFileHasLiveLogicalFileRelation(logicalFile.getPhysicalFile()) ) {
            logicalFile.getPhysicalFile().delete();
        }

        //todo 비동기 파일 캐시 제거 요청

        return LogicalFileResponseDto.from(logicalFile);
    }

    private boolean isFileHasLiveLogicalFileRelation(PhysicalFile physicalFile) {
        return logicalFileRepository.existsByDeletedIsFalseAndPhysicalFile(physicalFile);
    }

    @Transactional
    public LogicalFileResponseDto updateFile(String ufId, LogicalFileRequestDto requestDto) {
        LogicalFile logicalFile = getLogicalFileWithUfId(ufId);

        if ( requestDto.getDeleted() != null ) {
            if ( requestDto.getDeleted() ) {
                logicalFile.delete();
            } else {
                logicalFile.restore();
                if ( logicalFile.getPhysicalFile().isDeleted() ) {
                    logicalFile.getPhysicalFile().restore();
                }
            }
        }
        return LogicalFileResponseDto.from(logicalFile);
    }

    private LogicalFile getLogicalFileWithUfId(String ufId) {
        return logicalFileRepository.findByUfId(ufId).orElseThrow(
                () -> new FileException(ErrorCode.RESOURCE_NOT_FOUND, "logical file not found."));
    }

    public FileInfoResponseDto getFileInfo(String ufId) {
        LogicalFile logicalFile = logicalFileRepository.findOneWithUfId(ufId);

        if ( logicalFile == null ) {
            throw new FileException(ErrorCode.RESOURCE_NOT_FOUND, "logical file not found.");
        }

        return FileInfoResponseDto
                .builder()
                .logicalFileInfo(LogicalFileResponseDto.from(logicalFile))
                .physicalFileInfo(PhysicalFileResponseDto.from(logicalFile.getPhysicalFile()))
                .build();
    }
}
