package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.*;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.file.FileWriter;
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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;

@Slf4j
@Controller
@RequestMapping("/dt/model")
public class DTModelController extends BaseController {

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private SystemProperties systemProperties;

    @Autowired
    private VerifyService verifyService;

    @Autowired
    private FilesService filesService;

    @Autowired
    private DTEtcModelService dtEtcModelService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @Autowired
    private APIService apiService;

    /**
     * getModelList(), getSharedModelList() 한세트
     */
    @GetMapping("/preprocess/list")
    public String getPreprocessModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        log.info("params -> {}", params);
        log.info("model -> {}", model);
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtModelService.getDTModelList(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtModelService.getDTModelListSetUserSeq(paramsMap, paging);
        }

        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("model_seq").toString()), "Make Data Twin Model");
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
                map.put("ERR_LCT", "Make Data Twin Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
        }

        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);

        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());
        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        List<Map<String, Object>> share_list = dtModelService.getDTModelSharedList(subParamsMap, subPaging);

        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_model/preprocess-list";
    }

    @GetMapping("/model/list")
    public String getModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        log.info("getModelList params -> {}, model -> {}", params, model);
        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = dtModelService.getDTModelList(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtModelService.getDTModelListSetUserSeq(paramsMap, paging);
        }

        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("model_seq").toString()), "Make Data Twin Model");
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
                map.put("ERR_LCT", "Make Data Twin Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
        }

        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);

        Paging subPaging = new Paging();
        subPaging.setPage(params.getSubPage());
        subPaging.setSize(params.getSubSize());
        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
        List<Map<String, Object>> share_list = dtModelService.getDTModelSharedList(subParamsMap, subPaging);

        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_model/model-list";
    }

    @GetMapping("/shared/preprocess/list")
    public String getSharedPreprocessModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        log.info("getSharedPreprocessModelList params -> {}, model -> {}", params, model);

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
            list = dtModelService.getDTModelList(subParamsMap, subPaging);
        } else {
            subParamsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtModelService.getDTModelListSetUserSeq(subParamsMap, subPaging);
        }

        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("model_seq").toString()), "Make Data Twin Model");
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
                map.put("ERR_LCT", "Make Data Twin Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
        }
        paramsMap.put("job_level", "P");
        List<Map<String, Object>> share_list = dtModelService.getDTModelSharedListByJobLevel(paramsMap, paging);

        model.addAttribute("share_list", list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("list", share_list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(share_list, paging));
        model.addAttribute("params", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_model/shared-preprocess-list";
    }

    @GetMapping("/shared/model/list")
    public String getSharedModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
        log.info("getSharedModelList params -> {}, model -> {}", params, model);

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
            list = dtModelService.getDTModelList(subParamsMap, subPaging);
        } else {
            subParamsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = dtModelService.getDTModelListSetUserSeq(subParamsMap, subPaging);
        }

        for (Map<String, Object> map : list) {
            ErrorLog errorLog = errorService.getErrorLog(Integer.parseInt(map.get("model_seq").toString()), "Make Data Twin Model");
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
                map.put("ERR_LCT", "Make Data Twin Model");
                map.put("ERR_CN", "java.lang.RuntimeException");
                map.put("ERRREGDT", "날짜 미정");
            }
        }
        List<Map<String, Object>> share_list = dtModelService.getDTAllSharedList(paramsMap, paging);

        model.addAttribute("share_list", list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(list, subPaging));
        model.addAttribute("subParams", params);

        model.addAttribute("list", share_list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(share_list, paging));
        model.addAttribute("params", params);

        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        return "pages/dt_model/shared-model-list";
    }

    @GetMapping(value = {"/form", "/preprocess/form", "/model/form"})
    public String modelForm(@ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModel dtModel = new DTModel();
        model.addAttribute("dtModel", dtModel);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));

        Map<String, Object> param = StoneUtil.convertObjectToMap(params);
        model.addAttribute("formType", "I");
        int limit = systemProperties.getLimitCsvRowCount();
        model.addAttribute("limit", limit);

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        List<Map<String, Object>> unit_code_list = dtModelService.getUnitCodeList();
        model.addAttribute("unit_code_list", unit_code_list);

        model.addAttribute("interp_type_list", getCodeList2("INTERP_TYPE", false));
        model.addAttribute("resamp_type_list", getCodeList("RESAMP_TYPE", false));
        model.addAttribute("unit_type_list", getCodeList("UNIT_TYPE", false));

        model.addAttribute("valid_mater_list", getCodeList("VERIFY_TYPE", false));
        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtModel.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                //해당 부분은 생성
                model.addAttribute("GRANT", true);
            }
        }
        return "pages/dt_model/form";
    }

    /**
     * modelView(), sharedModelView() 한세트
     */
    @GetMapping("/preprocess/{modelSeq}")
    public String preprocessModelView(@PathVariable int modelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModel dtModel = new DTModel();
        DTModelMetaUserItem dtModelMetaUserItem = new DTModelMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        model.addAttribute("menuCd", params.getMenuCd());

        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");

        dtModel = dtModelService.selectMetaModel(modelSeq);
        dtModelMetaUserItem = dtModelService.selectMetaUserItem(modelSeq);

        Files files = dtModelService.getDtPreprocLastFile(modelSeq);

        model.addAttribute("dtModel", dtModel);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModel.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtModelService.getModelLossList(modelSeq);
            List<Map<String, Object>> list_fid = dtModelService.getModelFIDList(modelSeq);

            model.addAttribute("list_loss", list_loss);
            model.addAttribute("list_fid", list_fid);

            List<Map<String, Object>> predictionFileList = getDtMetaFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
            model.addAttribute("predictionFileList", predictionFileList);
            model.addAttribute("predictionFileListCount", predictionFileList.size());
            model.addAttribute("pathLength", systemProperties.getDtMetaFilePath().length());
        } else if (Objects.equals("FAIL", dtModel.getModelStatus())) {
            /**
             * 해당 모델과 관련된 에러 최신 로그 가져오기
             * */
            ErrorLog errorLog = errorService.getErrorLog(dtModel.getModelSeq(), "Make Data Twin Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtModel.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_model/form";
    }

    @GetMapping("/model/{modelSeq}")
    public String modelView(@PathVariable int modelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModel dtModel = new DTModel();
        DTModelMetaUserItem dtModelMetaUserItem = new DTModelMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        model.addAttribute("menuCd", params.getMenuCd());

        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");

        dtModel = dtModelService.selectMetaModel(modelSeq);
        dtModelMetaUserItem = dtModelService.selectMetaUserItem(modelSeq);

        Files files = dtModelService.getDtPreprocLastFile(modelSeq);

        model.addAttribute("dtModel", dtModel);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModel.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtModelService.getModelLossList(modelSeq);
            List<Map<String, Object>> list_fid = dtModelService.getModelFIDList(modelSeq);

            model.addAttribute("list_loss", list_loss);
            model.addAttribute("list_fid", list_fid);

            List<Map<String, Object>> predictionFileList = getDtMetaFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
            model.addAttribute("predictionFileList", predictionFileList);
            model.addAttribute("predictionFileListCount", predictionFileList.size());
            model.addAttribute("pathLength", systemProperties.getDtMetaFilePath().length());
        } else if (Objects.equals("FAIL", dtModel.getModelStatus())) {
            ErrorLog errorLog = errorService.getErrorLog(dtModel.getModelSeq(), "Make Data Twin Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtModel.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_model/form";
    }

    @GetMapping("/shared/preprocess/{modelSeq}")
    public String sharedPreprocessModelView(@PathVariable int modelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModel dtModel = new DTModel();
        DTModelMetaUserItem dtModelMetaUserItem = new DTModelMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        model.addAttribute("menuCd", params.getMenuCd());

        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");

        dtModel = dtModelService.selectMetaModel(modelSeq);
        dtModelMetaUserItem = dtModelService.selectMetaUserItem(modelSeq);

        Files files = dtModelService.getDtPreprocLastFile(modelSeq);

        model.addAttribute("dtModel", dtModel);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModel.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtModelService.getModelLossList(modelSeq);
            List<Map<String, Object>> list_fid = dtModelService.getModelFIDList(modelSeq);

            model.addAttribute("list_loss", list_loss);
            model.addAttribute("list_fid", list_fid);

            List<Map<String, Object>> predictionFileList = getDtMetaFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
            model.addAttribute("predictionFileList", predictionFileList);
            model.addAttribute("predictionFileListCount", predictionFileList.size());
            model.addAttribute("pathLength", systemProperties.getDtMetaFilePath().length());
        } else if (Objects.equals("FAIL", dtModel.getModelStatus())) {
            /**
             * 해당 모델과 관련된 에러 최신 로그 가져오기
             * */
            ErrorLog errorLog = errorService.getErrorLog(dtModel.getModelSeq(), "Make Data Twin Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtModel.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_model/form";
    }

    @GetMapping("/shared/model/{modelSeq}")
    public String sharedModelView(@PathVariable int modelSeq, @ModelAttribute BaseParameter params, Model model) throws Exception {
        DTModel dtModel = new DTModel();
        DTModelMetaUserItem dtModelMetaUserItem = new DTModelMetaUserItem();

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = dtModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        model.addAttribute("menuCd", params.getMenuCd());

        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("formType", "U");

        dtModel = dtModelService.selectMetaModel(modelSeq);
        dtModelMetaUserItem = dtModelService.selectMetaUserItem(modelSeq);

        Files files = dtModelService.getDtPreprocLastFile(modelSeq);

        model.addAttribute("dtModel", dtModel);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("dtModelMetaUserItem", dtModelMetaUserItem);
        model.addAttribute("lastFilePath", files.getFilePath());

        if ("DONE".equals(dtModel.getModelStatus())) {
            List<Map<String, Object>> list_loss = dtModelService.getModelLossList(modelSeq);
            List<Map<String, Object>> list_fid = dtModelService.getModelFIDList(modelSeq);

            model.addAttribute("list_loss", list_loss);
            model.addAttribute("list_fid", list_fid);

            List<Map<String, Object>> predictionFileList = getDtMetaFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
            model.addAttribute("predictionFileList", predictionFileList);
            model.addAttribute("predictionFileListCount", predictionFileList.size());
            model.addAttribute("pathLength", systemProperties.getDtMetaFilePath().length());
        } else if (Objects.equals("FAIL", dtModel.getModelStatus())) {
            /**
             * 해당 모델과 관련된 에러 최신 로그 가져오기
             * */
            ErrorLog errorLog = errorService.getErrorLog(dtModel.getModelSeq(), "Make Data Twin Model");
            log.info("errorLog -> {}", errorLog);
            model.addAttribute("errorLog", errorLog);
        }
        if (authenticationFacade.getAuth().equals("AU00")) {
            model.addAttribute("GRANT", true);
        } else {
            if (authenticationFacade.getLoginUserSeq() == dtModel.getRegUserSeq()) {
                model.addAttribute("GRANT", true);
            } else {
                model.addAttribute("GRANT", false);
            }
        }
        return "pages/dt_model/form";
    }

    @PostMapping(value = "/csvFileUpload")
    @ResponseBody
    public Map<String, Object> csvFileUpload(@ModelAttribute AugmentModel augmentModel, HttpServletRequest request) throws Exception {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> param = new HashMap<>();
        //modal 에서 선택한 인덱스컬럼, 시간값을 python 에 보낸 후 가상으로 셀렉트 해온 데이터를 생성, 파일명은 java에서 우선 보냄

        log.info("csvFileUpload augmentModel -> {}", augmentModel);

        String user_tmp_key = WebConfig.getSessionInfo().getUserId() + currentTimeMillis();
        if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
            MultipartFile attachFile = augmentModel.getAttachFilesCsv().get(0);
            param = filesService.saveNewDtFiles(attachFile, user_tmp_key);
        }

        param.put("user_tmp_key", user_tmp_key);
        ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeUserUploadBaseDataFile(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);
        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        int limit = systemProperties.getLimitCsvRowCount();
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("file_name"));

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));
        result.put("target_row_count", limit);
        return result;
    }

    @PostMapping(value = "/getBaseData")
    @ResponseBody
    public Map<String, Object> getBaseData(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        //modal 에서 선택한 인덱스컬럼, 시간값을 python 에 보낸 후 가상으로 셀렉트 해온 데이터를 생성, 파일명은 java에서 우선 보냄

        param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + currentTimeMillis());
        ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        int limit = systemProperties.getLimitCsvRowCount();
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(resultJson.get("file_path") + File.separator + resultJson.get("file_name"), limit);

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));

        return result;
    }

    @PostMapping(value = "/checkIndexTimeColumn")
    @ResponseBody
    public Map<String, Object> checkIndexTimeColumn(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("checkIndexTimeColumn param : " + param.toString());
        ResponseEntity<?> checkIndexTimeColumn = dtModelApiService.checkIndexTimeColumn(param);

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
        ResponseEntity<?> resultBaseDataSetRangeRow = dtModelApiService.makeBaseDataSetRangeRow(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeRow);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("base_file_nm_set_range_row"));

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);

        result.put("index_trgt_col", resultJson.get("index_trgt_col").toString());
        result.put("target_start_date", resultJson.get("target_start_date").toString());
        result.put("target_end_date", resultJson.get("target_end_date").toString());
        result.put("target_row_count", resultJson.get("target_row_count").toString());
        result.put("base_file_nm_set_range_row", resultJson.get("base_file_nm_set_range_row").toString());
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));

        return result;
    }

    @PostMapping(value = "/getBaseDataSetRangeCol")
    @ResponseBody
    public Map<String, Object> getBaseDataSetRangeCol(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> paramSet = propertyJsonParsingInfo(param.get("param").toString());
        paramSet.put("form_type", param.get("form_type").toString());
        paramSet.put("last_file_path", param.get("last_file_path").toString());
        try {
            ResponseEntity<?> resultBaseDataSetRangeCol = dtModelApiService.makeBaseDataSetRangeCol(paramSet);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeCol);
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("base_file_nm_set_range_col"));

            result.put("base_file_nm_set_range_col", resultJson.get("preproc_trgt_col").toString());
            result.put("base_file_nm_set_range_col", resultJson.get("base_file_nm_set_range_col").toString());
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "BaseDataSetRangeCol");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping(value = "/getDataSetInfo")
    @ResponseBody
    public Map<String, Object> getDataSetInfo(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();

        try {
            ResponseEntity<?> resultDataSetColumnListInfo = dtModelApiService.getDataSetColumnListInfo(param);
            if (param.get("proc_type") != null && "outlier".equals(param.get("proc_type"))) {
                Map<String, Object> etcParams = new HashMap<String, Object>();
                etcParams.put("session_userseq", String.valueOf(authenticationFacade.getLoginUserSeq()));
                List<Map<String, Object>> etc_outlier_list = dtEtcModelService.getEtcAEModelList(etcParams);
                result.put("etc_outlier_list", etc_outlier_list);
            }

            if (param.get("proc_type") != null && "interpolate".equals(param.get("proc_type"))) {
                Map<String, Object> etcParams = new HashMap<String, Object>();
                etcParams.put("session_userseq", String.valueOf(authenticationFacade.getLoginUserSeq()));
                List<Map<String, Object>> etc_interpolate_list = new ArrayList<>();

                List<Map<String, Object>> etc_rf_interpolate_list = dtEtcModelService.getEtcRFModelList(etcParams);
                for (Map<String, Object> map : etc_rf_interpolate_list) {
                    DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(map.get("etc_model_seq").toString()));
                    map.put("user_pprcs_full_stng_value", item.getUserPprcsFullStngValue());
                }

                // etc_rf_interpolate_list를 etc_interpolate_list에 추가
                etc_interpolate_list.addAll(etc_rf_interpolate_list);

                List<Map<String, Object>> etc_brits_interpolate_list = dtEtcModelService.getEtcBritsModelList(etcParams);
                for (Map<String, Object> map : etc_brits_interpolate_list) {
                    DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(map.get("etc_model_seq").toString()));
                    map.put("user_pprcs_full_stng_value", item.getUserPprcsFullStngValue());
                }

                // etc_brits_interpolate_list를 etc_interpolate_list에 추가
                etc_interpolate_list.addAll(etc_brits_interpolate_list);

                // etc_naomi_interpolate_list를 etc_interpolate_list에 추가
                List<Map<String, Object>> etc_naomi_interpolate_list = dtEtcModelService.getEtcNaomiModelList(etcParams);
                for (Map<String, Object> map : etc_naomi_interpolate_list) {
                    DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(map.get("etc_model_seq").toString()));
                    map.put("user_pprcs_full_stng_value", item.getUserPprcsFullStngValue());
                }

                // etc_brits_interpolate_list를 etc_interpolate_list에 추가
                etc_interpolate_list.addAll(etc_naomi_interpolate_list);

                result.put("etc_interpolate_list", etc_interpolate_list);
            }

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", resultDataSetColumnListInfo.getBody());
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "DataSet Info");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/select_valid_detail_tp")
    @ResponseBody
    public Map<String, Object> selectValidDetailTp(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        paramsMap.put("dtlCd", params.get("valid_tp").toString());

        try {
            List<Map<String, Object>> valid_detail_tp = verifyService.getVerifyDetailList(paramsMap);
            result.put("valid_detail_tp", valid_detail_tp);
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "VALIDATION_CHANGE_TYPE_ERROR");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/valid_view_set")
    @ResponseBody
    public Map<String, Object> validViewSet(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        setParam.put("target_file_name", StringUtil.changeFileName(file_name.toString(), "_" + currentTimeMillis()));

        setParam.put("vrfc_trgt_col", params.get("verifyColumn").toString());

        Map<String, Object> verify_option = verifyService.getVerifyOption(Integer.parseInt(params.get("verifyType").toString()));
        setParam.put("vrfc_tp", verify_option.get("vrfc_tp").toString());

        if (verify_option.get("rule_value_1") != null) {
            if (!verify_option.get("rule_value_1").toString().equals("")) {
                setParam.put("rule1", verify_option.get("rule_value_1").toString());
            } else {
                setParam.put("rule1", null);
            }
        }
        if (verify_option.get("rule_value_2") != null) {
            if (!verify_option.get("rule_value_2").toString().equals("")) {
                setParam.put("rule2", verify_option.get("rule_value_2").toString());
            } else {
                setParam.put("rule2", null);
            }
        }
        if (verify_option.get("rule_value_3") != null) {
            if (!verify_option.get("rule_value_3").toString().equals("")) {
                setParam.put("rule3", verify_option.get("rule_value_3").toString());
            } else {
                setParam.put("rule3", null);
            }
        }
        if (verify_option.get("rule_value_4") != null) {
            if (!verify_option.get("rule_value_4").toString().equals("")) {
                setParam.put("rule4", verify_option.get("rule_value_4").toString());
            } else {
                setParam.put("rule4", null);
            }
        }

        /**
         * 특수한 로직 상태 처리
         * 타입이 범위이고 최소와 최대가 존재할때,
         * */
        if (verify_option.get("vrfc_tp") != null && Objects.equals(verify_option.get("vrfc_tp").toString(), "RG")) {
            if ((verify_option.get("rule_value_2") != null && Objects.equals(verify_option.get("rule_value_2").toString(), "MIN")) && (verify_option.get("rule_value_3") != null && Objects.equals(verify_option.get("rule_value_3").toString(), "MAX"))) {
                setParam.put("rule2", params.get("min").toString());
                setParam.put("rule3", params.get("max").toString());
            }
        }
        setParam.put("is_create", "N");

        setParam.put("vrfc_clear_type", params.get("clearType").toString());
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        try {
            log.info("setParam -> {}", setParam);
            ResponseEntity<?> validSet = dtModelApiService.makeValidateSet(setParam);
            log.info("validSet -> {}", validSet);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", validSet.getBody());
            result.put("param", setParam);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PYTHON");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Validate View");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/valid_set")
    @ResponseBody
    public Map<String, Object> validSet(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("validSet params -> {}", params);
        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        setParam.put("target_file_name", params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv");
        setParam.put("vrfc_trgt_col", params.get("verifyColumn").toString());

        Map<String, Object> verify_option = verifyService.getVerifyOption(Integer.parseInt(params.get("verifyType").toString()));
        setParam.put("vrfc_tp", verify_option.get("vrfc_tp").toString());

        if (verify_option.get("rule_value_1") != null) {
            if (!verify_option.get("rule_value_1").toString().equals("")) {
                setParam.put("rule1", verify_option.get("rule_value_1").toString());
            } else {
                setParam.put("rule1", null);
            }
        }
        if (verify_option.get("rule_value_2") != null) {
            if (!verify_option.get("rule_value_2").toString().equals("")) {
                setParam.put("rule2", verify_option.get("rule_value_2").toString());
            } else {
                setParam.put("rule2", null);
            }
        }
        if (verify_option.get("rule_value_3") != null) {
            if (!verify_option.get("rule_value_3").toString().equals("")) {
                setParam.put("rule3", verify_option.get("rule_value_3").toString());
            } else {
                setParam.put("rule3", null);
            }
        }
        if (verify_option.get("rule_value_4") != null) {
            if (!verify_option.get("rule_value_4").toString().equals("")) {
                setParam.put("rule4", verify_option.get("rule_value_4").toString());
            } else {
                setParam.put("rule4", null);
            }
        }

        /**
         * 특수한 로직 상태 처리
         * 타입이 범위이고 최소와 최대가 존재할때,
         * */
        if (verify_option.get("vrfc_tp") != null && Objects.equals(verify_option.get("vrfc_tp").toString(), "RG")) {
            if ((verify_option.get("rule_value_2") != null && Objects.equals(verify_option.get("rule_value_2").toString(), "MIN")) && (verify_option.get("rule_value_3") != null && Objects.equals(verify_option.get("rule_value_3").toString(), "MAX"))) {
                setParam.put("rule2", params.get("min").toString());
                setParam.put("rule3", params.get("max").toString());
            }
        }
        setParam.put("is_create", "Y");

        setParam.put("vrfc_clear_type", params.get("clearType").toString());
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        setParam.put("set_order", Integer.parseInt(params.get("set_order").toString()));

        /*if (Integer.parseInt(params.get("verifyType").toString()) == 1 && Objects.equals(params.get("clearType").toString(), "O")) {
            try {
                List<Map<String, String>> data = com.stoneitgt.dt.data.platform.util.JSONParser.readCsv(file_path + File.separator + file_name);
                List<Map<String, String>> temp = new ArrayList<>();
                String vrfc_trgt_col = setParam.get("vrfc_trgt_col").toString();
                for (Map<String, String> map : data) {
                    String colValueTemp = map.get(vrfc_trgt_col);
                    int colValueInt = -1;
                    try {
                        colValueInt = Integer.parseInt(colValueTemp);
                        map.put(vrfc_trgt_col, colValueTemp);
                    } catch (Exception e) {
                        map.put(vrfc_trgt_col, "");
                    }
                    temp.add(map);
                }
                com.stoneitgt.dt.data.platform.util.JSONParser.writeCsv(file_path + File.separator + file_name, temp);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }*/

        try {
            ResponseEntity<?> validSet = dtModelApiService.makeValidateSet(setParam);
            log.info("validSet -> {}", validSet.getBody().toString());
            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(validSet);

            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.filteredValidReadCSV(resultJson.get("file_path").toString(), resultJson.get("target_file_name").toString(), resultJson.get("file_name").toString(), resultJson.get("index_trgt_col").toString(), resultJson.get("vrfc_trgt_col").toString());

            /**
             * 2024-07-29
             * Target 파일에서 빈값을 찾아서 빈값의 시간과 값, 개수를 반환한다.
             *
             * 2024-08-06
             * 변환된 데이터의 오리진 데이터를 새롭게 추가한다.
             * */
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", validSet.getBody());
            result.put("param", resultJson);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
            result.put("removed_count", resultCsv.get("removed_count"));
            result.put("removed_data_list", resultCsv.get("removed_data_list"));
            result.put("origin_list", resultCsv.get("origin_list"));
            result.put("row_count", resultCsv.get("row_count"));
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PYTHON");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Validate");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/get/outlier_info")
    @ResponseBody
    public Map<String, Object> getOutlierInfo(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> correlationParam = new HashMap<String, Object>();
        if (params.get("file_path") != null) {
            correlationParam.put("file", params.get("file_path").toString());
        }
        if (params.get("index_target_col") != null) {
            correlationParam.put("index_trgt_col", params.get("index_target_col").toString());
        }
        if (params.get("outlier_target_col") != null) {
            correlationParam.put("feature", params.get("outlier_target_col").toString());
        }
        if (params.get("freq") != null) {
            correlationParam.put("freq", Integer.parseInt(params.get("freq").toString()));
        }
        if (params.get("file_path") != null) {
            correlationParam.put("file_path", systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString());
        }
        if (params.get("file_name") != null) {
            correlationParam.put("file_name", params.get("file_name").toString());
        }
        if (params.get("file_name") != null) {
            correlationParam.put("target_file_name", params.get("file_name").toString());
        }

        correlationParam.put("isCreate", "N");

        String outlier_type = params.get("outlier_type").toString();

        ResponseEntity<?> correlationSet = null;

        switch (outlier_type) {
            case "standard":
                correlationParam.put("p_value", Float.parseFloat(params.get("p_value").toString()));
                correlationSet = dtModelApiService.correlation(correlationParam, outlier_type);
                break;
            case "kmean":
                correlationParam.put("n_clusters", Integer.parseInt(params.get("n_clusters").toString()));
                correlationParam.put("n_count", Integer.parseInt(params.get("n_count").toString()));
                correlationParam.put("n_clusters_lable", 4);
                correlationSet = dtModelApiService.correlation(correlationParam, outlier_type);
                break;
            case "dbscan":
                correlationParam.put("eps", Float.parseFloat(params.get("eps").toString()));
                correlationParam.put("min_samples", Integer.parseInt(params.get("min_samples").toString()));
                correlationSet = dtModelApiService.correlation(correlationParam, outlier_type);
                break;
            case "autoencoder":
            case "AutoEncoder":
            case "auto encoder":
            case "Auto Encoder":
                Map<String, Object> model_info = dtModelService.getEtcModelInfo(params);

                correlationParam.put("model_file_path", systemProperties.getDtEtcMetaFilePath() + model_info.get("file_path").toString());
                correlationParam.put("model_file_name", model_info.get("file_nm").toString());

                String[] output_cols = {params.get("outlier_target_col").toString()};
                correlationParam.put("output_cols", output_cols);
                correlationParam.put("window_size", Integer.parseInt(params.get("window_size").toString()));
                correlationParam.put("threshold", Float.parseFloat(params.get("threshold").toString()));
                correlationSet = dtModelApiService.correlation(correlationParam, outlier_type);
                break;
            default:
                return null;
        }

        log.info("correlationSet -> {}", correlationSet);

        JSONObject correlationObj = (JSONObject) new JSONParser().parse(correlationSet.getBody().toString());
        log.info("correlationObj -> {}", correlationObj);
        JsonNode jsonNode = new ObjectMapper().readTree(correlationSet.getBody().toString());
        JsonNode histNode = jsonNode.path("data").path("hist");
        JsonNode infoNode = jsonNode.path("data").path("info");
        log.info("jsonNode -> {}", jsonNode);
        try {
            switch (outlier_type) {
                case "standard":
                case "auto encoder":
                case "AUTO ENCODER":
                case "AUTOENCODER":
                case "autoencoder": {
                    HashMap<String, Object> normalizeParams = dtModelApiService.makeDataNormalize(infoNode);
                    log.info("normalizeParams -> {}", normalizeParams);
                    if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                        result.put("hist", histNode.toString());
                        result.put("info", infoNode);
                        result.put("headers", normalizeParams.get("headers"));
                        result.put("datas", normalizeParams.get("datas"));
                        result.put("row_count", params.get("target_row_count"));
                    }
                    break;
                }
                case "kmean": {
                    HashMap<String, Object> makeDataNormalizeKMean = dtModelApiService.makeDataNormalizeKMean(infoNode, "max");
                    log.info("normalizeParams -> {}", makeDataNormalizeKMean);
                    if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                        result.put("info", infoNode);
                        List<String> headers = (List<String>) makeDataNormalizeKMean.get("headers");
                        if (headers.size() != 0) {
                            result.put("headers", makeDataNormalizeKMean.get("headers"));
                        } else {
                            List<String> dumps = new ArrayList<>();
                            dumps.add(params.get("index_target_col").toString());
                            dumps.add(params.get("outlier_target_col").toString());
                            result.put("headers", dumps);
                        }
                        result.put("datas", makeDataNormalizeKMean.get("datas"));
                        result.put("row_count", params.get("target_row_count"));
                    }
                    break;
                }
                case "dbscan": {
                    HashMap<String, Object> makeDataNormalizeDBSCAN = dtModelApiService.makeDataNormalizeDBSCAN(infoNode);
                    log.info("normalizeParams -> {}", makeDataNormalizeDBSCAN);
                    if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                        result.put("info", infoNode);
                        List<String> headers = (List<String>) makeDataNormalizeDBSCAN.get("headers");
                        if (headers.size() != 0) {
                            result.put("headers", makeDataNormalizeDBSCAN.get("headers"));
                        } else {
                            List<String> dumps = new ArrayList<>();
                            dumps.add(params.get("index_target_col").toString());
                            dumps.add(params.get("outlier_target_col").toString());
                            result.put("headers", dumps);
                        }
                        result.put("datas", makeDataNormalizeDBSCAN.get("datas"));
                        result.put("row_count", params.get("target_row_count"));
                    }
                    break;
                }
                default:
                    result.put("result_code", GlobalConstant.API_STATUS.FAIL_MAPPING);
                    break;
            }
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            log.info("실패 -> {}", correlationObj);
            insertErrorLog(0, 0, "PYTHON", "processorOutlier" + outlier_type, correlationObj.get("code").toString(), correlationObj.get("message").toString(), correlationObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
            result.put("hist", histNode.toString());
            result.put("info", correlationObj.get("detail"));

            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Outlier Info");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/outlier_set")
    @ResponseBody
    public Map<String, Object> makeOutlier(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> setParam = new HashMap<String, Object>();
        if (params.get("file_path") != null) {
            setParam.put("file", params.get("file_path").toString());
        }
        if (params.get("index_trgt_col") != null) {
            setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        }
        if (params.get("outlier_target_col") != null) {
            setParam.put("feature", params.get("outlier_target_col").toString());
        }
        if (params.get("freq") != null) {
            setParam.put("freq", Integer.parseInt(params.get("freq").toString()));
        }

        setParam.put("file_path", systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString());
        if (params.get("file_name") != null) {
            setParam.put("file_name", params.get("file_name").toString());
        }
        if (params.get("file_path") != null) {
            setParam.put("target_file_name", params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv");
        }
        if (params.get("set_order") != null) {
            setParam.put("set_order", Integer.parseInt(params.get("set_order").toString()));
        }
        String outlier_type = params.get("outlier_type").toString();
        if ("standard".equals(outlier_type)) {
            setParam.put("p_value", Float.parseFloat(params.get("p_value").toString()));
        }
        if ("kmean".equals(outlier_type)) {
            setParam.put("n_clusters", Integer.parseInt(params.get("n_clusters").toString()));
            setParam.put("n_count", Integer.parseInt(params.get("n_count").toString()));
            setParam.put("n_clusters_lable", 4);
        }
        if ("dbscan".equals(outlier_type)) {
            setParam.put("eps", Float.parseFloat(params.get("eps").toString()));
            setParam.put("min_samples", Integer.parseInt(params.get("min_samples").toString()));
        }
        if ("autoencoder".equals(outlier_type)
                || "autoencoder".equalsIgnoreCase(outlier_type)
                || "auto encoder".equals(outlier_type)
                || "auto encoder".equalsIgnoreCase(outlier_type)) {
            Map<String, Object> model_info = dtModelService.getEtcModelInfo(params);
            setParam.put("model_file_path", systemProperties.getDtEtcMetaFilePath() + model_info.get("file_path").toString());
            setParam.put("model_file_name", model_info.get("file_nm").toString());
            setParam.put("etc_model_seq", Integer.parseInt(params.get("etc_model_seq").toString()));
            String[] output_cols = {params.get("outlier_target_col").toString()};
            setParam.put("output_cols", output_cols);
            setParam.put("window_size", Integer.parseInt(params.get("window_size").toString()));
            setParam.put("threshold", Float.parseFloat(params.get("threshold").toString()));
        }
        setParam.put("isCreate", "Y");
        try {
            ResponseEntity<?> outlierSet = dtModelApiService.makeOutlierSet(setParam, outlier_type);

            log.info("outlierSet -> {}", outlierSet);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(outlierSet);
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("target_file_name"));

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", outlierSet.getBody());
            result.put("param", setParam);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Outlier");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }

        return result;
    }

    @PostMapping("/make/unit_set")
    @ResponseBody
    public Map<String, Object> makeUnit(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String unitFormula = dtModelService.getUnitFormula(params);
        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString());
        setParam.put("file_name", params.get("file_name").toString());
        setParam.put("target_file_name", params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv");
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        setParam.put("unit_trgt_col", params.get("unit_target_col").toString());
        setParam.put("unit_formula", unitFormula);

        try {
            ResponseEntity<?> unitSet = dtModelApiService.makeUnitSet(setParam);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(unitSet);
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("target_file_name"));

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", unitSet.getBody());
            result.put("param", setParam);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        } catch (Exception e) {
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Unit");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/interpolate_set")
    @ResponseBody
    public Map<String, Object> makeInterpolate(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        setParam.put("target_file_name", params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv");
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        String interpolate_option = params.get("interpolate_option").toString();
        setParam.put("interpl_tp", interpolate_option);

        log.info("makeInterpolate setParam -> {}", setParam);
        try {
            ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam);

            log.info("interpolateSet -> {}", interpolateSet);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(interpolateSet);
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("target_file_name"));

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", interpolateSet.getBody());
            result.put("param", setParam);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Interpolate");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/interpolate_set/decision")
    @ResponseBody
    public Map<String, Object> makeInterpolateDecision(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        log.info("makeInterpolateDecision params -> {}", params);

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();

        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        String fileTempName = params.get("file_path").toString() + "_" + currentTimeMillis();
        setParam.put("target_file_name", fileTempName + ".csv");
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        String interpolate_option = params.get("interpolate_option").toString();
        if (Objects.equals(interpolate_option, "decisiontree")) {
            setParam.put("set_order", params.get("set_order").toString());
            setParam.put("isCreate", "Y");
            setParam.put("index_column", params.get("index_trgt_col").toString());
            setParam.put("prev_file_name", params.get("prev_file_name").toString());
            setParam.put("feature", params.get("feature").toString());
            setParam.put("outputs", (List<String>) params.get("outputs"));

            /**
             * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
             * */
            String decisionModelFileName = fileTempName + ".pkl";
            setParam.put("model_path", file_path + File.separator + decisionModelFileName);
            result.put("decision_model_file_name", decisionModelFileName);
            result.put("decision_model_file_path", file_path);
        }
        setParam.put("interpl_tp", interpolate_option);

        log.info("makeInterpolate setParam -> {}", setParam);
        try {
            ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateDecisionSet(setParam);
            log.info("interpolateSet -> {}", interpolateSet);
            //결과 json을 먼저 풀고
            Map<String, Object> resultMap = extractDecisionDataKeyValues(interpolateSet);
            log.info("resultMap -> {}", resultMap);

            List<Map<String, String>> readData = FileReader.getInstance().readCSVToListStringMap(resultMap.get("target_file_name").toString());
            FileWriter.getInstance().writeCSV(resultMap.get("target_file_name").toString(), readData);
            Map<String, Object> resultCsv = FileReader.getInstance().readCSV(resultMap.get("target_file_name").toString());

            /**
             * 2024-08-19 정렬 로직 추가
             * */
            HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));
            if (convertHashMap != null) {
                result.put("header_list", convertHashMap.get("headers"));
                result.put("data_list", convertHashMap.get("datas"));
            } else {
                result.put("header_list", resultCsv.get("header_list"));
                result.put("data_list", resultCsv.get("data_list"));
            }
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", interpolateSet.getBody());
            result.put("param", setParam);
            result.put("labels", resultMap.get("labels"));
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Interpolate");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/interpolate_set/rf")
    @ResponseBody
    public Map<String, Object> makeInterpolateRF(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        int etc_model_seq = Integer.parseInt(params.get("etc_model_seq").toString());
        Map<String, Object> etcModelParams = new HashMap<String, Object>();
        etcModelParams.put("etc_model_seq", etc_model_seq);
        Map<String, Object> etcModelInfo = dtModelService.getEtcModelInfo(etcModelParams);
        String etcModelFilePath = systemProperties.getDtEtcMetaFilePath() + etcModelInfo.get("file_path").toString();
        setParam.put("model_file_path", etcModelFilePath);
        setParam.put("model_file_name", etcModelInfo.get("file_nm").toString());
        setParam.put("model_use_file_path", file_path);
        setParam.put("model_use_file_name", file_name);
        String fileTempName = params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv";
        setParam.put("output_file", file_path + File.separator + fileTempName);

        ArrayList<String> features = (ArrayList<String>) params.get("features");
        ArrayList<String> outputs = (ArrayList<String>) params.get("outputs");
        setParam.put("features", features);
        setParam.put("outputs", outputs);
        setParam.put("index_column", params.get("index_trgt_col").toString());
        setParam.put("trgt_col_list", "");

        log.info("makeInterpolateRF setParam -> {}", setParam);

        try {
            ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSetRF(setParam);

            log.info("interpolateSet -> {}", interpolateSet);

            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(file_path + File.separator + fileTempName);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", interpolateSet.getBody());
            setParam.put("etc_model_seq", params.get("etc_model_seq"));
            setParam.put("output_file", fileTempName);
            result.put("param", setParam);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Interpolate");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }


    @PostMapping("/make/interpolate_set/brits")
    @ResponseBody
    public Map<String, Object> makeInterpolateBrits(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        int etc_model_seq = Integer.parseInt(params.get("etc_model_seq").toString());
        Map<String, Object> etcModelParams = new HashMap<String, Object>();
        etcModelParams.put("etc_model_seq", etc_model_seq);
        Map<String, Object> etcModelInfo = dtModelService.getEtcModelInfo(etcModelParams);
        String etcModelFilePath = systemProperties.getDtEtcMetaFilePath() + etcModelInfo.get("file_path").toString();
        setParam.put("model_file_path", etcModelFilePath);
        setParam.put("model_file_name", etcModelInfo.get("file_nm").toString());
        setParam.put("model_use_file_path", file_path);
        setParam.put("model_use_file_name", file_name);
        String fileTempName = params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv";
        setParam.put("output_file", file_path + File.separator + fileTempName);
        ArrayList<String> outputs = (ArrayList<String>) params.get("outputs");
        setParam.put("outputs", outputs);
        setParam.put("index_column", params.get("index_trgt_col").toString());
        setParam.put("trgt_col_list", outputs);

        log.info("makeInterpolateBrits setParam -> {}", setParam);

        try {
            ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSetBrits(setParam);

            log.info("interpolateSet -> {}", interpolateSet);

            //결과 json을 먼저 풀고
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(file_path + File.separator + fileTempName);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", interpolateSet.getBody());
            setParam.put("etc_model_seq", params.get("etc_model_seq"));
            setParam.put("output_file", fileTempName);
            result.put("param", setParam);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Interpolate");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/interpolate_set/naomi")
    @ResponseBody
    public Map<String, Object> makeInterpolateNaomi(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(params.get("etc_model_seq").toString()));
        String json = item.getUserPprcsFullStngValue();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(json);
        int windowSize = Integer.parseInt(rootNode.get("preproc_property_info").get(0).get("model_property").get(0).get("hyperparam").get("window_size").asText());

        Map<String, Object> setParam = new HashMap<String, Object>();
        int etc_model_seq = Integer.parseInt(params.get("etc_model_seq").toString());
        Map<String, Object> etcModelParams = new HashMap<String, Object>();
        etcModelParams.put("etc_model_seq", etc_model_seq);
        Map<String, Object> etcModelInfo = dtModelService.getEtcModelInfo(etcModelParams);
        String etcModelFilePath = systemProperties.getDtEtcMetaFilePath() + etcModelInfo.get("file_path").toString();

        setParam.put("windowSize", windowSize);
        setParam.put("model_file_path", etcModelFilePath);
        setParam.put("model_file_name", etcModelInfo.get("file_nm").toString());
        setParam.put("model_use_file_path", file_path);
        setParam.put("model_use_file_name", file_name);
        String fileTempName = params.get("file_path").toString() + "_" + currentTimeMillis() + ".csv";
        setParam.put("output_file", file_path + File.separator + fileTempName);
        ArrayList<String> outputs = (ArrayList<String>) params.get("outputs");
        setParam.put("outputs", outputs);
        setParam.put("index_column", params.get("index_trgt_col").toString());
        setParam.put("trgt_col_list", outputs);

        log.info("makeInterpolateNaomi setParam -> {}", setParam);

        try {
            ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSetNaomi(setParam);

            log.info("interpolateSet -> {}", interpolateSet);

            //결과 json을 먼저 풀고
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(file_path + File.separator + fileTempName);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", interpolateSet.getBody());
            setParam.put("etc_model_seq", params.get("etc_model_seq"));
            setParam.put("output_file", fileTempName);
            result.put("param", setParam);
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        } catch (Exception e) {
            e.printStackTrace();
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Interpolate");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/make/resample_set")
    @ResponseBody
    public Map<String, Object> makeResample(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        log.info("makeResample -> {}", params);
        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();
        //시간 구문 후 생성할 파일
        Map<String, Object> setBaseParam = new HashMap<>();
        setBaseParam.put("file_path", file_path);
        setBaseParam.put("file_name", file_name);
        setBaseParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        setParam.put("resmpl_tp", params.get("resmpl_tp").toString());
        setParam.put("time_rule", params.get("resmpl_intvl_value").toString().trim() + params.get("resmpl_tp").toString());

        try {
            /**
             * 리샘플링 로직 수정
             * [기능] 전처리
             * [메뉴] Data Twin Model
             * [동작] U
             * [작업내용]
             * 시간의 단위를 판별해서 해당 시간 단위의 최저 값으로 먼저 샘플링 작업을 실행하여 최저 시간으로 인해 늘어난 데이터 중 원본데이터를 최대한 유지하는 로직으로 수정합니다.
             * EX) 시간 단위 데이터 1시간 단위로, 분 단위 데이터 1분 단위로, 초 단위 데이터 1초 단위로
             *
             * 프리컨디션
             * resampling 함수화 및 데이터의 파일을 어떻게 할건지 JSON에서 파일에 관련된 수정사항이 필요.
             *
             * 프로세스
             * 1. 파일을 읽어드린다.
             * 2. 파일의 데이터에서 일부 데이터만을 얻고 시계열 컬럼만 뽑아온 데이터를 얻어온다. (index_trgt_col 참조)
             * 3. 시계열 컬럼만 얻어온 데이터에서 시간이 초단위인지 분단위인지 시간단위인지 일단위인지 얻는다. (time_rule과 resmpl_tp 지정)
             * 4. 얻은 time_rule, resmpl_tp 파라미터로 resampling 로직을 굴린다.
             * 5. 원래 클라이언트에게 받은 파라미터로 resampling 로직을 굴린다.
             * */

            /**
             * 시간 구분 로직
             * */
            String dateKey = params.get("index_trgt_col").toString();

            Map<String, Object> prevResultCsv = FileReader.getInstance().readCSVWithLimit(file_path + File.separator + file_name, 100);
            List<String> timeIndicatorHeaders = (List<String>) prevResultCsv.get("header_list");
            List<List<String>> prevResultDataList = (List<List<String>>) prevResultCsv.get("data_list");

            TimeUnit unit = dtModelApiService.reSampleTimeDivider(dateKey, timeIndicatorHeaders, prevResultDataList);

            /**
             * 데이터 유효성 유지 하면서 리샘플 로직
             * */
            {
                JsonNode jsonNode = null;
                ResponseEntity<?> resampleSet = null;
                log.info("unit -> {}", unit);

                setBaseParam.put("target_file_name", params.get("file_path").toString() + "_prevResample_" + currentTimeMillis() + ".csv");
                setBaseParam.put("resmpl_tp", unit.getResampleType());
                setBaseParam.put("time_rule", ("1" + unit.getResampleType()));

                log.info("prevResample setBaseParam -> {}", setBaseParam);

                resampleSet = dtModelApiService.makeResampleSet(setBaseParam);
                jsonNode = ConvertUtil.requestBodyParsing(resampleSet.getBody().toString());
                setParam.put("file_name", jsonNode.get("target_file_name").asText());
                setParam.put("target_file_name", params.get("file_path").toString() + "_resample_" + currentTimeMillis() + ".csv");
                setParam.put("origin_file_name", file_name);
                setParam.put("prev_file_name", jsonNode.get("target_file_name").asText());
            }
            if (!Objects.equals("0", params.get("resmpl_tp").toString())) {
                log.info("setParam -> {}", setParam);
                ResponseEntity<?> resampleSet = dtModelApiService.makeResampleSet(setParam);
                JsonNode jsonNode = ConvertUtil.requestBodyParsing(resampleSet.getBody().toString());
                Map<String, Object> resultCsv = new HashMap<String, Object>();
                List<List<String>> resultDataList = new ArrayList<List<String>>();

                FileReader fileReader = FileReader.getInstance();

                if (params.get("decision") != null) {
                    Map<String, Object> decisionTreeSetParam = new HashMap<String, Object>();
                    Map<String, Object> decision = (Map<String, Object>) params.get("decision");
                    String modelFilePath = (String) decision.get("model_file_path");
                    String modelFileName = (String) decision.get("model_file_name");
                    String decisionFileName = (String) decision.get("decision_file_name");
                    String index_column = (String) decision.get("index_column");
                    // 리스트 필드 가져오기
                    List<String> outputs = (List<String>) decision.get("outputs");
                    String feature = (String) decision.get("feature");
                    List<String> labels = (List<String>) decision.get("labels");

                    log.info("labels -> {}", labels);

                    decisionTreeSetParam.put("file_path", jsonNode.get("file_path").asText());
                    decisionTreeSetParam.put("file_name", jsonNode.get("target_file_name").asText());
                    decisionTreeSetParam.put("prev_file_name", decisionFileName);
                    String targetFileName = params.get("file_path").toString() + "_dt_resample_" + currentTimeMillis() + ".csv";
                    decisionTreeSetParam.put("target_file_name", targetFileName);
                    decisionTreeSetParam.put("index_column", index_column);
                    decisionTreeSetParam.put("outputs", outputs);
                    decisionTreeSetParam.put("model_path", modelFilePath + File.separator + modelFileName);
                    decisionTreeSetParam.put("feature", feature);
                    decisionTreeSetParam.put("set_order", "0");
                    decisionTreeSetParam.put("isCreate", "Y");
                    log.info("decisionTreeSetParam -> {}", decisionTreeSetParam);

                    /**
                     * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
                     * */
                    ResponseEntity<?> interpolateModelDecisionSet = dtModelApiService.makeInterpolateModelDecisionSet(decisionTreeSetParam);
                    log.info("interpolateModelDecisionSet -> {}", interpolateModelDecisionSet);
                    Map<String, Object> resultMap = extractDecisionDataKeyValues(interpolateModelDecisionSet);
                    log.info("resultMap -> {}", resultMap);
                    //파이썬 생성 파일 읽어들이기
                    resultCsv = fileReader.readCSV(jsonNode.get("file_path").asText() + File.separator + targetFileName);
                    setParam.put("target_file_name", targetFileName);
                } else {
                    //파이썬 생성 파일 읽어들이기
                    resultCsv = fileReader.readCSV(jsonNode.get("file_path").asText() + File.separator + jsonNode.get("target_file_name").asText());
                }
                resultDataList = (List<List<String>>) resultCsv.get("data_list");

                //원본 파일 읽어들이기
                prevResultCsv = fileReader.readCSV(file_path + File.separator + file_name);
                prevResultDataList = (List<List<String>>) prevResultCsv.get("data_list");
                //파이썬 생성 파일과 원본 파일 비교
                Map<String, Object> compareData = compareDatas(prevResultDataList, resultDataList);

                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("data", resampleSet.getBody());
                result.put("param", setParam);
                result.put("header_list", resultCsv.get("header_list"));
                result.put("data_list", resultCsv.get("data_list"));
                result.put("prev_header_list", prevResultCsv.get("header_list"));
                result.put("prev_data_list", prevResultCsv.get("data_list"));

                HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) prevResultCsv.get("header_list"), (List<List<String>>) compareData.get("added_data"));
                result.put("added_data", convertHashMap.get("datas"));
                convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) prevResultCsv.get("header_list"), (List<List<String>>) compareData.get("removed_data"));
                result.put("removed_data", convertHashMap.get("datas"));
            }
        } catch (Exception e) {
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Make Resample");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/getDataTimeCheck")
    @ResponseBody
    public Map<String, Object> getDataTimeCheck(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
        String file_name = params.get("file_name").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        try {
            log.info("getDataTimeCheck setParam -> {}", setParam);
            ResponseEntity<?> checkTime = dtModelApiService.getIndexColumnTimeCheck(setParam);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", checkTime.getBody());
        } catch (Exception e) {
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "DataTimeCheck");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }

        return result;
    }

    @PostMapping("/make/select_unit_tp")
    @ResponseBody
    public Map<String, Object> selectUnitTp(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();
        try {
            List<Map<String, Object>> unit_tp_list = dtModelService.getUnitTpList(params.get("unit_tp").toString());
            result.put("unit_tp_list", unit_tp_list);
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Unit Type");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping("/delete/files")
    @ResponseBody
    public Map<String, Object> deleteFiles(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<String, Object>();

        List<String> filesList = (List<String>) request.get("files");
        String base_dir = systemProperties.getDtMetaFilePath() + "/tmp/" + request.get("file_path").toString();

        try {
            for (int i = 0; i < filesList.size(); i++) {
                FileUtil.delete(base_dir + "/" + filesList.get(i).toString());
            }
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Delete Reference Temp File");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
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
        Map<String, Object> result = dtModelService.insertPreprocProcess(jsonString, info);
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


    @PostMapping("/load/preprocFile")
    @ResponseBody
    public Map<String, Object> loadPreprocFile(@RequestBody Map<String, Object> params) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String formType = params.get("form_type").toString();
        String file_path = null;

        if ("I".equals(formType)) {
            file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + params.get("file_path").toString();
        } else {
            file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + File.separator + params.get("file_path").toString();
        }
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSV(file_path + File.separator + params.get("file_name"));

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));

        return result;
    }

    @PostMapping("/make/algorithm_set")
    @ResponseBody
    public Map<String, Object> makeAlgorithmSet(@RequestBody Map<String, Object> params) throws ParseException {
        String[] checkHeader = params.get("checkHeader").toString().replace("[", "").replace("]", "").split(", ");
        List<String> checkHeaderList = new ArrayList<String>();

        for (int ch = 0; ch < checkHeader.length; ch++) {
            checkHeaderList.add(checkHeader[ch]);
        }

        Map<String, Object> result = new HashMap<String, Object>();
        int modelSeq = Integer.parseInt(params.get("model_seq").toString());

        DTModel dtModel = new DTModel();
        dtModel = dtModelService.getAugmentModel(modelSeq);

        Map<String, Object> correlationParam = new HashMap<String, Object>();
        correlationParam.put("file_path", systemProperties.getDtMetaFilePath().replace("\\", "/") + dtModel.getFilePath());
        correlationParam.put("file_name", params.get("file_name").toString());
        correlationParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        correlationParam.put("columns", checkHeaderList);

        log.info("correlationParam -> {}", correlationParam);
        String correlationString = apiService.requestPythonApi("/dt/newpreproc/processorDatasetCorrelation/", correlationParam);

        JSONParser correlationParser = new JSONParser();
        JSONObject correlationObj = (JSONObject) correlationParser.parse(correlationString);
        log.info("correlationObj -> {}", correlationObj);

        if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("job_level", dtModel.getJobLevel());
            result.put("model_status", dtModel.getModelStatus());
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
        log.info("algorithmMeatSet -> {}", params);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("model_seq", Integer.parseInt(params.get("model_seq").toString()));
        int model_algrm_seq = Integer.parseInt(params.get("model_algrm_seq").toString());
        map.put("model_algrm_seq", model_algrm_seq);

        List<Map<String, Object>> algorithm_meta_item_list = dtModelService.getModelAlgorithmParamsList(map);

        List<Map<String, Object>> algorithm_param_template_set = new ArrayList<>();

        for (Map<String, Object> algorithmMetaItem : algorithm_meta_item_list) {
            log.info("algorithmMetaItem -> {}", algorithmMetaItem);
            Map<String, Object> defaultItem = new HashMap<>();
            defaultItem.put(algorithmMetaItem.get("model_params_item").toString(), algorithmMetaItem.get("model_params_item_crtr_1"));
            algorithm_param_template_set.add(defaultItem);
        }

        List<Map<String, Object>> loss_list = null;
        List<Map<String, Object>> meterics_list = null;
        List<Map<String, Object>> optimizer_list = null;
        if (model_algrm_seq == 1) {
            loss_list = dtModelService.getAlgolithmCodeList("LSTM_LOSS");
            meterics_list = dtModelService.getAlgolithmCodeList("LSTM_METERICS");
            optimizer_list = dtModelService.getAlgolithmCodeList("LSTM_OPTIMIZER");
        } else if (model_algrm_seq == 2) {
            loss_list = dtModelService.getAlgolithmCodeList("GRU_LOSS");
            meterics_list = dtModelService.getAlgolithmCodeList("GRU_METERICS");
            optimizer_list = dtModelService.getAlgolithmCodeList("GRU_OPTIMIZER");
        } else if (model_algrm_seq == 3) {
            loss_list = dtModelService.getAlgolithmCodeList("DEEP_AR_LOSS");
            meterics_list = dtModelService.getAlgolithmCodeList("DEEP_AR_METERICS");
            optimizer_list = dtModelService.getAlgolithmCodeList("DEEP_AR_OPTIMIZER");
        } else if (model_algrm_seq == 4) {
            loss_list = dtModelService.getAlgolithmCodeList("NBEATS_LOSS");
            meterics_list = dtModelService.getAlgolithmCodeList("NBEATS_METERICS");
            optimizer_list = dtModelService.getAlgolithmCodeList("NBEATS_OPTIMIZER");
        } else {
            loss_list = new ArrayList<Map<String, Object>>();
            meterics_list = new ArrayList<Map<String, Object>>();
            optimizer_list = new ArrayList<Map<String, Object>>();
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
    public Map<String, Object> makeModel(@RequestBody Map<String, Object> params) throws IOException {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model_seq", params.get("model_seq"));
        requestBody.put("algorithm_seq", params.get("algorithm_seq"));
        requestBody.put("algorithm", params.get("algorithm"));
        requestBody.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
        requestBody.put("reg_ip", authenticationFacade.getLoginUserIp());

        List<Map<String, Object>> item_list = (List<Map<String, Object>>) params.get("algorithm_meta_item_list");


        DTModelParams dtModelParams = new DTModelParams();
        dtModelParams.setModelSeq(Integer.parseInt(params.get("model_seq").toString()));

        dtModelService.checkAlgorithmModelParams(dtModelParams);

        for (int i = 0; i < item_list.size(); i++) {
            dtModelParams.setModelSeq(Integer.parseInt(item_list.get(i).get("model_seq").toString()));
            dtModelParams.setModelAlgrmSeq(Integer.parseInt(item_list.get(i).get("model_algrm_seq").toString()));
            dtModelParams.setModelParamsItemSeq(Integer.parseInt(item_list.get(i).get("model_params_item_seq").toString()));
            dtModelParams.setModelParamsItemValue(item_list.get(i).get("model_params_item_value").toString());
            dtModelService.saveAlgorithmModelParams(dtModelParams);
        }

        DTModelColumn dtModelColumn = new DTModelColumn();
        String[] output_col = params.get("output_col").toString().replace("[", "").replace("]", "").split(", ");

        dtModelColumn.setModelSeq(Integer.parseInt(params.get("model_seq").toString()));
        for (int i = 0; i < output_col.length; i++) {
            dtModelColumn.setModelColTp("OC");
            dtModelColumn.setModelColNm(output_col[i]);
            dtModelService.saveAlgorithmModelColumn(dtModelColumn);
        }

        if (params.get("feature_col") != null) {
            String[] feature_col = params.get("feature_col").toString().replace("[", "").replace("]", "").split(", ");
            for (int i = 0; i < feature_col.length; i++) {
                dtModelColumn.setModelColTp("FC");
                dtModelColumn.setModelColNm(feature_col[i]);
                dtModelService.saveAlgorithmModelColumn(dtModelColumn);
            }
        }

        dtModelService.updateAlgorithmSeq(requestBody);

        Map<String, Object> param = new HashMap<>();
        param.put("model_seq", params.get("model_seq"));
        String addDirectory = FileUtil.getUploadDtFilePath(GlobalConstant.FILE_REF_TYPE.DATA, Integer.parseInt(params.get("model_seq").toString()));
        String moveDirectory = systemProperties.getDtMetaFilePath() + addDirectory;
        String jsonString = params.get("full_text").toString();
        ObjectMapper objectMapper = new ObjectMapper();
        DTModelJsonProperty sss = objectMapper.readValue(jsonString, DTModelJsonProperty.class);
        /**
         * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
         * */
        for (DTModelJsonPropertySub step : sss.getPreproc_property_info().get(0).getPreproc_property()) {
            for (DTModelJsonPropertySubSet property : step.getPreproc_set()) {
                if (Objects.equals(step.getPreproc_type(), "missing") && Objects.equals(property.getInterpl_tp(), "decisiontree")) {
                    property.setDecision_model_file_path(moveDirectory);
                    property.setDecision_model_file_name(property.getInterpl_decision_model_file_name());
                }
                //Data Twin Model 생성 중 필요한 Data 담았던 것을 초기화
                property.setValidate_data(new ArrayList<>());
                property.setOutlier_data(new ArrayList<>());
                property.setMissing_data(new ArrayList<>());
                property.setResmpl_removed_data(new ArrayList<>());
                property.setResmpl_added_data(new ArrayList<>());
            }
        }
        param.put("user_pprcs_full_stng_value", new org.json.JSONObject(sss).toString());
        dtModelService.updateMetaUerItemFulltext(param);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("item_list", item_list);

        return result;
    }

    /**
     * 2024-10-15
     * Data Twin Model 수정 기능
     * 1208515341596874
     */
    @PostMapping("/make/model_reset")
    @ResponseBody
    public Map<String, Object> reMakeModel(@RequestBody Map<String, Object> params) throws IOException {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model_seq", params.get("model_seq"));
        requestBody.put("algorithm_seq", params.get("algorithm_seq"));
        requestBody.put("algorithm", params.get("algorithm"));
        requestBody.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
        requestBody.put("reg_ip", authenticationFacade.getLoginUserIp());

        List<Map<String, Object>> item_list = (List<Map<String, Object>>) params.get("algorithm_meta_item_list");

        DTModelParams dtModelParams = new DTModelParams();
        dtModelParams.setModelSeq(Integer.parseInt(params.get("model_seq").toString()));

        dtModelService.checkAlgorithmModelParams(dtModelParams);

        for (int i = 0; i < item_list.size(); i++) {
            dtModelParams.setModelSeq(Integer.parseInt(item_list.get(i).get("model_seq").toString()));
            dtModelParams.setModelAlgrmSeq(Integer.parseInt(item_list.get(i).get("model_algrm_seq").toString()));
            dtModelParams.setModelParamsItemSeq(Integer.parseInt(item_list.get(i).get("model_params_item_seq").toString()));
            dtModelParams.setModelParamsItemValue(item_list.get(i).get("model_params_item_value").toString());
            dtModelService.saveAlgorithmModelParams(dtModelParams);
        }

        DTModelColumn dtModelColumn = new DTModelColumn();
        String[] output_col = params.get("output_col").toString().replace("[", "").replace("]", "").split(", ");

        dtModelColumn.setModelSeq(Integer.parseInt(params.get("model_seq").toString()));
        for (int i = 0; i < output_col.length; i++) {
            dtModelColumn.setModelColTp("OC");
            dtModelColumn.setModelColNm(output_col[i]);
            dtModelService.saveAlgorithmModelColumn(dtModelColumn);
        }

        if (params.get("feature_col") != null) {
            String[] feature_col = params.get("feature_col").toString().replace("[", "").replace("]", "").split(", ");
            for (int i = 0; i < feature_col.length; i++) {
                dtModelColumn.setModelColTp("FC");
                dtModelColumn.setModelColNm(feature_col[i]);
                dtModelService.saveAlgorithmModelColumn(dtModelColumn);
            }
        }

        dtModelService.updateAlgorithmSeq(requestBody);

        Map<String, Object> param = new HashMap<>();
        param.put("model_seq", params.get("model_seq"));
        String addDirectory = FileUtil.getUploadDtFilePath(GlobalConstant.FILE_REF_TYPE.DATA, Integer.parseInt(params.get("model_seq").toString()));
        String moveDirectory = systemProperties.getDtMetaFilePath() + addDirectory;
        String jsonString = params.get("full_text").toString();
        ObjectMapper objectMapper = new ObjectMapper();
        DTModelJsonProperty sss = objectMapper.readValue(jsonString, DTModelJsonProperty.class);
        /**
         * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
         * */
        for (DTModelJsonPropertySub step : sss.getPreproc_property_info().get(0).getPreproc_property()) {
            for (DTModelJsonPropertySubSet property : step.getPreproc_set()) {
                if (Objects.equals(step.getPreproc_type(), "missing") && Objects.equals(property.getInterpl_tp(), "decisiontree")) {
                    property.setDecision_model_file_path(moveDirectory);
                    property.setDecision_model_file_name(property.getInterpl_decision_model_file_name());
                }
                //Data Twin Model 생성 중 필요한 Data 담았던 것을 초기화
                property.setValidate_data(new ArrayList<>());
                property.setOutlier_data(new ArrayList<>());
                property.setMissing_data(new ArrayList<>());
                property.setResmpl_removed_data(new ArrayList<>());
                property.setResmpl_added_data(new ArrayList<>());
            }
        }
        param.put("user_pprcs_full_stng_value", new org.json.JSONObject(sss).toString());
        dtModelService.updateMetaUerItemFulltext(param);
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("item_list", item_list);

        /**
         * LOSS 삭제
         * FID 삭제
         * */
        dtModelService.deleteModelLoss(Integer.parseInt(params.get("model_seq").toString()));
        dtModelService.deleteModelFid(Integer.parseInt(params.get("model_seq").toString()));
        return result;
    }


    /**
     * 2024-10-16
     * Data Twin Model 수정 기능 - 제약 조건 체크
     * 1208515341596874
     */
    @PostMapping("/check/model_reset")
    @ResponseBody
    public Map<String, Object> checkReMakeModel(@RequestBody Map<String, Object> params) throws IOException {
        Map<String, Object> result = new HashMap<String, Object>();
        log.info("checkReMakeModel -> {}", params);
        if (params.get("model_seq") != null) {
            int model_seq = Integer.parseInt(params.get("model_seq").toString());
            boolean check = dtSimulationService.checkUseRemakeDTModel(model_seq);
            if (!check) {
                result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("status", true);
            } else {
                result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("status", false);
            }
        } else {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
        }
        return result;
    }

    @PostMapping("/loss")
    @ResponseBody
    public Map<String, Object> getLoss(@RequestBody Map<String, Object> params) {
        int result = 1;
        Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());

        Map<String, Object> data = dtModelService.getModelLoss(modelSeq);

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

        Map<String, Object> data = dtModelService.getModelFID(modelSeq);

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

        String prctFilePath = systemProperties.getDtMetaFilePath() + predFileList.get(0).get("file_path").toString() + predFileList.get(0).get("file_nm").toString();
        String testFilePath = systemProperties.getDtMetaFilePath() + testFileList.get(0).get("file_path").toString() + testFileList.get(0).get("file_nm").toString();

        HashMap<String, Object> r = new HashMap<String, Object>();
        List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
        String title1 = "학습데이터 검증";
        String title2 = "학습데이터 검증";


        ArrayList<String> columns = new ArrayList<String>();
        getTestData(prctFilePath, dataList, "P", columns, count);
        getTestData(testFilePath, dataList, "T", columns, count);

        ArrayList<String> data_test_header = new ArrayList<String>();
        ArrayList<String> data_pred_header = new ArrayList<String>();
        log.info("getDataTest testFilePath -> {}", testFilePath);
        log.info("getDataTest prctFilePath -> {}", prctFilePath);
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
        ArrayList<Integer> indexes = new ArrayList<>();
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
    public Map<String, Object> deleteDTModel(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("deleteDTModel param -> " + param.toString());
        if (param.get("model_seq") != null) {
            int model_seq = Integer.parseInt(param.get("model_seq").toString());
            /**
             * 2024-09-05
             * 1208174775623601
             * 제약 조건 추가 부분
             * 조건 : 해당 DT Model이 사용되는 Data Twin Simulation이 없어야합니다.
             * */
            boolean check = dtSimulationService.checkUseDTModel(model_seq);
            if (!check) {
                Map<String, Object> parameters = new HashMap<String, Object>();
                parameters.put("model_seq", model_seq);
                parameters.put("user_seq", authenticationFacade.getLoginUserSeq());
                parameters.put("user_ip", authenticationFacade.getLoginUserIp());
                dtModelService.deleteModel(parameters);
                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("type", "success");
            } else {
                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("type", "restrict");
            }
        } else {
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("type", "nofind");
        }
        return result;
    }

    public static Map<String, Object> extractDecisionDataKeyValues(ResponseEntity<?> responseEntity) {
        Map<String, Object> resultMap = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            // ResponseEntity의 body를 JSON 문자열로 변환
            String bodyString = responseEntity.getBody().toString();
            // JSON 문자열을 JsonNode로 변환
            JsonNode rootNode = mapper.readTree(bodyString);

            // data 키에 해당하는 JsonNode 가져오기
            JsonNode jsonNode = rootNode.get("data");
            if (jsonNode.get("resultMessage") != null) {
                String target_file = jsonNode.get("resultMessage").asText();

                resultMap.put("target_file_name", target_file);
                ArrayList<String> labels = new ArrayList<>();
                if (jsonNode.get("label") != null) {
                    Iterator<JsonNode> elements = jsonNode.get("label").elements();
                    while (elements.hasNext()) {
                        labels.add(elements.next().asText());
                    }
                }
                resultMap.put("labels", labels);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return resultMap;
    }
}
