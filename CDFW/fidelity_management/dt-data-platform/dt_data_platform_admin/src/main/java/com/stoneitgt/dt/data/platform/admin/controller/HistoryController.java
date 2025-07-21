package com.stoneitgt.dt.data.platform.admin.controller;


import com.stoneitgt.dt.data.platform.admin.service.DTEtcModelService;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.admin.service.DTSimulationService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.DataFileDownloadLog;
import com.stoneitgt.dt.data.platform.domain.HistoryItem;
import com.stoneitgt.dt.data.platform.domain.ModelReferenceLog;
import com.stoneitgt.dt.data.platform.enums.ModelType;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/dt/history")
public class HistoryController extends BaseController {
    private final DTEtcModelService dtEtcModelService;
    private final DTModelService dtModelService;
    private final DTSimulationService dtSimulationService;

    @GetMapping("/dashboard")
    public ModelAndView historyDashboard(HttpServletRequest request, @ModelAttribute BaseParameter params) {
        ModelAndView VIEW = new ModelAndView("pages/dashboard");
        log.info("historyDashboard -> {}", params);

        /**
         * 유효성 검증 도구 전체 통계 부분
         * */
        List<Map<String, Object>> etc_algorithm_list = dtEtcModelService.getAlgolithmList();
        Map<String, Object> etcHistory = new HashMap<>();
        etc_algorithm_list.forEach(map -> {
            int count = logService.countDtEtcModelByAlgorithm(Integer.parseInt(map.get("model_algrm_seq").toString()));
            etcHistory.put(map.get("model_algrm").toString().toUpperCase(), count);
        });
        VIEW.addObject("etcHistory", etcHistory);

        /**
         * 데이터 증강 도구 전체 통계 부분
         * */
        List<Map<String, Object>> meta_algorithm_list = dtModelService.getAlgolithmList();
        Map<String, Object> metaHistory = new HashMap<>();
        meta_algorithm_list.forEach(map -> {
            int count = logService.countDtModelByAlgorithm(Integer.parseInt(map.get("model_algrm_seq").toString()));
            metaHistory.put(map.get("model_algrm").toString().toUpperCase(), count);
        });
        VIEW.addObject("metaHistory", metaHistory);

        /*전체 도구 및 시뮬레이션 통계*/
        int etcModelCount = dtEtcModelService.countEtcModel();
        VIEW.addObject("etcModelCount", etcModelCount);
        int metaModelCount = dtModelService.countMetaModel();
        VIEW.addObject("metaModelCount", metaModelCount);
        int metaSimulationCount = dtSimulationService.countMetaSimulation();
        VIEW.addObject("metaSimulationCount", metaSimulationCount);

        /*유효성 검증 도구 통계*/
        HashMap<String, Object> etcAlgorithmMaps = new HashMap<>();
        etc_algorithm_list.forEach(map -> {
            int count = dtEtcModelService.countEtcModel(Integer.parseInt(map.get("model_algrm_seq").toString()));
            etcAlgorithmMaps.put(map.get("model_algrm").toString(), count);
        });
        VIEW.addObject("etcAlgorithmMaps", etcAlgorithmMaps);
        /*데이터 증강 도구 통계*/
        HashMap<String, Object> metaAlgorithmMaps = new HashMap<>();
        meta_algorithm_list.forEach(map -> {
            int count = dtModelService.countMetaModel(Integer.parseInt(map.get("model_algrm_seq").toString()));
            metaAlgorithmMaps.put(map.get("model_algrm").toString(), count);
        });
        VIEW.addObject("metaAlgorithmMaps", metaAlgorithmMaps);

        VIEW.addObject("menuCd", params.getMenuCd());
        VIEW.addObject("breadcrumb", getBreadcrumb(params.getMenuCd()));
        VIEW.addObject("params", params);
        return VIEW;
    }

    @PostMapping(value = "/{type}/graph")
    @ResponseBody
    public Map<String, Object> getHistoryModelAlgorithmInfo(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getHistoryInfo param -> " + param.toString());
        String dateParam = param.get("date").toString();
        switch (type) {
            case META_ETC_MODEL: {
                List<Map<String, Object>> etc_algorithm_list = dtEtcModelService.getAlgolithmList();

                //모델 사용 이력 추출
                ArrayList<ModelReferenceLog> modelReferenceLogs = logService.findDtEtcModelReferenceLogsRange(dateParam);
                result.put("modelReferenceLogs", modelReferenceLogs);

                //데이터 사용 이력 추출
                ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logService.findDtEtcDataFileLogsRange(dateParam);
                result.put("dataFileDownloadLogs", dataFileDownloadLogs);

                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");
                Date currentDate = inputFormat.parse(TimeUtil.getCurrentDateTime());

                // 날짜별 데이터 저장을 위한 Map
                Map<String, HistoryItem> historyMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계
                for (ModelReferenceLog log : modelReferenceLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계
                for (DataFileDownloadLog log : dataFileDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                log.info("historyMap.isEmpty() -> {}", historyMap.isEmpty());
                if (historyMap.isEmpty()) {
                    String formattedDate = outputFormat.format(currentDate);
                    HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                    historyItem.setRegDt(formattedDate);
                    historyItem.setDownloads(0);
                    historyItem.setReferences(0);
                    historyMap.put(formattedDate, historyItem);
                }

                Map<String, HistoryItem> sortedHistoryMap = historyMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                result.put("historyMap", sortedHistoryMap);

                // 유효성 검증 모델 별 그레프 데이터
                Map<String, Map<String, HistoryItem>> historyAlgorithmMaps = new HashMap<>();
                etc_algorithm_list.forEach(map -> {
                    // 날짜별 데이터 저장을 위한 Map
                    Map<String, HistoryItem> historyAlgorithmMap = new HashMap<>();
                    // 모델 참조 이력 날짜 추출 및 집계
                    for (ModelReferenceLog log : modelReferenceLogs) {
                        String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                        if (dateTime != null && Integer.parseInt(map.get("model_algrm_seq").toString()) == log.getModelAlgrmSeq()) {
                            try {
                                Date date = inputFormat.parse(dateTime);
                                String formattedDate = outputFormat.format(date);
                                HistoryItem historyItem = historyAlgorithmMap.getOrDefault(formattedDate, new HistoryItem());
                                historyItem.setRegDt(formattedDate);
                                historyItem.setReferences(historyItem.getReferences() + 1);
                                historyAlgorithmMap.put(formattedDate, historyItem);
                            } catch (java.text.ParseException e) {
                                // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                                e.printStackTrace();
                            }
                        }
                    }

                    Map<String, HistoryItem> sortedHistoryAlgorithmMap = historyAlgorithmMap.entrySet()
                            .stream()
                            .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    Map.Entry::getValue,
                                    (oldValue, newValue) -> oldValue,
                                    LinkedHashMap::new // 순서 유지하는 Map
                            ));

                    historyAlgorithmMaps.put(map.get("model_algrm").toString(), sortedHistoryAlgorithmMap);
                });
                historyAlgorithmMaps.forEach((key, map) -> historyMap.keySet().forEach(dateKey -> {
                    if (!map.containsKey(dateKey)) {
                        HistoryItem historyItem = new HistoryItem();
                        historyItem.setRegDt(dateKey);
                        historyItem.setReferences(0);
                        historyItem.setDownloads(0);
                        map.put(dateKey, historyItem);
                    }
                }));
                result.put("historyAlgorithmMaps", historyAlgorithmMaps);

                //모델 사용 이력 추출 (전체)
                ArrayList<ModelReferenceLog> modelReferenceAllLogs = logService.findDtEtcModelReferenceLogs();
                //데이터 사용 이력 추출 (전체)
                ArrayList<DataFileDownloadLog> dataFileAllDownloadLogs = logService.findDtEtcDataFileLogs();

                // 날짜별 데이터 저장을 위한 Map (전체)
                Map<String, HistoryItem> allHistoryMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계 (전체)
                for (ModelReferenceLog log : modelReferenceAllLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계 (전체)
                for (DataFileDownloadLog log : dataFileAllDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 연도와 월 추출
                Set<String> dates = new HashSet<>();

                allHistoryMap = allHistoryMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                for (String dateStr : allHistoryMap.keySet()) {
                    String[] parts = dateStr.split("-");
                    if (parts.length == 3) {
                        String year = parts[0];
                        String month = parts[1];
                        dates.add(year + "-" + month);
                    }
                }

                // 추출된 연도와 월을 결과에 추가
                if (!dates.contains(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1])) {
                    //현재 연도와 월이 들어가있지 않다면
                    dates.add(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1]);
                }

                List<String> sortedDates = new ArrayList<>(dates);
                sortedDates.sort(Collections.reverseOrder());
                result.put("dates", new ArrayList<>(sortedDates));
                result.put("date", dateParam);
                break;
            }
            case META_MODEL: {
                List<Map<String, Object>> meta_algorithm_list = dtModelService.getAlgolithmList();

                //모델 사용 이력 추출
                ArrayList<ModelReferenceLog> modelReferenceLogs = logService.findDtModelReferenceLogsRange(dateParam);
                result.put("modelReferenceLogs", modelReferenceLogs);

                //데이터 사용 이력 추출
                ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logService.findDtDataFileLogsRange(dateParam);
                result.put("dataFileDownloadLogs", dataFileDownloadLogs);

                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");
                Date currentDate = inputFormat.parse(TimeUtil.getCurrentDateTime());

                // 날짜별 데이터 저장을 위한 Map
                Map<String, HistoryItem> historyMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계
                for (ModelReferenceLog log : modelReferenceLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계
                for (DataFileDownloadLog log : dataFileDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                log.info("historyMap.isEmpty() -> {}", historyMap.isEmpty());
                if (historyMap.isEmpty()) {
                    String formattedDate = outputFormat.format(currentDate);
                    HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                    historyItem.setRegDt(formattedDate);
                    historyItem.setDownloads(0);
                    historyItem.setReferences(0);
                    historyMap.put(formattedDate, historyItem);
                }

                Map<String, HistoryItem> sortedHistoryMap = historyMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                result.put("historyMap", sortedHistoryMap);

                // 데이터 증강 도구 모델 별 그레프 데이터
                Map<String, Map<String, HistoryItem>> historyAlgorithmMaps = new HashMap<>();
                meta_algorithm_list.forEach(map -> {
                    log.info("map -> {}", map);
                    // 날짜별 데이터 저장을 위한 Map
                    Map<String, HistoryItem> historyAlgorithmMap = new HashMap<>();
                    // 모델 참조 이력 날짜 추출 및 집계
                    for (ModelReferenceLog log : modelReferenceLogs) {
                        String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                        if (dateTime != null && Integer.parseInt(map.get("model_algrm_seq").toString()) == log.getModelAlgrmSeq() && log.getModelAlgrmSeq() != 0) {
                            try {
                                Date date = inputFormat.parse(dateTime);
                                String formattedDate = outputFormat.format(date);
                                HistoryItem historyItem = historyAlgorithmMap.getOrDefault(formattedDate, new HistoryItem());
                                historyItem.setRegDt(formattedDate);
                                historyItem.setReferences(historyItem.getReferences() + 1);
                                historyAlgorithmMap.put(formattedDate, historyItem);
                            } catch (java.text.ParseException e) {
                                // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                                e.printStackTrace();
                            }
                        }
                    }

                    Map<String, HistoryItem> sortedHistoryAlgorithmMap = historyAlgorithmMap.entrySet()
                            .stream()
                            .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    Map.Entry::getValue,
                                    (oldValue, newValue) -> oldValue,
                                    LinkedHashMap::new // 순서 유지하는 Map
                            ));

                    historyAlgorithmMaps.put(map.get("model_algrm").toString(), sortedHistoryAlgorithmMap);
                });
                historyAlgorithmMaps.forEach((key, map) -> historyMap.keySet().forEach(dateKey -> {
                    if (!map.containsKey(dateKey)) {
                        HistoryItem historyItem = new HistoryItem();
                        historyItem.setRegDt(dateKey);
                        historyItem.setReferences(0);
                        historyItem.setDownloads(0);
                        map.put(dateKey, historyItem);
                    }
                }));
                result.put("historyAlgorithmMaps", historyAlgorithmMaps);

                //모델 사용 이력 추출 (전체)
                ArrayList<ModelReferenceLog> modelReferenceAllLogs = logService.findDtModelReferenceLogs();
                //데이터 사용 이력 추출 (전체)
                ArrayList<DataFileDownloadLog> dataFileAllDownloadLogs = logService.findDtDataFileLogs();

                // 날짜별 데이터 저장을 위한 Map (전체)
                Map<String, HistoryItem> allHistoryMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계 (전체)
                for (ModelReferenceLog log : modelReferenceAllLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계 (전체)
                for (DataFileDownloadLog log : dataFileAllDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 연도와 월 추출
                Set<String> dates = new HashSet<>();

                allHistoryMap = allHistoryMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                for (String dateStr : allHistoryMap.keySet()) {
                    String[] parts = dateStr.split("-");
                    if (parts.length == 3) {
                        String year = parts[0];
                        String month = parts[1];
                        dates.add(year + "-" + month);
                    }
                }

                // 추출된 연도와 월을 결과에 추가
                if (!dates.contains(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1])) {
                    //현재 연도와 월이 들어가있지 않다면
                    dates.add(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1]);
                }

                List<String> sortedDates = new ArrayList<>(dates);
                sortedDates.sort(Collections.reverseOrder());
                result.put("dates", new ArrayList<>(sortedDates));
                result.put("date", dateParam);
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }

        return result;
    }

    @PostMapping(value = "/data/{type}")
    @ResponseBody
    public Map<String, Object> getDataInfoHistory(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getDataInfoHistory param -> " + param.toString());
        switch (type) {
            case META_ETC_MODEL: {
                int etcModelSeq = Integer.parseInt(param.get("etcModelSeq").toString());
                //데이터 사용 이력 추출
                ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logService.findDtEtcDataFileLogsByEtcModelSeq(etcModelSeq);
                result.put("dataFileDownloadLogs", dataFileDownloadLogs);
                break;
            }
            case META_MODEL: {
                int modelSeq = Integer.parseInt(param.get("modelSeq").toString());
                //모델 사용 이력 추출
                ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logService.findDtDataFileLogsByModelSeq(modelSeq);
                result.put("dataFileDownloadLogs", dataFileDownloadLogs);
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        return result;
    }

    @PostMapping(value = "/model/{type}")
    @ResponseBody
    public Map<String, Object> getModelInfoHistory(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getModelInfoHistory param -> " + param.toString());
        switch (type) {
            case META_ETC_MODEL: {
                int etcModelSeq = Integer.parseInt(param.get("etcModelSeq").toString());
                //모델 사용 이력 추출
                ArrayList<ModelReferenceLog> modelReferenceLogs = logService.findDtEtcModelReferenceLogsByEtcModelSeq(etcModelSeq);
                result.put("modelReferenceLogs", modelReferenceLogs);
                break;
            }
            case META_MODEL: {
                int modelSeq = Integer.parseInt(param.get("modelSeq").toString());
                //모델 사용 이력 추출
                ArrayList<ModelReferenceLog> modelReferenceLogs = logService.findDtModelReferenceLogsByModelSeq(modelSeq);
                result.put("modelReferenceLogs", modelReferenceLogs);
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        return result;
    }

    @PostMapping(value = "/graph/{type}")
    @ResponseBody
    public Map<String, Object> getHistoryInfo(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getHistoryInfo param -> " + param.toString());

        switch (type) {
            case META_ETC_MODEL: {
                int etcModelSeq = Integer.parseInt(param.get("etcModelSeq").toString());
                String dateParam = param.get("date").toString();

                //모델 사용 이력 추출
                ArrayList<ModelReferenceLog> modelReferenceLogs = logService.findDtEtcModelReferenceLogsRangeByEtcModelSeq(etcModelSeq, dateParam);
                result.put("modelReferenceLogs", modelReferenceLogs);

                //데이터 사용 이력 추출
                ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logService.findDtEtcDataFileLogsRangeByEtcModelSeq(etcModelSeq, dateParam);
                result.put("dataFileDownloadLogs", dataFileDownloadLogs);

                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");
                Date currentDate = inputFormat.parse(TimeUtil.getCurrentDateTime());
                // 날짜별 데이터 저장을 위한 Map
                Map<String, HistoryItem> historyMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계
                for (ModelReferenceLog log : modelReferenceLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계
                for (DataFileDownloadLog log : dataFileDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                log.info("historyMap.isEmpty() -> {}", historyMap.isEmpty());
                if (historyMap.isEmpty()) {
                    String formattedDate = outputFormat.format(currentDate);
                    HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                    historyItem.setRegDt(formattedDate);
                    historyItem.setDownloads(0);
                    historyItem.setReferences(0);
                    historyMap.put(formattedDate, historyItem);
                }

                historyMap = historyMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                result.put("historyMap", historyMap);

                //모델 사용 이력 추출 (전체)
                ArrayList<ModelReferenceLog> modelReferenceAllLogs = logService.findDtEtcModelReferenceLogsByEtcModelSeq(etcModelSeq);
                //데이터 사용 이력 추출 (전체)
                ArrayList<DataFileDownloadLog> dataFileAllDownloadLogs = logService.findDtEtcDataFileLogsByEtcModelSeq(etcModelSeq);

                // 날짜별 데이터 저장을 위한 Map (전체)
                Map<String, HistoryItem> allHistoryMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계 (전체)
                for (ModelReferenceLog log : modelReferenceAllLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계 (전체)
                for (DataFileDownloadLog log : dataFileAllDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 연도와 월 추출
                Set<String> dates = new HashSet<>();

                allHistoryMap = allHistoryMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                for (String dateStr : allHistoryMap.keySet()) {
                    String[] parts = dateStr.split("-");
                    if (parts.length == 3) {
                        String year = parts[0];
                        String month = parts[1];
                        dates.add(year + "-" + month);
                    }
                }

                // 추출된 연도와 월을 결과에 추가
                if (!dates.contains(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1])) {
                    //현재 연도와 월이 들어가있지 않다면
                    dates.add(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1]);
                }

                List<String> sortedDates = new ArrayList<>(dates);
                sortedDates.sort(Collections.reverseOrder());
                result.put("dates", new ArrayList<>(sortedDates));
                result.put("date", dateParam);
                break;
            }
            case META_MODEL: {
                int modelSeq = Integer.parseInt(param.get("modelSeq").toString());
                String dateParam = param.get("date").toString();

                //모델 사용 이력 추출
                ArrayList<ModelReferenceLog> modelReferenceLogs = logService.findDtModelReferenceLogsRangeByModelSeq(modelSeq, dateParam);
                result.put("modelReferenceLogs", modelReferenceLogs);

                //데이터 사용 이력 추출
                ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logService.findDtDataFileLogsRangeByModelSeq(modelSeq, dateParam);
                result.put("dataFileDownloadLogs", dataFileDownloadLogs);

                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");
                Date currentDate = inputFormat.parse(TimeUtil.getCurrentDateTime());

                // 날짜별 데이터 저장을 위한 Map
                Map<String, HistoryItem> historyMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계
                for (ModelReferenceLog log : modelReferenceLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계
                for (DataFileDownloadLog log : dataFileDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            historyMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                log.info("historyMap.isEmpty() -> {}", historyMap.isEmpty());
                if (historyMap.isEmpty()) {
                    String formattedDate = outputFormat.format(currentDate);
                    HistoryItem historyItem = historyMap.getOrDefault(formattedDate, new HistoryItem());
                    historyItem.setRegDt(formattedDate);
                    historyItem.setDownloads(0);
                    historyItem.setReferences(0);
                    historyMap.put(formattedDate, historyItem);
                }

                historyMap = historyMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                result.put("historyMap", historyMap);

                //모델 사용 이력 추출 (전체)
                ArrayList<ModelReferenceLog> modelReferenceAllLogs = logService.findDtModelReferenceLogsByModelSeq(modelSeq);
                //데이터 사용 이력 추출 (전체)
                ArrayList<DataFileDownloadLog> dataFileAllDownloadLogs = logService.findDtDataFileLogsByModelSeq(modelSeq);

                // 날짜별 데이터 저장을 위한 Map (전체)
                Map<String, HistoryItem> allHistoryMap = new HashMap<>();

                // 모델 참조 이력 날짜 추출 및 집계 (전체)
                for (ModelReferenceLog log : modelReferenceAllLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setReferences(historyItem.getReferences() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 데이터 다운로드 이력 날짜 추출 및 집계 (전체)
                for (DataFileDownloadLog log : dataFileAllDownloadLogs) {
                    String dateTime = log.getRegDt(); // 또는 날짜/시간을 반환하는 메서드
                    if (dateTime != null) {
                        try {
                            Date date = inputFormat.parse(dateTime);
                            String formattedDate = outputFormat.format(date);
                            HistoryItem historyItem = allHistoryMap.getOrDefault(formattedDate, new HistoryItem());
                            historyItem.setRegDt(formattedDate);
                            historyItem.setDownloads(historyItem.getDownloads() + 1);
                            allHistoryMap.put(formattedDate, historyItem);
                        } catch (java.text.ParseException e) {
                            // 날짜 형식 변환 실패 처리 (예: 예외 발생 또는 null 반환)
                            e.printStackTrace();
                        }
                    }
                }

                // 연도와 월 추출
                Set<String> dates = new HashSet<>();

                allHistoryMap = allHistoryMap.entrySet()
                        .stream()
                        .sorted(Map.Entry.comparingByKey()) // key 기준 오름차순 정렬
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (oldValue, newValue) -> oldValue,
                                LinkedHashMap::new // 순서 유지하는 Map
                        ));

                for (String dateStr : allHistoryMap.keySet()) {
                    String[] parts = dateStr.split("-");
                    if (parts.length == 3) {
                        String year = parts[0];
                        String month = parts[1];
                        dates.add(year + "-" + month);
                    }
                }

                // 추출된 연도와 월을 결과에 추가
                if (!dates.contains(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1])) {
                    //현재 연도와 월이 들어가있지 않다면
                    dates.add(outputFormat.format(currentDate).split("-")[0] + "-" + outputFormat.format(currentDate).split("-")[1]);
                }

                List<String> sortedDates = new ArrayList<>(dates);
                sortedDates.sort(Collections.reverseOrder());
                result.put("dates", new ArrayList<>(sortedDates));
                result.put("date", dateParam);
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        return result;
    }
}