package kr.co.e8ight.ndxpro.fileservice.controller;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.GlobalExceptionHandler;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.PhysicalFileResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileListResponseDto;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.LogicalFileResponseDto;
import kr.co.e8ight.ndxpro.fileservice.service.FileIoService;
import kr.co.e8ight.ndxpro.fileservice.service.FileService;
import kr.co.e8ight.ndxpro.fileservice.service.MimeTypeDetector;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = FileController.class)
@Import(GlobalExceptionHandler.class)
@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)
class PhysicalFileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FileService fileService;
    @MockBean
    private FileIoService fileIoService;
    @MockBean
    private MimeTypeDetector mimeTypeDetector;

    private MockMultipartFile multipartFile;
    private String checksum;

    @BeforeEach
    public void setup() throws IOException {
        File file = new File("src/test/resources/test.txt");
        checksum = DigestUtils.md5DigestAsHex(new FileInputStream(file));
        multipartFile = new MockMultipartFile("file", file.getName(), "text/html; charset=utf-8", new FileInputStream(file));
    }

    @Nested
    class PhysicalFileUploadMVCTest {
        @Test
        void success() throws Exception {
            LogicalFileResponseDto responseDto = LogicalFileResponseDto.builder()
                    .id(1L)
                    .ufId("ufId")
                    .owner("tester")
                    .isDeleted(false)
                    .originalName(multipartFile.getOriginalFilename())
                    .extension(StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()))
                    .build();

            String documentName = "test";
            given(fileService.uploadFile(any(MultipartFile.class), eq(checksum), eq(documentName)))
                    .willReturn(responseDto);

            mockMvc.perform(multipart(HttpMethod.POST, "/ndxpro/v1/file-service/files")
                            .file(multipartFile)
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isCreated())
                    .andExpect(redirectedUrl("/files/" + responseDto.getUfId()))
                    .andExpect(jsonPath("id").value(responseDto.getId()))
                    .andExpect(jsonPath("ufId").value(responseDto.getUfId()))
                    .andExpect(jsonPath("originalName").value(responseDto.getOriginalName()))
                    .andExpect(jsonPath("extension").value(responseDto.getExtension()))
                    .andExpect(jsonPath("owner").value(responseDto.getOwner()));
        }

        @Test
        void failCausedByWithoutDocumentName() throws Exception {
            mockMvc.perform(multipart(HttpMethod.POST, "/ndxpro/v1/file-service/files")
                            .file(multipartFile)
                            .param("checksum", checksum))
                    .andDo(print())
                    //then
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("code").exists());
        }

        @Test
        void failCausedByExistUniqueFileId() throws Exception {
            String documentName = "test";
            given(fileService.uploadFile(any(MultipartFile.class), eq(checksum), eq(documentName)))
                    .willThrow(new FileException(ErrorCode.ALREADY_EXISTS, "File with the same UFID already exists."));

            mockMvc.perform(multipart(HttpMethod.POST, "/ndxpro/v1/file-service/files")
                            .file(multipartFile)
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("code").exists());
        }

        @Test
        void failCausedByFileIoError() throws Exception {
            String documentName = "test";
            given(fileService.uploadFile(any(MultipartFile.class), eq(checksum), eq(documentName)))
                    .willThrow(new FileException(FileErrorCode.FILE_IO_ERROR, "exceeded max file upload try count."));

            mockMvc.perform(multipart(HttpMethod.POST, "/ndxpro/v1/file-service/files")
                            .file(multipartFile)
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().is5xxServerError())
                    .andExpect(jsonPath("code").exists());
        }
    }

    @Nested
    class PhysicalPhysicalFileSearchTest {
        @Test
        void success() throws Exception {
            PhysicalFileResponseDto responseDto = PhysicalFileResponseDto.builder()
                    .id(1L)
                    .path("./data/0x00/0x00/0x00/0x00")
                    .size(multipartFile.getSize())
                    .status(FileStatus.READY)
                    .deleted(false)
                    .checksum(checksum)
                    .build();

            given(fileService.getPhysicalFile(checksum)).willReturn(responseDto);

            mockMvc.perform(get("/ndxpro/v1/file-service/physical-files")
                            .param("checksum", checksum))
                    .andDo(print())
                    //then
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("id").value(responseDto.getId()))
                    .andExpect(jsonPath("path").value(responseDto.getPath()))
                    .andExpect(jsonPath("size").value(responseDto.getSize()))
                    .andExpect(jsonPath("status").value(responseDto.getStatus().name()))
                    .andExpect(jsonPath("deleted").value(responseDto.isDeleted()))
                    .andExpect(jsonPath("checksum").value(responseDto.getChecksum()));
        }

        @Test
        void failCausedByNotFoundPhysicalFile() throws Exception {
            given(fileService.getPhysicalFile(checksum))
                    .willThrow(new FileException(ErrorCode.RESOURCE_NOT_FOUND, "file not found."));

            mockMvc.perform(get("/ndxpro/v1/file-service/physical-files")
                            .param("checksum", checksum))
                    .andDo(print())
                    //then
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("code").exists());
        }
    }

    @Nested
    class LogicalPhysicalFileSearchTest {
        @Test
        void success() throws Exception {
            List<LogicalFileResponseDto> list = new ArrayList<>();
            LogicalFileResponseDto responseDto = LogicalFileResponseDto.builder()
                    .id(1L)
                    .ufId("ufId")
                    .owner("tester")
                    .isDeleted(false)
                    .originalName(multipartFile.getOriginalFilename())
                    .extension(StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()))
                    .build();
            list.add(responseDto);
            LogicalFileListResponseDto listResponseDto = new LogicalFileListResponseDto(list);

            String documentName = "test";
            given(fileService.getLogicalFile(multipartFile.getOriginalFilename(), checksum, documentName))
                    .willReturn(listResponseDto);

            mockMvc.perform(get("/ndxpro/v1/file-service/logical-files")
                            .param("filename", multipartFile.getOriginalFilename())
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.list.length()").value(1))
                    .andExpect(jsonPath("$.list[?(@.id == '%s')]", responseDto.getId()).exists())
                    .andExpect(jsonPath("$.list[?(@.ufId == '%s')]", responseDto.getUfId()).exists())
                    .andExpect(jsonPath("$.list[?(@.originalName == '%s')]", responseDto.getOriginalName()).exists())
                    .andExpect(jsonPath("$.list[?(@.extension == '%s')]", responseDto.getExtension()).exists())
                    .andExpect(jsonPath("$.list[?(@.owner == '%s')]", responseDto.getOwner()).exists());
        }

        @Test
        void successWithoutQueryParameters() throws Exception {
            LogicalFileListResponseDto listResponseDto = new LogicalFileListResponseDto(List.of());
            given(fileService.getLogicalFile(null, null, null))
                    .willReturn(listResponseDto);

            mockMvc.perform(get("/ndxpro/v1/file-service/logical-files"))
                    .andDo(print())
                    //then
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.list.length()").value(0));
        }
    }

    @Nested
    class LogicalPhysicalFileRegistrationTest {
        @Test
        void success() throws Exception {
            LogicalFileResponseDto responseDto = LogicalFileResponseDto.builder()
                    .id(1L)
                    .ufId("ufId")
                    .owner("tester")
                    .isDeleted(false)
                    .originalName(multipartFile.getOriginalFilename())
                    .extension(StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()))
                    .build();

            String documentName = "test";
            given(fileService.registerLogicalFile(multipartFile.getOriginalFilename(), checksum, documentName))
                    .willReturn(responseDto);

            mockMvc.perform(post("/ndxpro/v1/file-service/logical-files")
                            .param("filename", multipartFile.getOriginalFilename())
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isCreated())
                    .andExpect(redirectedUrl("/files/" + responseDto.getUfId()))
                    .andExpect(jsonPath("id").value(responseDto.getId()))
                    .andExpect(jsonPath("ufId").value(responseDto.getUfId()))
                    .andExpect(jsonPath("originalName").value(responseDto.getOriginalName()))
                    .andExpect(jsonPath("extension").value(responseDto.getExtension()))
                    .andExpect(jsonPath("owner").value(responseDto.getOwner()));
        }

        @Test
        void failCausedByMissingArguments() throws Exception {
            mockMvc.perform(post("/ndxpro/v1/file-service/logical-files")
                            .param("filename", multipartFile.getOriginalFilename())
                            .param("checksum", checksum))
                    .andDo(print())
                    //then
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("code").exists());
        }

        @Test
        void failCausedByExistUniqueFileId() throws Exception {
            String documentName = "test";
            given(fileService.registerLogicalFile(multipartFile.getOriginalFilename(), checksum, documentName))
                    .willThrow(new FileException(ErrorCode.ALREADY_EXISTS, "logical file(ufId:" + "ufId" + ") is already exists."));

            mockMvc.perform(post("/ndxpro/v1/file-service/logical-files")
                            .param("filename", multipartFile.getOriginalFilename())
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("code").exists());
        }

        @Test
        void failCausedByNotFoundPhysicalFile() throws Exception {
            String documentName = "test";
            given(fileService.registerLogicalFile(multipartFile.getOriginalFilename(), checksum, documentName))
                    .willThrow(new FileException(ErrorCode.RESOURCE_NOT_FOUND, "file not found."));

            mockMvc.perform(post("/ndxpro/v1/file-service/logical-files")
                            .param("filename", multipartFile.getOriginalFilename())
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("code").exists());
        }

        @Test
        void failCausedByWaitingFileUploadThreadIsInterrupted() throws Exception {
            String documentName = "test";
            given(fileService.registerLogicalFile(multipartFile.getOriginalFilename(), checksum, documentName))
                    .willThrow(new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file upload waiting thread interrupt."));

            mockMvc.perform(post("/ndxpro/v1/file-service/logical-files")
                            .param("filename", multipartFile.getOriginalFilename())
                            .param("checksum", checksum)
                            .param("document_name", documentName))
                    .andDo(print())
                    //then
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("code").exists());
        }
    }

    @Nested
    class PhysicalFileDownloadTest {
        @Test
        void success() throws Exception {
            String documentName = "test";
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/" + UUID.randomUUID();
            LogicalFile logicalFile = new LogicalFile(
                    1L,
                    ufId,
                    multipartFile.getOriginalFilename(),
                    StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()),
                    "tester",
                    false,
                    documentName,
                    new PhysicalFile(
                            1L,
                            multipartFile.getSize(),
                            checksum,
                            path,
                            FileStatus.READY,
                            false,
                            0,
                            null)
            );

            given(fileService.getLogicalFileWithUfIdAndNotDeleted(ufId)).willReturn(logicalFile);
            given(fileIoService.getByteArrayFromFilePath(path)).willReturn(multipartFile.getBytes());
            given(mimeTypeDetector.getMimeTypeFromLogicalFile(any(LogicalFile.class))).willReturn("text/plain");

            mockMvc.perform(get("/ndxpro/v1/file-service/files/" + ufId))
                    .andDo(print())
                    //then
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type","text/plain;charset=UTF-8"))
                    .andExpect(header().exists("Content-Disposition"))
                    .andExpect(header().longValue("Content-Length",multipartFile.getSize()));

            verify(fileIoService).getByteArrayFromFilePath(path);
        }

        @Test
        void failCausedByNotFoundLogicalFile() throws Exception {
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/" + UUID.randomUUID();

            given(fileService.getLogicalFileWithUfIdAndNotDeleted(ufId)).willThrow(
                    new FileException(ErrorCode.RESOURCE_NOT_FOUND, "logical file not found.")
            );

            mockMvc.perform(get("/ndxpro/v1/file-service/files/" + ufId))
                    .andDo(print())
                    //then
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("code").exists());

            verify(fileIoService, never()).getByteArrayFromFilePath(path);
        }

        @Test
        void failCausedByFileIoError() throws Exception {
            String documentName = "test";
            String ufId = "ufId";
            String path = "./data/0x00/0x00/0x00/0x00/" + UUID.randomUUID();
            LogicalFile logicalFile = new LogicalFile(
                    1L,
                    ufId,
                    multipartFile.getOriginalFilename(),
                    StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()),
                    "tester",
                    false,
                    documentName,
                    new PhysicalFile(
                            1L,
                            multipartFile.getSize(),
                            checksum,
                            path,
                            FileStatus.READY,
                            false,
                            0,
                            null)
            );

            given(fileService.getLogicalFileWithUfIdAndNotDeleted(ufId)).willReturn(logicalFile);
            given(fileIoService.getByteArrayFromFilePath(path)).willThrow(
                    new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "read file error. "));
            given(mimeTypeDetector.getMimeTypeFromLogicalFile(any(LogicalFile.class))).willReturn("text/plain");

            mockMvc.perform(get("/ndxpro/v1/file-service/files/" + ufId))
                    .andDo(print())
                    //then
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("code").exists());

            verify(fileIoService).getByteArrayFromFilePath(path);
        }
    }

    @Nested
    class PhysicalFileDeleteTest {
        @Test
        void success() throws Exception {
            String ufId = "ufId";
            LogicalFileResponseDto responseDto = LogicalFileResponseDto.builder()
                    .id(1L)
                    .ufId(ufId)
                    .owner("tester")
                    .isDeleted(true)
                    .originalName(multipartFile.getOriginalFilename())
                    .extension(StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()))
                    .build();

            given(fileService.deleteFile(ufId)).willReturn(responseDto);

            mockMvc.perform(delete("/ndxpro/v1/file-service/files/" + ufId))
                    .andDo(print())
                    //then
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("id").value(responseDto.getId()))
                    .andExpect(jsonPath("ufId").value(responseDto.getUfId()))
                    .andExpect(jsonPath("originalName").value(responseDto.getOriginalName()))
                    .andExpect(jsonPath("extension").value(responseDto.getExtension()))
                    .andExpect(jsonPath("owner").value(responseDto.getOwner()))
                    .andExpect(jsonPath("deleted").value(responseDto.isDeleted()));
        }

        @Test
        void failCausedByNotFoundLogicalFile() throws Exception {
            String ufId = "ufId";

            given(fileService.deleteFile(ufId)).willThrow(
                    new FileException(ErrorCode.RESOURCE_NOT_FOUND, "logical file not found.")
            );

            mockMvc.perform(delete("/ndxpro/v1/file-service/files/" + ufId))
                    .andDo(print())
                    //then
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("code").exists());
        }
    }
}