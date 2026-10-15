package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@AllArgsConstructor
@Getter
@Builder
public class FileCopyResponseDto {
    private String ufId;
    private String originalName;
    private String sourcePath;
    private String copiedPath;
    private Long size;
}
