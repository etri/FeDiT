package kr.co.e8ight.ndxpro_v1_datamanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.stereotype.Service;

@Service
public class FileService {

    private final ObjectMapper objectMapper;

    public FileService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void uploadJsonFile(String url, String context)
            throws IOException, ParseException {


        // context 폴더 생성
        File folder = new File("ngsi-context");
        if (!folder.exists()) {
            folder.mkdir();
        }
        int index = url.lastIndexOf("/");
        String substring = url.substring(index);
        String path = "ngsi-context";


        File file = new File(path + substring);
        FileOutputStream outputStream = new FileOutputStream(file);

        JSONParser jsonParse = new JSONParser(); //JSONParse에 json데이터를 넣어 파싱한 다음 JSONObject로 변환한다.
        JSONObject jsonObj = (JSONObject) jsonParse.parse(context);

        String contentData = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonObj);  // json 데이터 보기쉽게 정렬

        byte[] strToBytes = contentData.getBytes();
        outputStream.write(strToBytes);
        outputStream.close();
    }

    public void deleteJsonFile(String contextUrl) {

        int index = contextUrl.lastIndexOf("/");
        String substring = contextUrl.substring(index);
        String path = "ngsi-context";

        File file = new File(path + substring);

        file.delete();

    }


}
