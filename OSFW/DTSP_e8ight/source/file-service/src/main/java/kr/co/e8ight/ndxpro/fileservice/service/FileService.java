package kr.co.e8ight.ndxpro.fileservice.service;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.regex.Pattern;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.FileCopyResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.FileInfoResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.FileUploadResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileListResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileRegisterDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileRequestDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.PhysicalFileResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.TmpDirectoryResponseDto;
import kr.co.e8ight.ndxpro.fileservice.repository.FileUploadHistoryRepository;
import kr.co.e8ight.ndxpro.fileservice.repository.LogicalFileRepository;
import kr.co.e8ight.ndxpro.fileservice.repository.PhysicalFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileService {

    /** 임시 디렉터리 이름으로 허용하는 형식: ufId(32자리 hex) 또는 UUID */
    private static final Pattern TMP_DIRECTORY_NAME = Pattern.compile(
            "[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

    private final PhysicalFileRepository physicalFileRepository;
    private final FileUploadHistoryRepository fileUploadHistoryRepository;
    private final LogicalFileRepository logicalFileRepository;
    private final UFIDBuilder ufIdBuilder;
    private final FilePathBuilder filePathBuilder;
    private final FileWriteQueue fileWriteQueue;
    private final FileUploadEvent fileUploadEvent;
    private final FileIoService fileIoService;

    @PostConstruct
    private void setUp() {
        List<PhysicalFile> terminatedPhysicalFiles = physicalFileRepository.findByStatus(FileStatus.WAIT);
        terminatedPhysicalFiles.forEach(f -> f.setStatus(FileStatus.FAIL));
        physicalFileRepository.saveAll(terminatedPhysicalFiles);
    }

    public PhysicalFile uploadFile(MultipartFile multipartFile) {
        String checksum = fileIoService.getChecksumFromMultipartFile(multipartFile);

        Optional<PhysicalFile> optionalFile = physicalFileRepository.findByChecksum(checksum);
        return getPhysicalFile(multipartFile, checksum, optionalFile);
    }

    public PhysicalFile uploadFile(MultipartFile multipartFile, String checksum) {
        Optional<PhysicalFile> optionalFile = physicalFileRepository.findByChecksum(checksum);
        return getPhysicalFile(multipartFile, checksum, optionalFile);
    }

    public FileUploadResponseDto registerLogicalFile(PhysicalFile physicalFile) {
        String ufId = ufIdBuilder.buildUFID(physicalFile.getChecksum(), physicalFile.getMultipartFile().getOriginalFilename());

        Optional<LogicalFile> optionalLogicalFile = logicalFileRepository.findByUfId(ufId);

        if ( optionalLogicalFile.isPresent() ) {
            return FileUploadResponseDto.from(restoreIfDeleted(optionalLogicalFile.get()), true, physicalFile.getSize());
        }
        try {
            LogicalFile saved = logicalFileRepository.save(
                LogicalFile.create(ufId, physicalFile.getMultipartFile(), physicalFile));
            return FileUploadResponseDto.from(saved, false, physicalFile.getSize());
        } catch (DataIntegrityViolationException e) {
            // 동시 요청이 동일 ufId로 INSERT한 경우: 기존 행을 재조회해 이미 존재하던 것처럼 응답.
            LogicalFile existing = logicalFileRepository.findByUfId(ufId).orElseThrow(
                    () -> new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "logical file race recovery failed."));
            return FileUploadResponseDto.from(restoreIfDeleted(existing), true, physicalFile.getSize());
        }
    }

    /**
     * 삭제된 논리 파일을 재업로드로 되살린다.
     * 물리 파일은 useExistingFile에서 이미 복구되므로 논리 파일만 처리한다.
     */
    private LogicalFile restoreIfDeleted(LogicalFile logicalFile) {
        if ( !logicalFile.isDeleted() ) {
            return logicalFile;
        }

        logicalFile.restore();
        log.info("삭제된 논리 파일 복구 - ufId: {}", logicalFile.getUfId());

        return logicalFileRepository.save(logicalFile);
    }

    @Transactional
    public void deletePhysicalFileAndUploadHistory(PhysicalFile physicalFile) {
        fileUploadHistoryRepository.deleteAllByPhysicalFile(physicalFile);
        physicalFileRepository.delete(physicalFile);
    }

    private PhysicalFile getPhysicalFile(MultipartFile multipartFile, String checksum, Optional<PhysicalFile> optionalFile) {
        if ( optionalFile.isPresent() ) {
            return useExistingFile(multipartFile, optionalFile.get());
        } else {
            return createNewFile(multipartFile, checksum);
        }
    }

    private PhysicalFile useExistingFile(MultipartFile multipartFile, PhysicalFile physicalFile) {
        Observer<PhysicalFile> observer;
        physicalFile.setMultipartFile(multipartFile);

        if ( physicalFile.isDeleted() ) {
            physicalFile.restore();
            physicalFileRepository.save(physicalFile);
        }

        if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
            physicalFile.setStatus(FileStatus.WAIT);
            ensurePathAssigned(physicalFile);
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

    private PhysicalFile createNewFile(MultipartFile multipartFile, String checksum) {
        PhysicalFile physicalFile = physicalFileRepository.save(PhysicalFile.create(multipartFile, checksum));
        String path = filePathBuilder.buildPath(physicalFile.getId());
        physicalFile.setPath(path + buildStoredFileName(multipartFile));
        physicalFileRepository.save(physicalFile);

        Observer<PhysicalFile> observer = registerObserver(physicalFile);
        fileWriteQueue.offer(physicalFile);
        physicalFile = waitFileUploadToComplete(observer);

        physicalFileRepository.save(physicalFile);

        if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "exceeded max file upload try count.");
        }

        return physicalFile;
    }

    /**
     * path가 비어 있는 PhysicalFile에 경로를 재생성해 즉시 영속화한다.
     * 과거 실패로 path=NULL 상태가 된 행이 큐에 들어가 NPE를 일으키는 것을 방지한다.
     */
    private void ensurePathAssigned(PhysicalFile physicalFile) {
        if ( physicalFile.getPath() != null ) {
            return;
        }
        String path = filePathBuilder.buildPath(physicalFile.getId());
        physicalFile.setPath(path + buildStoredFileName(physicalFile.getMultipartFile()));
        physicalFileRepository.save(physicalFile);
    }

    /**
     * 디스크에 저장할 파일명을 만든다. UUID 뒤에 원본 파일의 확장자를 붙이고,
     * 확장자를 알 수 없으면 UUID만 사용한다.
     */
    private String buildStoredFileName(MultipartFile multipartFile) {
        String fileName = UUID.randomUUID().toString();

        if ( multipartFile == null ) {
            return fileName;
        }

        String extension = StringUtils.getFilenameExtension(multipartFile.getOriginalFilename());

        if ( !StringUtils.hasText(extension) ) {
            return fileName;
        }

        return fileName + "." + extension;
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
            physicalFile = physicalFileRepository.save(physicalFile);
        }
        if ( physicalFile.getStatus().equals(FileStatus.WAIT) ) {
            observer = registerObserver(physicalFile);
            physicalFile = waitFileUploadToComplete(observer);

            if ( physicalFile.getStatus().equals(FileStatus.FAIL) ) {
                throw new FileException(FileErrorCode.FILE_IO_ERROR, "exceeded max file upload try count.");
            }
        }

        try {
            LogicalFile logicalFile = logicalFileRepository.save(
                    LogicalFile.create(ufId, registerDto.getFilename(), physicalFile));
            return LogicalFileResponseDto.from(logicalFile);
        } catch (DataIntegrityViolationException e) {
            // 동시 요청이 동일 ufId로 INSERT한 경우: 기존 정책대로 ALREADY_EXISTS.
            throw new FileException(ErrorCode.ALREADY_EXISTS,
                    "logical file(ufId:" + ufId + ") is already exists.");
        }
    }

    /**
     * 이미 저장된 파일의 사본을 사본 디렉터리(file-service.copy-dir)/{ufId}/{원본 파일명}으로 만든다.
     * 같은 경로에 사본이 이미 있으면 덮어쓰며, DB에는 아무것도 등록하지 않는다.
     */
    public FileCopyResponseDto copyFile(String ufId) {
        LogicalFile logicalFile = getLogicalFileWithUfIdAndNotDeleted(ufId);
        PhysicalFile physicalFile = logicalFile.getPhysicalFile();

        if ( physicalFile.getStatus() != FileStatus.READY ) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "physical file is not ready. status: " + physicalFile.getStatus());
        }

        Path source = fileIoService.resolvePathInBaseDir(physicalFile.getPath());
        // 원본 파일명에 경로가 섞여 있어도 마지막 이름만 사용한다.
        String fileName = Paths.get(logicalFile.getOriginalName()).getFileName().toString();
        Path copied = fileIoService.copyFileToCopyDir(source, logicalFile.getUfId() + "/" + fileName, true);

        return FileCopyResponseDto.builder()
                .ufId(logicalFile.getUfId())
                .originalName(logicalFile.getOriginalName())
                .sourcePath(source.toString())
                .copiedPath(copied.toString())
                .size(physicalFile.getSize())
                .build();
    }

    /**
     * 사본 디렉토리(file-service.copy-dir) 아래에 UUID 이름의 임시 디렉토리를 만든다.
     */
    public TmpDirectoryResponseDto createTmpDirectory() {
        Path dir = fileIoService.createTmpDir();

        return TmpDirectoryResponseDto.builder()
                .name(dir.getFileName().toString())
                .path(dir.toString())
                .build();
    }

    /**
     * 임시 디렉터리(copy-dir/{name}) 안의 파일을 삭제한다. 디렉터리는 남긴다.
     * name은 copyFile로 만든 사본의 ufId이거나 createTmpDirectory로 만든 UUID다.
     * 논리 파일이 이미 삭제됐어도 사본은 지울 수 있도록 DB는 조회하지 않는다.
     */
    public void deleteCopy(String name) {
        if ( name == null || !TMP_DIRECTORY_NAME.matcher(name).matches() ) {
            throw new FileException(ErrorCode.BAD_REQUEST_DATA, "invalid ufId or uuid. " + name);
        }

        fileIoService.deleteCopyDir(name);
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

    public String setCalculatedChecksumFromPhysicalFile(PhysicalFile physicalFile) {
        byte[] b = createChecksum(physicalFile.getPath());
        StringBuilder result = new StringBuilder();

        for (int i=0; i < b.length; i++) {
            result.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
        }

        physicalFile.setChecksum(result.toString());
        return result.toString();
    }

    public byte[] createChecksum(String path) {
        try (InputStream fis = new FileInputStream(path)) {
            byte[] buffer = new byte[1024];
            MessageDigest complete = MessageDigest.getInstance("MD5");
            int numRead;

            do {
                numRead = fis.read(buffer);
                if (numRead > 0) {
                    complete.update(buffer, 0, numRead);
                }
            } while (numRead != -1);

            return complete.digest();
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public PhysicalFile createNewFileInTempDir(MultipartFile multipartFile) {
        PhysicalFile physicalFile = PhysicalFile.create(multipartFile, null);
        physicalFile.setPath("/tmp/" + buildStoredFileName(multipartFile));
        try {
            fileIoService.writeFile(physicalFile.getPath(), physicalFile.getMultipartFile());
        } catch (IOException e) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file write error. " + e.getMessage());
        }
        physicalFile.setChecksum(calculatedChecksumFromPhysicalFile(physicalFile));

        Optional<PhysicalFile> optionalFile = physicalFileRepository.findByChecksum(physicalFile.getChecksum());

        if ( optionalFile.isPresent() ) {
            PhysicalFile existedFile = optionalFile.get();
            existedFile.setMultipartFile(multipartFile);
            return existedFile;
        } else {
            return createNewFile(physicalFile.getMultipartFile(), physicalFile.getChecksum());
        }
    }

    private String calculatedChecksumFromPhysicalFile(PhysicalFile physicalFile) {
        byte[] b = createChecksum(physicalFile.getPath());
        StringBuilder result = new StringBuilder();

        for (int i=0; i < b.length; i++) {
            result.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
        }

        return result.toString();
    }
}
