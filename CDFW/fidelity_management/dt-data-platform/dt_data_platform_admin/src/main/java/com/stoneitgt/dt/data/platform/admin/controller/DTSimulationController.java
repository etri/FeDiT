package com.stoneitgt.dt.data.platform.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.admin.service.DTSimulationService;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.StoneUtil;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.util.*;

@Slf4j
@Controller
@RequestMapping("/dt/simulation")
public class DTSimulationController extends BaseController {

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @GetMapping("/augment/list")
    public String getAugmentSimulationList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtSimulationService.getDTSimulationList(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtSimulationService.getDTSimulationListSetUserSeq(paramsMap, paging);
        }

        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);


        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());

        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> share_list = dtSimulationService.getDTSimulationSharedList(subParamsMap, subPaging);
        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_simulation/augment-list";
    }

    @GetMapping(value = {"/form", "/preprocess/form", "/augment/form"})
    public String modelForm(HttpServletRequest request, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTAugment dTAugment = new DTAugment();
        model.addAttribute("dTAugment", dTAugment);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));

        Map<String, Object> param = StoneUtil.convertObjectToMap(params);

        model.addAttribute("formType", "I");

        model.addAttribute("sim_type_list", getCodeList3("SIM_TYPE", true));
        model.addAttribute("augment_type_list", getCodeList3("AUGMENT_TYPE", true));
        model.addAttribute("cycle_tp", getCodeList3("CYCLE_TP", false));
        model.addAttribute("limit", systemProperties.getLimitCsvRowCount());

        List<Map<String, Object>> data_crt_intvl_tp_list = dtSimulationService.getModelDataTerm();
        model.addAttribute("data_crt_intvl_tp_list", data_crt_intvl_tp_list);

        // 요청된 URL 확인
        String requestUrl = request.getRequestURI();
        log.info("requestUrl -> {}", requestUrl);

        // 요청된 경로에 따라 리다이렉트 경로 변경
        model.addAttribute("prevUrl", "/dt/simulation/augment/list");
        return "pages/dt_simulation/platform_form";
    }

    @PostMapping(value = {"/form", "/preprocess/form", "/augment/form"})
    public String updateForm(@RequestParam(required = false) String menuCd, @ModelAttribute BaseParameter params, @ModelAttribute SimulationModel simulationModel, BindingResult bindingResult, Model model, RedirectAttributes rttr, HttpServletRequest request) {
        String redirectUrl = "";
        if (params.getTemplateType() != null) {
            // 기본 리다이렉트 URL
            redirectUrl = "redirect:/dt/simulation/";
            redirectUrl += "augment/";
        } else {
            redirectUrl = "redirect:/dt/simulation/";
            redirectUrl += "augment/";
        }
        // 리다이렉트 URL에 추가 정보 삽입
        String returnUrl = redirectUrl + simulationModel.getAugmentSeq() + "?";
        returnUrl += getBaseParameterString(params);

        // SimulationModel 업데이트
        simulationModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        simulationModel.setLoginUserIp(authenticationFacade.getLoginUserIp());
        dtSimulationService.updateSimulationInfo(simulationModel);

        return returnUrl;
    }

    @GetMapping(value = {"/{augmentSeq}", "/preprocess/{augmentSeq}", "/augment/{augmentSeq}"})
    public String modelView(HttpServletRequest request, @PathVariable int augmentSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTAugment dtAugment = dtSimulationService.getDTSimulation(augmentSeq);
        List<Map<String, Object>> file_list = dtSimulationService.getDTSimulationFileList(augmentSeq);
        for (Map<String, Object> file : file_list) {
            if (file.get("file_sz").toString() != null && Integer.parseInt(file.get("file_sz").toString()) != 0) {
                file.put("changedFileSize", FileUtil.formatFileSize(Integer.parseInt(file.get("file_sz").toString())));
            } else {
                file.put("changedFileSize", "0 KB");
            }
        }
        List<Map<String, Object>> log_list = dtSimulationService.getDTSimulationLogList(augmentSeq);
        Map<String, Object> param = new HashMap<>();
        param.put("model_seq", dtAugment.getModelSeq());
        Map<String, Object> property = dtSimulationService.getSimulationSetModelProperty(param);
        int windowSize = 0;

        if (Objects.equals(dtAugment.getSimTp(), "A") && Objects.equals(dtAugment.getAugmentTp(), "R")) {
            try {
                String json = property.get("user_pprcs_full_stng_value").toString();
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(json);
                windowSize = Integer.parseInt(rootNode.get("preproc_property_info").get(0).get("model_property").get(0).get("hyperparam").get("window_size").asText().replaceAll("\"", ""));
            } catch (Exception e) {
                log.warn("window Size가 없습니다.");
            }
        }
        model.addAttribute("windowSize", windowSize);
        model.addAttribute("dTAugment", dtAugment);
        model.addAttribute("file_list", file_list);
        model.addAttribute("log_list", log_list);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("formType", "U");

        model.addAttribute("sim_type_list", getCodeList3("SIM_TYPE", true));
        model.addAttribute("augment_type_list", getCodeList3("AUGMENT_TYPE", true));
        model.addAttribute("data_crt_intvl_tp_list", getCodeList3("AUGMENT_INTVL_TYPE", true));
        model.addAttribute("cycle_tp", getCodeList3("CYCLE_TP", false));

        model.addAttribute("limit", systemProperties.getLimitCsvRowCount());
        // 요청된 URL 확인
        String requestUrl = request.getRequestURI();

        // 요청된 경로에 따라 리다이렉트 경로 변경
        if (requestUrl.contains("/preprocess/")) {
            model.addAttribute("prevUrl", "/dt/simulation/preprocess/list");
        } else if (requestUrl.contains("/augment/")) {
            model.addAttribute("prevUrl", "/dt/simulation/augment/list");
        } else {
            // 기본 "/form"은 추가 작업 없이 그대로 사용
            model.addAttribute("prevUrl", "/dt/simulation/augment/list");
        }
        if (property.get("job_level") != null && property.get("job_level").toString().equals("P")) {
            model.addAttribute("modelUrl", "/dt/model/model/" + dtAugment.getModelSeq() + "?menuCd=" + params.getMenuCd());
        } else if (property.get("job_level") != null && property.get("job_level").toString().equals("M")) {
            model.addAttribute("modelUrl", "/dt/model/model/" + dtAugment.getModelSeq() + "?menuCd=" + params.getMenuCd());
        } else {
            model.addAttribute("modelUrl", "/dt/model/model/" + dtAugment.getModelSeq() + "?menuCd=" + params.getMenuCd());
        }

        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtAugment.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_simulation/platform_view";
    }

    @GetMapping(value = {"/shared/{augmentSeq}", "/shared/preprocess/{augmentSeq}", "/shared/augment/{augmentSeq}"})
    public String sharedModelView(HttpServletRequest request, @PathVariable int augmentSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTAugment dtAugment = dtSimulationService.getDTSimulation(augmentSeq);
        List<Map<String, Object>> file_list = dtSimulationService.getDTSimulationFileList(augmentSeq);
        for (Map<String, Object> file : file_list) {
            if (file.get("file_sz").toString() != null && Integer.parseInt(file.get("file_sz").toString()) != 0) {
                file.put("changedFileSize", FileUtil.formatFileSize(Integer.parseInt(file.get("file_sz").toString())));
            } else {
                file.put("changedFileSize", "0 KB");
            }
        }

        List<Map<String, Object>> log_list = dtSimulationService.getDTSimulationLogList(augmentSeq);
        Map<String, Object> param = new HashMap<>();
        param.put("model_seq", dtAugment.getModelSeq());
        Map<String, Object> property = dtSimulationService.getSimulationSetModelProperty(param);
        int windowSize = 0;
        log.info("dtAugment -> {}", dtAugment);
        if (Objects.equals(dtAugment.getSimTp(), "A") && Objects.equals(dtAugment.getAugmentTp(), "R")) {
            try {
                String json = property.get("user_pprcs_full_stng_value").toString();
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(json);
                windowSize = Integer.parseInt(rootNode.get("preproc_property_info").get(0).get("model_property").get(0).get("hyperparam").get("window_size").asText().replaceAll("\"", ""));
            } catch (Exception e) {
                log.warn("window Size가 없습니다.");
            }
        }
        model.addAttribute("windowSize", windowSize);
        model.addAttribute("dTAugment", dtAugment);
        model.addAttribute("file_list", file_list);
        model.addAttribute("log_list", log_list);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("formType", "U");

        model.addAttribute("sim_type_list", getCodeList3("SIM_TYPE", true));
        model.addAttribute("augment_type_list", getCodeList3("AUGMENT_TYPE", true));
        model.addAttribute("data_crt_intvl_tp_list", getCodeList3("AUGMENT_INTVL_TYPE", true));
        model.addAttribute("cycle_tp", getCodeList3("CYCLE_TP", true));

        model.addAttribute("limit", systemProperties.getLimitCsvRowCount());

        // 요청된 URL 확인
        String requestUrl = request.getRequestURI();
        log.info("requestUrl -> {}", requestUrl);

        // 요청된 경로에 따라 리다이렉트 경로 변경
        if (requestUrl.contains("/shared/preprocess/")) {
            model.addAttribute("prevUrl", "/dt/simulation/preprocess/list");
        } else if (requestUrl.contains("/shared/augment/")) {
            model.addAttribute("prevUrl", "/dt/simulation/augment/list");
        } else {
            // 기본 "/form"은 추가 작업 없이 그대로 사용
            model.addAttribute("prevUrl", "/dt/simulation/list");
        }
        if (property.get("job_level") != null && property.get("job_level").toString().equals("P")) {
            model.addAttribute("modelUrl", "/dt/model/preprocess/" + dtAugment.getModelSeq() + "?menuCd=" + params.getMenuCd());
        } else if (property.get("job_level") != null && property.get("job_level").toString().equals("M")) {
            model.addAttribute("modelUrl", "/dt/model/model/" + dtAugment.getModelSeq() + "?menuCd=" + params.getMenuCd());
        } else {
            model.addAttribute("modelUrl", "/dt/model/" + dtAugment.getModelSeq() + "?menuCd=" + params.getMenuCd());
        }
        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtAugment.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_simulation/platform_view";
    }

    @PostMapping(value = "/{augmentSeq}/prediction")
    @ResponseBody
    public Map<String, Object> getSimulationPredictionView(HttpServletRequest request, @PathVariable String augmentSeq) throws IOException, JSONException {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> predictionViewParam = dtSimulationService.getSimulationPredictionView(Integer.parseInt(augmentSeq));
        log.info("predictionViewParam -> {}", predictionViewParam);
        if (predictionViewParam != null) {
            Map<String, Object> data = FileReader.getInstance().readCSV(systemProperties.getDtMetaFilePath() + predictionViewParam.get("augment_file_path"));
            result.put("data", data);
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        } else {
            result.put("message", "추론된 파일이 없습니다.");
            result.put("code", GlobalConstant.API_STATUS.FAIL);
        }
        return result;
    }

    @PostMapping(value = "/insertSimulationViewResult")
    @ResponseBody
    public Map<String, Object> insertSimulationViewResult(@RequestBody Map<String, Object> params, HttpServletRequest request) throws IOException, JSONException {
        Map<String, Object> result = new HashMap<>();
        int augmentSeq = Integer.parseInt(params.get("augmentSeq").toString());
        List<Map<String, Object>> fileList = dtSimulationService.getDTSimulationFileList(augmentSeq);
        log.info("fileList -> {}, {}", fileList, fileList.isEmpty());
        if (fileList.isEmpty()) {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("message", "추론된 파일이 없습니다.");
            return result;
        }

        Map<String, Object> fileInfo = fileList.get(0);
        String filePath = systemProperties.getDtMetaFilePath() + fileInfo.get("file_path").toString();
        String fileName = fileInfo.get("file_nm").toString();
        log.info("insertSimulationViewResult filePath -> {}, fileName -> {}", filePath, fileName);
        try {
            List<Map<String, Object>> readCSVResult = FileReader.getInstance().readCSVToListObjectMap(filePath + File.separator + fileName);
            List<String> headers = FileReader.getInstance().readHeaders(filePath + File.separator + fileName, 1);
            result.put("data", readCSVResult);
            result.put("headers", headers);
            result.put("index_trgt_col", ConvertUtil.findDateColumn(readCSVResult));
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("message", "CSV 형태로 읽을 수 없습니다.");
        }
        return result;
    }

    @PostMapping(value = "/get/model/list")
    @ResponseBody
    public Map<String, Object> getModelList(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getModelList param -> {}", param.toString());
        param.put("userSeq", authenticationFacade.getLoginUserSeq());
        List<Map<String, Object>> model_list = dtSimulationService.getSimulationSetModelList(param);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("count", model_list.size());
        result.put("data", model_list);
        return result;
    }

    @PostMapping(value = "/get/model/property")
    @ResponseBody
    public Map<String, Object> getModelProperty(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getModelProperty param : " + param.toString());
        Map<String, Object> property = dtSimulationService.getSimulationSetModelProperty(param);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", property);

        return result;
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    @PostMapping(value = "/save/augment")
    @ResponseBody
    public Map<String, Object> saveAugment(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("saveAugment -> " + param.toString());
        param.put("user_seq", authenticationFacade.getLoginUserSeq());
        param.put("user_ip", authenticationFacade.getLoginUserIp());

        String cycle_bgng_dsgn_ymd = TimeUtil.parseToYYYYMMDDHHMMSSAtCurrent(false, param.get("cycle_bgng_dsgn_ymd").toString());
        String cycle_end_dsgn_ymd;
        if (param.get("cycle_end_dsgn_ymd") != null && param.get("cycle_end_dsgn_ymd").toString().length() != 0) {
            cycle_end_dsgn_ymd = TimeUtil.parseToYYYYMMDDHHMMSS(true, param.get("cycle_end_dsgn_ymd").toString());
        } else {
            cycle_end_dsgn_ymd = null;
        }

        //json 파싱
        //data 범위로 끌오오기 - 범위만큼 가져와서 전처리, 모델 있으면 모델 처리
        int modelSeq = Integer.parseInt(param.get("model_seq").toString());
        DTModel dtModel = dtModelService.selectMetaModel(modelSeq);
        DTModelMetaUserItem dtModelMetaUserItem = dtModelService.selectMetaUserItem(dtModel.getModelSeq());
        String twin_id = dtModelMetaUserItem.getTwinId();
        String obj_id = dtModelMetaUserItem.getTwinObjId();

        Map<String, Object> params = new HashMap<>();
        params.put("digital_twins", twin_id);
        params.put("digital_objects", obj_id);
        String data_crt_last_hr = TimeUtil.parseToYYYYMMDDHHMMSSAtCurrent(false, param.get("data_crt_last_hr").toString());

        param.put("cycle_bgng_dsgn_ymd", cycle_bgng_dsgn_ymd);
        param.put("cycle_end_dsgn_ymd", cycle_end_dsgn_ymd);
        param.put("data_crt_last_hr", data_crt_last_hr);
        param.put("data_crt_bgng_hr", data_crt_last_hr);
        String use_yn = param.get("use_yn").toString();
        param.put("use_yn", use_yn);
        String rls_yn = param.get("rls_yn").toString();
        param.put("rls_yn", rls_yn);
        if (Objects.equals(param.get("cycle_tp").toString(), "ETC")) {
            param.put("data_crt_intvl_tp", param.get("etc_time_tp").toString());
            param.put("data_crt_intvl_value", param.get("etc_time_intvl").toString());
        }

        /**
         * 2024-07-10
         * 증강 모델 생성시 디지털 트윈 객체 생성 관련 로직 수정 및 추가
         *
         * 증강 모델 생성 SEQ 가져와서 바로 Select 차후 로직 실행
         * @author kimwoosik
         * */
        int augmentSeq = dtSimulationService.getSimulationSaveAugment(param);

        /**
         * 2025-03-14
         * 증강 생성시 데이터 증강 도구에 이력 남기기
         * */
        ModelReferenceLog modelReferenceLog = new ModelReferenceLog();
        modelReferenceLog.setRefSimulationSeq(augmentSeq);
        modelReferenceLog.setModelSeq(modelSeq);
        modelReferenceLog.setRegUserSeq(authenticationFacade.getLoginUserSeq());
        modelReferenceLog.setRegIp(authenticationFacade.getLoginUserIp());
        logService.insertDtModelReferenceLog(modelReferenceLog);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping(value = "/delete")
    @ResponseBody
    public Map<String, Object> deleteAugment(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("deleteAugment param -> " + param.toString());
        if (param.get("augment_seq") != null) {
            int augment_seq = Integer.parseInt(param.get("augment_seq").toString());
            /**
             * 2024-09-05
             * 1208174775623601
             * 제약 조건 추가 부분
             * 조건1 : 해당 시뮬레이션이 USE_YN = 'N'인 상태인것만 삭제 가능
             * 조건2 : 해당 시뮬레이션이 AUGMENT_TP = 'O' 또는 'F'인 상태인것만 삭제 가능
             * 조건3 : 해당 시뮬레이션이 AUGMENT_TP = 'R' 일때, AUGMENT_STATUS = 'S' 또는 'C'일때 삭제 가능
             *
             * 주의점 : KETI AUGMENT DELETE API 구현/미구현에 따라 달라진다.
             * */
            DTAugment dtAugment = dtSimulationService.getDTSimulation(augment_seq);
            log.info("deleting dtAugment -> {}", dtAugment);
            if (Objects.equals(dtAugment.getUseYn(), "Y")) {
                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("type", "restrict");
                result.put("message", "해당 시뮬레이션의 사용 여부가 \"사용\"으로 되어있습니다.\n미사용으로 설정해주세요.");
            } else {
                if (Objects.equals(dtAugment.getAugmentTp(), "O") || Objects.equals(dtAugment.getAugmentTp(), "F")) {
                    Map<String, Object> parameters = new HashMap<String, Object>();
                    parameters.put("augment_seq", augment_seq);
                    parameters.put("user_seq", authenticationFacade.getLoginUserSeq());
                    parameters.put("user_ip", authenticationFacade.getLoginUserIp());
                    dtSimulationService.deleteDTSimulation(parameters);
                    result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                    result.put("type", "success");
                } else {
                    if (Objects.equals(dtAugment.getAugmentStatus(), "T")) {
                        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                        result.put("type", "restrict");
                        result.put("message", "해당 시뮬레이션은 진행 중 상태입니다.\n진행 여부를 일시중지로 설정해주세요.");
                    } else {
                        Map<String, Object> parameters = new HashMap<String, Object>();
                        parameters.put("augment_seq", augment_seq);
                        parameters.put("user_seq", authenticationFacade.getLoginUserSeq());
                        parameters.put("user_ip", authenticationFacade.getLoginUserIp());
                        dtSimulationService.deleteDTSimulation(parameters);
                        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                        result.put("type", "success");
                    }
                }
            }
        } else {
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("type", "nofind");
        }
        return result;
    }
}
