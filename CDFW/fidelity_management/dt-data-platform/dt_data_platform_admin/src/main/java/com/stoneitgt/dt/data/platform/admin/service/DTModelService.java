package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.DTEtcModelMapper;
import com.stoneitgt.dt.data.platform.admin.mapper.DTModelMapper;
import com.stoneitgt.dt.data.platform.admin.mapper.LogMapper;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
public class DTModelService extends BaseService {

    @Autowired
    private DTModelMapper dtModelMapper;

    @Autowired
    private DTEtcModelMapper dtEtcModelMapper;

    @Autowired
    private LogMapper logMapper;

    public List<Map<String, Object>> getDTModelList(Map<String, Object> params, Paging paging) {
        return dtModelMapper.getDTModelList(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTModelListSetUserSeq(Map<String, Object> params, Paging paging) {
        return dtModelMapper.getDTModelListSetUserSeq(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTModelSharedList(Map<String, Object> subParamsMap, Paging subPaging) {
        return dtModelMapper.getDTModelSharedList(subParamsMap, subPaging.getPaging());
    }

    public List<Map<String, Object>> getAlgolithmList() {
        return dtModelMapper.getAlgolithmList();
    }

    public List<Map<String, Object>> getUnitCodeList() {
        return dtModelMapper.getUnitCodeList();
    }

    public List<Map<String, Object>> getUnitTpList(String unit) {
        return dtModelMapper.getUnitTpList(unit);
    }

    public String getUnitFormula(Map<String, Object> params) {
        return dtModelMapper.getUnitFormula(params);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public Map<String, Object> insertPreprocProcess(String jsonString, DTModelJsonPropertyMain info) throws IOException {
        List<DTModelJsonPropertySub> preproc_property = info.getPreproc_property();

        DTModel dtModel = new DTModel();
        DTModelMetaUserItem dtModelMetaUserItem = new DTModelMetaUserItem();
        DTModelMetaUserItemPreprocessMapVrfc preprocessMapVrfc = new DTModelMetaUserItemPreprocessMapVrfc();
        DTModelMetaUserItemPreprocessMapOutlr preprocessMapOutlr = new DTModelMetaUserItemPreprocessMapOutlr();
        DTModelMetaUserItemPreprocessMapInterpl preprocessMapInterpl = new DTModelMetaUserItemPreprocessMapInterpl();
        DTModelMetaUserItemPreprocessMapResmpl preprocessMapResmpl = new DTModelMetaUserItemPreprocessMapResmpl();
        DTModelMetaUserItemPreprocessMapUnit preprocessMapUnit = new DTModelMetaUserItemPreprocessMapUnit();

        dtModel.setModelNm(info.getModel_nm());
        dtModel.setModelDerpn(info.getModel_derpn());
        dtModel.setRlsYn(info.getRls_yn());
        dtModel.setJobLevel("P");
        dtModel.setLoginUserSeq(info.getLoginUserSeq());
        dtModel.setIndexTrgtCol(info.getIndex_trgt_col());
        dtModel.setDataUseTp(info.getData_use_tp());
        dtModel.setModelStatus("DONE");

        dtModelMapper.insertDTModel(dtModel);

        dtModelMetaUserItem.setModelSeq(dtModel.getModelSeq());

        if (info.getTwin_id() != null && info.getTwin_obj_id() != null) {
            dtModelMetaUserItem.setTwinId(info.getTwin_id());
            dtModelMetaUserItem.setTwinObjId(info.getTwin_obj_id());
        } else {
            dtModelMetaUserItem.setTwinId("None");
            dtModelMetaUserItem.setTwinObjId("None");
        }
        String addDirectory = FileUtil.getUploadDtFilePath(GlobalConstant.FILE_REF_TYPE.DATA, dtModel.getModelSeq());
        String moveDirectory = systemProperties.getDtMetaFilePath() + addDirectory;

        ArrayList<Integer> integers = new ArrayList<>();

        ObjectMapper objectMapper = new ObjectMapper();
        DTModelJsonProperty sss = objectMapper.readValue(jsonString, DTModelJsonProperty.class);
        for (DTModelJsonPropertySub step : sss.getPreproc_property_info().get(0).getPreproc_property()) {
            for (DTModelJsonPropertySubSet property : step.getPreproc_set()) {
                if (Objects.equals(step.getPreproc_type(), "missing") && Objects.equals(property.getInterpl_tp(), "decisiontree")) {
                    property.setDecision_model_file_path(moveDirectory);
                    property.setDecision_model_file_name(property.getInterpl_decision_model_file_name());
                }

                // 유효성 검증 모델 사용 이력 남기기 위한 로직
                if ((property.getEtc_model_seq() != null && Integer.parseInt(property.getEtc_model_seq()) != 0) || (property.getInterpl_etc_model_seq() != 0)) {
                    //integers.add(Integer.parseInt(property.getEtc_model_seq()) != 0 ? Integer.parseInt(property.getEtc_model_seq()) : property.getInterpl_etc_model_seq());
                    integers.add(property.getInterpl_etc_model_seq() != 0 ? property.getInterpl_etc_model_seq() : Integer.parseInt(property.getEtc_model_seq()));
                }
                //Data Twin Model 생성 중 필요한 Data 담았던 것을 초기화
                if (property.getValidate_data() == null || property.getValidate_data().isEmpty()) {
                    property.setValidate_data(new ArrayList<>());
                }
                if (property.getOutlier_data() == null || property.getOutlier_data().isEmpty()) {
                    property.setOutlier_data(new ArrayList<>());
                }
                if (property.getMissing_data() == null || property.getMissing_data().isEmpty()) {
                    property.setMissing_data(new ArrayList<>());
                }
                if (property.getResmpl_removed_data() == null || property.getResmpl_removed_data().isEmpty()) {
                    property.setResmpl_removed_data(new ArrayList<>());
                }
                if (property.getResmpl_added_data() == null || property.getResmpl_added_data().isEmpty()) {
                    property.setResmpl_added_data(new ArrayList<>());
                }
            }
        }
        dtModelMetaUserItem.setUserPprcsFullStngValue(new JSONObject(sss).toString());
        dtModelMapper.insertDTModelMetaUserItem(dtModelMetaUserItem);

        integers.forEach(integer -> {
            DTModelEtc dtEtcModel = dtEtcModelMapper.selectMetaModel(integer);
            ModelReferenceLog modelReferenceLog = new ModelReferenceLog();
            modelReferenceLog.setRefModelSeq(dtModel.getModelSeq());
            modelReferenceLog.setModelSeq(dtEtcModel.getEtcModelSeq());
            modelReferenceLog.setModelAlgrmSeq(dtEtcModel.getModelAlgrmSeq());
            modelReferenceLog.setRegUserSeq(info.getLoginUserSeq());
            modelReferenceLog.setRegIp(info.getLoginUserIp());
            logMapper.insertDtEtcModelReferenceLog(modelReferenceLog);
        });

        //전처리5단계중
        for (int i = 0; i < preproc_property.size(); i++) {
            //preproc_set 전처리를 한 배열을 찾아서
            if (preproc_property.get(i).getPreproc_set().size() > 0) {
                for (int j = 0; j < preproc_property.get(i).getPreproc_set().size(); j++) {
                    if (preproc_property.get(i).getPreproc_order() == 1) {
                        preprocessMapVrfc.setUserMetaItemSeq(dtModelMetaUserItem.getUserMetaItemSeq());
                        preprocessMapVrfc.setVrfcTp(preproc_property.get(i).getPreproc_set().get(j).getVrfc_tp());
                        preprocessMapVrfc.setVrfcClearTp(preproc_property.get(i).getPreproc_set().get(j).getVrfc_clear_tp());
                        preprocessMapVrfc.setRuleValue1(preproc_property.get(i).getPreproc_set().get(j).getRule1());
                        preprocessMapVrfc.setRuleValue2(preproc_property.get(i).getPreproc_set().get(j).getRule2());
                        preprocessMapVrfc.setRuleValue3(preproc_property.get(i).getPreproc_set().get(j).getRule3());
                        preprocessMapVrfc.setRuleValue4(preproc_property.get(i).getPreproc_set().get(j).getRule4());
                        preprocessMapVrfc.setOrdby(preproc_property.get(i).getPreproc_set().get(j).getSet_order());
                        dtModelMapper.insertPreprocessMapVrfc(preprocessMapVrfc);
                        preprocessMapVrfc = new DTModelMetaUserItemPreprocessMapVrfc();
                    }

                    if (preproc_property.get(i).getPreproc_order() == 2) {
                        preprocessMapOutlr.setUserMetaItemSeq(dtModelMetaUserItem.getUserMetaItemSeq());
                        preprocessMapOutlr.setOutlrPrcsTp(preproc_property.get(i).getPreproc_set().get(j).getOutlier_tp());
                        preprocessMapOutlr.setOutlrStandrdSmpl(Double.parseDouble(preproc_property.get(i).getPreproc_set().get(j).getP_value()));
                        preprocessMapOutlr.setOutlrSmplngLen(Integer.parseInt(preproc_property.get(i).getPreproc_set().get(j).getFreq()));

                        if ("dbscan".equals(preprocessMapOutlr.getOutlrPrcsTp())) {
                            preprocessMapOutlr.setOutlrEps(Double.parseDouble(preproc_property.get(i).getPreproc_set().get(j).getEps()));
                            preprocessMapOutlr.setOutlrMinSmpl(Integer.parseInt(preproc_property.get(i).getPreproc_set().get(j).getMin_samples()));
                        }

                        if ("kmean".equals(preprocessMapOutlr.getOutlrPrcsTp())) {
                            preprocessMapOutlr.setOutlrClustCnt(Integer.parseInt(preproc_property.get(i).getPreproc_set().get(j).getN_clusters()));
                            preprocessMapOutlr.setOutlrClustGrp(Integer.parseInt(preproc_property.get(i).getPreproc_set().get(j).getN_count()));
                        }

                        preprocessMapOutlr.setOrdby(preproc_property.get(i).getPreproc_set().get(j).getSet_order());
                        dtModelMapper.insertPreprocessMapOutlr(preprocessMapOutlr);
                        preprocessMapOutlr = new DTModelMetaUserItemPreprocessMapOutlr();
                    }

                    if (preproc_property.get(i).getPreproc_order() == 3) {
                        preprocessMapInterpl.setUserMetaItemSeq(dtModelMetaUserItem.getUserMetaItemSeq());
                        preprocessMapInterpl.setInterplTp(preproc_property.get(i).getPreproc_set().get(j).getInterpl_tp());
                        preprocessMapInterpl.setOrdby(preproc_property.get(i).getPreproc_set().get(j).getSet_order());
                        dtModelMapper.insertPreprocessMapInterpl(preprocessMapInterpl);
                        preprocessMapInterpl = new DTModelMetaUserItemPreprocessMapInterpl();
                    }

                    if (preproc_property.get(i).getPreproc_order() == 4) {
                        preprocessMapResmpl.setUserMetaItemSeq(dtModelMetaUserItem.getUserMetaItemSeq());
                        preprocessMapResmpl.setResmplTp(preproc_property.get(i).getPreproc_set().get(j).getResmpl_tp());
                        preprocessMapResmpl.setResmplIntvlTp(preproc_property.get(i).getPreproc_set().get(j).getInterpl_tp());
                        preprocessMapResmpl.setResmplIntvlValue(Integer.parseInt(preproc_property.get(i).getPreproc_set().get(j).getResmpl_intvl_value()));
                        preprocessMapResmpl.setOrdby(preproc_property.get(i).getPreproc_set().get(j).getSet_order());
                        dtModelMapper.insertPreprocessMapResmpl(preprocessMapResmpl);
                        preprocessMapResmpl = new DTModelMetaUserItemPreprocessMapResmpl();
                    }

                    if (preproc_property.get(i).getPreproc_order() == 5) {
                        preprocessMapUnit.setUserMetaItemSeq(dtModelMetaUserItem.getUserMetaItemSeq());
                        preprocessMapUnit.setUnitTp(preproc_property.get(i).getPreproc_set().get(j).getUnit_tp());
                        preprocessMapUnit.setUnitCd1(preproc_property.get(i).getPreproc_set().get(j).getUnit_cd_1());
                        preprocessMapUnit.setUnitCd2(preproc_property.get(i).getPreproc_set().get(j).getUnit_cd_2());
                        preprocessMapUnit.setOrdby(preproc_property.get(i).getPreproc_set().get(j).getSet_order());
                        dtModelMapper.insertPreprocessMapUnit(preprocessMapUnit);
                        preprocessMapUnit = new DTModelMetaUserItemPreprocessMapUnit();
                    }
                    //log.info("preproc_property:" + preproc_property.get(i).getPreproc_order());
                }
            }

        }


        //마지막 파일만 db 저장하고 나머지는 해당 경로에 이동만
        //log.info(info.getBase_dir());
        //log.info(info.getLast_step_preproc_file_nm());

        String sourceDirectory = systemProperties.getDtMetaFilePath() + "/tmp/" + info.getBase_dir();
        String fileName = info.getLast_step_preproc_file_nm();
        //savePreProcLastFiles()

        try {
            filesService.savePreProcLastFiles(sourceDirectory, info.getBase_dir(), fileName, dtModel.getModelSeq(), dtModel.getJobLevel(), info.getLoginUserSeq(), info.getLoginUserIp());
        } catch (IOException e) {
            e.printStackTrace();
        }
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("model_seq", dtModel.getModelSeq());
        return result;
    }

    public DTModel selectMetaModel(int modelSeq) {
        return dtModelMapper.selectMetaModel(modelSeq);
    }

    public DTModelMetaUserItem selectMetaUserItem(int modelSeq) {
        return dtModelMapper.selectMetaUserItem(modelSeq);
    }

    public Files getDtPreprocLastFile(int modelSeq) {
        Files files = dtModelMapper.getDtPreprocLastFile(modelSeq);
        if (files != null) {
            files.setFileSzSrt(FileUtil.formatFileSize(files.getFileSz()));
        }
        return files;
    }

    public DTModel getAugmentModel(int modelSeq) {
        return dtModelMapper.getAugmentModel(modelSeq);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public void checkAlgorithmModelParams(DTModelParams dtModelParams) {
        int cnt = dtModelMapper.getAlgorithmModelParamsCount(dtModelParams);
        if (cnt > 0) {
            dtModelMapper.deleteAlgorithmModelParams(dtModelParams);
            dtModelMapper.deleteAlgorithmModelColumn(dtModelParams);
        }
    }

    public void saveAlgorithmModelParams(DTModelParams dtModelParams) {
        dtModelMapper.saveAlgorithmModelParams(dtModelParams);
        //aiModelMapper.saveAlgorithmModelColumn(augmentModelParams);
    }

    public void saveAlgorithmModelColumn(DTModelColumn dtModelColumn) {
        dtModelMapper.saveAlgorithmModelColumn(dtModelColumn);
    }

    public int updateAlgorithmSeq(Map<String, Object> requestBody) {
        return dtModelMapper.updateAlgorithmSeq(requestBody);
    }

    public List<Map<String, Object>> getModelAlgorithmParamsList(Map<String, Object> map) {
        return dtModelMapper.getModelAlgorithmParamsList(map);
    }

    public List<Map<String, Object>> getAlgolithmCodeList(String code) {
        return dtModelMapper.getAlgolithmCodeList(code);
    }

    public int updateMetaUerItemFulltext(Map<String, Object> param) {
        return dtModelMapper.updateMetaUerItemFulltext(param);
    }

    public List<Map<String, Object>> getModelLossList(int modelSeq) {
        return dtModelMapper.getModelLoss(modelSeq);
    }

    public List<Map<String, Object>> getModelFIDList(int modelSeq) {
        return dtModelMapper.getModelFID(modelSeq);
    }

    public int getCountModelFileInfo(Map<String, Object> modelParam) {
        return dtModelMapper.getCountModelFileInfo(modelParam);
    }

    public int updateModelFileInfo(Map<String, Object> modelParam) {
        return dtModelMapper.updateModelFileInfo(modelParam);
    }

    public int insertModelFileInfo(Map<String, Object> modelParam) {
        return dtModelMapper.insertModelFileInfo(modelParam);
    }

    public int getCountTestFileInfo(Map<String, Object> testParam) {
        return dtModelMapper.getCountTestFileInfo(testParam);
    }

    public int updateTestFileInfo(Map<String, Object> testParam) {
        return dtModelMapper.updateTestFileInfo(testParam);
    }

    public int insertTestFileInfo(Map<String, Object> testParam) {
        return dtModelMapper.insertTestFileInfo(testParam);
    }

    public int getCountPredFileInfo(Map<String, Object> predParam) {
        return dtModelMapper.getCountPredFileInfo(predParam);
    }

    public int updatePredFileInfo(Map<String, Object> predParam) {
        return dtModelMapper.updatePredFileInfo(predParam);
    }

    public int insertPredFileInfo(Map<String, Object> predParam) {
        return dtModelMapper.insertPredFileInfo(predParam);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public HashMap<String, Object> getModelLoss(int modelSeq) {
        HashMap<String, Object> result = new HashMap<String, Object>();
        List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
        String title1 = "Training and Valdation loss";
        String title2 = "손실율";

        //데이터 생성
        HashMap<String, Object> data1 = new HashMap<String, Object>();
        data1.put("chart", "line");
        data1.put("name", "Training loss");
        data1.put("unit", "");

        HashMap<String, Object> data2 = new HashMap<String, Object>();
        data2.put("chart", "line");
        data2.put("name", "Validation loss");
        data2.put("unit", "");

        List<Map<String, Object>> resultList1 = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> resultList2 = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> list = dtModelMapper.getModelLoss(modelSeq);

        for (Map<String, Object> info : list) {
            Map<String, Object> temp1 = new HashMap<String, Object>();
            Map<String, Object> temp2 = new HashMap<String, Object>();

            temp1.put("name", info.get("epochs").toString());
            temp1.put("value", String.format("%f", info.get("loss")));
            resultList1.add(temp1);

            temp2.put("name", info.get("epochs").toString());
            temp2.put("value", String.format("%f", info.get("vrfc_loss")));
            resultList2.add(temp2);
        }

        data1.put("data", resultList1);
        data2.put("data", resultList2);

        dataList.add(data1);
        dataList.add(data2);

        result.put("title", title1);
        result.put("subtitle", title2);
        result.put("series", dataList);

        return result;
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public HashMap<String, Object> getModelFID(int modelSeq) {
        HashMap<String, Object> result = new HashMap<String, Object>();
        List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
        String title1 = "FID Score";
        String title2 = "FID 평가";

        //데이터 생성
        HashMap<String, Object> data1 = new HashMap<String, Object>();
        data1.put("chart", "line");
        data1.put("name", "FID Score");
        data1.put("unit", "");

        List<Map<String, Object>> resultList1 = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> list = dtModelMapper.getModelFID(modelSeq);

        for (Map<String, Object> info : list) {
            Map<String, Object> temp1 = new HashMap<String, Object>();

            temp1.put("name", info.get("epochs").toString());
            temp1.put("value", String.format("%f", info.get("fid_score")));
            resultList1.add(temp1);
        }

        data1.put("data", resultList1);

        dataList.add(data1);

        result.put("title", title1);
        result.put("subtitle", title2);
        result.put("series", dataList);

        return result;
    }

    public Map<String, Object> getEtcModelInfo(Map<String, Object> params) {
        return dtModelMapper.getEtcModelInfo(params);
    }

    public Map<String, Object> getEtcModelInfo(int etc_model_seq) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("etc_model_seq", etc_model_seq);
        return dtModelMapper.getEtcModelInfo(params);
    }

    public Map<String, Object> getMetaDataJsonDepth(Map<String, Object> param) {
        return dtModelMapper.getMetaDataJsonDepth(param);
    }

    public boolean checkUseAEModel(int ae_model_seq) {
        return dtModelMapper.checkUseAEModel(ae_model_seq);
    }

    public void deleteModel(Map<String, Object> parameters) {
        dtModelMapper.deleteModel(parameters);
    }

    public boolean checkUseRFModel(int rf_model_seq) {
        return dtModelMapper.checkUseRFModel(rf_model_seq);
    }

    public void deleteModelLoss(int modelSeq) {
        dtModelMapper.deleteModelLoss(modelSeq);
    }

    public void deleteModelFid(int modelSeq) {
        dtModelMapper.deleteModelFid(modelSeq);
    }

    public boolean checkUseBritsModel(int brits_model_seq) {
        return dtModelMapper.checkUseBritsModel(brits_model_seq);
    }

    public boolean checkUseNaomiModel(int naomi_model_seq) {
        return dtModelMapper.checkUseNaomiModel(naomi_model_seq);
    }

    public List<Map<String, Object>> getDTAllSharedList(Map<String, Object> params, Paging paging) {
        return dtModelMapper.getDTAllSharedList(params, paging.getPaging());
    }

    public int getCountXAIFileInfo(Map<String, Object> xaiParams) {
        return dtModelMapper.getCountXAIFileInfo(xaiParams);
    }

    public int insertXAIFileInfo(Map<String, Object> xaiParams) {
        return dtModelMapper.insertXAIFileInfo(xaiParams);
    }

    public int updateXAIFileInfo(Map<String, Object> xaiParams) {
        return dtModelMapper.updateXAIFileInfo(xaiParams);
    }

    public void deleteModelXAI(int modelSeq, String ref_tp) {
        dtModelMapper.deleteModelXAI(modelSeq, ref_tp);
    }

    public Map<String, Object> getModelXAI(int modelSeq) {
        Map<String, Object> modelXAI = dtModelMapper.getModelXAI(modelSeq);
        return modelXAI;
    }

    public int countMetaModel() {
        return dtModelMapper.countMetaModel();
    }

    public int countMetaModel(int modelAlgrmSeq) {
        return dtModelMapper.countMetaModelByAlgrmSeq(modelAlgrmSeq);
    }

    public DTModelJsonProperty findPreprocessJSONByModelSeq(int modelSeq) throws IOException {
        return new ObjectMapper().readValue(dtModelMapper.findPreprocessJSONByModelSeq(modelSeq), DTModelJsonProperty.class);
    }
}
