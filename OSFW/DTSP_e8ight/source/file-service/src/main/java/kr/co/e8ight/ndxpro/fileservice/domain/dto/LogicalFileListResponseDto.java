package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import kr.co.e8ight.ndxpro.fileservice.domain.LogicalFile;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@AllArgsConstructor
public class LogicalFileListResponseDto {
    private List<LogicalFileResponseDto> list;

    public static LogicalFileListResponseDto from(List<LogicalFile> logicalFiles) {
        List<LogicalFileResponseDto> list = new ArrayList<>();
        for (LogicalFile logicalFile : logicalFiles) {
            list.add(LogicalFileResponseDto.from(logicalFile));
        }
        return new LogicalFileListResponseDto(list);
    }
}
