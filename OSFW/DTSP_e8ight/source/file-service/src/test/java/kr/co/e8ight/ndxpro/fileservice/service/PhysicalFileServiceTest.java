package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.fileservice.ReplaceCamelCase;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.FileUploadResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileResponseDto;
import kr.co.e8ight.ndxpro.fileservice.repository.PhysicalFileRepository;
import kr.co.e8ight.ndxpro.fileservice.repository.LogicalFileRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.DigestUtils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayNameGeneration(ReplaceCamelCase.class)
class PhysicalFileServiceTest {

    @InjectMocks
    FileService fileService;

    @Mock
    PhysicalFileRepository physicalFileRepository;
    @Mock
    LogicalFileRepository logicalFileRepository;
    @Mock
    UFIDBuilder ufIdBuilder;
    @Mock
    FilePathBuilder filePathBuilder;
    @Mock
    FileWriteQueue fileWriteQueue;
    @Mock
    FileUploadEvent fileUploadEvent;

    private MockMultipartFile multipartFile;
    private String checksum;

    @BeforeEach
    public void setup() throws IOException {
        java.io.File file = new java.io.File("src/test/resources/test.txt");
        checksum = DigestUtils.md5DigestAsHex(new FileInputStream(file));
        multipartFile = new MockMultipartFile("file", file.getName(), "text/html; charset=utf-8", new FileInputStream(file));
    }

    @Nested
    class PhysicalFileUploadTest {
        @Test
        void successWithNewPhysicalFile() {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = PhysicalFile.create(multipartFile, checksum);
            CompletableFuture<PhysicalFile> future = new CompletableFuture<>();
            FutureObserver<PhysicalFile> observer = new FutureObserver<>(physicalFile.getId(), future);

            given(physicalFileRepository.findByChecksum(checksum))
              .willReturn(Optional.empty());
            given(physicalFileRepository.save(any(PhysicalFile.class)))
                    .willReturn(physicalFile);
            given(filePathBuilder.buildPath(physicalFile.getId()))
                    .willReturn(path);
            given(fileUploadEvent.registerObserver(any(Observer.class)))
                    .willReturn(observer);

            observer.getFuture().complete(new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + UUID.randomUUID(),
                    FileStatus.READY,
                    false,
                    0,
                    null));
            PhysicalFile result = fileService.uploadFile(multipartFile, checksum);

            assertThat(result.getChecksum()).isEqualTo(checksum);
            assertThat(result.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(result.getPath().startsWith(path)).isTrue();
            assertThat(result.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(result.getUploadFailCount()).isEqualTo(0);

            verify(filePathBuilder).buildPath(physicalFile.getId());
            verify(fileWriteQueue).offer(any(PhysicalFile.class));
            verify(fileUploadEvent).registerObserver(any(Observer.class));
        }

        @Test
        void successWithExistPhysicalFileIsReady() throws IOException {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + UUID.randomUUID(),
                    FileStatus.READY,
                    false,
                    0,
                    multipartFile);
            LogicalFile logicalFile = LogicalFile.create(ufId, multipartFile, physicalFile);

            given(physicalFileRepository.findByChecksum(checksum))
                    .willReturn(Optional.of(physicalFile));

            PhysicalFile responseDto = fileService.uploadFile(multipartFile, checksum);

            assertThat(responseDto.getChecksum()).isEqualTo(checksum);
            assertThat(responseDto.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(responseDto.getPath().startsWith(path)).isTrue();
            assertThat(responseDto.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(responseDto.getUploadFailCount()).isEqualTo(0);

            verify(filePathBuilder, never()).buildPath(physicalFile.getId());
            verify(fileWriteQueue, never()).offer(any(PhysicalFile.class));
            verify(fileUploadEvent, never()).registerObserver(any(Observer.class));
        }

        @Test
        void successWithExistPhysicalFileIsWait() throws IOException {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/" + UUID.randomUUID();
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path,
                    FileStatus.WAIT,
                    false,
                    0,
                    multipartFile);
            CompletableFuture<PhysicalFile> future = new CompletableFuture<>();
            FutureObserver<PhysicalFile> observer = new FutureObserver<>(physicalFile.getId(), future);

            given(physicalFileRepository.findByChecksum(checksum))
                    .willReturn(Optional.of(physicalFile));
            given(fileUploadEvent.registerObserver(any(Observer.class)))
                    .willReturn(observer);

            observer.getFuture().complete(new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + UUID.randomUUID(),
                    FileStatus.READY,
                    false,
                    0,
                    multipartFile));
            PhysicalFile responseDto = fileService.uploadFile(multipartFile, checksum);

            assertThat(responseDto.getChecksum()).isEqualTo(checksum);
            assertThat(responseDto.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(responseDto.getPath().startsWith(path)).isTrue();
            assertThat(responseDto.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(responseDto.getUploadFailCount()).isEqualTo(0);

            verify(filePathBuilder, never()).buildPath(physicalFile.getId());
            verify(fileWriteQueue, never()).offer(any(PhysicalFile.class));
            verify(fileUploadEvent).registerObserver(any(Observer.class));
        }

        @Test
        void successWithExistPhysicalFileIsFail() throws IOException {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/" + UUID.randomUUID();
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path,
                    FileStatus.FAIL,
                    false,
                    0,
                    multipartFile);
            CompletableFuture<PhysicalFile> future = new CompletableFuture<>();
            FutureObserver<PhysicalFile> observer = new FutureObserver<>(physicalFile.getId(), future);

            given(physicalFileRepository.findByChecksum(checksum))
                    .willReturn(Optional.of(physicalFile));
            given(fileUploadEvent.registerObserver(any(Observer.class)))
                    .willReturn(observer);

            observer.getFuture().complete(new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + UUID.randomUUID(),
                    FileStatus.READY,
                    false,
                    0,
                    multipartFile));
            PhysicalFile responseDto = fileService.uploadFile(multipartFile, checksum);

            assertThat(responseDto.getChecksum()).isEqualTo(checksum);
            assertThat(responseDto.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(responseDto.getPath().startsWith(path)).isTrue();
            assertThat(responseDto.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(responseDto.getUploadFailCount()).isEqualTo(0);

            verify(filePathBuilder, never()).buildPath(physicalFile.getId());
            verify(fileWriteQueue).offer(any(PhysicalFile.class));
            verify(fileUploadEvent).registerObserver(any(Observer.class));
        }

        @Test
        void successWithExistPhysicalFileIsDeleted() throws IOException {
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + UUID.randomUUID(),
                    FileStatus.READY,
                    true,
                    0,
                    multipartFile);
            given(physicalFileRepository.findByChecksum(checksum))
                    .willReturn(Optional.of(physicalFile));

            PhysicalFile responseDto = fileService.uploadFile(multipartFile, checksum);

            assertThat(responseDto.getChecksum()).isEqualTo(checksum);
            assertThat(responseDto.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(responseDto.getPath().startsWith(path)).isTrue();
            assertThat(responseDto.isDeleted()).isFalse();
            assertThat(responseDto.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(responseDto.getUploadFailCount()).isEqualTo(0);

            verify(filePathBuilder, never()).buildPath(physicalFile.getId());
            verify(fileWriteQueue, never()).offer(any(PhysicalFile.class));
            verify(fileUploadEvent, never()).registerObserver(any(Observer.class));
        }

        @Test
        void failCausedByFileIoError() {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = PhysicalFile.create(multipartFile, checksum);
            CompletableFuture<PhysicalFile> future = new CompletableFuture<>();
            FutureObserver<PhysicalFile> observer = new FutureObserver<>(physicalFile.getId(), future);

            given(physicalFileRepository.findByChecksum(checksum))
              .willReturn(Optional.empty());
            given(physicalFileRepository.save(any(PhysicalFile.class)))
                    .willReturn(physicalFile);
            given(filePathBuilder.buildPath(physicalFile.getId()))
                    .willReturn(path);
            given(fileUploadEvent.registerObserver(any(Observer.class)))
                    .willReturn(observer);

            observer.getFuture().complete(new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + multipartFile.getOriginalFilename(),
                    FileStatus.FAIL,
                    false,
                    0,
                    null));
            assertThrows(FileException.class,
                    () -> fileService.uploadFile(multipartFile, checksum));

            verify(filePathBuilder).buildPath(physicalFile.getId());
            verify(fileWriteQueue).offer(any(PhysicalFile.class));
            verify(fileUploadEvent).registerObserver(any(Observer.class));
            verify(physicalFileRepository, times(2)).save(any(PhysicalFile.class));
            verify(logicalFileRepository, never()).save(any(LogicalFile.class));
        }
    }

    @Nested
    class LogicalPhysicalFileRegistrationTest {
        @Test
        void success() {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + multipartFile.getOriginalFilename(),
                    FileStatus.READY,
                    false,
                    0,
                    multipartFile);
            LogicalFile logicalFile = LogicalFile.create(ufId, multipartFile, physicalFile);
            given(ufIdBuilder.buildUFID(checksum, multipartFile.getOriginalFilename()))
                    .willReturn(ufId);
            given(logicalFileRepository.findByUfId(ufId))
                    .willReturn(Optional.empty());
            ArgumentCaptor<LogicalFile> captor = ArgumentCaptor.forClass(LogicalFile.class);
            given(logicalFileRepository.save(captor.capture()))
                    .willReturn(logicalFile);

            FileUploadResponseDto responseDto = fileService.registerLogicalFile(physicalFile);

            assertThat(responseDto.getUfId()).isEqualTo(ufId);
            assertThat(responseDto.getOriginalName()).isEqualTo(multipartFile.getOriginalFilename());
            assertThat(responseDto.getExtension()).isEqualTo(multipartFile.getOriginalFilename().split("\\.")[1]);
            assertThat(captor.getValue().getPhysicalFile().getChecksum()).isEqualTo(checksum);
            assertThat(captor.getValue().getPhysicalFile().getStatus()).isEqualTo(FileStatus.READY);
            assertThat(captor.getValue().getPhysicalFile().getPath().startsWith(path)).isTrue();
            assertThat(captor.getValue().getPhysicalFile().getSize()).isEqualTo(multipartFile.getSize());
            assertThat(captor.getValue().getPhysicalFile().getUploadFailCount()).isEqualTo(0);
        }

        @Test
        void successWithRestore() {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + multipartFile.getOriginalFilename(),
                    FileStatus.READY,
                    true,
                    0,
                    multipartFile);
            LogicalFile logicalFile = LogicalFile.create(ufId, multipartFile, physicalFile);
            given(ufIdBuilder.buildUFID(checksum, multipartFile.getOriginalFilename()))
                    .willReturn(ufId);
            given(logicalFileRepository.findByUfId(ufId))
                    .willReturn(Optional.empty());
            ArgumentCaptor<LogicalFile> captor = ArgumentCaptor.forClass(LogicalFile.class);
            given(logicalFileRepository.save(captor.capture()))
                    .willReturn(logicalFile);

            FileUploadResponseDto responseDto = fileService.registerLogicalFile(physicalFile);

            assertThat(responseDto.getUfId()).isEqualTo(ufId);
            assertThat(responseDto.getOriginalName()).isEqualTo(multipartFile.getOriginalFilename());
            assertThat(responseDto.getExtension()).isEqualTo(multipartFile.getOriginalFilename().split("\\.")[1]);
            assertThat(captor.getValue().getPhysicalFile().getChecksum()).isEqualTo(checksum);
            assertThat(captor.getValue().getPhysicalFile().getStatus()).isEqualTo(FileStatus.READY);
            assertThat(captor.getValue().getPhysicalFile().getPath().startsWith(path)).isTrue();
            assertThat(captor.getValue().getPhysicalFile().getSize()).isEqualTo(multipartFile.getSize());
            assertThat(captor.getValue().getPhysicalFile().getUploadFailCount()).isEqualTo(0);
        }

        @Test
        void successWithPhysicalFileIsWait() throws IOException {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + multipartFile.getOriginalFilename(),
                    FileStatus.WAIT,
                    false,
                    0,
                    multipartFile);
            LogicalFile logicalFile = LogicalFile.create(ufId, multipartFile, physicalFile);
            given(ufIdBuilder.buildUFID(checksum, multipartFile.getOriginalFilename()))
                    .willReturn(ufId);
            given(logicalFileRepository.findByUfId(ufId))
                    .willReturn(Optional.empty());
            ArgumentCaptor<LogicalFile> captor = ArgumentCaptor.forClass(LogicalFile.class);
            given(logicalFileRepository.save(captor.capture()))
                    .willReturn(logicalFile);

            FileUploadResponseDto responseDto = fileService.registerLogicalFile(physicalFile);

            assertThat(responseDto.getUfId()).isEqualTo(ufId);
            assertThat(responseDto.getOriginalName()).isEqualTo(multipartFile.getOriginalFilename());
            assertThat(responseDto.getExtension()).isEqualTo(multipartFile.getOriginalFilename().split("\\.")[1]);
            assertThat(captor.getValue().getPhysicalFile().getChecksum()).isEqualTo(checksum);
            assertThat(captor.getValue().getPhysicalFile().getStatus()).isEqualTo(FileStatus.WAIT);
            assertThat(captor.getValue().getPhysicalFile().getPath().startsWith(path)).isTrue();
            assertThat(captor.getValue().getPhysicalFile().getSize()).isEqualTo(multipartFile.getSize());
            assertThat(captor.getValue().getPhysicalFile().getUploadFailCount()).isEqualTo(0);
        }
    }

    @Nested
    class PhysicalFileDeleteTest {
        @Test
        void success() {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + multipartFile.getOriginalFilename(),
                    FileStatus.READY,
                    false,
                    0,
                    null);
            LogicalFile logicalFile = LogicalFile.create(ufId, multipartFile, physicalFile);
            given(logicalFileRepository.findByUfIdAndDeletedFalse(ufId))
                    .willReturn(Optional.of(logicalFile));
            given(logicalFileRepository.existsByDeletedIsFalseAndPhysicalFile(any(PhysicalFile.class)))
                    .willReturn(true);

            LogicalFileResponseDto responseDto = fileService.deleteFile(ufId);

            assertThat(responseDto.getUfId()).isEqualTo(ufId);
            assertThat(responseDto.getOriginalName()).isEqualTo(multipartFile.getOriginalFilename());
            assertThat(responseDto.getExtension()).isEqualTo(multipartFile.getOriginalFilename().split("\\.")[1]);
            assertThat(responseDto.isDeleted()).isTrue();
            assertThat(physicalFile.getChecksum()).isEqualTo(checksum);
            assertThat(physicalFile.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(physicalFile.getPath().startsWith(path)).isTrue();
            assertThat(physicalFile.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(physicalFile.getUploadFailCount()).isEqualTo(0);
            assertThat(physicalFile.isDeleted()).isFalse();
        }

        @Test
        void successWithDeletePhysicalFileToo() {
            
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/";
            PhysicalFile physicalFile = new PhysicalFile(
                    1L,
                    multipartFile.getSize(),
                    checksum,
                    path + multipartFile.getOriginalFilename(),
                    FileStatus.READY,
                    false,
                    0,
                    null);
            LogicalFile logicalFile = LogicalFile.create(ufId, multipartFile, physicalFile);
            given(logicalFileRepository.findByUfIdAndDeletedFalse(ufId))
                    .willReturn(Optional.of(logicalFile));
            given(logicalFileRepository.existsByDeletedIsFalseAndPhysicalFile(any(PhysicalFile.class)))
                    .willReturn(false);

            LogicalFileResponseDto responseDto = fileService.deleteFile(ufId);

            assertThat(responseDto.getUfId()).isEqualTo(ufId);
            assertThat(responseDto.getOriginalName()).isEqualTo(multipartFile.getOriginalFilename());
            assertThat(responseDto.getExtension()).isEqualTo(multipartFile.getOriginalFilename().split("\\.")[1]);
            assertThat(responseDto.isDeleted()).isTrue();
            assertThat(physicalFile.getChecksum()).isEqualTo(checksum);
            assertThat(physicalFile.getStatus()).isEqualTo(FileStatus.READY);
            assertThat(physicalFile.getPath().startsWith(path)).isTrue();
            assertThat(physicalFile.getSize()).isEqualTo(multipartFile.getSize());
            assertThat(physicalFile.getUploadFailCount()).isEqualTo(0);
            assertThat(physicalFile.isDeleted()).isTrue();
        }

        @Test
        void failCausedByNotFoundUniqueFileId() {
            String ufId = "ufId";
            given(logicalFileRepository.findByUfIdAndDeletedFalse(ufId))
                    .willReturn(Optional.empty());

            assertThrows(FileException.class,
                    () -> fileService.deleteFile(ufId));

            verify(logicalFileRepository, never()).existsByDeletedIsFalseAndPhysicalFile(any(PhysicalFile.class));
        }
    }
}