package com.stoneitgt.dt.data.platform.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.service.DTEtcModelService;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.util.StoneUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.*;

@Slf4j
@Controller
@RequestMapping("/dt/etc/model")
public class DTEtcModelController extends BaseController {

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private DTEtcModelService dtEtcModelService;

    /**
     * getModelList(), getSharedModelList() 한세트
     */
    @GetMapping("/ae/list")
    public String getAEModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
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

    @GetMapping("/naomi/list")
    public String getNaomiModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        paramsMap.put("model_tp", "naomi");
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
        subParamsMap.put("model_tp", "naomi");
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
        return "pages/dt_etc_model/naomi-list";
    }

    @GetMapping(value = {"/form", "/ae/form", "/rf/form", "/brits/form", "/naomi/form"})
    public String modelForm(@ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));
        String formType = "I";
        model.addAttribute("formType", formType);
        int limit = systemProperties.getLimitCsvRowCount();
        model.addAttribute("limit", limit);

        //TB_META_MODEL_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        List<Map<String, Object>> unit_code_list = dtEtcModelService.getUnitCodeList();
        model.addAttribute("unit_code_list", unit_code_list);

        model.addAttribute("interp_type_list", getCodeList2("INTERP_TYPE", false));
        model.addAttribute("resamp_type_list", getCodeList("RESAMP_TYPE", false));
        model.addAttribute("unit_type_list", getCodeList("UNIT_TYPE", false));

        model.addAttribute("valid_mater_list", getCodeList("VERIFY_TYPE", false));

        if (authenticationFacade.getAuth().equals("AU00") && Objects.equals(formType, "I")) {
            model.addAttribute("GRANT", true);
        } else {
            //생성된 아이템의 주인이거나 아니면 생성할려고 하거나 할때 GRANT는 TRUE
            if (authenticationFacade.getLoginUserSeq() == dtModelEtc.getRegUserSeq() && Objects.equals(formType, "I")) {
                model.addAttribute("GRANT", true);
            } else {
                //생성된 아이템의 주인이 아니면
                model.addAttribute("GRANT", false);
            }
        }

        return "pages/dt_etc_model/platform_form";
    }

    @PostMapping("/savePreproc")
    @ResponseBody
    public Map<String, Object> savePreproc(HttpServletRequest request) throws IOException {
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

        //TB_META_MODEL_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        String formType = "U";
        model.addAttribute("formType", formType);

        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);

        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());
        model.addAttribute("dataFile", files);

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }

        if (authenticationFacade.getAuth().equals("AU00") && Objects.equals(formType, "I")) {
            model.addAttribute("GRANT", true);
        } else {
            //생성된 아이템의 주인이거나 아니면 생성할려고 하거나 할때 GRANT는 TRUE
            if (authenticationFacade.getLoginUserSeq() == dtModelEtc.getRegUserSeq() && Objects.equals(formType, "I")) {
                model.addAttribute("GRANT", true);
            } else {
                //생성된 아이템의 주인이 아니면
                model.addAttribute("GRANT", false);
            }
        }

        return "pages/dt_etc_model/platform_form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/rf/{etcModelSeq}")
    public String rfModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_META_MODEL_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        String formType = "U";
        model.addAttribute("formType", formType);

        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);

        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());
        model.addAttribute("dataFile", files);

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }

        if (authenticationFacade.getAuth().equals("AU00") && Objects.equals(formType, "I")) {
            model.addAttribute("GRANT", true);
        } else {
            //생성된 아이템의 주인이거나 아니면 생성할려고 하거나 할때 GRANT는 TRUE
            if (authenticationFacade.getLoginUserSeq() == dtModelEtc.getRegUserSeq() && Objects.equals(formType, "I")) {
                model.addAttribute("GRANT", true);
            } else {
                //생성된 아이템의 주인이 아니면
                model.addAttribute("GRANT", false);
            }
        }

        return "pages/dt_etc_model/platform_form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/brits/{etcModelSeq}")
    public String britsModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_META_MODEL_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        String formType = "U";
        model.addAttribute("formType", formType);

        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);

        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());
        model.addAttribute("dataFile", files);

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }

        if (authenticationFacade.getAuth().equals("AU00") && Objects.equals(formType, "I")) {
            model.addAttribute("GRANT", true);
        } else {
            //생성된 아이템의 주인이거나 아니면 생성할려고 하거나 할때 GRANT는 TRUE
            if (authenticationFacade.getLoginUserSeq() == dtModelEtc.getRegUserSeq() && Objects.equals(formType, "I")) {
                model.addAttribute("GRANT", true);
            } else {
                //생성된 아이템의 주인이 아니면
                model.addAttribute("GRANT", false);
            }
        }

        return "pages/dt_etc_model/platform_form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/naomi/{etcModelSeq}")
    public String naomiModelView(@PathVariable int etcModelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModelEtc dtModelEtc = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();

        //TB_META_MODEL_ITEM
        List<Map<String, Object>> algorithm_list = dtEtcModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        String formType = "U";
        model.addAttribute("formType", formType);

        dtModelEtc = dtEtcModelService.selectMetaModel(etcModelSeq);
        dtModelEtcMetaUserItem = dtEtcModelService.selectMetaUserItem(etcModelSeq);

        Files files = dtEtcModelService.getDtPreprocLastFile(etcModelSeq);

        model.addAttribute("dtModelEtc", dtModelEtc);
        model.addAttribute("dtModelEtcMetaUserItem", dtModelEtcMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());
        model.addAttribute("dataFile", files);

        if ("DONE".equals(dtModelEtc.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtEtcModelService.getModelLossList(etcModelSeq);
            model.addAttribute("list_loss", list_loss);
        } else if (Objects.equals("FAIL", dtModelEtc.getModelStatus())) {
            /* 해당 모델과 관련된 에러 최신 로그 가져오기*/
            ErrorLog errorLog = errorService.getErrorLog(dtModelEtc.getEtcModelSeq(), "Make AI Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }

        if (authenticationFacade.getAuth().equals("AU00") && Objects.equals(formType, "I")) {
            model.addAttribute("GRANT", true);
        } else {
            //생성된 아이템의 주인이거나 아니면 생성할려고 하거나 할때 GRANT는 TRUE
            if (authenticationFacade.getLoginUserSeq() == dtModelEtc.getRegUserSeq() && Objects.equals(formType, "I")) {
                model.addAttribute("GRANT", true);
            } else {
                //생성된 아이템의 주인이 아니면
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_etc_model/platform_form";
    }

    @PostMapping("/make/algorithm_meta_set")
    @ResponseBody
    public Map<String, Object> algorithmMeatSet(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("model_seq", Integer.parseInt(params.get("model_seq").toString()));
        int model_algrm_seq = Integer.parseInt(params.get("model_algrm_seq").toString());
        map.put("model_algrm_seq", model_algrm_seq);

        //Get
        List<Map<String, Object>> algorithm_meta_item_list = dtEtcModelService.getModelAlgorithmParamsList(map);

        //Default
        List<Map<String, Object>> algorithm_param_template_set = new ArrayList<>();

        List<Map<String, Object>> loss_list = new ArrayList<>();
        List<Map<String, Object>> meterics_list = new ArrayList<>();
        List<Map<String, Object>> optimizer_list = new ArrayList<>();
        if (model_algrm_seq == 3) {
            loss_list = dtEtcModelService.getAlgolithmCodeList("BRITS_LOSS");
            optimizer_list = dtEtcModelService.getAlgolithmCodeList("BRITS_OPTIMIZER");
        }

        for (Map<String, Object> algorithmMetaItem : algorithm_meta_item_list) {
            Map<String, Object> defaultItem = new HashMap<>();
            defaultItem.put(algorithmMetaItem.get("model_params_item").toString(), algorithmMetaItem.get("model_params_item_crtr_1"));
            algorithm_param_template_set.add(defaultItem);
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
            boolean checkNAOMI = dtModelService.checkUseNaomiModel(model_seq);

            if (!checkAE && !checkRF && !checkRF && !checkNAOMI) {
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
                result.put("model_type", checkAE ? "AE" : checkRF ? "RF" : checkBRITS ? "BRITS" : checkNAOMI ? "NAOMI" : "EMPTY");
            }
        } else {
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("type", "nofind");
        }
        return result;
    }
}
