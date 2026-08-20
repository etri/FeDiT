package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Component
public class FileService {

    private static final String BACKUP_SUFFIX = ".bak";

    public void createOrReplaceFile(String filePath, String contents) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                file.createNewFile();
            }
            FileWriter fileWriter = new FileWriter(file);
            BufferedWriter bufferedWriter = new BufferedWriter(fileWriter);

            bufferedWriter.write(contents);
            bufferedWriter.close();
        } catch (IOException e) {
            e.printStackTrace();
            throw new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, filePath + " file save error");
        }
    }

    /**
     * 덮어쓰기 전 백업본을 남긴다. createOrReplaceFile 은 무조건 덮어쓰므로
     * 사용자가 conf 를 직접 편집할 때 복구 수단이 필요하다.
     */
    public void backupFile(String filePath) {
        File file = new File(filePath);
        if (!file.exists()) {
            return;
        }
        try {
            Files.copy(file.toPath(), Paths.get(filePath + BACKUP_SUFFIX), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            e.printStackTrace();
            throw new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, filePath + " file backup error");
        }
    }

    public void removeFile(String filePath) {
        File file = new File(filePath);
        if (file.exists()) {
            file.delete();
        } else {
            throw new AgentException(ErrorCode.RESOURCE_NOT_FOUND, filePath + " file not Found");
        }
    }

    public String readFile(String filePath) {
        File file = new File(filePath);

        try {
            FileReader fileReader = new FileReader(file);
            BufferedReader bufferedReader = new BufferedReader(fileReader);

            StringBuilder result = new StringBuilder();
            bufferedReader.lines().forEach(s -> result.append(s).append("\n"));

            bufferedReader.close();
            return result.toString();
        } catch (IOException e) {
            e.printStackTrace();
            throw new AgentException(ErrorCode.INTERNAL_SERVER_ERROR, filePath + " file read error");
        }
    }

    public boolean isExistFile(String filePath) {
        File file = new File(filePath);
        return file.exists();
    }
}
