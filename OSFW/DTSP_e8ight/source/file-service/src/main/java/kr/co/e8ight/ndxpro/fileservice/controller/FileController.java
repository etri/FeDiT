package kr.co.e8ight.ndxpro.fileservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.dto.*;
import kr.co.e8ight.ndxpro.fileservice.service.FileIoService;
import kr.co.e8ight.ndxpro.fileservice.service.FileService;
import kr.co.e8ight.ndxpro.fileservice.service.MimeTypeDetector;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
    public ResponseEntity<LogicalFileResponseDto> uploadFile(
            @Parameter(description = "업로드 할 파일", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile multipartFile,
            @RequestParam("checksum") String checksum) {
        LogicalFileResponseDto responseDto = fileService.uploadFile(multipartFile, checksum);

        URI uri = URI.create("/files/" + responseDto.getUfId());

        return ResponseEntity.created(uri).body(responseDto);
    }

    @GetMapping("/files/{ufId}")
    @Operation(summary = "파일 다운로드 API (UFID 사용)")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable("ufId") String ufId,
            @RequestParam(value = "open", defaultValue = "true") Boolean open
            ) {
        LogicalFile logicalFile = fileService.getLogicalFileWithUfIdAndNotDeleted(ufId);

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

        byte[] fileDataByteArray = fileIoService.getByteArrayFromFilePath(logicalFile.getPhysicalFile().getPath());

        //tood 비동기 파일 캐싱 요청

        return new ResponseEntity<>(fileDataByteArray, headers, HttpStatus.OK);
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
            @RequestBody LogicalFileRegisterDto registerDto) {
        LogicalFileResponseDto responseDto = fileService.registerLogicalFile(registerDto);

        URI uri = URI.create("/files/" + responseDto.getUfId());

        return ResponseEntity.created(uri).body(responseDto);
    }

    @GetMapping("/files/{ufId}/details")
    public ResponseEntity<FileInfoResponseDto> getFileInfo(
            @PathVariable(value = "ufId") String ufId) {
        return ResponseEntity.ok().body(fileService.getFileInfo(ufId));
    }

    @PatchMapping("/files/{ufId}")
    @Operation(summary = "파일 상태 수정 API (파일 삭제/복구, UFID 사용)")
    public ResponseEntity<LogicalFileResponseDto> updateFile(
            @PathVariable("ufId") String ufId, @RequestBody LogicalFileRequestDto requestDto) {
        return ResponseEntity.ok().body(fileService.updateFile(ufId, requestDto));
    }

    @DeleteMapping("/files/{ufId}")
    @Operation(summary = "파일 삭제 API (UFID 사용)")
    public ResponseEntity<LogicalFileResponseDto> deleteFile(
            @PathVariable("ufId") String ufId) {
        return ResponseEntity.ok().body(fileService.deleteFile(ufId));
    }
}
