package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class LogicalFileRegisterDto {
    private String filename;
    private String checksum;
}
