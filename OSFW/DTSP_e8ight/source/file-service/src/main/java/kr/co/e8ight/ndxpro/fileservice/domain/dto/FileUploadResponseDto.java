package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class FileUploadResponseDto {
  private Long id;
  private String ufId;
  private String originalName;
  private String extension;
  private String owner;
  private boolean reused;
  private long fileSize;

  public static FileUploadResponseDto from(LogicalFile logicalFile, boolean reused, long fileSize) {
    return FileUploadResponseDto.builder()
        .id(logicalFile.getId())
        .ufId(logicalFile.getUfId())
        .originalName(logicalFile.getOriginalName())
        .extension(logicalFile.getExtension())
        .owner(logicalFile.getOwner())
        .reused(reused)
        .fileSize(fileSize)
        .build();
  }
}
