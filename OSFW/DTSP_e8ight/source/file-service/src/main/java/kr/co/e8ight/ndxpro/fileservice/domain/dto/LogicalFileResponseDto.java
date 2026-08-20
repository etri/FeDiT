package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class LogicalFileResponseDto {

    private Long id;
    private String ufId;
    private String originalName;
    private String extension;
    private String owner;
    private boolean isDeleted;

    public static LogicalFileResponseDto from(LogicalFile logicalFile) {
        return LogicalFileResponseDto.builder()
                .id(logicalFile.getId())
                .ufId(logicalFile.getUfId())
                .originalName(logicalFile.getOriginalName())
                .extension(logicalFile.getExtension())
                .owner(logicalFile.getOwner())
                .isDeleted(logicalFile.isDeleted())
                .build();
    }
}
