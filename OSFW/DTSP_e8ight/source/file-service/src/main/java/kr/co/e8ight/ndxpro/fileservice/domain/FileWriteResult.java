package kr.co.e8ight.ndxpro.fileservice.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FileWriteResult {
    private String message;
    private boolean success;
}
