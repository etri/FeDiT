package kr.co.e8ight.ndxpro.fileservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.*;
import kr.co.e8ight.ndxpro.fileservice.service.FileIoService;
import kr.co.e8ight.ndxpro.fileservice.service.FileService;
import kr.co.e8ight.ndxpro.fileservice.service.MimeTypeDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

@Slf4j
@RestController
@Tag(name = "File Controller", description = "File management APIs")
@RequiredArgsConstructor
@RequestMapping("/ndxpro/v1/file-service")
public class FileController {

    private final FileService fileService;
    private final FileIoService fileIoService;
    private final MimeTypeDetector mimeTypeDetector;

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "파일 업로드 API")
    public ResponseEntity<FileUploadResponseDto> uploadFile(
            @Parameter(description = "업로드 할 파일", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile multipartFile) {
        log.info("파일 업로드 요청 - filename: {}, size: {} bytes, contentType: {}",
                multipartFile.getOriginalFilename(), multipartFile.getSize(), multipartFile.getContentType());

        PhysicalFile physicalFile =  fileService.uploadFile(multipartFile);
        FileUploadResponseDto responseDto = fileService.registerLogicalFile(physicalFile);

        URI uri = URI.create("/ndxpro/v1/file-service/files/" + responseDto.getUfId());

        log.info("파일 업로드 완료 - filename: {}, ufId: {}",
                multipartFile.getOriginalFilename(), responseDto.getUfId());

        return ResponseEntity.created(uri).body(responseDto);
    }

    @GetMapping("/files/{ufId}")
    @Operation(summary = "파일 다운로드 API (UFID 사용)")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("ufId") String ufId,
            @RequestParam(value = "open", defaultValue = "true") Boolean open
            ) {
        LogicalFile logicalFile = fileService.getLogicalFileWithUfIdAndNotDeleted(ufId.split("\\.")[0]);

        HttpHeaders headers = new HttpHeaders();
        String encodedName = URLEncoder.encode(logicalFile.getOriginalName(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        if ( open ) {
            String mimeType = mimeTypeDetector.getMimeTypeFromLogicalFile(logicalFile);
            headers.setContentType(new MediaType(MediaType.parseMediaType(mimeType), StandardCharsets.UTF_8));
            headers.setContentDisposition(ContentDisposition.inline().filename(encodedName).build());
        } else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", encodedName);
        }

        Resource fileResource = fileIoService.getFileResourceFromFilePath(logicalFile.getPhysicalFile().getPath());

        //tood 비동기 파일 캐싱 요청
        return new ResponseEntity<>(fileResource, headers, HttpStatus.OK);
    }

    @PostMapping("/files/{ufId}/copy")
    @Operation(summary = "저장된 파일의 사본 생성 API (UFID 사용)")
    public ResponseEntity<FileCopyResponseDto> copyFile(
            @PathVariable("ufId") String ufId) {
        log.info("파일 사본 생성 요청 - ufId: {}", ufId);

        return ResponseEntity.ok().body(fileService.copyFile(ufId.split("\\.")[0]));
    }

    @DeleteMapping("/files/{ufId}/copy")
    @Operation(summary = "임시 사본 삭제 API (UFID 또는 임시 디렉터리 UUID 사용)")
    public ResponseEntity<Void> deleteCopy(
            @PathVariable("ufId") String ufId) {
        log.info("파일 사본 삭제 요청 - ufId: {}", ufId);

        fileService.deleteCopy(ufId.split("\\.")[0]);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tmp-directories")
    @Operation(summary = "임시 디렉토리 생성 API")
    public ResponseEntity<TmpDirectoryResponseDto> createTmpDirectory() {
        TmpDirectoryResponseDto responseDto = fileService.createTmpDirectory();

        log.info("임시 디렉토리 생성 완료 - path: {}", responseDto.getPath());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @GetMapping("/physical-files/download")
    @Operation(summary = "파일 다운로드 API (물리 경로 사용)")
    public ResponseEntity<Resource> downloadFileByPath(
            @Parameter(description = "파일 저장 루트(file-service.dir) 기준 절대 경로 또는 상대 경로")
            @RequestParam("path") String path,
            @RequestParam(value = "open", defaultValue = "true") Boolean open) {
        log.info("물리 경로 파일 다운로드 요청 - path: {}", path);

        Path filePath = fileIoService.resolvePathInBaseDir(path);

        HttpHeaders headers = new HttpHeaders();
        String encodedName = URLEncoder.encode(filePath.getFileName().toString(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        if ( open ) {
            String mimeType = mimeTypeDetector.getMimeTypeFromFile(filePath.toFile());
            headers.setContentType(new MediaType(MediaType.parseMediaType(mimeType), StandardCharsets.UTF_8));
            headers.setContentDisposition(ContentDisposition.inline().filename(encodedName).build());
        } else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", encodedName);
        }

        Resource fileResource = fileIoService.getFileResourceFromFilePath(filePath.toString());

        return new ResponseEntity<>(fileResource, headers, HttpStatus.OK);
    }

    @GetMapping("/physical-files")
    @Operation(summary = "물리 파일 정보 조회 API")
    public ResponseEntity<PhysicalFileResponseDto> getFile(
            @RequestParam(value = "checksum") String checksum) {
        return ResponseEntity.ok().body(fileService.getPhysicalFile(checksum));
    }

    @GetMapping("/logical-files")
    @Operation(summary = "논리 파일 정보 검색 API")
    public ResponseEntity<LogicalFileListResponseDto> getLogicalFile(
            @RequestParam(value = "filename", required = false) String filename,
            @RequestParam(value = "checksum", required = false) String checksum) {
        return ResponseEntity.ok().body(fileService.getLogicalFile(filename, checksum));
    }

    @PostMapping("/logical-files")
    @Operation(summary = "논리 파일 등록 API")
    public ResponseEntity<LogicalFileResponseDto> registerLogicalFile(
            @RequestBody @Valid LogicalFileRegisterDto registerDto) {
        LogicalFileResponseDto responseDto = fileService.registerLogicalFile(registerDto);

        URI uri = URI.create("/files/" + responseDto.getUfId());

        return ResponseEntity.created(uri).body(responseDto);
    }

    @GetMapping("/files/{ufId}/details")
    public ResponseEntity<FileInfoResponseDto> getFileInfo(
            @PathVariable(value = "ufId") String ufId) {
        return ResponseEntity.ok().body(fileService.getFileInfo(ufId.split("\\.")[0]));
    }

    @PatchMapping("/files/{ufId}")
    @Operation(summary = "파일 상태 수정 API (파일 삭제/복구, UFID 사용)")
    public ResponseEntity<LogicalFileResponseDto> updateFile(
            @PathVariable("ufId") String ufId, @RequestBody LogicalFileRequestDto requestDto) {
        return ResponseEntity.ok().body(fileService.updateFile(ufId.split("\\.")[0], requestDto));
    }

    @DeleteMapping("/files/{ufId}")
    @Operation(summary = "파일 삭제 API (UFID 사용)")
    public ResponseEntity<LogicalFileResponseDto> deleteFile(
            @PathVariable("ufId") String ufId) {
        return ResponseEntity.ok().body(fileService.deleteFile(ufId.split("\\.")[0]));
    }
}
