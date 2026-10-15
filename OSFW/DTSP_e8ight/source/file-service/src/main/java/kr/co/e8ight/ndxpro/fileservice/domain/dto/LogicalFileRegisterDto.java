package kr.co.e8ight.ndxpro.fileservice.domain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Builder
public class LogicalFileRegisterDto {
    @NotNull
    private String filename;
    @NotNull
    private String checksum;
}
