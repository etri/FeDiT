package com.stoneitgt.dt.data.platform.util.file;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Data
public class FileWriter {
    // volatile로 선언하여 instance가 변경될 때 다른 스레드에 즉시 반영되도록 보장
    private static volatile FileWriter instance;

    // private 생성자로 외부에서 객체 생성을 막음
    private FileWriter() {
        // 생성자 코드
    }

    // getInstance() 메서드를 통해 싱글톤 객체를 가져옴
    public static FileWriter getInstance() {
        if (instance == null) {
            synchronized (FileWriter.class) { // 첫 번째 생성 시에만 동기화 처리
                if (instance == null) {
                    instance = new FileWriter();
                }
            }
        }
        return instance;
    }

    public void writeCSV(String filePath, List<Map<String, String>> csvData) throws IOException {
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(Files.newOutputStream(Paths.get(filePath)), StandardCharsets.UTF_8))) {
            if (csvData.isEmpty()) {
                return;
            }

            // 헤더 쓰기
            Set<String> headers = csvData.get(0).keySet();
            String headerLine = headers.stream().map(header -> {
                // 헤더가 이미 쌍따옴표로 감싸져 있는지 확인
                if (header.contains("\"")) {
                    return header;
                } else {
                    return "\"" + header + "\"";
                }
            }).collect(Collectors.joining(","));
            bw.write(headerLine);
            bw.newLine();

            // 데이터 쓰기
            for (Map<String, String> map : csvData) {
                String line = headers.stream().map(header -> {
                    String value = map.get(header);
                    // 값이 이미 쌍따옴표로 감싸져 있는지 확인
                    if (value.contains("\"")) {
                        return value;
                    } else {
                        return "\"" + value + "\"";
                    }
                }).collect(Collectors.joining(","));
                bw.write(line);
                bw.newLine();
            }
        }
    }

    public void writeCSV(String filePath, ArrayList<String> tempHeaders, List<List<String>> tempDatas) throws IOException {
        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(Files.newOutputStream(Paths.get(filePath)), StandardCharsets.UTF_8))) {
            if (tempDatas.isEmpty() || tempHeaders.isEmpty()) {
                return;
            }

            // 헤더 쓰기
            String headerLine = tempHeaders.stream().map(header -> {
                // 헤더가 이미 쌍따옴표로 감싸져 있는지 확인
                if (header.contains("\"")) {
                    return header;
                } else {
                    return "\"" + header + "\"";
                }
            }).collect(Collectors.joining(","));
            bw.write(headerLine);
            bw.newLine();

            // 데이터 쓰기
            for (List<String> datas : tempDatas) {
                String line = datas.stream().map(data -> {
                    String value = data;
                    // 값이 이미 쌍따옴표로 감싸져 있는지 확인
                    if (value.contains("\"")) {
                        return value;
                    } else {
                        return "\"" + value + "\"";
                    }
                }).collect(Collectors.joining(","));
                bw.write(line);
                bw.newLine();
            }
        }
    }
}