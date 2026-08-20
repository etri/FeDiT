package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@AllArgsConstructor
@Getter
@Builder
public class FileInfoResponseDto {
    private LogicalFileResponseDto logicalFileInfo;
    private PhysicalFileResponseDto physicalFileInfo;
}
