package kr.co.e8ight.ndxpro.translatorbuilder.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorbuilder.exception.BuildTranslatorException;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;

@Service
public class FileService {
    public void saveOrReplaceFile(String path, String contents) {
        try (BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(path))) {
            bufferedWriter.write(contents);
            bufferedWriter.flush();
        } catch (IOException e) {
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
