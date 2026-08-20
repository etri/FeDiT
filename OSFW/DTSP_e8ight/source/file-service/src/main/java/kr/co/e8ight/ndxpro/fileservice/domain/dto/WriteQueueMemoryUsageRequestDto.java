package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class WriteQueueMemoryUsageRequestDto {
    private Long capacity;
    private Long usedSize;
    private Integer length;
}
