package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.*;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.StoneUtil;

@Slf4j
@Controller
@RequestMapping("/dt/etc/model")
public class DTEtcCModelController extends BaseController {

    @Autowired
    private DTEtcModelApiService dtEtcModelApiService;

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private DTEtcModelService dtEtcModelService;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Autowired
    private ErrorService errorService;

    @Autowired
    private FilesService filesService;

    /**
     * getModelList(), getSharedModelList() 한세트
     */
    @GetMapping("/ae/list")
    public String getAEModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("paramsMap -> {}", paramsMap);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        paramsMap.put("model_tp", "auto encoder");
        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtEtcModelService.getDTEtcModelListByModelTp(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtEtcModelService.getDTEtcModelListSetUserSeqByModelTp(paramsMap, paging);
        }
        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("etc_model_seq").toString()), "Make AI Model");
            if (errorLog != null) {
                map.put("ERR_TP", errorLog.getErrTp());
                map.put("ERR_CD", errorLog.getErrCd());
                map.put("ERR_NM", errorLog.getErrNm());
                map.put("ERR_LCT", errorLog.getErrLct());
                map.put("ERR_CN", errorLog.getErrCn());
                map.put("ERRREGDT", errorLog.getRegDt());
            } else {
                map.put("ERR_TP", "PLATFORM");
                map.put("ERR_CD", "500");
                map.put("ERR_NM", "INTERNAL_SERVER_ERROR");
                map.put("ERR_LCT", "Make AI Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);

        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());

        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        subParamsMap.put("model_tp", "auto encoder");
        List<Map<String, Object>> share_list = dtEtcModelService.getDTEtcModelSharedListByModelTp(subParamsMap, subPaging);
        for (Map<String, Object> map : share_list) {
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_etc_model/ae-list";
    }

    @GetMapping("/rf/list")
    public String getRFModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("paramsMap -> {}", paramsMap);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        paramsMap.put("model_tp", "random forest");
        if (authenticationFacade.getAuth().equals("AU00")) {
            //list = dtEtcModelService.getDTEtcModelList(paramsMap, paging);
            list = dtEtcModelService.getDTEtcModelListByModelTp(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            //list = dtEtcModelService.getDTEtcModelListSetUserSeq(paramsMap, paging);
            list = dtEtcModelService.getDTEtcModelListSetUserSeqByModelTp(paramsMap, paging);
        }
        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("etc_model_seq").toString()), "Make AI Model");
            if (errorLog != null) {
                map.put("ERR_TP", errorLog.getErrTp());
                map.put("ERR_CD", errorLog.getErrCd());
                map.put("ERR_NM", errorLog.getErrNm());
                map.put("ERR_LCT", errorLog.getErrLct());
                map.put("ERR_CN", errorLog.getErrCn());
                map.put("ERRREGDT", errorLog.getRegDt());
            } else {
                map.put("ERR_TP", "PLATFORM");
                map.put("ERR_CD", "500");
                map.put("ERR_NM", "INTERNAL_SERVER_ERROR");
                map.put("ERR_LCT", "Make AI Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);


        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());

        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        subParamsMap.put("model_tp", "random forest");
        List<Map<String, Object>> share_list = dtEtcModelService.getDTEtcModelSharedListByModelTp(subParamsMap, subPaging);
        for (Map<String, Object> map : share_list) {
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_etc_model/rf-list";
    }

    @GetMapping("/brits/list")
    public String getBritsModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("paramsMap -> {}", paramsMap);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        paramsMap.put("model_tp", "brits");
        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtEtcModelService.getDTEtcModelListByModelTp(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtEtcModelService.getDTEtcModelListSetUserSeqByModelTp(paramsMap, paging);
        }
        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("etc_model_seq").toString()), "Make AI Model");
            if (errorLog != null) {
                map.put("ERR_TP", errorLog.getErrTp());
                map.put("ERR_CD", errorLog.getErrCd());
                map.put("ERR_NM", errorLog.getErrNm());
                map.put("ERR_LCT", errorLog.getErrLct());
                map.put("ERR_CN", errorLog.getErrCn());
                map.put("ERRREGDT", errorLog.getRegDt());
            } else {
                map.put("ERR_TP", "PLATFORM");
                map.put("ERR_CD", "500");
                map.put("ERR_NM", "INTERNAL_SERVER_ERROR");
                map.put("ERR_LCT", "Make AI Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);


        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());

        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        subParamsMap.put("model_tp", "brits");
        List<Map<String, Object>> share_list = dtEtcModelService.getDTEtcModelSharedListByModelTp(subParamsMap, subPaging);
        for (Map<String, Object> map : share_list) {
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_etc_model/brits-list";
    }

    /**
     * getModelList(), getSharedModelList() 한세트
     */
    @GetMapping("/shared/ae/list")
    public String getSharedAEModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());
        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());
        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("paramsMap -> {}", paramsMap);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtEtcModelService.getDTEtcModelList(subParamsMap, subPaging);
        } else {
            subParamsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtEtcModelService.getDTEtcModelListSetUserSeq(subParamsMap, subPaging);
        }
        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("etc_model_seq").toString()), "Make AI Model");
            if (errorLog != null) {
                map.put("ERR_TP", errorLog.getErrTp());
                map.put("ERR_CD", errorLog.getErrCd());
                map.put("ERR_NM", errorLog.getErrNm());
                map.put("ERR_LCT", errorLog.getErrLct());
                map.put("ERR_CN", errorLog.getErrCn());
                map.put("ERRREGDT", errorLog.getRegDt());
            } else {
                map.put("ERR_TP", "PLATFORM");
                map.put("ERR_CD", "500");
                map.put("ERR_NM", "INTERNAL_SERVER_ERROR");
                map.put("ERR_LCT", "Make AI Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("list", list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(list, subPaging));
        model.addAttribute("subParams", params);

        paramsMap.put("model_tp", "auto encoder");
        List<Map<String, Object>> share_list = dtEtcModelService.getDTEtcModelSharedListByModelTp(paramsMap, paging);
        for (Map<String, Object> map : share_list) {
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("share_list", share_list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(share_list, paging));
        model.addAttribute("params", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_etc_model/shared-ae-list";
    }

    @GetMapping("/shared/rf/list")
    public String getSharedRFModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());
        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());
        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        log.info("paramsMap -> {}", paramsMap);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtEtcModelService.getDTEtcModelList(subParamsMap, subPaging);
        } else {
            subParamsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtEtcModelService.getDTEtcModelListSetUserSeq(subParamsMap, subPaging);
        }
        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("etc_model_seq").toString()), "Make AI Model");
            if (errorLog != null) {
                map.put("ERR_TP", errorLog.getErrTp());
                map.put("ERR_CD", errorLog.getErrCd());
                map.put("ERR_NM", errorLog.getErrNm());
                map.put("ERR_LCT", errorLog.getErrLct());
                map.put("ERR_CN", errorLog.getErrCn());
                map.put("ERRREGDT", errorLog.getRegDt());
            } else {
                map.put("ERR_TP", "PLATFORM");
                map.put("ERR_CD", "500");
                map.put("ERR_NM", "INTERNAL_SERVER_ERROR");
                map.put("ERR_LCT", "Make AI Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("list", list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(list, subPaging));
        model.addAttribute("subParams", params);
        paramsMap.put("model_tp", "random forest");
        List<Map<String, Object>> share_list = dtEtcModelService.getDTEtcModelSharedListByModelTp(paramsMap, paging);
        for (Map<String, Object> map : share_list) {
            if (map.get("model_algrm_seq") != null) {
                int model_algrm_seq = Integer.parseInt(map.get("model_algrm_seq").toString());
                Map<String, Object> modelAlgorithmResult = dtEtcModelService.getModelAlgorithmBySeq(model_algrm_seq);
                map.put("model_algorithm", modelAlgorithmResult.get("rmrk").toString());
            } else {
                map.put("model_algorithm", "");
            }
        }
        model.addAttribute("share_list", share_list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(share_list, paging));
        model.addAttribute("params", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_etc_model/shared-rf-list";
    }

    @GetMapping(value = {"/form", "/ae/form", "/rf/form", "/brits/form"})
    public String modelForm(@ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));

        model.addAttribute("formType", "I");
        int limit = systemproperties.getLimitCsvRowCount();
        model.addAttribute("limit", limit);

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        List<Map<String, Object>> unit_code_list = dtEtcModelService.getUnitCodeList();
        model.addAttribute("unit_code_list", unit_code_list);

        model.addAttribute("interp_type_list", getCodeList2("INTERP_TYPE", false));
        model.addAttribute("resamp_type_list", getCodeList("RESAMP_TYPE", false));
        model.addAttribute("unit_type_list", getCodeList("UNIT_TYPE", false));

        model.addAttribute("valid_mater_list", getCodeList("VERIFY_TYPE", false));

        return "pages/dt_etc_model/form";
    }

    @PostMapping("/savePreproc")
    @ResponseBody
    public Map<String, Object> savePreproc2(HttpServletRequest request) throws IOException {
        String jsonString = extractRequestBody(request);
        ObjectMapper objectMapper = new ObjectMapper();
        DTModelJsonProperty sss = objectMapper.readValue(jsonString, DTModelJsonProperty.class);
        DTModelJsonPropertyMain info = sss.getPreproc_property_info().get(0);

        info.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        info.setLoginUserIp(authenticationFacade.getLoginUserIp());

        Map<String, Object> result = dtEtcModelService.insertPreprocProcess(jsonString, info);

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    private String extractRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder stringBuilder = new StringBuilder();
        BufferedReader bufferedReader = null;
        try {
            bufferedReader = request.getReader();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                stringBuilder.append(line);
            }
        } finally {
            if (bufferedReader != null) {
                bufferedReader.close();
            }
        }
        return stringBuilder.toString();
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/ae/{etcModelSeq}")
    public String aeModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        log.info("params -> {}", params);
        log.info("Model -> {}", model);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");


        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);


        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        return "pages/dt_etc_model/form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/rf/{etcModelSeq}")
    public String rfModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        log.info("params -> {}", params);
        log.info("Model -> {}", model);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");

        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);

        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        return "pages/dt_etc_model/form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/brits/{etcModelSeq}")
    public String britsModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        log.info("params -> {}", params);
        log.info("Model -> {}", model);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");

        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);

        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        return "pages/dt_etc_model/form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/shared/ae/{etcModelSeq}")
    public String sharedAEModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        log.info("params -> {}", params);
        log.info("Model -> {}", model);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");


        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);


        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        return "pages/dt_etc_model/form";
    }

    @GetMapping("/shared/rf/{etcModelSeq}")
    public String sharedRFModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        log.info("params -> {}", params);
        log.info("Model -> {}", model);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");


        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);


        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        return "pages/dt_etc_model/form";
    }

    @PostMapping("/load/preprocFile")
    @ResponseBody
    public Map<String, Object> loadPreprocFile(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String formType = params.get("form_type").toString();
        String file_path = null;

        if ("I".equals(formType)) {
            file_path = systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + params.get("file_path").toString();
        } else {
            file_path = systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + File.separator + params.get("file_path").toString();
        }


        Map<String, Object> resultCsv = readCSV(file_path, params.get("file_name").toString(), 0);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("header_list", resultCsv.get("header_list").toString());
        result.put("data_list", resultCsv.get("data_list").toString());

        return result;
    }

    @PostMapping(value = "/csvFileUpload")
    @ResponseBody
    public Map<String, Object> csvFileUpload(@ModelAttribute AugmentModel augmentModel, HttpServletRequest request) throws Exception {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> param = new HashMap<>();
        //modal 에서 선택한 인덱스컬럼, 시간값을 python 에 보낸 후 가상으로 셀렉트 해온 데이터를 생성, 파일명은 java에서 우선 보냄
        String user_tmp_key = WebConfig.getSessionInfo().getUserId() + currentTimeMillis();
        if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
            MultipartFile attachFile = augmentModel.getAttachFilesCsv().get(0);
            param = filesService.saveNewEtcDtFiles(attachFile, user_tmp_key);
        }

        param.put("user_tmp_key", user_tmp_key);
        ResponseEntity<?> resultOriginFileSet = dtEtcModelApiService.makeUserUploadBaseDataFile(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        int limit = 0;
        Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("file_name").toString(), limit);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("header_list", resultCsv.get("header_list").toString());
        result.put("data_list", resultCsv.get("data_list").toString());
        limit = systemproperties.getLimitCsvRowCount();
        result.put("limit", limit);
        return result;
    }

    @PostMapping(value = "/getBaseData")
    @ResponseBody
    public Map<String, Object> getBaseData(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        //modal 에서 선택한 인덱스컬럼, 시간값을 python 에 보낸 후 가상으로 셀렉트 해온 데이터를 생성, 파일명은 java에서 우선 보냄
        param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + currentTimeMillis());
        ResponseEntity<?> resultOriginFileSet = dtEtcModelApiService.makeBaseDataFile(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        int limit = systemproperties.getLimitCsvRowCount();
        Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("file_name").toString(), limit);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("header_list", resultCsv.get("header_list").toString());
        result.put("data_list", resultCsv.get("data_list").toString());

        return result;
    }

    @PostMapping(value = "/checkIndexTimeColumn")
    @ResponseBody
    public Map<String, Object> checkIndexTimeColumn(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("checkIndexTimeColumn param : " + param.toString());

        ResponseEntity<?> checkIndexTimeColumn = dtEtcModelApiService.checkIndexTimeColumn(param);

        String responseBody = checkIndexTimeColumn.getBody().toString();

        // JSON 문자열을 Map으로 변환
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);

        // 결과를 저장할 Map 생성
        result.put("data", responseMap);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping(value = "/getBaseDataSetRangeRow")
    @ResponseBody
    public Map<String, Object> getBaseDataSetRangeRow(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("param -> " + param.toString());
        int limit = systemproperties.getLimitCsvRowCount();
        param.put("limit", limit);

        ResponseEntity<?> resultBaseDataSetRangeRow = dtEtcModelApiService.makeBaseDataSetRangeRow(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeRow);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("base_file_nm_set_range_row").toString(), 0);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);

        result.put("index_trgt_col", resultJson.get("index_trgt_col").toString());
        result.put("target_start_date", resultJson.get("target_start_date").toString());
        result.put("target_end_date", resultJson.get("target_end_date").toString());
        result.put("target_row_count", resultJson.get("target_row_count").toString());
        result.put("base_file_nm_set_range_row", resultJson.get("base_file_nm_set_range_row").toString());
        result.put("header_list", resultCsv.get("header_list").toString());
        result.put("data_list", resultCsv.get("data_list").toString());

        return result;
    }

    @PostMapping(value = "/getBaseDataSetRangeCol")
    @ResponseBody
    public Map<String, Object> getBaseDataSetRangeCol(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> paramSet = propertyJsonParsingInfo(param.get("param").toString());

        paramSet.put("form_type", param.get("form_type").toString());
        paramSet.put("last_file_path", param.get("last_file_path").toString());
        ResponseEntity<?> resultBaseDataSetRangeCol = dtEtcModelApiService.makeBaseDataSetRangeCol(paramSet);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeCol);
        Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("base_file_nm_set_range_col").toString(), 0);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_file_nm_set_range_col", resultJson.get("base_file_nm_set_range_col").toString());
        result.put("header_list", resultCsv.get("header_list").toString());
        result.put("data_list", resultCsv.get("data_list").toString());
        return result;
    }

    @PostMapping(value = "/getDataSetInfo")
    @ResponseBody
    public Map<String, Object> getDataSetInfo(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        ResponseEntity<?> resultDataSetColumnListInfo = dtEtcModelApiService.getDataSetColumnListInfo(param);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", resultDataSetColumnListInfo.getBody());
        return result;
    }

    @PostMapping("/getDataTimeCheck")
    @ResponseBody
    public Map<String, Object> getDataTimeCheck(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String file_path = systemproperties.getDtEtcMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        ResponseEntity<?> checkTime = dtEtcModelApiService.getIndexColumnTimeCheck(setParam);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", checkTime.getBody());

        return result;
    }

    @PostMapping("/delete/files")
    @ResponseBody
    public Map<String, Object> deleteFiles(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<String, Object>();

        List<String> filesList = (List<String>) request.get("files");
        String base_dir = systemproperties.getDtEtcMetaFilePath() + "/tmp/" + request.get("file_path").toString();

        for (int i = 0; i < filesList.size(); i++) {
            FileUtil.delete(base_dir + "/" + filesList.get(i).toString());
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);

        return result;
    }

    @PostMapping("/make/algorithm_set")
    @ResponseBody
    public Map<String, Object> makeAlgorithmSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        String[] checkHeader = params.get("checkHeader").toString().replace("[", "").replace("]", "").split(", ");

        List<String> checkHeaderList = new ArrayList<String>();

        for (int ch = 0; ch < checkHeader.length; ch++) {
            checkHeaderList.add(checkHeader[ch]);
        }

        log.info("makeAlgorithmSet -> {}", params);
        Map<String, Object> result = new HashMap<String, Object>();
        int modelSeq = Integer.parseInt(params.get("model_seq").toString());

        DTModelEtc dtModelEtc = new DTModelEtc();
        dtModelEtc = dtEtcModelService.getAugmentModel(modelSeq);

        String correlationUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetCorrelation/";

        Map<String, Object> correlationParam = new HashMap<String, Object>();
        correlationParam.put("file_path", systemproperties.getDtEtcMetaFilePath().replace("\\", "/") + dtModelEtc.getFilePath());
        correlationParam.put("file_name", params.get("file_name").toString());
        correlationParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        correlationParam.put("columns", checkHeaderList);

        String correlationString = dtEtcModelApiService.requestDjangoApi(correlationUrl, correlationParam, modelSeq);

        JSONParser correlationParser = new JSONParser();
        JSONObject correlationObj = (JSONObject) correlationParser.parse(correlationString);

        if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("model_status", dtModelEtc.getModelStatus());
            result.put("correlation_data", correlationObj.get("data"));
            result.put("check_header_data", checkHeaderList);
        } else {
            log.info("FAIL -> {}", correlationObj);
            insertErrorLog(modelSeq, 0, "PYTHON", "datasetCorrelation", correlationObj.get("code").toString(), correlationObj.get("message").toString(), correlationObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }
        return result;
    }

    @PostMapping("/make/algorithm_meta_set")
    @ResponseBody
    public Map<String, Object> algorithmMeatSet(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("model_seq", Integer.parseInt(params.get("model_seq").toString()));
        int model_algrm_seq = Integer.parseInt(params.get("model_algrm_seq").toString());
        map.put("model_algrm_seq", model_algrm_seq);

        List<Map<String, Object>> algorithm_meta_item_list = dtEtcModelService.getModelAlgorithmParamsList(map);

        List<Map<String, Object>> algorithm_param_template_set = new ArrayList<>();

        if (algorithm_meta_item_list.size() > 0) {
            for (int i = 0; i < algorithm_meta_item_list.size(); i++) {
                Map<String, Object> newItem = new HashMap<>();
                newItem.put(algorithm_meta_item_list.get(i).get("model_params_item").toString(), null); // value 값은 여기에 설정하세요.
                algorithm_param_template_set.add(newItem);
            }
        }

        List<Map<String, Object>> loss_list = new ArrayList<>();
        List<Map<String, Object>> meterics_list = new ArrayList<>();
        List<Map<String, Object>> optimizer_list = new ArrayList<>();
        if (model_algrm_seq == 3) {
            loss_list = dtEtcModelService.getAlgolithmCodeList("BRITS_LOSS");
            optimizer_list = dtEtcModelService.getAlgolithmCodeList("BRITS_OPTIMIZER");
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);

        result.put("meta_item_loss_list", loss_list);
        result.put("meta_item_meterics_list", meterics_list);
        result.put("meta_item_optimizer_list", optimizer_list);

        result.put("algorithm_meta_item_list", algorithm_meta_item_list);
        result.put("algorithm_param_template_set", algorithm_param_template_set);
        return result;
    }

    @PostMapping("/make/model_set")
    @ResponseBody
    public Map<String, Object> makeModel(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> requestBody = new HashMap<>();
        int algorithm_seq = Integer.parseInt(params.get("algorithm_seq").toString());
        String algorithm = params.get("algorithm").toString();

        requestBody.put("etc_model_seq", params.get("model_seq"));
        requestBody.put("algorithm_seq", params.get("algorithm_seq"));
        requestBody.put("algorithm", algorithm.toLowerCase());
        requestBody.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
        requestBody.put("reg_ip", authenticationFacade.getLoginUserIp());
        requestBody.put("trgt_col", params.get("output_col"));
        List<Map<String, Object>> item_list = (List<Map<String, Object>>) params.get("algorithm_meta_item_list");
        DTModelEtcParams dtModelEtcParams = new DTModelEtcParams();
        dtModelEtcParams.setEtcModelSeq(Integer.parseInt(params.get("model_seq").toString()));

        dtEtcModelService.checkAlgorithmModelParams(dtModelEtcParams);

        for (int i = 0; i < item_list.size(); i++) {
            dtModelEtcParams.setEtcModelSeq(Integer.parseInt(item_list.get(i).get("model_seq").toString()));
            dtModelEtcParams.setModelAlgrmSeq(Integer.parseInt(item_list.get(i).get("model_algrm_seq").toString()));
            dtModelEtcParams.setModelParamsItemSeq(Integer.parseInt(item_list.get(i).get("model_params_item_seq").toString()));
            dtModelEtcParams.setModelParamsItemValue(item_list.get(i).get("model_params_item_value").toString());
            dtEtcModelService.saveAlgorithmModelParams(dtModelEtcParams);
        }

        DTModelEtcColumn dTModelEtcOCColumn = new DTModelEtcColumn();
        dTModelEtcOCColumn.setModelColTp("OC");
        dTModelEtcOCColumn.setEtcModelSeq(Integer.parseInt(params.get("model_seq").toString()));
        dTModelEtcOCColumn.setModelColNm(params.get("output_col").toString());
        dtEtcModelService.saveAlgorithmModelColumn(dTModelEtcOCColumn);

        if (Objects.equals(algorithm.toLowerCase(), "Random Forest".toLowerCase()) || algorithm_seq == 2) {
            ArrayList<String> features = (ArrayList<String>) params.get("feature_cols");
            for (String feature : features) {
                DTModelEtcColumn dTModelEtcFCColumn = new DTModelEtcColumn();
                dTModelEtcFCColumn.setModelColTp("FC");
                dTModelEtcFCColumn.setEtcModelSeq(Integer.parseInt(params.get("model_seq").toString()));
                dTModelEtcFCColumn.setModelColNm(feature);
                dtEtcModelService.saveAlgorithmModelColumn(dTModelEtcFCColumn);
            }
        }

        dtEtcModelService.updateAlgorithmSeq(requestBody);
        Map<String, Object> param = new HashMap<>();
        param.put("model_seq", params.get("model_seq"));
        param.put("user_pprcs_full_stng_value", params.get("full_text").toString());
        dtEtcModelService.updateMetaUerItemFulltext(param);

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("item_list", item_list);
        return result;
    }

    @PostMapping("/loss")
    @ResponseBody
    public Map<String, Object> getLoss(@RequestBody Map<String, Object> params) {
        int result = 1;
        log.info("getLoss -> {}", params);
        Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());
        Map<String, Object> data = dtEtcModelService.getModelLoss(modelSeq);
        HashMap<String, Object> map = new HashMap<String, Object>();
        map.put("result_code", result);
        map.put("loss", data);
        return map;
    }

    @PostMapping("/fid")
    @ResponseBody
    public Map<String, Object> getFID(@RequestBody Map<String, Object> params) {
        int result = 1;
        Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());
        Map<String, Object> data = dtEtcModelService.getModelFID(modelSeq);

        HashMap<String, Object> map = new HashMap<String, Object>();
        map.put("result_code", result);
        map.put("fid", data);

        return map;
    }

    @PostMapping("/testdata")
    @ResponseBody
    public Map<String, Object> getDataTest(@RequestBody Map<String, Object> params) throws IOException {
        int result = 1;
        int modelSeq = Integer.parseInt(params.get("modelSeq").toString());
        int count = Integer.parseInt(params.get("count").toString());

        List<Map<String, Object>> predFileList = getDtMetaFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
        List<Map<String, Object>> testFileList = getDtMetaFileList(FILE_REF_TYPE.TEST, modelSeq);

        String prctFilePath = systemproperties.getDtEtcMetaFilePath() + predFileList.get(0).get("file_path").toString() + predFileList.get(0).get("file_nm").toString();
        String testFilePath = systemproperties.getDtEtcMetaFilePath() + testFileList.get(0).get("file_path").toString() + testFileList.get(0).get("file_nm").toString();

        HashMap<String, Object> r = new HashMap<String, Object>();
        List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
        String title1 = "학습데이터 검증";
        String title2 = "학습데이터 검증";

        ArrayList<String> columns = new ArrayList<String>();
        getTestData(prctFilePath, dataList, "P", columns, count);
        getTestData(testFilePath, dataList, "T", columns, count);

        ArrayList<String> data_test_header = new ArrayList<String>();
        ArrayList<String> data_pred_header = new ArrayList<String>();
        List<Map<String, Object>> data_test = getTestDataList(testFilePath, data_test_header, count);
        List<Map<String, Object>> data_pred = getTestDataList(prctFilePath, data_pred_header, count);

        r.put("title", title1);
        r.put("subtitle", title2);
        r.put("series", dataList);
        r.put("data_test", data_test);
        r.put("data_test_header", data_test_header);
        r.put("data_pred", data_pred);
        r.put("data_pred_header", data_pred_header);

        HashMap<String, Object> map = new HashMap<String, Object>();
        map.put("result_code", result);
        map.put("test", r);

        return map;
    }

    public void getTestData(String filePath, List<Map<String, Object>> dataList, String type, ArrayList<String> columns, int count) throws IOException {
        ArrayList<HashMap<String, Object>> alData = new ArrayList<HashMap<String, Object>>();
        ArrayList<List<Map<String, Object>>> alResultList = new ArrayList<List<Map<String, Object>>>();
        ArrayList<Integer> columns_no = new ArrayList<Integer>();

        BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(new File(filePath))));

        String row;
        int n = 0;
        int colCount = 0;
        while ((row = br.readLine()) != null) {
            if (n == 0) {
                String[] temp = row.split(",");
                colCount = temp.length - 1;
                for (int i = 0; i < colCount; i++) {
                    if ("P".equals(type)) {
                        columns.add(temp[i + 1]);

                        HashMap<String, Object> data = new HashMap<String, Object>();
                        data.put("chart", "line");
                        data.put("name", type + "_" + temp[i + 1]);
                        data.put("unit", "");
                        alData.add(data);

                        List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
                        alResultList.add(resultList);
                    } else {
                        for (int j = 0; j < columns.size(); j++) {
                            if (columns.get(j).trim().equals(temp[i + 1].trim())) {
                                columns_no.add(j);

                                HashMap<String, Object> data = new HashMap<String, Object>();
                                data.put("chart", "line");
                                data.put("name", type + "_" + temp[i + 1]);
                                data.put("unit", "");
                                alData.add(data);

                                List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
                                alResultList.add(resultList);
                            }
                        }
                    }
                }
            } else {
                String[] temp = row.split(",");
                if ("P".equals(type)) {
                    for (int i = 0; i < colCount; i++) {
                        Map<String, Object> item = new HashMap<String, Object>();
                        item.put("name", n);
                        item.put("value", temp[i + 1]);

                        List<Map<String, Object>> resultList = alResultList.get(i);
                        resultList.add(item);
                    }
                } else {
                    for (int i = 0; i < colCount; i++) {
                        for (int j = 0; j < columns_no.size(); j++) {
                            if (columns_no.get(j) == i) {
                                Map<String, Object> item = new HashMap<String, Object>();
                                item.put("name", n);
                                item.put("value", temp[i + 1]);

                                List<Map<String, Object>> resultList = alResultList.get(i);
                                resultList.add(item);
                            }
                        }
                    }
                }
            }
            if (n == count) break;
            n++;
        }

        for (int i = 0; i < alData.size(); i++) {
            Map<String, Object> data = alData.get(i);
            List<Map<String, Object>> resultList = alResultList.get(i);
            data.put("data", resultList);
            dataList.add(data);
        }
    }

    public List<Map<String, Object>> getTestDataList(String filePath, ArrayList<String> columns, int count) throws IOException {
        List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
        BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(new File(filePath))));

        String row;
        int n = 0;
        int colCount = 0;
        while ((row = br.readLine()) != null) {
            if (n == 0) {
                String[] temp = row.split(",");
                colCount = temp.length - 1;
                for (int i = 0; i < colCount; i++) {
                    columns.add(temp[i + 1]);
                }
            } else {
                String[] temp = row.split(",");
                Map<String, Object> item = new HashMap<String, Object>();
                for (int i = 0; i < colCount; i++) {
                    item.put(columns.get(i), temp[i + 1]);
                }
                resultList.add(item);
            }
            if (n == count) break;
            n++;
        }
        return resultList;
    }

    @PostMapping(value = "/delete")
    @ResponseBody
    public Map<String, Object> deleteETCModel(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("deleteAEModel param -> " + param.toString());
        if (param.get("model_seq") != null) {
            int model_seq = Integer.parseInt(param.get("model_seq").toString());
            /**
             * 2024-09-04
             * 1208174775623601
             * 제약 조건 추가 부분
             * 조건 : 해당 AE Model이 사용되는 Data Twin Model이 없어야합니다.
             * */
            boolean checkAE = dtModelService.checkUseAEModel(model_seq);
            boolean checkRF = dtModelService.checkUseRFModel(model_seq);
            boolean checkBRITS = dtModelService.checkUseBritsModel(model_seq);

            if (!checkAE && !checkRF && !checkRF) {
                Map<String, Object> parameters = new HashMap<String, Object>();
                parameters.put("model_seq", model_seq);
                parameters.put("user_seq", authenticationFacade.getLoginUserSeq());
                parameters.put("user_ip", authenticationFacade.getLoginUserIp());
                dtEtcModelService.deleteModel(parameters);
                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("type", "success");
            } else {
                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("type", "restrict");
                result.put("model_type", checkAE ? "AE" : checkRF ? "RF" : checkBRITS ? "BRITS" : "EMPTY");
            }
        } else {
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("type", "nofind");
        }
        return result;
    }
}
