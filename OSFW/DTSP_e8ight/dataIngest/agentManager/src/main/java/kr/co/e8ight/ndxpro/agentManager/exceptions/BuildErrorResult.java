package kr.co.e8ight.ndxpro.agentManager.exceptions;

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
