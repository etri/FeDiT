package com.stoneitgt.dt.data.platform.admin.service;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.*;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.DTModelMapper;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTModelService {

    @Autowired
    private DTModelMapper dtModelMapper;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Autowired
    private FilesService filesService;

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

        if (info.getTwin_id() != null) {
            dtModelMetaUserItem.setTwinId(info.getTwin_id());
            dtModelMetaUserItem.setTwinObjId(info.getTwin_obj_id());
        } else {
            dtModelMetaUserItem.setTwinId("None");
            dtModelMetaUserItem.setTwinObjId("None");
        }
        String addDirectory = FileUtil.getUploadDtFilePath(GlobalConstant.FILE_REF_TYPE.DATA, dtModel.getModelSeq());
        String moveDirectory = systemproperties.getDtMetaFilePath() + addDirectory;
        ObjectMapper objectMapper = new ObjectMapper();
        DTModelJsonProperty sss = objectMapper.readValue(jsonString, DTModelJsonProperty.class);
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
        dtModelMetaUserItem.setUserPprcsFullStngValue(new JSONObject(sss).toString());
        dtModelMapper.insertDTModelMetaUserItem(dtModelMetaUserItem);


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

        String sourceDirectory = systemproperties.getDtMetaFilePath() + "/tmp/" + info.getBase_dir();
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

    public List<DTModelMetaUserItemPreprocessMapVrfc> selectMetaPreprocessVrfc(int userMetaItemSeq) {
        return dtModelMapper.selectMetaPreprocessVrfc(userMetaItemSeq);
    }

    public List<DTModelMetaUserItemPreprocessMapOutlr> selectMetaPreprocessOutlr(int userMetaItemSeq) {
        return dtModelMapper.selectMetaPreprocessOutlr(userMetaItemSeq);
    }

    public List<DTModelMetaUserItemPreprocessMapInterpl> selectMetaPreprocessInterpl(int userMetaItemSeq) {
        return dtModelMapper.selectMetaPreprocessInterpl(userMetaItemSeq);
    }

    public List<DTModelMetaUserItemPreprocessMapResmpl> selectMetaPreprocessResmpl(int userMetaItemSeq) {
        return dtModelMapper.selectMetaPreprocessResmpl(userMetaItemSeq);
    }

    public List<DTModelMetaUserItemPreprocessMapUnit> selectMetaPreprocessUnit(int userMetaItemSeq) {
        return dtModelMapper.selectMetaPreprocessUnit(userMetaItemSeq);
    }

    public Files getDtPreprocLastFile(int modelSeq) {
        return dtModelMapper.getDtPreprocLastFile(modelSeq);
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

    public List<Map<String, Object>> getDTModelSharedListByJobLevel(Map<String, Object> params, Paging paging) {
        return dtModelMapper.getDTModelSharedListByJobLevel(params, paging.getPaging());
    }

    public void deleteModelLoss(int modelSeq) {
        dtModelMapper.deleteModelLoss(modelSeq);
    }

    public void deleteModelFid(int modelSeq) {
        dtModelMapper.deleteModelFid(modelSeq);
    }
}
