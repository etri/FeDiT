package com.stoneitgt.dt.data.platform.util.file;


import com.opencsv.CSVReader;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

/**
 * 파일을 읽는것과 연관된 클래스
 *
 * @author ws.kim
 * @implNote FileReader reader = FileReader.getInstance();
 * @since 2024-09-06
 */
@Slf4j
@Data
public class FileReader {
    // volatile로 선언하여 instance가 변경될 때 다른 스레드에 즉시 반영되도록 보장
    private static volatile FileReader instance;

    // private 생성자로 외부에서 객체 생성을 막음
    private FileReader() {
        // 생성자 코드
    }

    // getInstance() 메서드를 통해 싱글톤 객체를 가져옴
    public static FileReader getInstance() {
        if (instance == null) {
            synchronized (FileReader.class) { // 첫 번째 생성 시에만 동기화 처리
                if (instance == null) {
                    instance = new FileReader();
                }
            }
        }
        return instance;
    }

    /**
     * CSV 파일에서 데이터를 읽어 반환합니다.
     *
     * <p>
     * 이 메서드는 주어진 CSV 파일의 데이터를 읽어 {@link List} 형태로 반환합니다.
     * 각 행은 {@link Map}으로 표현되며, 헤더를 키로 사용하여 값을 저장합니다.
     * </p>
     *
     * @param filePath CSV 파일의 전체 경로
     * @return CSV 파일의 데이터 리스트, 파일이 존재하지 않거나 읽을 수 없는 경우 빈 리스트 반환
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public List<Map<String, Object>> readCsvOnlyData(String filePath) throws IOException {
        List<Map<String, Object>> csvData = new ArrayList<>();
        java.io.File file = new java.io.File(filePath);

        if (!file.exists()) {
            return csvData; // 파일이 존재하지 않을 경우 빈 리스트 반환
        }

        try (BufferedReader br = new BufferedReader(new java.io.FileReader(filePath))) {
            String line;
            String[] headers = br.readLine().split(",", -1); // 첫 번째 줄을 헤더로 읽기

            if (headers.length == 0) {
                return csvData; // 헤더가 없는 파일 처리
            }

            while ((line = br.readLine()) != null) {
                String[] values = line.split(",", -1);
                if (values.length != headers.length) {
                    continue; // 헤더와 데이터의 길이가 맞지 않을 경우 무시
                }
                Map<String, Object> row = IntStream.range(0, headers.length).boxed().collect(Collectors.toMap(i -> headers[i], i -> values[i]));
                csvData.add(row);
            }
        }

        return csvData;
    }

    /**
     * CSV 파일의 마지막 행 데이터를 읽어 반환합니다.
     *
     * <p>
     * 이 메서드는 CSV 파일의 마지막 행 데이터를 헤더를 기반으로 {@link Map} 형태로 반환합니다.
     * 첫 번째 행은 헤더로 사용되며, 나머지 행은 데이터로 처리됩니다.
     * </p>
     *
     * @param filePath CSV 파일의 전체 경로
     * @return CSV 파일의 마지막 행 데이터를 담은 {@link Map}, 파일이 비어있으면 빈 {@link Map} 반환
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public Map<String, Object> readCSVLastRowOnlyData(String filePath) throws IOException {
        log.info("readCSVLastRowData -> " + filePath);

        List<String> headers = new ArrayList<>();
        Map<String, Object> lastRowData = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(new java.io.FileReader(filePath))) {
            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                String[] values = line.split(","); // 쉼표로 구분된 CSV 값들

                if (isFirstLine) {
                    // 첫 번째 행을 헤더로 처리
                    headers.addAll(Arrays.asList(values));
                    isFirstLine = false;
                } else {
                    // 마지막 데이터 행을 저장
                    lastRowData = parseRowData(headers, values);
                }
            }
        }
        return lastRowData;
    }

    /**
     * CSV 파일의 유효성을 검사합니다.
     *
     * <p>
     * 이 메서드는 파일을 읽어 CSV 파일의 각 라인을 검사합니다. 파일의 각 라인은
     * 쉼표로 구분되며, 마지막 값이 비어있거나 null인 경우 유효하지 않은 것으로 간주됩니다.
     * 첫 번째 라인은 헤더로 간주되어 검사에서 제외됩니다.
     * </p>
     *
     * @param filePath 검사할 CSV 파일의 전체 경로
     * @return CSV 파일이 유효하면 {@code true}, 그렇지 않으면 {@code false}
     * @implNote 파일의 각 라인은 쉼표로 분리되어야 하며, 각 값이 null이거나 빈 값이어서는 안 됩니다.
     * 첫 번째 라인은 헤더로 간주되어 검사되지 않습니다.
     */
    public boolean checkCSV(String filePath) {
        log.info("checkCSV -> " + filePath);

        try (BufferedReader br = new BufferedReader(new java.io.FileReader(filePath))) {
            String line;
            boolean isFirstLine = true;

            while ((line = br.readLine()) != null) {
                // 라인의 끝이 ','로 끝나는지 확인
                if (line.endsWith(",")) {
                    log.info("Line ends with a comma");
                    return false;
                }

                String[] values = line.split(","); // CSV 파일을 쉼표로 분리하여 배열에 저장

                // 첫 번째 라인은 헤더로 가정하고 건너뜀
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }

                // 각 값이 null이거나 빈 값인지 확인
                if (!areValidValues(values)) {
                    return false;
                }
            }
        } catch (FileNotFoundException e) {
            log.error("File not found: " + filePath, e);
            return false;
        } catch (IOException e) {
            log.error("IOException occurred while reading the file: " + filePath, e);
            return false;
        }

        return true;
    }

    /**
     * CSV 파일을 읽어 헤더와 데이터를 {@link Map} 형태로 반환합니다.
     *
     * <p>
     * 이 메서드는 CSV 파일을 읽고, 첫 번째 행을 헤더로 사용하며,
     * 나머지 행을 데이터로 처리하여 {@link Map}에 저장합니다.
     * </p>
     *
     * @param filePath CSV 파일의 전체 경로
     * @return 헤더와 데이터를 포함하는 {@link Map}, "header_list"와 "data_list" 키를 포함
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public Map<String, Object> readCSV(String filePath) throws IOException {
        List<String> headerList = new ArrayList<>();
        List<List<String>> dataList = new ArrayList<>();

        try (Stream<String> lines = Files.lines(Paths.get(filePath))) {
            Iterator<String> iterator = lines.iterator();
            if (iterator.hasNext()) {
                // 첫 번째 줄: 헤더 처리
                headerList = parseHeader(iterator.next().split(",", -1));
            }
            while (iterator.hasNext()) {
                // 나머지 줄: 데이터 처리
                dataList.add(parseRow(iterator.next().split(",", -1)));
            }
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        return resultMap;
    }

    /**
     * CSV 파일을 읽어 헤더와 데이터를 {@link Map} 형태로 반환합니다.
     *
     * <p>
     * 이 메서드는 CSV 파일을 읽고, 첫 번째 행을 헤더로 사용하며,
     * 나머지 행을 데이터로 처리하여 {@link Map}에 저장합니다.
     * </p>
     *
     * @param multipartFile {@link MultipartFile} 파일 타입
     * @return 헤더와 데이터를 포함하는 {@link Map}, "header_list"와 "data_list" 키를 포함
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public Map<String, Object> readCSV(MultipartFile multipartFile) throws IOException {
        List<String> headerList = new ArrayList<>();
        List<List<String>> dataList = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(multipartFile.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isFirstLine = true;
            while ((line = br.readLine()) != null) {
                String[] values = line.split(",", -1); // CSV 파일을 쉼표로 분리하여 배열에 저장
                if (isFirstLine) {
                    for (String value : values) {
                        headerList.add(value.replaceAll("\"", "")); // 첫 번째 행은 헤더로 저장
                    }
                    isFirstLine = false;
                } else {
                    dataList.add(parseRow(values));
                }
            }
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        return resultMap;
    }

    /**
     * CSV 파일을 읽어 헤더와 데이터를 {@link Map} 형태로 반환합니다.
     *
     * <p>
     * 이 메서드는 CSV 파일을 읽고, 첫 번째 행을 헤더로 사용하며,
     * 나머지 행을 데이터로 처리하여 {@link Map}에 저장합니다. 데이터는
     * 지정된 {@code limit} 값에 따라 최대 {@code limit}개의 행만 읽습니다.
     * </p>
     *
     * @param filePath CSV 파일의 전체 경로
     * @param limit    읽을 최대 행 수 (0 또는 음수 값은 모든 행을 읽음)
     * @return 헤더와 데이터를 포함하는 {@link Map}, "header_list"와 "data_list" 키를 포함
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public Map<String, Object> readCSVWithLimit(String filePath, int limit) throws IOException {
        List<String> headerList = new ArrayList<>();
        List<List<String>> dataList = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new java.io.FileReader(filePath))) {
            String line;
            boolean isFirstLine = true;
            int rowCount = 0;

            while ((line = reader.readLine()) != null) {
                if (limit > 0 && rowCount >= limit) break;

                // ✔ trailing empty 값 유지
                String[] values = line.split(",", -1);

                if (isFirstLine) {
                    headerList = parseHeader(values);
                    isFirstLine = false;
                } else {
                    dataList.add(parseRow(values));
                    rowCount++;
                }
            }
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        return resultMap;
    }

    /**
     * CSV 파일을 읽어 유효한 데이터와 원본 데이터를 필터링하여 반환합니다.
     *
     * <p>
     * 이 메서드는 주어진 파일에서 유효한 데이터를 필터링하고, 원본 파일을
     * 읽어 제거된 데이터와 비교하여 일치하는 행을 반환합니다.
     * </p>
     *
     * @param filePath       CSV 파일이 위치한 디렉토리 경로
     * @param originFileName 원본 데이터 CSV 파일 이름
     * @param indexTargetCol 날짜 컬럼 이름 (유효성 검사 기준)
     * @param vrfcTrgtCol    유효성 검사 대상 컬럼 이름
     * @return 필터링된 데이터와 원본 데이터가 포함된 {@link Map}
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public Map<String, Object> compareReadCSV(String filePath, String originFileName, String indexTargetCol, String vrfcTrgtCol) throws IOException {
        String csvFile = filePath; // 전체 파일 경로 생성
        log.info("compareReadCSV -> {}", csvFile);

        List<String> headerList = new ArrayList<>();
        List<String> originHeaderList = new ArrayList<>();
        List<List<String>> dataList = new ArrayList<>();
        List<List<String>> removedList = new ArrayList<>();
        List<List<String>> originList = new ArrayList<>();

        int targetIndex = findColumnIndex(headerList, vrfcTrgtCol);
        List<String[]> csvLines = readCSVLines(csvFile);

        processCSVLines(csvLines, headerList, dataList, removedList, targetIndex);

        int dateIndex = findColumnIndex(headerList, indexTargetCol);
        int targetDateIndex = findColumnIndex(originHeaderList, indexTargetCol);
        csvFile = filePath + "/" + originFileName;
        List<String[]> originCSVLines = readCSVLines(csvFile);

        processOriginLines(originCSVLines, removedList, originList, dateIndex, targetDateIndex);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        resultMap.put("origin_list", sortOriginList(originList, headerList, originHeaderList));
        resultMap.put("removed_count", removedList.size());
        resultMap.put("removed_data_list", removedList);
        resultMap.put("row_count", dataList.size());

        return resultMap;
    }

    /**
     * CSV 파일의 헤더를 읽어 반환합니다.
     *
     * <p>
     * 이 메서드는 주어진 CSV 파일의 첫 번째 행을 헤더로 읽어 반환합니다.
     * 지정된 {@code limitCsvRowCount} 값에 따라 최대 {@code limitCsvRowCount}개의 행만 읽습니다.
     * </p>
     *
     * @param filePath         CSV 파일의 전체 경로
     * @param limitCsvRowCount 읽을 최대 행 수 (0 또는 음수 값은 모든 행을 읽음)
     * @return CSV 파일의 헤더 리스트
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public List<String> readHeaders(String filePath, int limitCsvRowCount) throws IOException {
        List<String> headers = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(filePath), "UTF-8"))) {
            String line;
            int rowCount = 0;

            while ((line = br.readLine()) != null && rowCount < limitCsvRowCount) {
                // 첫 번째 줄만 헤더로 처리
                if (headers.isEmpty()) {
                    String[] headerArray = line.split(",", -1);
                    for (String header : headerArray) {
                        headers.add(header.replace("\"", ""));
                    }
                }
                rowCount++;
            }
        }
        return headers;
    }

    /**
     * CSV 파일의 헤더를 읽어 반환합니다.
     *
     * <p>
     * 이 메서드는 주어진 CSV 파일의 첫 번째 행을 헤더로 읽어 반환합니다.
     * 지정된 {@code limitCsvRowCount} 값에 따라 최대 {@code limitCsvRowCount}개의 행만 읽습니다.
     * </p>
     *
     * @param multipartFile    {@link MultipartFile} 파일 타입
     * @param limitCsvRowCount 읽을 최대 행 수 (0 또는 음수 값은 모든 행을 읽음)
     * @return CSV 파일의 헤더 리스트
     * @throws IOException 파일 읽기 오류 발생 시
     */
    public List<String> readHeaders(MultipartFile multipartFile, int limitCsvRowCount) throws IOException {
        List<String> headers = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(multipartFile.getInputStream(), "UTF-8"))) {
            String line;
            int rowCount = 0;

            while ((line = br.readLine()) != null && rowCount < limitCsvRowCount) {
                // 첫 번째 줄만 헤더로 처리
                if (headers.isEmpty()) {
                    String[] headerArray = line.split(",", -1);
                    for (String header : headerArray) {
                        headers.add(header.replace("\"", ""));
                    }
                }
                rowCount++;
            }
        }
        return headers;
    }

    public Map<String, Object> filteredValidReadCSV(String filePath, String fileName, String originFileName, String index_target_col, String vrfc_trgt_col) throws IOException {
        String csvFile = Paths.get(filePath, fileName).toString();
        log.info("filteredValidReadCSV -> {}", csvFile);
        log.info("index_target_col -> {}, vrfc_trgt_col -> {}", index_target_col, vrfc_trgt_col);

        List<String> headerList;
        List<List<String>> dataList = new ArrayList<>();
        List<List<String>> removedList = new ArrayList<>();
        List<List<String>> originList = new ArrayList<>();
        Map<String, Integer> headerIndexMap = new HashMap<>();

        // Read CSV file and process
        int dateIndex = 0;
        try (BufferedReader br = Files.newBufferedReader(Paths.get(csvFile))) {
            headerList = Arrays.stream(br.readLine().split(",", -1)).map(header -> header.replaceAll("\"", "")).collect(Collectors.toList());
            headerIndexMap = IntStream.range(0, headerList.size()).boxed().collect(Collectors.toMap(headerList::get, i -> i));
            int targetIndex = headerIndexMap.getOrDefault(vrfc_trgt_col, -1);
            dateIndex = headerIndexMap.getOrDefault(index_target_col, -1);

            if (targetIndex == -1 || dateIndex == -1) {
                throw new IllegalArgumentException("Target column not found.");
            }

            dataList = br.lines().map(line -> Arrays.stream(line.split(",", -1)).map(value -> value.replaceAll("\"", "").trim()).collect(Collectors.toList())).collect(Collectors.toList());

            removedList = dataList.stream().filter(row -> row.get(targetIndex).isEmpty()).collect(Collectors.toList());

            //dataList.removeAll(removedList); // Keep only non-removed data
        }

        // Read origin file
        String originCsvFile = Paths.get(filePath, originFileName).toString();
        List<String> originHeaderList;
        Map<String, Integer> originHeaderIndexMap;

        try (BufferedReader br = Files.newBufferedReader(Paths.get(originCsvFile))) {
            originHeaderList = Arrays.asList(br.readLine().split(",", -1));
            originHeaderIndexMap = IntStream.range(0, originHeaderList.size()).boxed().collect(Collectors.toMap(i -> originHeaderList.get(i).replaceAll("\"", ""), i -> i));
            int targetDateIndex = originHeaderIndexMap.getOrDefault(index_target_col, -1);

            if (targetDateIndex == -1) {
                throw new IllegalArgumentException("Index target column not found in origin file.");
            }

            List<List<String>> finalRemovedList = removedList;
            int finalDateIndex = dateIndex;

            originList = br.lines().map(line -> Arrays.asList(line.split(",", -1))) // CSV 파일의 각 행을 리스트로 변환
                    .map(row -> row.stream() // 각 요소에서 따옴표 제거
                            .map(element -> element.replaceAll("\"", "")).collect(Collectors.toList())).filter(row -> finalRemovedList.stream().anyMatch(removedRow -> {
                        Long removedDateNum = ConvertUtil.extractAndConvertToLong(removedRow.get(finalDateIndex));
                        Long originDateNum = ConvertUtil.extractAndConvertToLong(row.get(targetDateIndex));
                        return removedDateNum.equals(originDateNum);
                    })).collect(Collectors.toList());
        }

        // Sort originList based on headerList order
        List<List<String>> sortedOriginList = originList.stream().map(row -> headerList.stream().map(header -> row.get(originHeaderIndexMap.get(header.replaceAll("\"", "")))).collect(Collectors.toList())).collect(Collectors.toList());

        // Prepare result
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        resultMap.put("origin_list", sortedOriginList);
        resultMap.put("removed_count", removedList.size());
        resultMap.put("removed_data_list", removedList);
        resultMap.put("row_count", dataList.size());

        return resultMap;
    }

    public Map<String, Object> filteredValidReadCSVWithSize(String filePath, String fileName, String originFileName, String index_target_col, String vrfc_trgt_col, int size) throws IOException {
        String csvFile = Paths.get(filePath, fileName).toString();
        log.info("filteredValidReadCSV -> {}", csvFile);
        log.info("index_target_col -> {}, vrfc_trgt_col -> {}", index_target_col, vrfc_trgt_col);

        List<String> headerList;
        List<List<String>> dataList = new ArrayList<>();
        List<List<String>> removedList = new ArrayList<>();
        List<List<String>> originList = new ArrayList<>();
        Map<String, Integer> headerIndexMap = new HashMap<>();

        // Read CSV file and process
        int dateIndex = 0;
        try (BufferedReader br = Files.newBufferedReader(Paths.get(csvFile))) {
            headerList = Arrays.stream(br.readLine().split(",", -1)).map(header -> header.replaceAll("\"", "")).collect(Collectors.toList());
            headerIndexMap = IntStream.range(0, headerList.size()).boxed().collect(Collectors.toMap(headerList::get, i -> i));
            int targetIndex = headerIndexMap.getOrDefault(vrfc_trgt_col, -1);
            dateIndex = headerIndexMap.getOrDefault(index_target_col, -1);

            if (targetIndex == -1 || dateIndex == -1) {
                throw new IllegalArgumentException("Target column not found.");
            }

            dataList = br.lines().map(line -> Arrays.stream(line.split(",", -1)).map(value -> value.replaceAll("\"", "").trim()).collect(Collectors.toList())).collect(Collectors.toList());

            removedList = dataList.stream().filter(row -> row.get(targetIndex).isEmpty()).collect(Collectors.toList());

            //dataList.removeAll(removedList); // Keep only non-removed data
        }

        // Read origin file
        String originCsvFile = Paths.get(filePath, originFileName).toString();
        List<String> originHeaderList;
        Map<String, Integer> originHeaderIndexMap;

        try (BufferedReader br = Files.newBufferedReader(Paths.get(originCsvFile))) {
            originHeaderList = Arrays.asList(br.readLine().split(",", -1));
            originHeaderIndexMap = IntStream.range(0, originHeaderList.size()).boxed().collect(Collectors.toMap(i -> originHeaderList.get(i).replaceAll("\"", ""), i -> i));
            int targetDateIndex = originHeaderIndexMap.getOrDefault(index_target_col, -1);

            if (targetDateIndex == -1) {
                throw new IllegalArgumentException("Index target column not found in origin file.");
            }

            List<List<String>> finalRemovedList = removedList;
            int finalDateIndex = dateIndex;

            originList = br.lines().map(line -> Arrays.asList(line.split(",", -1))) // CSV 파일의 각 행을 리스트로 변환
                    .map(row -> row.stream() // 각 요소에서 따옴표 제거
                            .map(element -> element.replaceAll("\"", "")).collect(Collectors.toList())).filter(row -> finalRemovedList.stream().anyMatch(removedRow -> {
                        return removedRow.get(finalDateIndex).equals(row.get(targetDateIndex));
                    })).collect(Collectors.toList());
        }

        // Sort originList based on headerList order
        List<List<String>> sortedOriginList = originList.stream().map(row -> headerList.stream().map(header -> row.get(originHeaderIndexMap.get(header.replaceAll("\"", "")))).collect(Collectors.toList())).collect(Collectors.toList());

        // Prepare result
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("header_list", headerList);
        resultMap.put("data_list", dataList);
        resultMap.put("origin_list", sortedOriginList);
        resultMap.put("removed_count", removedList.size());
        resultMap.put("removed_data_list", removedList);
        resultMap.put("row_count", dataList.size());

        return resultMap;
    }

    public List<Map<String, Object>> readCSVToListObjectMap(String filePath) throws Exception {
        List<Map<String, Object>> csvData = new ArrayList<>();

        java.io.File file = new java.io.File(filePath);
        if (!file.exists()) {
            return null; // Return null if file does not exist
        }

        try (CSVReader csvReader = new CSVReader(new java.io.FileReader(filePath))) {
            String[] headers = csvReader.readNext();
            String[] values;

            while ((values = csvReader.readNext()) != null) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i], values[i]);
                }
                csvData.add(row);
            }
        }
        return csvData;
    }

    public List<Map<String, Object>> readCSVToListObjectMap(MultipartFile multipartFile) throws Exception {
        List<Map<String, Object>> csvData = new ArrayList<>();
        try (CSVReader csvReader = new CSVReader(new java.io.InputStreamReader(multipartFile.getInputStream()))) {
            String[] headers = csvReader.readNext();
            String[] values;

            while ((values = csvReader.readNext()) != null) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i], values[i]);
                }
                csvData.add(row);
            }
        }
        return csvData;
    }

    public Map<String, Object> readCSVLastRowObjectData(String filePath, String fileName) throws IOException {
        String csvFile = filePath + "/" + fileName; // 전체 파일 경로 생성

        log.info("csvFile:::" + csvFile);

        List<String> headerList = new ArrayList<>(); // 헤더를 담을 리스트
        List<Map<String, Object>> dataList = new ArrayList<>(); // 데이터를 담을 리스트

        try (java.io.FileReader fileReader = new java.io.FileReader(csvFile); BufferedReader br = new BufferedReader(fileReader)) {
            String line;
            boolean isFirstLine = true;
            while ((line = br.readLine()) != null) {
                String[] values = line.split(",", -1); // CSV 파일을 쉼표로 분리하여 배열에 저장
                if (isFirstLine) {
                    for (String value : values) {
                        headerList.add(value.replaceAll("\"", "")); // 첫 번째 행은 헤더로 저장
                    }
                    isFirstLine = false;
                } else {
                    Map<String, Object> rowData = new HashMap<>();
                    for (int i = 0; i < values.length; i++) {
                        rowData.put(headerList.get(i), values[i].replaceAll("\"", "")); // 나머지 행은 데이터로 저장
                    }
                    dataList.add(rowData);
                }
            }
        }
        Map<String, Object> lastRowData = new HashMap<>();
        if (!dataList.isEmpty()) {
            lastRowData = dataList.get(dataList.size() - 1);
        }
        return lastRowData;
    }

    //주요 함수들을 보조하는 보조함수

    /**
     * 주어진 값 배열이 유효한지 검사합니다.
     *
     * <p>
     * 이 메서드는 값 배열의 각 요소를 검사하여 null이거나 빈 문자열인지 확인합니다.
     * </p>
     *
     * @param values 검사할 값 배열
     * @return 배열의 모든 값이 유효하면 {@code true}, 그렇지 않으면 {@code false}
     * @implNote 값 배열의 각 요소는 null이거나 빈 문자열이어서는 안 됩니다.
     * 빈 문자열은 공백을 포함한 경우도 검사됩니다.
     */
    private boolean areValidValues(String[] values) {
        for (String value : values) {
            if (value == null || value.trim().isEmpty()) {
                log.info("Invalid value: null or empty");
                return false;
            }
        }
        return true;
    }

    /**
     * 주어진 값을 사용하여 헤더를 처리합니다.
     *
     * @param values CSV 파일의 첫 번째 행 값들
     * @return 처리된 헤더 리스트
     */
    private List<String> parseHeader(String[] values) {
        return Arrays.stream(values).map(value -> value.replace("\"", "")) // 스트림에서 바로 변환
                .collect(Collectors.toList());
    }

    /**
     * 주어진 값을 사용하여 데이터 행을 처리합니다.
     *
     * @param values CSV 파일의 데이터 행 값들
     * @return 처리된 데이터 행 리스트
     */
    private List<String> parseRow(String[] values) {
        return Arrays.stream(values).map(value -> value.replace("\"", "")).collect(Collectors.toList());
    }

    /**
     * 주어진 헤더와 값을 사용하여 데이터 행을 {@link Map}으로 변환합니다.
     *
     * @param headers CSV 파일의 헤더
     * @param values  현재 데이터 행의 값
     * @return {@link Map} 형태의 데이터 행
     */
    private Map<String, Object> parseRowData(List<String> headers, String[] values) {
        Map<String, Object> rowData = new HashMap<>();

        for (int i = 0; i < values.length; i++) {
            String header = headers.size() > i ? headers.get(i) : "Column" + i;
            rowData.put(header, values[i].replaceAll("\"", ""));
        }

        return rowData;
    }

    /**
     * 주어진 파일 경로에서 CSV 파일을 읽어 문자열 배열 리스트로 반환합니다.
     *
     * @param filePath CSV 파일 경로
     * @return CSV 파일의 각 행을 문자열 배열로 변환한 리스트
     * @throws IOException 파일 읽기 오류 발생 시
     */
    private List<String[]> readCSVLines(String filePath) throws IOException {
        try (BufferedReader br = new BufferedReader(new java.io.FileReader(filePath))) {
            return br.lines().map(line -> line.split(",", -1)).collect(Collectors.toList());
        }
    }

    /**
     * 주어진 CSV 데이터 행에서 헤더를 추출합니다.
     *
     * @param csvLines    CSV 데이터 행들
     * @param headerList  헤더를 저장할 리스트
     * @param dataList    데이터를 저장할 리스트
     * @param removedList 제거된 데이터를 저장할 리스트
     * @param targetIndex 유효성 검사 대상 컬럼 인덱스
     */
    private void processCSVLines(List<String[]> csvLines, List<String> headerList, List<List<String>> dataList, List<List<String>> removedList, int targetIndex) {
        boolean isFirstLine = true;

        for (String[] values : csvLines) {
            if (isFirstLine) {
                headerList.addAll(Arrays.asList(values));
                isFirstLine = false;
            } else {
                List<String> rowData = Arrays.asList(values);
                boolean isRemoved = rowData.get(targetIndex) == null || rowData.get(targetIndex).replaceAll("\"", "").isEmpty();
                dataList.add(rowData);

                if (isRemoved) {
                    removedList.add(rowData);
                }
            }
        }
    }

    /**
     * 주어진 헤더 리스트에서 컬럼의 인덱스를 찾습니다.
     *
     * @param headerList 헤더 리스트
     * @param columnName 찾고자 하는 컬럼 이름
     * @return 컬럼의 인덱스
     */
    private int findColumnIndex(List<String> headerList, String columnName) {
        for (int i = 0; i < headerList.size(); i++) {
            if (headerList.get(i).replaceAll("\"", "").equals(columnName.replaceAll("\"", ""))) {
                return i;
            }
        }
        return -1; // 컬럼을 찾지 못한 경우
    }

    /**
     * 원본 CSV 데이터와 제거된 데이터를 비교하여 일치하는 행을 처리합니다.
     *
     * @param originCSVLines  원본 CSV 데이터 행들
     * @param removedList     제거된 데이터 리스트
     * @param originList      일치하는 원본 데이터 리스트
     * @param dateIndex       제거된 데이터의 날짜 컬럼 인덱스
     * @param targetDateIndex 원본 데이터의 날짜 컬럼 인덱스
     */
    private void processOriginLines(List<String[]> originCSVLines, List<List<String>> removedList, List<List<String>> originList, int dateIndex, int targetDateIndex) {
        for (String[] values : originCSVLines) {
            List<String> rowData = Arrays.asList(values);
            for (List<String> removedRow : removedList) {
                if (Objects.equals(removedRow.get(dateIndex).replaceAll("\"", ""), rowData.get(targetDateIndex).replaceAll("\"", ""))) {
                    originList.add(rowData);
                    break;
                }
            }
        }
    }

    /**
     * 원본 데이터를 헤더 순서에 맞게 정렬합니다.
     *
     * @param originList       원본 데이터 리스트
     * @param headerList       헤더 리스트
     * @param originHeaderList 원본 헤더 리스트
     * @return 헤더 순서에 맞게 정렬된 원본 데이터 리스트
     */
    private List<List<String>> sortOriginList(List<List<String>> originList, List<String> headerList, List<String> originHeaderList) {
        Map<String, Integer> headerIndexMap = new HashMap<>();
        for (int i = 0; i < headerList.size(); i++) {
            headerIndexMap.put(headerList.get(i), i);
        }

        return originList.stream().map(row -> originHeaderList.stream().map(header -> row.get(headerIndexMap.getOrDefault(header, -1))).collect(Collectors.toList())).collect(Collectors.toList());
    }

    public JSONObject readJSON(String filePath) {
        JSONObject jsonObject = new JSONObject();
        java.io.File file = new java.io.File(filePath);
        log.info("file -> {}", file);
        if (!file.exists()) {
            return jsonObject; // 파일이 존재하지 않을 경우 빈 JSONObject 반환
        }

        try (BufferedReader br = new BufferedReader(new java.io.FileReader(filePath))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            jsonObject = new JSONObject(sb.toString());
        } catch (IOException e) {
            log.error("Error reading JSON file: " + filePath, e);
        }

        return jsonObject;
    }

    public JSONArray readJSONArray(String filePath) {
        JSONArray jsonArray = new JSONArray();
        java.io.File file = new java.io.File(filePath);
        log.info("file -> {}", file);

        if (!file.exists()) {
            return jsonArray; // 파일이 존재하지 않을 경우 빈 JSONArray 반환
        }

        try (BufferedReader br = new BufferedReader(new java.io.FileReader(filePath))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            jsonArray = new JSONArray(sb.toString());
        } catch (IOException e) {
            log.error("Error reading JSON file: " + filePath, e);
        }

        return jsonArray;
    }
}
