package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@AllArgsConstructor
@Getter
@Builder
public class TmpDirectoryResponseDto {
    private String name;
    private String path;
}
