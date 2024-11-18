package kr.co.e8ight.ndxpro.translatorManager.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class BuildErrorResult {
    private String type;
    private String title;
    private String detail;
    private int code;
}
