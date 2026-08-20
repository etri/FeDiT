package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import kr.co.e8ight.ndxpro.fileservice.domain.FileStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PhysicalFileResponseDto {
    private Long id;
    private Long size;
    private String checksum;
    private String path;
    private FileStatus status;
    private boolean deleted;

    public static PhysicalFileResponseDto from(PhysicalFile physicalFile) {
        return PhysicalFileResponseDto.builder()
                .id(physicalFile.getId())
                .size(physicalFile.getSize())
                .checksum(physicalFile.getChecksum())
                .path(physicalFile.getPath())
                .status(physicalFile.getStatus())
                .deleted(physicalFile.isDeleted())
                .build();
    }
}
