package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.stereotype.Component;

import java.io.*;

@Component
public class FileService {

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
