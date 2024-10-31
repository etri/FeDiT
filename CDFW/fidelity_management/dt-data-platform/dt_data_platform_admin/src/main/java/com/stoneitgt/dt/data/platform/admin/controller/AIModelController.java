package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.collections4.map.HashedMap;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.AIModelService;
import com.stoneitgt.dt.data.platform.admin.service.DjangoApiService;
import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.admin.service.MakeModelSchedulerService;
import com.stoneitgt.dt.data.platform.admin.service.VerifyService;
import com.stoneitgt.dt.data.platform.domain.AugmentModel;
import com.stoneitgt.dt.data.platform.domain.AugmentModelColumn;
import com.stoneitgt.dt.data.platform.domain.AugmentModelParams;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.StoneUtil;

@Slf4j
@Controller
@RequestMapping("/ai/model")
public class AIModelController extends BaseController {

    @Autowired
    private AIModelService aiModelService;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Autowired
    private FilesService filesService;

    @Autowired
    private DjangoApiService djangoApiService;

    @Autowired
    private MakeModelSchedulerService makeModelSchedulerService;

    @Autowired
    private VerifyService verifyService;

    @GetMapping("/list")
    public String getModelList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {

        Paging paging = new Paging();
        paging.setPage(params.getPage());
        paging.setSize(params.getSize());

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

        if (authenticationFacade.getAuth().equals("AU00")) {
            list = aiModelService.getAugmentModelList(paramsMap, paging);
        } else {
            paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
            list = aiModelService.getAugmentModelListSetUserSeq(paramsMap, paging);
        }
        model.addAttribute("list", list);
        model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
        model.addAttribute("params", params);


        Paging subPaging = new Paging();
        subPaging.setSubPage(params.getSubPage());
        subPaging.setSubSize(params.getSubSize());

        Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);

        List<Map<String, Object>> share_list = aiModelService.getAugmentModelSharedList(subParamsMap, subPaging);
        model.addAttribute("share_list", share_list);
        model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
        model.addAttribute("subParams", params);


        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));

        deleteCookie(request, response, "sub_tab");
        deleteCookie(request, response, "main_tab");
        return "pages/ai_model/list";
    }

    @GetMapping("/form")
    public String modelForm(@ModelAttribute BaseParameter params, Model model) {
        AugmentModel augmentModel = new AugmentModel();
        model.addAttribute("augmentModel", augmentModel);
        model.addAttribute("menuCd", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = aiModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        List<Map<String, Object>> unit_code_list = aiModelService.getUnitCodeList();
        model.addAttribute("unit_code_list", unit_code_list);
        model.addAttribute("interp_type_list", getCodeList2("INTERP_TYPE", false));
        model.addAttribute("resamp_type_list", getCodeList("RESAMP_TYPE", false));
        model.addAttribute("unit_type_list", getCodeList("UNIT_TYPE", false));
        model.addAttribute("valid_mater_list", getCodeList("VERIFY_TYPE", false));
        model.addAttribute("formType", "I");

        return "pages/ai_model/form";
    }

    @PostMapping("/form")
    public String updateForm(@RequestParam(required = false) String menuCd, @ModelAttribute BaseParameter params, @ModelAttribute AugmentModel augmentModel, BindingResult bindingResult, Model model, RedirectAttributes rttr) {

        String returnUrl = "redirect:/ai/model/" + augmentModel.getModelSeq() + "?";
        returnUrl += getBaseParameterString(params);

        augmentModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        augmentModel.setLoginUserIp(authenticationFacade.getLoginUserIp());
        aiModelService.updateModelInfo(augmentModel);

        return returnUrl;
    }


    @GetMapping("/{modelSeq}")
    public String modelView(@PathVariable int modelSeq, @ModelAttribute BaseParameter params, Model model) {
        AugmentModel augmentModel = new AugmentModel();

        if (authenticationFacade.getAuth().equals("AU00")) {
            augmentModel = aiModelService.getAugmentModel(modelSeq);
        } else {
            augmentModel.setModelSeq(modelSeq);
            augmentModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
            augmentModel = aiModelService.getAugmentModelSetUserSeq(augmentModel);
        }

        model.addAttribute("augmentModel", augmentModel);
        model.addAttribute("menuCd", params.getMenuCd());

        List<Map<String, Object>> augment_fid_list = aiModelService.getAugmentModelFID(modelSeq);
        model.addAttribute("augment_fid_list", augment_fid_list);

        List<Map<String, Object>> augment_loss_list = aiModelService.getAugmentModelLoss(modelSeq);
        model.addAttribute("augment_loss_list", augment_loss_list);

        List<Map<String, Object>> augment_params_list = aiModelService.getAugmentModelParams(modelSeq);
        model.addAttribute("augment_params_list", augment_params_list);

        List<Map<String, Object>> unit_code_list = aiModelService.getUnitCodeList();
        model.addAttribute("unit_code_list", unit_code_list);


        List<Map<String, Object>> dataFileList = getDtFileList(FILE_REF_TYPE.ORIGIN, modelSeq);
        List<Map<String, Object>> dataValidFileList = getDtFileList(FILE_REF_TYPE.VALIDATE, modelSeq);
        List<Map<String, Object>> dataOutlierFileList = getDtFileList(FILE_REF_TYPE.OUTLIER, modelSeq);

        if (dataFileList.size() > 0) {
            model.addAttribute("dataFileList", dataFileList);
            model.addAttribute("originFilePath", systemproperties.getDtFilePath() + dataFileList.get(0).get("file_path").toString() + dataFileList.get(0).get("file_nm").toString());
        } else {
            model.addAttribute("dataFileList", null);
            model.addAttribute("originFilePath", null);
        }

        if (dataValidFileList.size() > 0) {
            model.addAttribute("validateFilePath", systemproperties.getDtFilePath() + dataValidFileList.get(0).get("file_path").toString() + dataValidFileList.get(0).get("file_nm").toString());
        } else {
            model.addAttribute("validateFilePath", null);
        }

        if (dataOutlierFileList.size() > 0) {
            model.addAttribute("outLierFilePath", systemproperties.getDtFilePath() + dataOutlierFileList.get(0).get("file_path").toString() + dataOutlierFileList.get(0).get("file_nm").toString());
        } else {
            model.addAttribute("outLierFilePath", null);
        }


        List<Map<String, Object>> interpolateFileList = getDtFileList(FILE_REF_TYPE.INTERPOLATE, modelSeq);
        model.addAttribute("interpolateFileList", interpolateFileList);

        if (interpolateFileList.size() > 0) {
            model.addAttribute("interpolateFilePath", systemproperties.getDtFilePath() + interpolateFileList.get(0).get("file_path").toString() + interpolateFileList.get(0).get("file_nm").toString());
            model.addAttribute("interpolateOption", augmentModel.getInterplTp());
        } else {
            model.addAttribute("interpolateFilePath", "");
            model.addAttribute("interpolateOption", "");
        }

        List<Map<String, Object>> resampleFileList = getDtFileList(FILE_REF_TYPE.RESAMPLE, modelSeq);
        model.addAttribute("resampleFileList", resampleFileList);

        if (resampleFileList.size() > 0) {
            model.addAttribute("resampleFilePath", systemproperties.getDtFilePath() + resampleFileList.get(0).get("file_path").toString() + resampleFileList.get(0).get("file_nm").toString());
            model.addAttribute("resampleOption", augmentModel.getResmplTp());
            model.addAttribute("make_resample_status", "Y");

        } else {
            model.addAttribute("resampleFilePath", "");
            model.addAttribute("resampleOption", "");
            model.addAttribute("make_resample_status", "N");
        }

        List<Map<String, Object>> unitFileList = getDtFileList(FILE_REF_TYPE.UNIT, modelSeq);
        model.addAttribute("unitFileList", unitFileList);

        if (unitFileList.size() > 0) {
            model.addAttribute("unitFilePath", systemproperties.getDtFilePath() + unitFileList.get(0).get("file_path").toString() + unitFileList.get(0).get("file_nm").toString());
            model.addAttribute("make_unit_status", "Y");

        } else {
            model.addAttribute("unitFilePath", "");
            model.addAttribute("make_unit_status", "N");
        }

        model.addAttribute("interp_type_list", getCodeList2("INTERP_TYPE", false));
        model.addAttribute("resamp_type_list", getCodeList("RESAMP_TYPE", false));

        model.addAttribute("menuCode", params.getMenuCd());
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
        model.addAttribute("pageParams", getBaseParameterString(params));
        model.addAttribute("formType", "U");

        //TB_MODEL_META_ITEM
        List<Map<String, Object>> algorithm_list = aiModelService.getAlgolithmList();
        model.addAttribute("algorithm_list", algorithm_list);

        //TB_MODEL_PARAMS
        List<Map<String, Object>> algorithm_item_list = aiModelService.getAlgolithmItemList("LSTM");
        model.addAttribute("algorithm_item_list", algorithm_item_list);

        List<Map<String, Object>> loss_list = aiModelService.getAlgolithmCodeList("LSTM_LOSS");
        model.addAttribute("loss_list", loss_list);

        List<Map<String, Object>> meterics_list = aiModelService.getAlgolithmCodeList("LSTM_METERICS");
        model.addAttribute("meterics_list", meterics_list);

        List<Map<String, Object>> optimizer_list = aiModelService.getAlgolithmCodeList("LSTM_OPTIMIZER");
        model.addAttribute("optimizer_list", optimizer_list);

        List<Map<String, Object>> list_loss = aiModelService.getModelLossList(modelSeq);
        List<Map<String, Object>> list_fid = aiModelService.getModelFIDList(modelSeq);

        model.addAttribute("list_loss", list_loss);
        model.addAttribute("list_fid", list_fid);
        model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));

        List<Map<String, Object>> predictionFileList = getDtFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
        model.addAttribute("predictionFileList", predictionFileList);
        model.addAttribute("predictionFileListCount", predictionFileList.size());
        model.addAttribute("pathLength", systemproperties.getDtFilePath().length());

        model.addAttribute("interp_type_list", getCodeList2("INTERP_TYPE", false));
        model.addAttribute("resamp_type_list", getCodeList("RESAMP_TYPE", false));
        model.addAttribute("unit_type_list", getCodeList("UNIT_TYPE", false));
        model.addAttribute("valid_mater_list", getCodeList("VERIFY_TYPE", false));

        List<Map<String, Object>> validate_history = aiModelService.getValidateParamList(modelSeq);
        List<Map<String, Object>> unit_history = aiModelService.getUnitParamList(modelSeq);


        model.addAttribute("validate_history", validate_history);
        model.addAttribute("unit_history", unit_history);

        return "pages/ai_model/form";
    }

    @PostMapping("/delete")
    public String deleteModel(@RequestParam int modelSeq, @RequestParam(required = false) String menuCd, Model model, RedirectAttributes rttr) throws IOException {
        AugmentModel augmentModel = new AugmentModel();
        augmentModel.setModelSeq(modelSeq);
        augmentModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        augmentModel.setLoginUserIp(authenticationFacade.getLoginUserIp());

        aiModelService.deleteModel(augmentModel);

        return "redirect:/ai/model/list?menuCd=" + menuCd;
    }


    @PostMapping(value = "/csvFileUpload")
    @ResponseBody
    public Map<String, Object> uploadCsvFile(@ModelAttribute AugmentModel augmentModel, HttpServletRequest request) throws IOException {
        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<String> headerList = new ArrayList<String>();
        List<String> fileList = new ArrayList<String>();

        if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
            for (MultipartFile attachFile : augmentModel.getAttachFilesCsv()) {

                String line;
                int rowCount = 0;

                BufferedReader br = new BufferedReader(new InputStreamReader(attachFile.getInputStream(), "UTF-8"));
                while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                    //System.out.println(line);

                    List<String> stringList = new ArrayList<String>();
                    String stringArray[] = line.split(",", -1);

                    stringList = Arrays.asList(stringArray);

                    // csv 1열 데이터를 header로 인식
                    if (headerList.size() == 0) {
                        for (int i = 0; i < stringArray.length; i++) {
                            headerList.add(stringArray[i].replace("\"", ""));
                        }
                    } else {
                        Map<String, Object> map = new HashMap<String, Object>();
                        // header 컬럼 개수를 기준으로 데이터 set
                        for (int i = 0; i < headerList.size(); i++) {
                            if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                                stringList.set(i, "NaN");
                            }
                            map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                        }
                        mapList.add(map);
                    }
                    rowCount++;
                }
                br.close();
            }
        }

        //log.info("mapList:::" + mapList);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", mapList);
        result.put("header_data", headerList);
        result.put("file_list", fileList);

        return result;
    }


    @PostMapping(value = "/csvFileView")
    @ResponseBody
    public Map<String, Object> viewCsvFile(@RequestBody Map<String, Object> params, HttpServletRequest request) throws IOException {
        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<String> headerList = new ArrayList<String>();
        List<String> fileList = new ArrayList<String>();

        String line;
        int rowCount = 0;

        FileInputStream fileInputStream = new FileInputStream(params.get("file_path").toString());
        InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
        BufferedReader br = new BufferedReader(inputStreamReader);

        while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
            List<String> stringList = new ArrayList<String>();
            String stringArray[] = line.split(",", -1);
            stringList = Arrays.asList(stringArray);

            // csv 1열 데이터를 header로 인식
            if (headerList.size() == 0) {
                for (int i = 0; i < stringArray.length; i++) {
                    headerList.add(stringArray[i].replace("\"", ""));
                }

            } else {
                Map<String, Object> map = new HashMap<String, Object>();
                // header 컬럼 개수를 기준으로 데이터 set
                for (int i = 0; i < headerList.size(); i++) {
                    if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                        stringList.set(i, "NaN");
                    }
                    map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                }
                mapList.add(map);
            }
            rowCount++;
        }
        br.close();

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", mapList);
        result.put("header_data", headerList);
        result.put("file_list", fileList);

        return result;
    }

    @PostMapping(value = "/insertModel")
    @ResponseBody
    public Map<String, Object> insertModel(@ModelAttribute AugmentModel augmentModel, HttpServletRequest request) throws IOException, ParseException {
        List<String> fileList = new ArrayList<String>();
        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> nanDataList = new ArrayList<Map<String, Object>>();

        List<String> headerList = new ArrayList<String>();
        augmentModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        augmentModel.setLoginUserId(WebConfig.getSessionInfo().getUserId());
        augmentModel.setLoginUserIp(authenticationFacade.getLoginUserIp());

        augmentModel.setModelStatus("WAIT");
        int modelSeq = aiModelService.saveModelOriginData(augmentModel);

        Map<String, Object> result = new HashMap<String, Object>();

        if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
            for (MultipartFile attachFile : augmentModel.getAttachFilesCsv()) {

                int fileSeq = filesService.saveDtFiles(attachFile, FILE_REF_TYPE.DATA, modelSeq, augmentModel.getLoginUserSeq(), modelSeq, augmentModel.getLoginUserIp());
                Files file = filesService.getDtFile(fileSeq);
                String filePath = systemproperties.getDtFilePath().replace("\\", "/") + file.getFilePath() + file.getFileNm();
                fileList.add(filePath);

                //전처리 API
                String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetInfo/";

                Map<String, Object> params = new HashMap<String, Object>();
                params.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file.getFilePath());
                params.put("file_name", file.getFileNm());
                params.put("index_trgt_col", augmentModel.getIndexTrgtCol());

                String infoString = djangoApiService.requestDjangoApi(priprocInfoUrl, params, modelSeq);

                String dataDateTimeCheckUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDateTimeCheck/";
                Map<String, Object> param2 = new HashMap<String, Object>();
                param2.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file.getFilePath());
                param2.put("file_name", file.getFileNm());
                param2.put("index_trgt_col", augmentModel.getIndexTrgtCol());

                String dateTerm = djangoApiService.requestDjangoApi(dataDateTimeCheckUrl, param2, modelSeq);
                result.put("dataTimeCheckAll", dateTerm);

                // ObjectMapper 객체 생성
                ObjectMapper infoObjectMapper = new ObjectMapper();

                // JSON 문자열 파싱하여 JsonNode 객체 생성
                JsonNode infoStringRootNode = infoObjectMapper.readTree(infoString);

                // 필요한 값을 추출하기 위한 JsonNode 객체 생성
                JsonNode infoColumnsNode = infoStringRootNode.path("data").path("columns");
                JsonNode infoNode = infoStringRootNode.path("data").path("info");

                // JSON 문자열을 Map으로 변환
                JSONParser parserColumnsNode = new JSONParser();
                Object objColumnsNode = parserColumnsNode.parse(infoColumnsNode.toString());
                JSONArray jsonArrColumnsNode = (JSONArray) objColumnsNode;

                JSONParser parserInfoNode = new JSONParser();
                Object objInfoNode = parserInfoNode.parse(infoNode.toString());
                JSONArray jsonArrInfoNode = (JSONArray) objInfoNode;

                List<Map<String, Object>> infoDataList = new ArrayList<Map<String, Object>>();
                List<Map<String, Object>> statisticsDataList = new ArrayList<Map<String, Object>>();
                List<Map<String, Object>> missingValueDataList = new ArrayList<Map<String, Object>>();
                List<Map<String, Object>> dtypeValueDataList = new ArrayList<Map<String, Object>>();

                for (int j = 0; j < jsonArrInfoNode.size(); j++) {
                    JSONParser parser = new JSONParser();
                    Object obj = parser.parse(jsonArrInfoNode.get(j).toString());
                    JSONObject jsonMain = (JSONObject) obj;

                    String firstKey = (String) jsonMain.keySet().iterator().next();
                    JSONObject m = (JSONObject) jsonMain.get(firstKey);

                    Map<String, Object> infoMap = new HashMap<String, Object>();
                    infoMap.put("col", firstKey);
                    infoMap.put("dtype", m.get("dtype").toString());
                    infoMap.put("min", StoneUtil.objectNullString(m, "min"));
                    infoMap.put("max", StoneUtil.objectNullString(m, "max"));
                    infoMap.put("unique", StoneUtil.objectNullString(m, "unique"));
                    infoMap.put("duplicate", StoneUtil.objectNullString(m, "duplicate"));
                    infoMap.put("nan", StoneUtil.objectNullString(m, "nan"));
                    infoMap.put("mean", StoneUtil.objectNullString(m, "mean"));
                    infoMap.put("std", StoneUtil.objectNullString(m, "std"));
                    infoDataList.add(infoMap);

                    Map<String, Object> statisticsMap = new HashMap<String, Object>();
                    statisticsMap.put("col", firstKey);
                    statisticsMap.put("count", StoneUtil.objectNullString(m, "count"));
                    statisticsMap.put("mean", StoneUtil.objectNullString(m, "mean"));
                    statisticsMap.put("std", StoneUtil.objectNullString(m, "std"));
                    statisticsMap.put("min", StoneUtil.objectNullString(m, "min"));
                    statisticsMap.put("per25", StoneUtil.objectNullString(m, "25%"));
                    statisticsMap.put("per50", StoneUtil.objectNullString(m, "50%"));
                    statisticsMap.put("per75", StoneUtil.objectNullString(m, "75%"));
                    statisticsMap.put("max", StoneUtil.objectNullString(m, "max"));
                    statisticsDataList.add(statisticsMap);

                    Map<String, Object> missingValueMap = new HashMap<String, Object>();
                    missingValueMap.put("col", firstKey);
                    missingValueMap.put("nan", StoneUtil.objectNullString(m, "nan"));
                    missingValueDataList.add(missingValueMap);


                    Map<String, Object> dtypeValueMap = new HashMap<String, Object>();
                    dtypeValueMap.put("col", firstKey);
                    dtypeValueMap.put("dtype", StoneUtil.objectNullString(m, "dtype"));
                    dtypeValueDataList.add(dtypeValueMap);
                }

                // 추출한 값을 출력
                result.put("columnsNode", infoColumnsNode.toString());

                String infoHeaderList[] = {"col", "dtype", "min", "max", "unique", "duplicate", "nan", "std"};
                result.put("infoHeaderList", infoHeaderList);
                result.put("infoNode", infoDataList);
                result.put("statisticsNode", statisticsDataList);

                result.put("missingValueNode", missingValueDataList);
                result.put("dtypeValueNode", dtypeValueDataList);

                //HISTOY API
                JsonNode rangeNode = infoStringRootNode.path("data").path("range");
                result.put("rangeNode", rangeNode.toString());

                result.put("modelSeq", modelSeq);

                //API 연동 전 임시
                String line;
                int rowCount = 0;

                String tmpLine = "";

                FileInputStream fileInputStream = new FileInputStream(filePath);
                InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
                BufferedReader br = new BufferedReader(inputStreamReader);


                while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                    List<String> stringList = new ArrayList<String>();
                    String stringArray[] = line.split(",", -1);
                    stringList = Arrays.asList(stringArray);

                    // csv 1열 데이터를 header로 인식
                    if (headerList.size() == 0) {
                        for (int i = 0; i < stringArray.length; i++) {
                            headerList.add(stringArray[i].replace("\"", ""));
                        }
                    } else {
                        Map<String, Object> map = new HashMap<String, Object>();
                        // header 컬럼 개수를 기준으로 데이터 set
                        for (int i = 0; i < headerList.size(); i++) {
                            if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                                stringList.set(i, "NaN");
                                tmpLine += "," + rowCount;
                            }
                            map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                        }
                        mapList.add(map);
                    }
                    rowCount++;
                }
                br.close();

                if (tmpLine.length() > 0) {
                    String[] nanLineArr = tmpLine.substring(1, tmpLine.length()).split(",");
                    Set<String> set = new HashSet<>();

                    for (String str : nanLineArr) {
                        set.add(str);
                    }

                    String[] resultNanLineArr = set.toArray(new String[0]);

                    for (int n = 0; n < resultNanLineArr.length; n++) {
                        nanDataList.add(mapList.get(Integer.parseInt(resultNanLineArr[n].toString()) - 1));
                    }
                    result.put("nanLineArr", nanLineArr);
                } else {
                    result.put("nanLineArr", null);
                }
            }
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", mapList);
        result.put("nanData", nanDataList);
        result.put("header_data", headerList);
        result.put("file_list", fileList);
        result.put("originFilePath", fileList);

        return result;
    }

    @PostMapping(value = "/updateModel")
    @ResponseBody
    public Map<String, Object> updateModel(@ModelAttribute AugmentModel augmentModel, HttpServletRequest request) throws IOException, ParseException {
        List<String> fileList = new ArrayList<String>();
        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> nanDataList = new ArrayList<Map<String, Object>>();

        List<String> headerList = new ArrayList<String>();

        augmentModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
        augmentModel.setLoginUserId(WebConfig.getSessionInfo().getUserId());
        augmentModel.setLoginUserIp(authenticationFacade.getLoginUserIp());

        augmentModel.setModelStatus("WAIT");
        aiModelService.updateModelOriginData(augmentModel);

        Map<String, Object> result = new HashMap<String, Object>();
        int modelSeq = augmentModel.getModelSeq();
		
		/*
		파일 삭제
		TB_MODEL 업데이트
		TB_MODEL_FILES 삭제 deleteDtFileAll
		TB_MODEL_COLUMN 삭제
		TB_MODEL_FID 삭제
		TB_MODEL_LOSS 삭제
		TB_MODEL_PARAMS 삭제
		*/

        aiModelService.deleteModelOldFile(modelSeq);

        if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
            for (MultipartFile attachFile : augmentModel.getAttachFilesCsv()) {

                int fileSeq = filesService.saveDtFiles(attachFile, FILE_REF_TYPE.DATA, modelSeq, augmentModel.getLoginUserSeq(), modelSeq, augmentModel.getLoginUserIp());
                Files file = filesService.getDtFile(fileSeq);
                String filePath = systemproperties.getDtFilePath().replace("\\", "/") + file.getFilePath() + file.getFileNm();
                fileList.add(filePath);

                //전처리 API
                String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetInfo/";

                Map<String, Object> params = new HashMap<String, Object>();
                params.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file.getFilePath());
                params.put("file_name", file.getFileNm());
                params.put("index_trgt_col", augmentModel.getIndexTrgtCol());

                String infoString = djangoApiService.requestDjangoApi(priprocInfoUrl, params, modelSeq);


                String dataDateTimeCheckUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDateTimeCheck/";
                Map<String, Object> param2 = new HashMap<String, Object>();
                param2.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file.getFilePath());
                param2.put("file_name", file.getFileNm());
                param2.put("index_trgt_col", augmentModel.getIndexTrgtCol());

                String dateTerm = djangoApiService.requestDjangoApi(dataDateTimeCheckUrl, param2, modelSeq);
                result.put("dataTimeCheckAll", dateTerm);


                // ObjectMapper 객체 생성
                ObjectMapper infoObjectMapper = new ObjectMapper();

                // JSON 문자열 파싱하여 JsonNode 객체 생성
                JsonNode infoStringRootNode = infoObjectMapper.readTree(infoString);

                // 필요한 값을 추출하기 위한 JsonNode 객체 생성
                JsonNode infoColumnsNode = infoStringRootNode.path("data").path("columns");
                JsonNode infoNode = infoStringRootNode.path("data").path("info");

                JSONParser parserColumnsNode = new JSONParser();
                Object objColumnsNode = parserColumnsNode.parse(infoColumnsNode.toString());
                JSONArray jsonArrColumnsNode = (JSONArray) objColumnsNode;

                JSONParser parserInfoNode = new JSONParser();
                Object objInfoNode = parserInfoNode.parse(infoNode.toString());
                JSONArray jsonArrInfoNode = (JSONArray) objInfoNode;

                List<Map<String, Object>> infoDataList = new ArrayList<Map<String, Object>>();
                List<Map<String, Object>> statisticsDataList = new ArrayList<Map<String, Object>>();
                List<Map<String, Object>> missingValueDataList = new ArrayList<Map<String, Object>>();
                List<Map<String, Object>> dtypeValueDataList = new ArrayList<Map<String, Object>>();

                for (int j = 0; j < jsonArrInfoNode.size(); j++) {
                    JSONParser parser = new JSONParser();
                    Object obj = parser.parse(jsonArrInfoNode.get(j).toString());
                    JSONObject jsonMain = (JSONObject) obj;

                    String firstKey = (String) jsonMain.keySet().iterator().next();
                    JSONObject m = (JSONObject) jsonMain.get(firstKey);

                    Map<String, Object> infoMap = new HashMap<String, Object>();

                    infoMap.put("col", firstKey);

                    infoMap.put("dtype", m.get("dtype").toString());
                    infoMap.put("min", StoneUtil.objectNullString(m, "min"));
                    infoMap.put("max", StoneUtil.objectNullString(m, "max"));
                    infoMap.put("unique", StoneUtil.objectNullString(m, "unique"));
                    infoMap.put("duplicate", StoneUtil.objectNullString(m, "duplicate"));
                    infoMap.put("nan", StoneUtil.objectNullString(m, "nan"));
                    infoMap.put("mean", StoneUtil.objectNullString(m, "mean"));
                    infoMap.put("std", StoneUtil.objectNullString(m, "std"));

                    infoDataList.add(infoMap);
                    Map<String, Object> statisticsMap = new HashMap<String, Object>();
                    statisticsMap.put("col", firstKey);

                    statisticsMap.put("count", StoneUtil.objectNullString(m, "count"));
                    statisticsMap.put("mean", StoneUtil.objectNullString(m, "mean"));
                    statisticsMap.put("std", StoneUtil.objectNullString(m, "std"));
                    statisticsMap.put("min", StoneUtil.objectNullString(m, "min"));
                    statisticsMap.put("per25", StoneUtil.objectNullString(m, "25%"));
                    statisticsMap.put("per50", StoneUtil.objectNullString(m, "50%"));
                    statisticsMap.put("per75", StoneUtil.objectNullString(m, "75%"));
                    statisticsMap.put("max", StoneUtil.objectNullString(m, "max"));

                    statisticsDataList.add(statisticsMap);

                    Map<String, Object> missingValueMap = new HashMap<String, Object>();
                    //missingValueMap.put("col", jsonArrColumnsNode.get(j).toString());
                    missingValueMap.put("col", firstKey);
                    //missingValueMap.put("nan", m.get("nan").toString());
                    missingValueMap.put("nan", StoneUtil.objectNullString(m, "nan"));
                    missingValueDataList.add(missingValueMap);


                    Map<String, Object> dtypeValueMap = new HashMap<String, Object>();
                    dtypeValueMap.put("col", firstKey);
                    dtypeValueMap.put("dtype", StoneUtil.objectNullString(m, "dtype"));
                    dtypeValueDataList.add(dtypeValueMap);
                }

                // 추출한 값을 출력
                result.put("columnsNode", infoColumnsNode.toString());

                String infoHeaderList[] = {"col", "dtype", "min", "max", "unique", "duplicate", "nan", "std"};
                result.put("infoHeaderList", infoHeaderList);
                result.put("infoNode", infoDataList);
                result.put("statisticsNode", statisticsDataList);

                result.put("missingValueNode", missingValueDataList);
                result.put("dtypeValueNode", dtypeValueDataList);

                //HISTOY API
                JsonNode rangeNode = infoStringRootNode.path("data").path("range");
                result.put("rangeNode", rangeNode.toString());
                result.put("modelSeq", modelSeq);

                //API 연동 전 임시
                String line;
                int rowCount = 0;

                String tmpLine = "";

                FileInputStream fileInputStream = new FileInputStream(filePath);
                InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
                BufferedReader br = new BufferedReader(inputStreamReader);

                while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                    List<String> stringList = new ArrayList<String>();
                    String stringArray[] = line.split(",", -1);
                    stringList = Arrays.asList(stringArray);

                    // csv 1열 데이터를 header로 인식
                    if (headerList.size() == 0) {
                        for (int i = 0; i < stringArray.length; i++) {
                            headerList.add(stringArray[i].replace("\"", ""));
                        }

                    } else {
                        Map<String, Object> map = new HashMap<String, Object>();
                        // header 컬럼 개수를 기준으로 데이터 set
                        for (int i = 0; i < headerList.size(); i++) {
                            if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                                stringList.set(i, "NaN");
                                tmpLine += "," + rowCount;
                            }
                            map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                        }
                        mapList.add(map);
                    }
                    rowCount++;
                }
                br.close();

                if (tmpLine.length() > 0) {
                    String[] nanLineArr = tmpLine.substring(1, tmpLine.length()).split(",");
                    Set<String> set = new HashSet<>();

                    for (String str : nanLineArr) {
                        set.add(str);
                    }

                    String[] resultNanLineArr = set.toArray(new String[0]);

                    for (int n = 0; n < resultNanLineArr.length; n++) {
                        //log.info("resultNanLineArr::" + resultNanLineArr[n]);
                        //log.info("mapList::" + mapList.get(Integer.parseInt(resultNanLineArr[n].toString()) - 1));
                        nanDataList.add(mapList.get(Integer.parseInt(resultNanLineArr[n].toString()) - 1));
                    }
                    result.put("nanLineArr", nanLineArr);
                    //log.info("nanLineArr::" + Arrays.toString(nanLineArr));
                } else {
                    result.put("nanLineArr", null);
                }
            }
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", mapList);
        result.put("nanData", nanDataList);
        result.put("header_data", headerList);
        result.put("file_list", fileList);

        return result;
    }

    @PostMapping(value = "/make/data_set_info")
    @ResponseBody
    public Map<String, Object> dataSetInfo(@RequestBody Map<String, Object> params, HttpServletRequest request) throws IOException, ParseException {

        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetInfo/";

        params.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path").toString());
        params.put("file_name", file_info.get("file_nm").toString());
        params.put("index_trgt_col", params.get("index_trgt_col").toString());


        String infoString = djangoApiService.requestDjangoApi(priprocInfoUrl, params, Integer.parseInt(params.get("model_seq").toString()));

        ObjectMapper infoObjectMapper = new ObjectMapper();

        JsonNode infoStringRootNode = infoObjectMapper.readTree(infoString);

        JsonNode infoColumnsNode = infoStringRootNode.path("data").path("columns");
        JsonNode infoNode = infoStringRootNode.path("data").path("info");

        JSONParser parserColumnsNode = new JSONParser();
        Object objColumnsNode = parserColumnsNode.parse(infoColumnsNode.toString());
        JSONArray jsonArrColumnsNode = (JSONArray) objColumnsNode;

        JSONParser parserInfoNode = new JSONParser();
        Object objInfoNode = parserInfoNode.parse(infoNode.toString().replace("null", "0.0"));
        JSONArray jsonArrInfoNode = (JSONArray) objInfoNode;

        List<Map<String, Object>> infoDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> dtypeValueDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> missingValueDataList = new ArrayList<Map<String, Object>>();

        for (int j = 0; j < jsonArrInfoNode.size(); j++) {
            JSONParser parser = new JSONParser();
            Object obj = parser.parse(jsonArrInfoNode.get(j).toString());
            JSONObject jsonMain = (JSONObject) obj;

            String firstKey = (String) jsonMain.keySet().iterator().next();
            JSONObject m = (JSONObject) jsonMain.get(firstKey);

            Map<String, Object> infoMap = new HashMap<String, Object>();
            infoMap.put("col", firstKey);

            infoMap.put("dtype", m.get("dtype").toString());
            infoMap.put("min", StoneUtil.objectNullString(m, "min"));
            infoMap.put("max", StoneUtil.objectNullString(m, "max"));
            infoMap.put("unique", StoneUtil.objectNullString(m, "unique"));
            infoMap.put("duplicate", StoneUtil.objectNullString(m, "duplicate"));
            infoMap.put("nan", StoneUtil.objectNullString(m, "nan"));
            infoMap.put("mean", StoneUtil.objectNullString(m, "mean"));
            infoMap.put("std", StoneUtil.objectNullString(m, "std"));

            infoDataList.add(infoMap);

            Map<String, Object> dtypeValueMap = new HashMap<String, Object>();
            dtypeValueMap.put("col", firstKey);
            dtypeValueMap.put("dtype", StoneUtil.objectNullString(m, "dtype"));
            dtypeValueDataList.add(dtypeValueMap);


            Map<String, Object> missingValueMap = new HashMap<String, Object>();
            missingValueMap.put("col", firstKey);
            missingValueMap.put("nan", StoneUtil.objectNullString(m, "nan"));
            missingValueDataList.add(missingValueMap);
        }

        result.put("columnsNode", infoColumnsNode.toString());

        String infoHeaderList[] = {"col", "nan"};
        String infoTopHeaderList[] = {"col", "dtype", "min", "max", "unique", "duplicate", "nan", "std"};
        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("infoHeaderList", infoHeaderList);
        result.put("infoTopHeaderList", infoTopHeaderList);
        result.put("infoNode", infoDataList);
        result.put("missingValueNode", missingValueDataList);

        String validHeaderList[] = {"col", "dtype"};
        result.put("validHeaderList", validHeaderList);
        result.put("dtypeValueNode", dtypeValueDataList);


        return result;
    }

    @PostMapping(value = "/viewModel")
    @ResponseBody
    public Map<String, Object> viewModel(@RequestBody Map<String, Object> paramMap, HttpServletRequest request) throws IOException, ParseException {
        List<String> fileList = new ArrayList<String>();

        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> nanDataList = new ArrayList<Map<String, Object>>();

        List<String> headerList = new ArrayList<String>();

        int modelSeq = Integer.parseInt(paramMap.get("model_seq").toString());

        Map<String, Object> result = new HashMap<String, Object>();

        List<Map<String, Object>> dataFileList = new ArrayList<Map<String, Object>>();

        if (getDtFileList(FILE_REF_TYPE.OUTLIER, modelSeq).size() > 0) {
            dataFileList = getDtFileList(FILE_REF_TYPE.OUTLIER, modelSeq);
        } else if (getDtFileList(FILE_REF_TYPE.VALIDATE, modelSeq).size() > 0) {
            dataFileList = getDtFileList(FILE_REF_TYPE.VALIDATE, modelSeq);
        } else {
            dataFileList = getDtFileList(FILE_REF_TYPE.ORIGIN, modelSeq);
        }


        String filePath = systemproperties.getDtFilePath().replace("\\", "/") + dataFileList.get(0).get("file_path") + dataFileList.get(0).get("file_nm");
        fileList.add(filePath);

        //전처리 API
        String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetInfo/";

        String dataDateTimeCheckUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDateTimeCheck/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + dataFileList.get(0).get("file_path"));
        params.put("file_name", dataFileList.get(0).get("file_nm"));
        params.put("index_trgt_col", paramMap.get("index_trgt_col").toString());

        String infoString = djangoApiService.requestDjangoApi(priprocInfoUrl, params, modelSeq);

        Map<String, Object> param2 = new HashMap<String, Object>();
        param2.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + dataFileList.get(0).get("file_path"));
        param2.put("file_name", dataFileList.get(0).get("file_nm"));
        param2.put("index_trgt_col", paramMap.get("index_trgt_col").toString());

        String dateTerm = djangoApiService.requestDjangoApi(dataDateTimeCheckUrl, param2, modelSeq);

        // JSON 형식의 문자열
        // ObjectMapper 객체 생성
        ObjectMapper infoObjectMapper = new ObjectMapper();

        // JSON 문자열 파싱하여 JsonNode 객체 생성
        JsonNode infoStringRootNode = infoObjectMapper.readTree(infoString);

        // 필요한 값을 추출하기 위한 JsonNode 객체 생성
        JsonNode infoColumnsNode = infoStringRootNode.path("data").path("columns");
        JsonNode infoNode = infoStringRootNode.path("data").path("info");

        // JSON 문자열을 Map으로 변환

        JSONParser parserColumnsNode = new JSONParser();
        Object objColumnsNode = parserColumnsNode.parse(infoColumnsNode.toString());
        JSONArray jsonArrColumnsNode = (JSONArray) objColumnsNode;

        JSONParser parserInfoNode = new JSONParser();
        Object objInfoNode = parserInfoNode.parse(infoNode.toString());
        JSONArray jsonArrInfoNode = (JSONArray) objInfoNode;

        List<Map<String, Object>> infoDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> statisticsDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> missingValueDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> dtypeValueDataList = new ArrayList<Map<String, Object>>();

        for (int j = 0; j < jsonArrInfoNode.size(); j++) {
            JSONParser parser = new JSONParser();
            Object obj = parser.parse(jsonArrInfoNode.get(j).toString());
            JSONObject jsonMain = (JSONObject) obj;

            String firstKey = (String) jsonMain.keySet().iterator().next();
            JSONObject m = (JSONObject) jsonMain.get(firstKey);

            Map<String, Object> infoMap = new HashMap<String, Object>();
            infoMap.put("col", firstKey);

            infoMap.put("dtype", m.get("dtype").toString());
            infoMap.put("min", StoneUtil.objectNullString(m, "min"));
            infoMap.put("max", StoneUtil.objectNullString(m, "max"));
            infoMap.put("unique", StoneUtil.objectNullString(m, "unique"));
            infoMap.put("duplicate", StoneUtil.objectNullString(m, "duplicate"));
            infoMap.put("nan", StoneUtil.objectNullString(m, "nan"));
            infoMap.put("mean", StoneUtil.objectNullString(m, "mean"));
            infoMap.put("std", StoneUtil.objectNullString(m, "std"));

            infoDataList.add(infoMap);

            Map<String, Object> statisticsMap = new HashMap<String, Object>();
            statisticsMap.put("col", firstKey);

            statisticsMap.put("count", StoneUtil.objectNullString(m, "count"));
            statisticsMap.put("mean", StoneUtil.objectNullString(m, "mean"));
            statisticsMap.put("std", StoneUtil.objectNullString(m, "std"));
            statisticsMap.put("min", StoneUtil.objectNullString(m, "min"));
            statisticsMap.put("per25", StoneUtil.objectNullString(m, "25%"));
            statisticsMap.put("per50", StoneUtil.objectNullString(m, "50%"));
            statisticsMap.put("per75", StoneUtil.objectNullString(m, "75%"));
            statisticsMap.put("max", StoneUtil.objectNullString(m, "max"));

            statisticsDataList.add(statisticsMap);

            Map<String, Object> missingValueMap = new HashMap<String, Object>();
            missingValueMap.put("col", firstKey);
            missingValueMap.put("nan", m.get("nan").toString());
            missingValueMap.put("nan", StoneUtil.objectNullString(m, "nan"));
            missingValueDataList.add(missingValueMap);

            Map<String, Object> dtypeValueMap = new HashMap<String, Object>();
            dtypeValueMap.put("col", firstKey);
            dtypeValueMap.put("dtype", StoneUtil.objectNullString(m, "dtype"));
            dtypeValueDataList.add(dtypeValueMap);
        }

        // 추출한 값을 출력
        result.put("columnsNode", infoColumnsNode.toString());

        String infoHeaderList[] = {"col", "dtype", "min", "max", "unique", "duplicate", "nan", "std"};
        result.put("infoHeaderList", infoHeaderList);
        result.put("infoNode", infoDataList);
        result.put("statisticsNode", statisticsDataList);

        result.put("missingValueNode", missingValueDataList);
        result.put("dtypeValueNode", dtypeValueDataList);

        //HISTOY API
        JsonNode rangeNode = infoStringRootNode.path("data").path("range");
        result.put("rangeNode", rangeNode.toString());
        result.put("modelSeq", modelSeq);

        result.put("dataTimeCheckAll", dateTerm);

        //API 연동 전 임시
        String line;
        int rowCount = 0;

        String tmpLine = "";

        FileInputStream fileInputStream = new FileInputStream(filePath);
        InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
        BufferedReader br = new BufferedReader(inputStreamReader);

        while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
            List<String> stringList = new ArrayList<String>();
            String stringArray[] = line.split(",", -1);
            stringList = Arrays.asList(stringArray);

            // csv 1열 데이터를 header로 인식
            if (headerList.size() == 0) {
                for (int i = 0; i < stringArray.length; i++) {
                    headerList.add(stringArray[i].replace("\"", ""));
                }
            } else {
                Map<String, Object> map = new HashMap<String, Object>();
                // header 컬럼 개수를 기준으로 데이터 set
                for (int i = 0; i < headerList.size(); i++) {
                    if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                        stringList.set(i, "NaN");
                        tmpLine += "," + rowCount;
                    }
                    map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                }
                mapList.add(map);
            }
            rowCount++;
        }
        br.close();

        if (tmpLine.length() > 0) {
            String[] nanLineArr = tmpLine.substring(1, tmpLine.length()).split(",");
            Set<String> set = new HashSet<>();

            for (String str : nanLineArr) {
                set.add(str);
            }

            String[] resultNanLineArr = set.toArray(new String[0]);

            for (int n = 0; n < resultNanLineArr.length; n++) {
                nanDataList.add(mapList.get(Integer.parseInt(resultNanLineArr[n].toString()) - 1));
            }

            result.put("nanLineArr", nanLineArr);
        } else {
            result.put("nanLineArr", null);
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);

        result.put("data", mapList);
        result.put("nanData", nanDataList);
        result.put("header_data", headerList);
        result.put("file_list", fileList);


        List<String> interpolateHeaderList = aiModelService.getTargetColumnInfo(modelSeq);
        if (interpolateHeaderList.size() > 0) {
            result.put("interpolateHeaderList", interpolateHeaderList);
        } else {
            result.put("interpolateHeaderList", "");
        }


        List<Map<String, Object>> unitFileList = getDtFileList(FILE_REF_TYPE.UNIT, modelSeq);
        List<Map<String, Object>> unitMapList = new ArrayList<Map<String, Object>>();
        List<String> unitHeaderList = new ArrayList<String>();

        if (unitFileList.size() > 0) {
            String unitFilePath = systemproperties.getDtFilePath().replace("\\", "/") + unitFileList.get(0).get("file_path") + unitFileList.get(0).get("file_nm");

            String unitLine;
            int unitRowCount = 0;

            FileInputStream unitInputStream = new FileInputStream(unitFilePath);
            InputStreamReader unitStreamReader = new InputStreamReader(unitInputStream, "UTF-8");
            BufferedReader unitBr = new BufferedReader(unitStreamReader);


            while ((unitLine = unitBr.readLine()) != null && unitRowCount <= systemproperties.getLimitCsvRowCount()) {
                String unitArray[] = unitLine.split(",", -1);
                List<String> unitList = new ArrayList<String>();
                unitList = Arrays.asList(unitArray);

                // csv 1열 데이터를 header로 인식
                if (unitHeaderList.size() == 0) {
                    for (int i = 0; i < unitArray.length; i++) {
                        unitHeaderList.add(unitArray[i].replace("\"", ""));
                    }
                } else {
                    Map<String, Object> map = new HashMap<String, Object>();
                    // header 컬럼 개수를 기준으로 데이터 set
                    for (int i = 0; i < headerList.size(); i++) {
                        map.put(unitHeaderList.get(i), unitList.get(i).replace("\"", ""));
                    }
                    unitMapList.add(map);
                }
                unitRowCount++;
            }
            unitBr.close();

            result.put("unitHeaderList", unitHeaderList);
            result.put("unitMapList", unitMapList);
        } else {
            result.put("unitHeaderList", "");
            result.put("unitMapList", "");
        }

        return result;
    }


    @PostMapping(value = "/viewModel2")
    @ResponseBody
    public Map<String, Object> viewModel2(@RequestBody Map<String, Object> paramMap, HttpServletRequest request) throws IOException, ParseException {
        List<String> fileList = new ArrayList<String>();

        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> nanDataList = new ArrayList<Map<String, Object>>();

        List<String> headerList = new ArrayList<String>();

        int modelSeq = Integer.parseInt(paramMap.get("model_seq").toString());

        Map<String, Object> result = new HashMap<String, Object>();

        List<Map<String, Object>> dataFileList = getDtFileList(FILE_REF_TYPE.VALIDATE, modelSeq);

        String filePath = systemproperties.getDtFilePath().replace("\\", "/") + dataFileList.get(0).get("file_path") + dataFileList.get(0).get("file_nm");
        fileList.add(filePath);

        //전처리 API
        String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDateTimeCheck/";

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + dataFileList.get(0).get("file_path"));
        params.put("file_name", dataFileList.get(0).get("file_nm"));
        params.put("index_trgt_col", paramMap.get("index_trgt_col").toString());


        String infoString = djangoApiService.requestDjangoApi(priprocInfoUrl, params, modelSeq);

        // JSON 형식의 문자열
        // ObjectMapper 객체 생성
        ObjectMapper infoObjectMapper = new ObjectMapper();

        // JSON 문자열 파싱하여 JsonNode 객체 생성
        JsonNode infoStringRootNode = infoObjectMapper.readTree(infoString);

        // 필요한 값을 추출하기 위한 JsonNode 객체 생성
        JsonNode infoColumnsNode = infoStringRootNode.path("data").path("columns");
        JsonNode infoNode = infoStringRootNode.path("data").path("info");

        // JSON 문자열을 Map으로 변환
        JSONParser parserColumnsNode = new JSONParser();
        Object objColumnsNode = parserColumnsNode.parse(infoColumnsNode.toString());
        JSONArray jsonArrColumnsNode = (JSONArray) objColumnsNode;

        JSONParser parserInfoNode = new JSONParser();
        Object objInfoNode = parserInfoNode.parse(infoNode.toString());
        JSONArray jsonArrInfoNode = (JSONArray) objInfoNode;

        List<Map<String, Object>> infoDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> statisticsDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> missingValueDataList = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> dtypeValueDataList = new ArrayList<Map<String, Object>>();


        for (int j = 0; j < jsonArrInfoNode.size(); j++) {
            JSONParser parser = new JSONParser();
            Object obj = parser.parse(jsonArrInfoNode.get(j).toString());
            JSONObject jsonMain = (JSONObject) obj;
            String firstKey = (String) jsonMain.keySet().iterator().next();
            JSONObject m = (JSONObject) jsonMain.get(firstKey);

            Map<String, Object> infoMap = new HashMap<String, Object>();
            infoMap.put("col", firstKey);

            infoMap.put("dtype", m.get("dtype").toString());
            infoMap.put("min", StoneUtil.objectNullString(m, "min"));
            infoMap.put("max", StoneUtil.objectNullString(m, "max"));
            infoMap.put("unique", StoneUtil.objectNullString(m, "unique"));
            infoMap.put("duplicate", StoneUtil.objectNullString(m, "duplicate"));
            infoMap.put("nan", StoneUtil.objectNullString(m, "nan"));
            infoMap.put("mean", StoneUtil.objectNullString(m, "mean"));
            infoMap.put("std", StoneUtil.objectNullString(m, "std"));

            infoDataList.add(infoMap);

            Map<String, Object> statisticsMap = new HashMap<String, Object>();
            statisticsMap.put("col", firstKey);

            statisticsMap.put("count", StoneUtil.objectNullString(m, "count"));
            statisticsMap.put("mean", StoneUtil.objectNullString(m, "mean"));
            statisticsMap.put("std", StoneUtil.objectNullString(m, "std"));
            statisticsMap.put("min", StoneUtil.objectNullString(m, "min"));
            statisticsMap.put("per25", StoneUtil.objectNullString(m, "25%"));
            statisticsMap.put("per50", StoneUtil.objectNullString(m, "50%"));
            statisticsMap.put("per75", StoneUtil.objectNullString(m, "75%"));
            statisticsMap.put("max", StoneUtil.objectNullString(m, "max"));

            statisticsDataList.add(statisticsMap);

            Map<String, Object> missingValueMap = new HashMap<String, Object>();
            missingValueMap.put("col", firstKey);
            missingValueMap.put("nan", m.get("nan").toString());
            missingValueMap.put("nan", StoneUtil.objectNullString(m, "nan"));
            missingValueDataList.add(missingValueMap);

            Map<String, Object> dtypeValueMap = new HashMap<String, Object>();
            dtypeValueMap.put("col", firstKey);
            dtypeValueMap.put("dtype", StoneUtil.objectNullString(m, "dtype"));
            dtypeValueDataList.add(dtypeValueMap);
        }

        // 추출한 값을 출력
        result.put("columnsNode", infoColumnsNode.toString());

        String infoHeaderList[] = {"col", "dtype", "min", "max", "unique", "duplicate", "nan", "std"};
        result.put("infoHeaderList", infoHeaderList);
        result.put("infoNode", infoDataList);
        result.put("statisticsNode", statisticsDataList);

        result.put("missingValueNode", missingValueDataList);
        result.put("dtypeValueNode", dtypeValueDataList);

        //HISTOY API
        JsonNode rangeNode = infoStringRootNode.path("data").path("range");
        result.put("rangeNode", rangeNode.toString());
        result.put("modelSeq", modelSeq);

        //API 연동 전 임시
        String line;
        int rowCount = 0;

        String tmpLine = "";

        FileInputStream fileInputStream = new FileInputStream(filePath);
        InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
        BufferedReader br = new BufferedReader(inputStreamReader);

        while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
            List<String> stringList = new ArrayList<String>();
            String stringArray[] = line.split(",", -1);
            stringList = Arrays.asList(stringArray);

            // csv 1열 데이터를 header로 인식
            if (headerList.size() == 0) {
                for (int i = 0; i < stringArray.length; i++) {
                    headerList.add(stringArray[i].replace("\"", ""));
                }
            } else {
                Map<String, Object> map = new HashMap<String, Object>();
                // header 컬럼 개수를 기준으로 데이터 set
                for (int i = 0; i < headerList.size(); i++) {
                    if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                        stringList.set(i, "NaN");

                        tmpLine += "," + rowCount;
                    }
                    map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                }
                mapList.add(map);
            }
            rowCount++;
        }
        br.close();

        if (tmpLine.length() > 0) {
            String[] nanLineArr = tmpLine.substring(1, tmpLine.length()).split(",");
            Set<String> set = new HashSet<>();

            for (String str : nanLineArr) {
                set.add(str);
            }

            String[] resultNanLineArr = set.toArray(new String[0]);

            for (int n = 0; n < resultNanLineArr.length; n++) {
                nanDataList.add(mapList.get(Integer.parseInt(resultNanLineArr[n].toString()) - 1));
            }

            result.put("nanLineArr", nanLineArr);
        } else {
            result.put("nanLineArr", null);
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);

        result.put("data", mapList);
        result.put("nanData", nanDataList);
        result.put("header_data", headerList);
        result.put("file_list", fileList);


        List<String> interpolateHeaderList = aiModelService.getTargetColumnInfo(modelSeq);
        if (interpolateHeaderList.size() > 0) {
            result.put("interpolateHeaderList", interpolateHeaderList);
        } else {
            result.put("interpolateHeaderList", "");
        }


        List<Map<String, Object>> unitFileList = getDtFileList(FILE_REF_TYPE.UNIT, modelSeq);
        List<Map<String, Object>> unitMapList = new ArrayList<Map<String, Object>>();
        List<String> unitHeaderList = new ArrayList<String>();

        if (unitFileList.size() > 0) {
            String unitFilePath = systemproperties.getDtFilePath().replace("\\", "/") + unitFileList.get(0).get("file_path") + unitFileList.get(0).get("file_nm");

            String unitLine;
            int unitRowCount = 0;

            FileInputStream unitInputStream = new FileInputStream(unitFilePath);
            InputStreamReader unitStreamReader = new InputStreamReader(unitInputStream, "UTF-8");
            BufferedReader unitBr = new BufferedReader(unitStreamReader);


            while ((unitLine = unitBr.readLine()) != null && unitRowCount <= systemproperties.getLimitCsvRowCount()) {
                String unitArray[] = unitLine.split(",", -1);
                List<String> unitList = new ArrayList<String>();
                unitList = Arrays.asList(unitArray);

                // csv 1열 데이터를 header로 인식
                if (unitHeaderList.size() == 0) {
                    for (int i = 0; i < unitArray.length; i++) {
                        unitHeaderList.add(unitArray[i].replace("\"", ""));
                    }
                } else {
                    Map<String, Object> map = new HashMap<String, Object>();
                    // header 컬럼 개수를 기준으로 데이터 set
                    for (int i = 0; i < headerList.size(); i++) {
                        map.put(unitHeaderList.get(i), unitList.get(i).replace("\"", ""));
                    }
                    unitMapList.add(map);
                }
                unitRowCount++;
            }
            unitBr.close();

            result.put("unitHeaderList", unitHeaderList);
            result.put("unitMapList", unitMapList);
        } else {
            result.put("unitHeaderList", "");
            result.put("unitMapList", "");
        }

        //log.info("알고리즘 뷰---------------");

        return result;
    }

    public String renameFileBak(String filePath, long currentTime) {
        File file = new File(filePath);
        String fileName = file.getName();
        String newFileName = fileName.substring(0, fileName.lastIndexOf(".")) + "_" + currentTime + fileName.substring(fileName.lastIndexOf("."));
        File newFile = new File(file.getParent(), newFileName);
        file.renameTo(newFile);

        return newFileName;
    }


    @PostMapping("/make/valid_view_set")
    @ResponseBody
    public Map<String, Object> makeValidViewSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {

        Map<String, Object> result = new HashMap<String, Object>();

        int modelSeq = Integer.parseInt(params.get("model_seq").toString());
        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        String fileName = file_info.get("file_nm").toString();
        String makeFileNm = makeFileName(fileName, "_verify");

        String setfilePath = systemproperties.getDtFilePath() + file_info.get("file_path").toString() + makeFileNm;

        String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetVerify/";
        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
        setParam.put("file_name", fileName);
        setParam.put("target_file_name", makeFileName(fileName, "_verify"));


        setParam.put("vrfc_trgt_col", params.get("verifyColumn").toString());

        Map<String, Object> verify_option = aiModelService.getVerifyOption(Integer.parseInt(params.get("verifyType").toString()));
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

        setParam.put("is_create", "N");

        setParam.put("vrfc_clear_type", params.get("clearType").toString());
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        String validString = djangoApiService.requestDjangoApi(priprocInfoUrl, setParam, modelSeq);

        JSONParser parser = new JSONParser();
        JSONObject resultObj = (JSONObject) parser.parse(validString);

        if (Integer.parseInt(resultObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", resultObj.get("data").toString());
        } else {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            insertErrorLog(modelSeq, 0, "PYTHON", "dataVerifyInfo", resultObj.get("code").toString(), resultObj.get("message").toString(), resultObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }

        return result;
    }


    @PostMapping("/make/valid_set")
    @ResponseBody
    public Map<String, Object> makeValidSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {

        Map<String, Object> result = new HashMap<String, Object>();

        int modelSeq = Integer.parseInt(params.get("model_seq").toString());
        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        String fileName = file_info.get("file_nm").toString();

        String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetVerify/";
        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
        setParam.put("file_name", fileName);
        setParam.put("target_file_name", makeFileName(fileName, "_verify"));


        setParam.put("vrfc_trgt_col", params.get("verifyColumn").toString());

        Map<String, Object> verify_option = aiModelService.getVerifyOption(Integer.parseInt(params.get("verifyType").toString()));
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

        setParam.put("is_create", "Y");

        setParam.put("vrfc_clear_type", params.get("clearType").toString());
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        String validString = djangoApiService.requestDjangoApi(priprocInfoUrl, setParam, modelSeq);

        JSONParser parser = new JSONParser();
        JSONObject resultObj = (JSONObject) parser.parse(validString);


        if (Integer.parseInt(resultObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {

            String[] delType = {"OUTLIER", "INTERPOLATE", "RESAMPLE", "UNIT"};

            for (int i = 0; i < delType.length; i++) {
                Map<String, Object> resetParams = new HashMap<String, Object>();
                resetParams.put("modelSeq", modelSeq);
                resetParams.put("refTp", delType[i]);

                resetProcTargetFileList(resetParams);
            }

            File file = new File(systemproperties.getDtFilePath() + file_info.get("file_path").toString() + makeFileName(fileName, "_verify"));

            long fileSize = file.length();

            Map<String, Object> validParam = new HashMap<String, Object>();
            validParam.put("model_seq", modelSeq);
            validParam.put("ref_tp", FILE_REF_TYPE.VALIDATE.toUpperCase());
            validParam.put("file_nm", file.getName());
            validParam.put("file_path", file_info.get("file_path").toString());
            validParam.put("file_size", fileSize);
            validParam.put("file_extn", FileUtil.getFileExtension(file.getName()));
            validParam.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
            validParam.put("reg_ip", authenticationFacade.getLoginUserIp());
            validParam.put("clear_tp", params.get("clearType").toString());

            validParam.put("vrfc_seq", Integer.parseInt(params.get("verifyType").toString()));
            validParam.put("vrfc_trgt_col", params.get("verifyColumn").toString());


            int cnt = aiModelService.getCountInterpolateFileInfo(validParam);

            if (cnt > 0) {
                aiModelService.updateValidFileInfo(validParam);
            } else {
                aiModelService.insertValidFileInfo(validParam);
            }


            int valid_cnt = aiModelService.getCountModelValidateParams(validParam);
            if (valid_cnt > 0) {
                aiModelService.updateModelValidateParams(validParam);
            } else {
                aiModelService.insertModelValidateParams(validParam);
            }


            List<Map<String, Object>> valiate_history = aiModelService.getValidateParamList(modelSeq);

            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("valiate_history", valiate_history);
            result.put("validate_file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString() + makeFileName(fileName, "_verify"));
            result.put("data", resultObj.get("data").toString());


        } else {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            insertErrorLog(modelSeq, 0, "PYTHON", "dataVerifyInfo", resultObj.get("code").toString(), resultObj.get("message").toString(), resultObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }

        return result;
    }


    @PostMapping("/get/outlier_info")
    @ResponseBody
    public Map<String, Object> getOutlierInfo(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        Map<String, Object> result = new HashMap<String, Object>();
        int modelSeq = Integer.parseInt(params.get("model_seq").toString());

        Map<String, Object> correlationParam = new HashMap<String, Object>();
        correlationParam.put("file", params.get("file_path").toString());
        correlationParam.put("index_trgt_col", params.get("index_target_col").toString());
        correlationParam.put("feature", params.get("outlier_target_col").toString());
        correlationParam.put("freq", Integer.parseInt(params.get("freq").toString()));

        String correlationUrl = "";
        correlationParam.put("isCreate", "N");

        if ("standard".equals(params.get("outlier_type").toString())) {
            correlationUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorOutlierStandardDeviation/";
            correlationParam.put("p_value", Float.parseFloat(params.get("p_value").toString()));
        }

        if ("kmean".equals(params.get("outlier_type").toString())) {
            correlationUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorOutlierKMeans/";
            correlationParam.put("n_clusters", Integer.parseInt(params.get("n_clusters").toString()));
            correlationParam.put("n_clusters_lable", Integer.parseInt(params.get("n_clusters_lable").toString()));
        }

        if ("dbscan".equals(params.get("outlier_type").toString())) {
            correlationUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorOutlierDBscan/";
            correlationParam.put("eps", Float.parseFloat(params.get("eps").toString()));
            correlationParam.put("min_samples", Integer.parseInt(params.get("min_samples").toString()));
        }


        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());
        String fileName = file_info.get("file_nm").toString();

        correlationParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
        correlationParam.put("file_name", fileName);
        correlationParam.put("target_file_name", makeFileName(fileName, "_outlier"));


        String correlationString = djangoApiService.requestDjangoApi(correlationUrl, correlationParam, modelSeq);

        JSONParser correlationParser = new JSONParser();
        JSONObject correlationObj = (JSONObject) correlationParser.parse(correlationString);

        // ObjectMapper 객체 생성
        ObjectMapper infoObjectMapper = new ObjectMapper();

        // JSON 문자열 파싱하여 JsonNode 객체 생성
        JsonNode infoStringRootNode = infoObjectMapper.readTree(correlationString);

        // 필요한 값을 추출하기 위한 JsonNode 객체 생성
        JsonNode hist = infoStringRootNode.path("data").path("hist");
        JsonNode info = infoStringRootNode.path("data").path("info");

        try {
            if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("hist", hist.toString());
                result.put("info", info);
            }
        } catch (Exception e) {
            log.info("실패:::" + correlationObj);
            ;
            insertErrorLog(modelSeq, 0, "PYTHON", "processorOutlier" + params.get("outlier_type").toString(), correlationObj.get("code").toString(), correlationObj.get("message").toString(), correlationObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("hist", hist.toString());
            result.put("info", correlationObj.get("detail"));
        }

        return result;
    }

    @PostMapping("/make/outlier_set")
    @ResponseBody
    public Map<String, Object> makeOutlierSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {

        Map<String, Object> result = new HashMap<String, Object>();

        int modelSeq = Integer.parseInt(params.get("model_seq").toString());
        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        String fileName = file_info.get("file_nm").toString();

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file", params.get("file_path").toString());
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        setParam.put("feature", params.get("outlier_target_col").toString());
        setParam.put("freq", Integer.parseInt(params.get("freq").toString()));
        setParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
        setParam.put("file_name", fileName);
        setParam.put("target_file_name", makeFileName(file_info.get("file_nm").toString().replaceAll("_outlier|_verify", ""), "_outlier"));


        String outlierUrl = "";
        setParam.put("isCreate", "Y");

        if ("standard".equals(params.get("outlier_type").toString())) {
            outlierUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorOutlierStandardDeviation/";
            setParam.put("p_value", Float.parseFloat(params.get("p_value").toString()));
        }

        if ("kmean".equals(params.get("outlier_type").toString())) {
            outlierUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorOutlierKMeans/";
            setParam.put("n_clusters", Integer.parseInt(params.get("n_clusters").toString()));
            setParam.put("n_clusters_lable", Integer.parseInt(params.get("n_clusters_lable").toString()));
        }

        if ("dbscan".equals(params.get("outlier_type").toString())) {
            outlierUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorOutlierDBscan/";
            setParam.put("eps", Float.parseFloat(params.get("eps").toString()));
            setParam.put("min_samples", Integer.parseInt(params.get("min_samples").toString()));
        }

        String outlierString = djangoApiService.requestDjangoApi(outlierUrl, setParam, modelSeq);

        JSONParser parser = new JSONParser();
        JSONObject resultObj = (JSONObject) parser.parse(outlierString);


        if (Integer.parseInt(resultObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            String[] delType = {"INTERPOLATE", "RESAMPLE", "UNIT"};

            for (int i = 0; i < delType.length; i++) {
                Map<String, Object> resetParams = new HashMap<String, Object>();
                resetParams.put("modelSeq", modelSeq);
                resetParams.put("refTp", delType[i]);

                resetProcTargetFileList(resetParams);
            }


            File file = new File(systemproperties.getDtFilePath() + file_info.get("file_path").toString() + makeFileName(file_info.get("file_nm").toString().replaceAll("_outlier|_verify", ""), "_outlier"));

            long fileSize = file.length();

            Map<String, Object> outlierParam = new HashMap<String, Object>();
            outlierParam.put("model_seq", modelSeq);
            outlierParam.put("ref_tp", FILE_REF_TYPE.OUTLIER.toUpperCase());
            outlierParam.put("file_nm", file.getName());
            outlierParam.put("file_path", file_info.get("file_path").toString());
            outlierParam.put("file_size", fileSize);
            outlierParam.put("file_extn", FileUtil.getFileExtension(file.getName()));
            outlierParam.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
            outlierParam.put("reg_ip", authenticationFacade.getLoginUserIp());

            int cnt = aiModelService.getCountOutlierFileInfo(outlierParam);

            if (cnt > 0) {
                aiModelService.updateOutlierFileInfo(outlierParam);
            } else {
                aiModelService.insertOutlierFileInfo(outlierParam);
            }

            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("outlier_file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString() + makeFileName(file_info.get("file_nm").toString().replaceAll("_outlier|_verify", ""), "_outlier"));
            result.put("data", resultObj.get("data").toString());


        } else {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            insertErrorLog(modelSeq, 0, "PYTHON", "makeOutlierSet", resultObj.get("code").toString(), resultObj.get("message").toString(), resultObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }

        return result;
    }


    @PostMapping("/make/interpolate_set")
    @ResponseBody
    public Map<String, Object> makeInterpolateSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        Map<String, Object> result = new HashMap<String, Object>();
        String jsonString = params.get("data").toString();
        log.info("params -> " + params.toString());
        log.info("jsonString -> " + jsonString);

        int modelSeq = Integer.parseInt(params.get("model_seq").toString());
        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());
        log.info("file_info::" + file_info);

        String fileName = file_info.get("file_nm").toString();
        String makeFileNm = makeFileName(fileName.toString().replaceAll("_outlier|_verify", ""), "_imputer");


        String setfilePath = systemproperties.getDtFilePath() + file_info.get("file_path").toString() + makeFileNm;
        String priprocInfoUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetInterpolate/";
        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
        setParam.put("file_name", fileName);
        setParam.put("target_file_name", makeFileNm);
        setParam.put("interpl_tp", params.get("interpolate_option").toString());
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());


        String interpolateString = djangoApiService.requestDjangoApi(priprocInfoUrl, setParam, modelSeq);

        JSONParser parser = new JSONParser();
        JSONObject resultObj = (JSONObject) parser.parse(interpolateString);


        if (Integer.parseInt(resultObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            String[] delType = {"RESAMPLE", "UNIT"};

            for (int i = 0; i < delType.length; i++) {
                Map<String, Object> resetParams = new HashMap<String, Object>();
                resetParams.put("modelSeq", modelSeq);
                resetParams.put("refTp", delType[i]);

                resetProcTargetFileList(resetParams);
            }

            File file = new File(resultObj.get("data").toString());
            long fileSize = file.length();

            Map<String, Object> interpolateParam = new HashMap<String, Object>();
            interpolateParam.put("interpl_tp", params.get("interpolate_option").toString());
            interpolateParam.put("model_seq", modelSeq);
            interpolateParam.put("ref_tp", FILE_REF_TYPE.INTERPOLATE.toUpperCase());
            interpolateParam.put("file_nm", file.getName());
            interpolateParam.put("file_path", file_info.get("file_path").toString());
            interpolateParam.put("file_size", fileSize);
            interpolateParam.put("file_extn", FileUtil.getFileExtension(file.getName()));
            interpolateParam.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
            interpolateParam.put("reg_ip", authenticationFacade.getLoginUserIp());

            int cnt = aiModelService.getCountInterpolateFileInfo(interpolateParam);

            if (cnt > 0) {
                aiModelService.updateInterpolateFileInfo(interpolateParam);
            } else {
                aiModelService.insertInterpolateFileInfo(interpolateParam);
            }

            String line;
            int rowCount = 0;

            List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
            List<String> headerList = new ArrayList<String>();
            List<String> fileList = new ArrayList<String>();

            FileInputStream fileInputStream = new FileInputStream(setfilePath);
            InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
            BufferedReader br = new BufferedReader(inputStreamReader);

            while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                List<String> stringList = new ArrayList<String>();
                String stringArray[] = line.split(",", -1);
                stringList = Arrays.asList(stringArray);

                // csv 1열 데이터를 header로 인식
                if (headerList.size() == 0) {
                    for (int i = 0; i < stringArray.length; i++) {
                        headerList.add(stringArray[i].replace("\"", ""));
                    }

                } else {
                    Map<String, Object> map = new HashMap<String, Object>();
                    // header 컬럼 개수를 기준으로 데이터 set
                    for (int i = 0; i < headerList.size(); i++) {
                        if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                            stringList.set(i, "NaN");
                        }
                        map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                    }
                    mapList.add(map);
                }

                rowCount++;
            }
            br.close();

            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", mapList);
            result.put("header_data", headerList);
            result.put("interpolate_file_path", setfilePath);

        } else {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            insertErrorLog(modelSeq, 0, "PYTHON", "datasetInterpolate", resultObj.get("code").toString(), resultObj.get("message").toString(), resultObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }

        return result;
    }


    public Map<String, Object> setFileNamePath(String filePath) {
        Map<String, Object> result = new HashMap<String, Object>();
        File file = new File(filePath);
        result.put("file_path", file.getParent().replace("\\", "/").substring(systemproperties.getDtFilePath().length()) + "/");
        result.put("file_nm", file.getName());

        return result;
    }


    public void resetProcTargetFileList(Map<String, Object> resetParams) {
        List<Map<String, Object>> reset_unit_fileList = aiModelService.resetProcTargetFileList(resetParams);
        if (reset_unit_fileList.size() > 0) {
            for (int rf = 0; rf < reset_unit_fileList.size(); rf++) {
                String fileName = reset_unit_fileList.get(rf).get("file_nm").toString();
                String filePath = reset_unit_fileList.get(rf).get("file_path").toString();
                long currentTime = System.currentTimeMillis();


                Map<String, Object> tmp = new HashMap<String, Object>();
                tmp.put("file_seq", Integer.parseInt(reset_unit_fileList.get(rf).get("file_seq").toString()));
                tmp.put("model_seq", Integer.parseInt(resetParams.get("modelSeq").toString()));
                tmp.put("file_path", filePath);
                tmp.put("file_nm", renameFileBak(systemproperties.getDtFilePath() + filePath + fileName, currentTime));
                tmp.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
                tmp.put("reg_ip", authenticationFacade.getLoginUserIp());

                aiModelService.deleteResetFileList(tmp);

            }
        }

        aiModelService.deleteUnitParamList(Integer.parseInt(resetParams.get("modelSeq").toString()));
    }

    @PostMapping("/make/reset_proc_target_file")
    @ResponseBody
    public Map<String, Object> resetProcTargetFile(@RequestBody Map<String, Object> params) {

        Map<String, Object> result = new HashMap<String, Object>();

        String[] delType;

        if ("OUTLIER".equals(params.get("refTp").toString())) {
            delType = new String[]{"OUTLIER", "INTERPOLATE", "RESAMPLE", "UNIT"};
        } else if ("RESAMPLE".equals(params.get("refTp").toString())) {
            delType = new String[]{"RESAMPLE", "UNIT"};
        } else if ("UNIT".equals(params.get("refTp").toString())) {
            delType = new String[]{"UNIT"};
        } else if ("VALIDATE".equals(params.get("refTp").toString())) {
            delType = new String[]{"VALIDATE", "OUTLIER", "INTERPOLATE", "RESAMPLE", "UNIT"};
        } else {
            delType = new String[]{params.get("refTp").toString()};
        }

        for (int i = 0; i < delType.length; i++) {
            Map<String, Object> resetParams = new HashMap<String, Object>();
            resetParams.put("modelSeq", Integer.parseInt(params.get("modelSeq").toString()));
            resetParams.put("refTp", delType[i]);

            resetProcTargetFileList(resetParams);
        }

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);

        return result;
    }


    @PostMapping("/make/resample_set")
    @ResponseBody
    public Map<String, Object> makeResampleSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        String[] checkHeader = params.get("checkHeader").toString().replace("[", "").replace("]", "").split(", ");
        List<String> checkHeaderList = new ArrayList<String>();

        for (int ch = 0; ch < checkHeader.length; ch++) {
            checkHeaderList.add(checkHeader[ch]);
        }


        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> resetParams = new HashMap<String, Object>();
        int modelSeq = Integer.parseInt(params.get("model_seq").toString());
        resetParams.put("modelSeq", modelSeq);
        resetParams.put("refTp", "UNIT");

        //다음 단계 삭제
        resetProcTargetFileList(resetParams);

        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        if ("O".equals(params.get("timerule").toString())) {
            String sourceFilePath = systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path").toString() + file_info.get("file_nm").toString();
            String destinationFilePath = systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path").toString() + makeFileName(file_info.get("file_nm").toString().replace("_imputer", ""), "_resample");

            File sourceFile = new File(sourceFilePath);
            File destinationFile = new File(destinationFilePath);

            try {
                FileInputStream inputStream = new FileInputStream(sourceFile);
                FileOutputStream outputStream = new FileOutputStream(destinationFile);

                byte[] buffer = new byte[1024];
                int length;
                while ((length = inputStream.read(buffer)) > 0) {
                    outputStream.write(buffer, 0, length);
                }

                inputStream.close();
                outputStream.close();

                File file = new File(destinationFilePath);
                long fileSize = file.length();

                Map<String, Object> resampleParam = new HashMap<String, Object>();
                resampleParam.put("resample_tp", params.get("method").toString());


                if (params.get("timerule").toString().equals("") || params.get("timerule").toString().equals("")) {
                    resampleParam.put("resmpl_intvl_tp", params.get("timerule").toString());
                } else {
                    resampleParam.put("resmpl_intvl_tp", params.get("timerule").toString().trim());
                }


                resampleParam.put("model_seq", modelSeq);
                resampleParam.put("ref_tp", FILE_REF_TYPE.RESAMPLE.toUpperCase());
                resampleParam.put("file_nm", file.getName());
                resampleParam.put("file_path", file_info.get("file_path").toString());
                resampleParam.put("file_size", fileSize);
                resampleParam.put("file_extn", FileUtil.getFileExtension(file.getName()));
                resampleParam.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
                resampleParam.put("reg_ip", authenticationFacade.getLoginUserIp());
                resampleParam.put("resmpl_intvl_value", Integer.parseInt(params.get("resmpl_intvl_value").toString()));


                int cnt = aiModelService.getCountResampleFileInfo(resampleParam);

                if (cnt > 0) {
                    aiModelService.updateResampleFileInfo(resampleParam);
                } else {
                    aiModelService.insertResampleFileInfo(resampleParam);
                }

                String line;
                int rowCount = 0;

                List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
                List<String> headerList = new ArrayList<String>();

                FileInputStream fileInputStream = new FileInputStream(destinationFilePath);
                InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
                BufferedReader br = new BufferedReader(inputStreamReader);

                while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                    List<String> stringList = new ArrayList<String>();
                    String stringArray[] = line.split(",", -1);
                    stringList = Arrays.asList(stringArray);

                    // csv 1열 데이터를 header로 인식
                    if (headerList.size() == 0) {
                        for (int i = 0; i < stringArray.length; i++) {
                            headerList.add(stringArray[i].replace("\"", ""));
                        }

                    } else {
                        Map<String, Object> map = new HashMap<String, Object>();
                        // header 컬럼 개수를 기준으로 데이터 set
                        for (int i = 0; i < headerList.size(); i++) {
                            if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                                stringList.set(i, "NaN");
                            }
                            map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                        }
                        mapList.add(map);
                    }

                    rowCount++;
                }
                br.close();

                result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("data", mapList);
                result.put("header_data", headerList);
                result.put("check_header_data", checkHeaderList);

                result.put("resample_file_path", destinationFilePath);

            } catch (IOException e) {
                e.printStackTrace();
            }

        } else {
            String priprocResampleUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetResample/";

            Map<String, Object> setParam = new HashMap<String, Object>();
            setParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
            setParam.put("file_name", file_info.get("file_nm").toString());
            setParam.put("target_file_name", makeFileName(file_info.get("file_nm").toString().replace("_imputer", ""), "_resample"));

            setParam.put("resmpl_tp", params.get("method").toString());
            setParam.put("time_rule", params.get("resmpl_intvl_value").toString().trim() + params.get("timerule").toString().trim());
            setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

            String resampleString = djangoApiService.requestDjangoApi(priprocResampleUrl, setParam, modelSeq);

            JSONParser parser = new JSONParser();
            JSONObject resultObj = (JSONObject) parser.parse(resampleString);


            if (Integer.parseInt(resultObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                File file = new File(resultObj.get("data").toString());
                long fileSize = file.length();

                Map<String, Object> resampleParam = new HashMap<String, Object>();
                resampleParam.put("resample_tp", params.get("method").toString());
                resampleParam.put("resmpl_intvl_tp", params.get("timerule").toString());
                resampleParam.put("model_seq", modelSeq);
                resampleParam.put("ref_tp", FILE_REF_TYPE.RESAMPLE.toUpperCase());
                resampleParam.put("file_nm", file.getName());
                resampleParam.put("file_path", file_info.get("file_path").toString());
                resampleParam.put("file_size", fileSize);
                resampleParam.put("file_extn", FileUtil.getFileExtension(file.getName()));
                resampleParam.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
                resampleParam.put("reg_ip", authenticationFacade.getLoginUserIp());
                resampleParam.put("resmpl_intvl_value", Integer.parseInt(params.get("resmpl_intvl_value").toString()));


                int cnt = aiModelService.getCountResampleFileInfo(resampleParam);

                if (cnt > 0) {
                    aiModelService.updateResampleFileInfo(resampleParam);
                } else {
                    aiModelService.insertResampleFileInfo(resampleParam);
                }

                String line;
                int rowCount = 0;

                List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
                List<String> headerList = new ArrayList<String>();

                FileInputStream fileInputStream = new FileInputStream(resultObj.get("data").toString());
                InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
                BufferedReader br = new BufferedReader(inputStreamReader);

                while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                    List<String> stringList = new ArrayList<String>();
                    String stringArray[] = line.split(",", -1);
                    stringList = Arrays.asList(stringArray);

                    // csv 1열 데이터를 header로 인식
                    if (headerList.size() == 0) {
                        for (int i = 0; i < stringArray.length; i++) {
                            headerList.add(stringArray[i].replace("\"", ""));
                        }

                    } else {
                        Map<String, Object> map = new HashMap<String, Object>();
                        // header 컬럼 개수를 기준으로 데이터 set
                        for (int i = 0; i < headerList.size(); i++) {
                            if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                                stringList.set(i, "NaN");
                            }
                            map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                        }
                        mapList.add(map);
                    }
                    rowCount++;
                }
                br.close();

                result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
                result.put("data", mapList);
                result.put("header_data", headerList);
                result.put("resample_file_path", resultObj.get("data").toString());
            } else {
                result.put("result_code", GlobalConstant.API_STATUS.FAIL);
                insertErrorLog(modelSeq, 0, "PYTHON", "datasetResample", resultObj.get("code").toString(), resultObj.get("message").toString(), resultObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
            }
        }
        return result;
    }

    @PostMapping("/make/resample_set_view")
    @ResponseBody
    public Map<String, Object> makeResampleSetView(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        Map<String, Object> result = new HashMap<String, Object>();

        int modelSeq = Integer.parseInt(params.get("model_seq").toString());

        String line;
        int rowCount = 0;

        List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
        List<String> headerList = new ArrayList<String>();
        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        if (file_info.size() > 0) {
            String filePath = systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path") + file_info.get("file_nm");

            FileInputStream fileInputStream = new FileInputStream(filePath);

            InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
            BufferedReader br = new BufferedReader(inputStreamReader);

            while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                List<String> stringList = new ArrayList<String>();
                String stringArray[] = line.split(",", -1);
                stringList = Arrays.asList(stringArray);

                // csv 1열 데이터를 header로 인식
                if (headerList.size() == 0) {
                    for (int i = 0; i < stringArray.length; i++) {
                        headerList.add(stringArray[i].replace("\"", ""));
                    }
                } else {
                    Map<String, Object> map = new HashMap<String, Object>();
                    // header 컬럼 개수를 기준으로 데이터 set
                    for (int i = 0; i < headerList.size(); i++) {
                        if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                            stringList.set(i, "NaN");
                        }
                        map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                    }
                    mapList.add(map);
                }

                rowCount++;
            }
            br.close();

            List<Map<String, Object>> augment_column_list = aiModelService.getAugmentModelColumn(modelSeq);

            //상관그래프 이미지
            String correlationUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetCorrelation/";

            List<String> checkHeaderList = aiModelService.getTargetColumnInfo(modelSeq);
            Map<String, Object> correlationParam = new HashMap<String, Object>();
            correlationParam.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path"));
            correlationParam.put("file_name", file_info.get("file_nm"));
            correlationParam.put("index_trgt_col", params.get("index_trgt_col").toString());
            correlationParam.put("columns", checkHeaderList);


            String correlationString = djangoApiService.requestDjangoApi(correlationUrl, correlationParam, modelSeq);

            JSONParser correlationParser = new JSONParser();
            JSONObject correlationObj = (JSONObject) correlationParser.parse(correlationString);

            if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                result.put("correlation_data", correlationObj.get("data"));
            } else {
                log.error("FAIL");
            }

            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", mapList);
            result.put("augment_column_list", augment_column_list);
            result.put("header_data", headerList);
        } else {
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("augment_column_list", "");
            result.put("data", "");
            result.put("header_data", "");
        }

        return result;
    }

    @PostMapping("/make/unit_set")
    @ResponseBody
    public Map<String, Object> makeUnitSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {

        Map<String, Object> result = new HashMap<String, Object>();
        String[] checkHeader = params.get("checkHeader").toString().replace("[", "").replace("]", "").split(", ");
        List<String> checkHeaderList = new ArrayList<String>();

        for (int ch = 0; ch < checkHeader.length; ch++) {
            checkHeaderList.add(checkHeader[ch]);
        }

        int modelSeq = Integer.parseInt(params.get("model_seq").toString());

        String unitFormula = aiModelService.getUnitFormula(params);

        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());
        Map<String, Object> origin_file_info = setFileNamePath(params.get("origin_file_path").toString());

        String fileName = file_info.get("file_nm").toString();
        String priprocResampleUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetUnitConverter/";

        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", systemproperties.getDtFilePath() + file_info.get("file_path").toString());
        setParam.put("file_name", fileName);
        setParam.put("target_file_name", makeFileName(origin_file_info.get("file_nm").toString(), "_unit"));
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        setParam.put("unit_trgt_col", params.get("unit_target_col").toString());
        setParam.put("unit_formula", unitFormula);


        String unitString = djangoApiService.requestDjangoApi(priprocResampleUrl, setParam, modelSeq);

        JSONParser parser = new JSONParser();
        JSONObject resultObj = (JSONObject) parser.parse(unitString);

        if (Integer.parseInt(resultObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {

            File file = new File(resultObj.get("data").toString());
            long fileSize = file.length();

            Map<String, Object> unitParam = new HashMap<String, Object>();
            unitParam.put("model_seq", modelSeq);
            unitParam.put("ref_tp", FILE_REF_TYPE.UNIT.toUpperCase());
            unitParam.put("file_nm", file.getName());
            unitParam.put("file_path", file_info.get("file_path").toString());
            unitParam.put("file_size", fileSize);
            unitParam.put("file_extn", FileUtil.getFileExtension(file.getName()));
            unitParam.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
            unitParam.put("reg_ip", authenticationFacade.getLoginUserIp());

            unitParam.put("unit_seq", params.get("unit_seq").toString());
            unitParam.put("unit_target_col", params.get("unit_target_col").toString());


            int cnt = aiModelService.getCountResampleFileInfo(unitParam);

            if (cnt > 0) {
                aiModelService.updateUnitFileInfo(unitParam);
            } else {
                aiModelService.insertUnitFileInfo(unitParam);
            }

            int unit_cnt = aiModelService.getCountModelUnitParams(unitParam);
            if (unit_cnt > 0) {
                aiModelService.updateModelUnitParams(unitParam);
            } else {
                aiModelService.insertModelUnitParams(unitParam);
            }

            List<Map<String, Object>> unit_history = aiModelService.getUnitParamList(modelSeq);

            String line;
            int rowCount = 0;

            List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
            List<String> headerList = new ArrayList<String>();

            FileInputStream fileInputStream = new FileInputStream(resultObj.get("data").toString());
            InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
            BufferedReader br = new BufferedReader(inputStreamReader);

            while ((line = br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
                List<String> stringList = new ArrayList<String>();
                String stringArray[] = line.split(",", -1);
                stringList = Arrays.asList(stringArray);

                // csv 1열 데이터를 header로 인식
                if (headerList.size() == 0) {
                    for (int i = 0; i < stringArray.length; i++) {
                        headerList.add(stringArray[i].replace("\"", ""));
                    }

                } else {
                    Map<String, Object> map = new HashMap<String, Object>();
                    // header 컬럼 개수를 기준으로 데이터 set
                    for (int i = 0; i < headerList.size(); i++) {
                        if (stringList.get(i).isEmpty() || stringList.get(i).toString().trim().equals("\"\"") || stringList.get(i).toString().trim().equals("NaN")) {
                            stringList.set(i, "NaN");
                        }
                        map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
                    }
                    mapList.add(map);
                }

                rowCount++;
            }
            br.close();
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", mapList);
            result.put("header_data", headerList);
            result.put("unit_file_path", resultObj.get("data").toString());
            result.put("unit_history", unit_history);

        } else {
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            insertErrorLog(modelSeq, 0, "PYTHON", "datasetUnitConverter", resultObj.get("code").toString(), resultObj.get("message").toString(), resultObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }


        return result;
    }


    @PostMapping("/make/algorithm_set")
    @ResponseBody
    public Map<String, Object> makeAlgorithmSet(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
        //log.info("=========algorithm_set===========");
        String[] checkHeader = params.get("checkHeader").toString().replace("[", "").replace("]", "").split(", ");

        aiModelService.updateTargetCollist(params);

        List<String> checkHeaderList = new ArrayList<String>();

        for (int ch = 0; ch < checkHeader.length; ch++) {
            checkHeaderList.add(checkHeader[ch]);
        }


        Map<String, Object> result = new HashMap<String, Object>();
        int modelSeq = Integer.parseInt(params.get("model_seq").toString());


        AugmentModel augmentModel = new AugmentModel();
        augmentModel = aiModelService.getAugmentModel(modelSeq);

        if ("".equals(augmentModel.getResmplintvltp()) || augmentModel.getResmplintvltp() == null) {
            augmentModel.setDefaultResmplIntvlTp(params.get("defaultResmplIntvlTp").toString());
            augmentModel.setDefaultResmplIntvlValue(Integer.parseInt(params.get("defaultResmplIntvlValue").toString()));
            aiModelService.updateNullResmpltOptionDateTerm(augmentModel);
        }

        Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());

        //상관그래프 이미지
        String correlationUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetCorrelation/";

        Map<String, Object> correlationParam = new HashMap<String, Object>();
        correlationParam.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path").toString());
        correlationParam.put("file_name", file_info.get("file_nm").toString());
        correlationParam.put("index_trgt_col", params.get("index_trgt_col").toString());
        correlationParam.put("columns", checkHeader);

        String correlationString = djangoApiService.requestDjangoApi(correlationUrl, correlationParam, modelSeq);

        JSONParser correlationParser = new JSONParser();
        JSONObject correlationObj = (JSONObject) correlationParser.parse(correlationString);

        if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("correlation_data", correlationObj.get("data"));
            result.put("check_header_data", checkHeaderList);
        } else {
            log.error("FAIL -> {}", correlationObj);
            insertErrorLog(modelSeq, 0, "PYTHON", "datasetCorrelation", correlationObj.get("code").toString(), correlationObj.get("message").toString(), correlationObj.get("detail").toString(), authenticationFacade.getLoginUserSeq(), authenticationFacade.getLoginUserIp());
        }
        return result;
    }

    public String makeFileName(String fileName, String addTail) {
        String result = "";

        int lastDotIndex = fileName.lastIndexOf(".");
        String name = fileName.substring(0, lastDotIndex);
        String extension = fileName.substring(lastDotIndex + 1);

        result = name + addTail + "." + extension;

        return result;
    }

    public String makeCsv(String jsonString, String filePath) throws JsonParseException, JsonMappingException, IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        List<Map<String, Object>> measurements = objectMapper.readValue(jsonString, new TypeReference<List<Map<String, Object>>>() {
        });

        File file = new File(filePath);
        PrintWriter writer = new PrintWriter(file);

        if (measurements != null && !measurements.isEmpty()) {
            Map<String, Object> firstMeasurement = measurements.get(0);
            StringJoiner headerJoiner = new StringJoiner(",");
            for (String key : firstMeasurement.keySet()) {
                headerJoiner.add(key);
            }
            writer.println(headerJoiner.toString());
        }

        for (Map<String, Object> measurement : measurements) {
            StringJoiner rowJoiner = new StringJoiner(",");
            for (Object value : measurement.values()) {
                rowJoiner.add(value.toString());
            }
            writer.println(rowJoiner.toString());
        }
        writer.close();

        return filePath;
    }

    @PostMapping("/make/select_unit_tp")
    @ResponseBody
    public Map<String, Object> selectUnitTp(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();

        List<Map<String, Object>> unit_tp_list = aiModelService.getUnitTpList(params.get("unit_tp").toString());


        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("unit_tp_list", unit_tp_list);
        return result;
    }


    @PostMapping("/make/select_valid_detail_tp")
    @ResponseBody
    public Map<String, Object> selectValidDetailTp(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
        paramsMap.put("dtlCd", params.get("valid_tp").toString());

        List<Map<String, Object>> valid_detail_tp = verifyService.getVerifyDetailList(paramsMap);


        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("valid_detail_tp", valid_detail_tp);
        return result;
    }


    @PostMapping("/make/model_set")
    @ResponseBody
    public Map<String, Object> makeMdoel(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();
        log.info("makeMdoel -> " + params.toString());
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model_seq", params.get("model_seq"));
        requestBody.put("algorithm_seq", params.get("algorithm_seq"));
        requestBody.put("algorithm", params.get("algorithm"));
        requestBody.put("reg_user_seq", authenticationFacade.getLoginUserSeq());
        requestBody.put("reg_ip", authenticationFacade.getLoginUserIp());
        requestBody.put("prcs_level", params.get("prcs_level"));

        List<Map<String, Object>> item_list = (List<Map<String, Object>>) params.get("algorithm_meta_item_list");

        AugmentModelParams augmentModelParams = new AugmentModelParams();
        augmentModelParams.setModelSeq(Integer.parseInt(params.get("model_seq").toString()));

        aiModelService.checkAlgorithmModelParams(augmentModelParams);

        for (int i = 0; i < item_list.size(); i++) {
            augmentModelParams.setModelSeq(Integer.parseInt(item_list.get(i).get("model_seq").toString()));
            augmentModelParams.setModelAlgrmSeq(Integer.parseInt(item_list.get(i).get("model_algrm_seq").toString()));
            augmentModelParams.setModelParamsItemSeq(Integer.parseInt(item_list.get(i).get("model_params_item_seq").toString()));
            augmentModelParams.setModelParamsItemValue(item_list.get(i).get("model_params_item_value").toString());
            aiModelService.saveAlgorithmModelParams(augmentModelParams);
        }


        AugmentModelColumn augmentModelColumn = new AugmentModelColumn();

        String[] output_col = params.get("output_col").toString().replace("[", "").replace("]", "").split(", ");

        augmentModelColumn.setModelSeq(Integer.parseInt(params.get("model_seq").toString()));
        for (int i = 0; i < output_col.length; i++) {
            augmentModelColumn.setModelColTp("OC");
            augmentModelColumn.setModelColNm(output_col[i]);

            aiModelService.saveAlgorithmModelColumn(augmentModelColumn);
        }

        if (params.get("feature_col") != null) {
            String[] feature_col = params.get("feature_col").toString().replace("[", "").replace("]", "").split(", ");

            for (int i = 0; i < feature_col.length; i++) {
                augmentModelColumn.setModelColTp("FC");
                augmentModelColumn.setModelColNm(feature_col[i]);

                aiModelService.saveAlgorithmModelColumn(augmentModelColumn);
            }
        }

        aiModelService.updateAlgorithmSeq(requestBody);

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("item_list", item_list);
        return result;
    }

    @PostMapping("/check/process/file")
    @ResponseBody
    public Map<String, Object> checkProcessFile(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();
        int modelSeq = Integer.parseInt(params.get("model_seq").toString());
        String process = params.get("process").toString();
        log.info("model_seq -> " + modelSeq);
        log.info("process -> " + process);
        Map<String, Object> makeModelSchedulerServiceParams = new HashedMap<String, Object>();
        makeModelSchedulerServiceParams.put("model_seq", modelSeq);
        makeModelSchedulerServiceParams.put("ref_tp", process);
        log.info("makeModelSchedulerServiceParams -> " + makeModelSchedulerServiceParams.toString());
        List<Map<String, Object>> files = makeModelSchedulerService.setMakeModelFiles(makeModelSchedulerServiceParams);
        String fPath = systemproperties.getDtFilePath() + "/" + files.get(0).get("file_path").toString().replaceFirst("/", "");
        String fName = files.get(0).get("file_nm").toString();
        log.info("fPath -> " + fPath + ", fName -> " + fName);

        boolean check = com.stoneitgt.dt.data.platform.util.JSONParser.checkCSV(fPath + fName);
        if (check) {
            /**
             * 파일 데이터 NOT NULL
             * */
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        } else {
            /**
             * 파일 데이터 NULL
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
        }
        return result;
    }

    @PostMapping("/make/algorithm_meta_set")
    @ResponseBody
    public Map<String, Object> algorithmMeatSet(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<String, Object>();

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("model_seq", Integer.parseInt(params.get("model_seq").toString()));
        map.put("model_algrm_seq", Integer.parseInt(params.get("model_algrm_seq").toString()));

        List<Map<String, Object>> algorithm_meta_item_list = aiModelService.getModelAlgorithmParamsList(map);

        List<Map<String, Object>> loss_list = aiModelService.getAlgolithmCodeList("LSTM_LOSS");
        List<Map<String, Object>> meterics_list = aiModelService.getAlgolithmCodeList("LSTM_METERICS");
        List<Map<String, Object>> optimizer_list = aiModelService.getAlgolithmCodeList("LSTM_OPTIMIZER");

        result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("meta_item_loss_list", loss_list);
        result.put("meta_item_meterics_list", meterics_list);
        result.put("meta_item_optimizer_list", optimizer_list);

        result.put("algorithm_meta_item_list", algorithm_meta_item_list);
        return result;
    }

    //loss, fid 부분
    @PostMapping("/loss")
    @ResponseBody
    public Map<String, Object> getLoss(@RequestBody Map<String, Object> params) {
        int result = 1;
        Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());

        Map<String, Object> data = aiModelService.getModelLoss(modelSeq);

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

        Map<String, Object> data = aiModelService.getModelFID(modelSeq);

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

        List<Map<String, Object>> predFileList = getDtFileList(FILE_REF_TYPE.PREDICTION, modelSeq);
        List<Map<String, Object>> testFileList = getDtFileList(FILE_REF_TYPE.TEST, modelSeq);

        String prctFilePath = systemproperties.getDtFilePath() + predFileList.get(0).get("file_path").toString() + predFileList.get(0).get("file_nm").toString();
        String testFilePath = systemproperties.getDtFilePath() + testFileList.get(0).get("file_path").toString() + testFileList.get(0).get("file_nm").toString();

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

    public void deleteCookie(HttpServletRequest request, HttpServletResponse response, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(cookieName)) {
                    cookie.setValue("");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                    break;
                }
            }
        }
    }
}
