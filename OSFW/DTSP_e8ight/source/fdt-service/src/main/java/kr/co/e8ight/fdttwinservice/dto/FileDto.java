package kr.co.e8ight.fdttwinservice.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileDto {

    private  String ufId;

    private String original_name;


    private String extension;
    private Integer file_size;
    private String urlPath;

}
