package kr.co.e8ight.ndxpro.translatorbuilder.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ProcessingResult {
    private int exitCode;
    private String output;
    private String error;
}
