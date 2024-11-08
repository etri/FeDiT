package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.*;
import java.util.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import lombok.extern.slf4j.Slf4j;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.util.StoneUtil;

@Slf4j
@Controller
@RequestMapping("/dt/simulation")
public class DTSimulationController extends BaseController {

    @Autowired
    private SystemProperties systemProperties;

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @Autowired
    private SimulationService simulationService;

    @GetMapping("/preprocess/list")
    public String getPreprocessSimulationList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        paramsMap.put("sim_tp", "P");
        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtSimulationService.getDTSimulationListBySimTp(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtSimulationService.getDTSimulationListSetUserSeqBySimTp(paramsMap, paging);
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
        return "pages/dt_simulation/preprocess-list";
    }

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

    @GetMapping("/shared/preprocess/list")
    public String getSharedPreprocessSimulationList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {

        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtSimulationService.getDTSimulationList(subParamsMap, subPaging);
        } else {
            subParamsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtSimulationService.getDTSimulationListSetUserSeq(subParamsMap, subPaging);
        }

        model.addAttribute("share_list", list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(list, subPaging));
        model.addAttribute("subParams", params);
        paramsMap.put("sim_tp", "P");
        List<Map<String, Object>> share_list = dtSimulationService.getDTSimulationSharedListBySimTp(paramsMap, paging);
        model.addAttribute("list", share_list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(share_list, paging));
        model.addAttribute("params", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_simulation/shared-preprocess-list";
    }

    @GetMapping("/shared/augment/list")
    public String getSharedAugmentSimulationList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {

        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtSimulationService.getDTSimulationList(subParamsMap, subPaging);
        } else {
            subParamsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtSimulationService.getDTSimulationListSetUserSeq(subParamsMap, subPaging);
        }

        model.addAttribute("share_list", list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(list, subPaging));
        model.addAttribute("subParams", params);

        paramsMap.put("sim_tp", "A");
        List<Map<String, Object>> share_list = dtSimulationService.getDTSimulationSharedListBySimTp(paramsMap, paging);
        model.addAttribute("list", share_list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(share_list, paging));
        model.addAttribute("params", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_simulation/shared-augment-list";
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
        model.addAttribute("cycle_tp", getCodeList3("CYCLE_TP", true));
        model.addAttribute("limit", systemProperties.getLimitCsvRowCount());

        List<Map<String, Object>> data_crt_intvl_tp_list = simulationService.getModelDataTerm();
        model.addAttribute("data_crt_intvl_tp_list", data_crt_intvl_tp_list);

        // 요청된 URL 확인
        String requestUrl = request.getRequestURI();
        log.info("requestUrl -> {}", requestUrl);

        // 요청된 경로에 따라 리다이렉트 경로 변경
        model.addAttribute("prevUrl", "/dt/simulation/augment/list");
        return "pages/dt_simulation/form";
    }

    @PostMapping(value = {"/form", "/preprocess/form", "/augment/form"})
    public String updateForm(@RequestParam(required = false) String menuCd, @ModelAttribute BaseParameter params, @ModelAttribute SimulationModel simulationModel, BindingResult bindingResult, Model model, RedirectAttributes rttr, HttpServletRequest request) {
        String redirectUrl = "";
        if (params.getTemplateType() != null) {
            // 기본 리다이렉트 URL
            redirectUrl = "redirect:/dt/simulation/";
            redirectUrl += "augment/";
        } else {
            // 기본 리다이렉트 URL
            redirectUrl = "redirect:/dt/simulation/";
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

        DTAugment dtAugment = new DTAugment();

        dtAugment = dtSimulationService.getDTSimulation(augmentSeq);
        List<Map<String, Object>> file_list = dtSimulationService.getDTSimulationFileList(augmentSeq);
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
        if (requestUrl.contains("/preprocess/")) {
            model.addAttribute("prevUrl", "/dt/simulation/preprocess/list");
        } else if (requestUrl.contains("/augment/")) {
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
        return "pages/dt_simulation/view";
    }

    @GetMapping(value = {"/shared/{augmentSeq}", "/shared/preprocess/{augmentSeq}", "/shared/augment/{augmentSeq}"})
    public String sharedModelView(HttpServletRequest request, @PathVariable int augmentSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {

        DTAugment dtAugment = new DTAugment();

        dtAugment = dtSimulationService.getDTSimulation(augmentSeq);
        List<Map<String, Object>> file_list = dtSimulationService.getDTSimulationFileList(augmentSeq);
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
        return "pages/dt_simulation/view";
    }

    @PostMapping(value = "/{augmentSeq}/prediction")
    @ResponseBody
    public Map<String, Object> getSimulationPredictionView(HttpServletRequest request, @PathVariable String augmentSeq) throws IOException, org.json.simple.parser.ParseException {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> predictionViewParam = dtSimulationService.getSimulationPredictionView(Integer.parseInt(augmentSeq));
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        log.info("predictionViewParam -> {}", predictionViewParam);
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> data = fileReader.readCSV(systemProperties.getDtMetaFilePath() + predictionViewParam.get("augment_file_path"));
        result.put("data", data);
        return result;
    }

    @PostMapping("/make/correlation")
    @ResponseBody
    public Map<String, Object> makeResampleSetView(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();
        DTAugment dtAugment = dtSimulationService.getDTSimulation(Integer.parseInt(params.get("augmentSeq").toString()));
        int modelSeq = dtAugment.getModelSeq();
        DTModel dtModel = dtModelService.getAugmentModel(modelSeq);
        List<Map<String, Object>> fileList = dtSimulationService.getDTSimulationFileList(dtAugment.getAugmentSeq());
        Map<String, Object> fileInfo = fileList.get(0);
        String filePath = systemProperties.getDtMetaFilePath() + fileInfo.get("file_path").toString();
        String fileName = fileInfo.get("file_nm").toString();
        log.info("makeResampleSetView filePath -> {}, fileName -> {}", filePath, fileName);
        List<String> headers = new ArrayList<>();
        try {
            headers = FileReader.getInstance().readHeaders(filePath + File.separator + fileName, 1);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        List<Map<String, Object>> columns = new ArrayList<Map<String, Object>>();
        columns = dtSimulationService.getModelColumns(modelSeq);
        List<String> checkHeaderList = dtSimulationService.getTargetColumnInfo(modelSeq);
        Map<String, Object> correlationParam = new HashMap<String, Object>();
        correlationParam.put("file_path", filePath);
        correlationParam.put("file_name", fileName);
        correlationParam.put("index_trgt_col", dtModel.getIndexTrgtCol());
        correlationParam.put("columns", checkHeaderList);
        log.info("correlationParam -> {}", correlationParam);
        HashMap<String, Object> correlationResult = null;
        try {
            correlationResult = dtSimulationService.processorDatasetCorrelation(modelSeq, correlationParam);
            if (correlationResult != null) {
                log.info("correlationResult -> {}", correlationResult);
                result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("columns", columns);
                result.put("headers", headers);
                result.put("data", correlationResult.get("data"));
            } else {
                throw new RuntimeException();
            }
        } catch (org.json.simple.parser.ParseException e) {
            throw new RuntimeException(e);
        }
        return result;
    }

    @PostMapping(value = "/insertSimulationViewResult")
    @ResponseBody
    public Map<String, Object> insertSimulationViewResult(@RequestBody Map<String, Object> params, HttpServletRequest request) throws IOException, org.json.simple.parser.ParseException {
        Map<String, Object> result = new HashMap<>();
        int augmentSeq = Integer.parseInt(params.get("augmentSeq").toString());
        List<Map<String, Object>> fileList = dtSimulationService.getDTSimulationFileList(augmentSeq);
        Map<String, Object> fileInfo = fileList.get(0);
        String filePath = systemProperties.getDtMetaFilePath() + fileInfo.get("file_path").toString();
        String fileName = fileInfo.get("file_nm").toString();
        log.info("insertSimulationViewResult filePath -> {}, fileName -> {}", filePath, fileName);
        List<Map<String, String>> readCSVResult = null;
        List<String> headers = new ArrayList<>();
        try {
            readCSVResult = FileReader.getInstance().readCSVToListStringMap(filePath + File.separator + fileName);
            headers = FileReader.getInstance().readHeaders(filePath + File.separator + fileName, 1);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        result.put("data", readCSVResult);
        result.put("headers", headers);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping(value = "/get/model/list")
    @ResponseBody
    public Map<String, Object> getModelList(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getModelList param -> {}", param.toString());
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

        /**
         * 2024-07-10
         * 증강 모델 생성시 디지털 트윈 객체 생성 관련 로직 수정 및 추가
         *
         * 증강 모델 생성 SEQ 가져와서 바로 Select 차후 로직 실행
         * @author kimwoosik
         * */
        dtSimulationService.getSimulationSaveAugment(param);
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
