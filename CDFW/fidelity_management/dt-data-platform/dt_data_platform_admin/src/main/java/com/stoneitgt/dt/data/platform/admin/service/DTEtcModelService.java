package com.stoneitgt.dt.data.platform.admin.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.DTEtcModelMapper;
import com.stoneitgt.dt.data.platform.domain.DTModelEtc;
import com.stoneitgt.dt.data.platform.domain.DTModelEtcColumn;
import com.stoneitgt.dt.data.platform.domain.DTModelEtcMetaUserItem;
import com.stoneitgt.dt.data.platform.domain.DTModelEtcParams;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonPropertyMain;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonPropertySub;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTEtcModelService {

    @Autowired
    private DTEtcModelMapper dtEtcModelMapper;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Autowired
    private FilesService filesService;

    public List<Map<String, Object>> getDTEtcModelList(Map<String, Object> params, Paging paging) {
        return dtEtcModelMapper.getDTEtcModelList(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTEtcModelListSetUserSeq(Map<String, Object> params, Paging paging) {
        return dtEtcModelMapper.getDTEtcModelListSetUserSeq(params, paging.getPaging());
    }

    public List<Map<String, Object>> getAlgolithmList() {
        return dtEtcModelMapper.getAlgolithmList();
    }

    public List<Map<String, Object>> getUnitCodeList() {
        return dtEtcModelMapper.getUnitCodeList();
    }

    public List<Map<String, Object>> getUnitTpList(String unit) {
        return dtEtcModelMapper.getUnitTpList(unit);
    }

    public String getUnitFormula(Map<String, Object> params) {
        return dtEtcModelMapper.getUnitFormula(params);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public Map<String, Object> insertPreprocProcess(String jsonString, DTModelJsonPropertyMain info) {
        DTModelEtc dtEtcModel = new DTModelEtc();
        DTModelEtcMetaUserItem dtModelEtcMetaUserItem = new DTModelEtcMetaUserItem();
        dtEtcModel.setEtcModelNm(info.getModel_nm());
        dtEtcModel.setEtcModelDerpn(info.getModel_derpn());
        dtEtcModel.setRlsYn(info.getRls_yn());
        dtEtcModel.setLoginUserSeq(info.getLoginUserSeq());
        dtEtcModel.setIndexTrgtCol(info.getIndex_trgt_col());
        dtEtcModel.setDataUseTp(info.getData_use_tp());
        dtEtcModel.setModelStatus("PREPARE");
        dtEtcModel.setEtcModelTp(null);
        dtEtcModelMapper.insertDTModelEtc(dtEtcModel);
        dtModelEtcMetaUserItem.setEtcModelSeq(dtEtcModel.getEtcModelSeq());
        dtModelEtcMetaUserItem.setUserPprcsFullStngValue(jsonString);

        if (info.getTwin_id() != null) {
            dtModelEtcMetaUserItem.setTwinId(info.getTwin_id());
            dtModelEtcMetaUserItem.setTwinObjId(info.getTwin_obj_id());
        } else {
            dtModelEtcMetaUserItem.setTwinId("None");
            dtModelEtcMetaUserItem.setTwinObjId("None");
        }

        dtEtcModelMapper.insertDTModelEtcMetaUserItem(dtModelEtcMetaUserItem);

        String sourceDirectory = systemproperties.getDtEtcMetaFilePath() + "/tmp/" + info.getBase_dir();
        String fileName = info.getLast_step_preproc_file_nm();

        try {
            filesService.saveEtcModelLastFiles(sourceDirectory, info.getBase_dir(), fileName, dtEtcModel.getEtcModelSeq(), info.getLoginUserSeq(), info.getLoginUserIp());
        } catch (IOException e) {
            e.printStackTrace();
        }

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("model_seq", dtEtcModel.getEtcModelSeq());
        return result;
    }

    public DTModelEtc getAugmentModel(int modelSeq) {
        return dtEtcModelMapper.getAugmentModel(modelSeq);
    }

    public DTModelEtc selectMetaModel(int modelSeq) {
        return dtEtcModelMapper.selectMetaModel(modelSeq);
    }

    public DTModelEtcMetaUserItem selectMetaUserItem(int modelSeq) {
        return dtEtcModelMapper.selectMetaUserItem(modelSeq);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public void checkAlgorithmModelParams(DTModelEtcParams dtModelEtcParams) {
        int cnt = dtEtcModelMapper.getAlgorithmModelParamsCount(dtModelEtcParams);
        if (cnt > 0) {
            dtEtcModelMapper.deleteAlgorithmModelParams(dtModelEtcParams);
            //dtEtcModelMapper.deleteAlgorithmModelColumn(dtModelEtcParams);

        }
    }

    public void saveAlgorithmModelParams(DTModelEtcParams dtModelEtcParams) {
        dtEtcModelMapper.saveAlgorithmModelParams(dtModelEtcParams);
        //aiModelMapper.saveAlgorithmModelColumn(augmentModelParams);
    }

    public void saveAlgorithmModelColumn(DTModelEtcColumn dTModelEtcColumn) {
        dtEtcModelMapper.saveAlgorithmModelColumn(dTModelEtcColumn);
    }

    public List<Map<String, Object>> getModelLossList(int modelSeq) {
        return dtEtcModelMapper.getModelLoss(modelSeq);
    }

    public Files getDtPreprocLastFile(int modelSeq) {
        return dtEtcModelMapper.getDtPreprocLastFile(modelSeq);
    }

    public int updateAlgorithmSeq(Map<String, Object> requestBody) {
        return dtEtcModelMapper.updateAlgorithmSeq(requestBody);
    }

    public List<Map<String, Object>> getModelAlgorithmParamsList(Map<String, Object> map) {
        return dtEtcModelMapper.getModelAlgorithmParamsList(map);
    }

    public List<Map<String, Object>> getAlgolithmCodeList(String code) {
        return dtEtcModelMapper.getAlgolithmCodeList(code);
    }

    public int updateMetaUerItemFulltext(Map<String, Object> param) {
        return dtEtcModelMapper.updateMetaUerItemFulltext(param);
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
        List<Map<String, Object>> list = dtEtcModelMapper.getModelLoss(modelSeq);

        for (Map<String, Object> info : list) {
            Map<String, Object> temp1 = new HashMap<String, Object>();
            Map<String, Object> temp2 = new HashMap<String, Object>();

            temp1.put("name", info.get("epochs_cnt").toString());
            temp1.put("value", String.format("%f", info.get("loss")));
            resultList1.add(temp1);

            temp2.put("name", info.get("epochs_cnt").toString());
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
        List<Map<String, Object>> list = dtEtcModelMapper.getModelFID(modelSeq);

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

    public List<Map<String, Object>> getEtcAEModelList(Map<String, Object> etcParams) {
        return dtEtcModelMapper.getEtcAEModelList(etcParams);
    }

    public List<Map<String, Object>> getEtcRFModelList(Map<String, Object> etcParams) {
        return dtEtcModelMapper.getEtcRFModelList(etcParams);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public void deleteModel(Map<String, Object> parameters) {
        /**
         * 삭제 로직 진행
         * tb_meta_etc_model_files 가져와서 관련 파일 삭제
         * tb_meta_etc_model_files row 삭제
         * tb_meta_etc_model_column row 삭제
         * tb_meta_etc_model_loss row 삭제
         * tb_meta_etc_model_params row 삭제
         * tb_meta_etc_user_item row 삭제
         * 이지만 현재는 DEL_YN만 업데이트 하면됩니다.
         * */
        dtEtcModelMapper.deleteModel(parameters);
        dtEtcModelMapper.deleteModelFiles(parameters);
        dtEtcModelMapper.deleteModelColumn(parameters);
        dtEtcModelMapper.deleteModelLoss(parameters);
        dtEtcModelMapper.deleteModelParams(parameters);
    }

    public Map<String, Object> getModelAlgorithmBySeq(int modelAlgrmSeq) {
        return dtEtcModelMapper.getModelAlgorithmBySeq(modelAlgrmSeq);
    }

    public List<Map<String, Object>> getDTEtcModelListByModelTp(Map<String, Object> params, Paging paging) {
        return dtEtcModelMapper.getDTEtcModelListByModelTp(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTEtcModelListSetUserSeqByModelTp(Map<String, Object> params, Paging paging) {
        return dtEtcModelMapper.getDTEtcModelListSetUserSeqByModelTp(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTEtcModelSharedListByModelTp(Map<String, Object> paramsMap, Paging paging) {
        return dtEtcModelMapper.getDTEtcModelSharedListByModelTp(paramsMap, paging.getPaging());
    }

    public List<Map<String, Object>> getEtcBritsModelList(Map<String, Object> etcParams) {
        return dtEtcModelMapper.getEtcBritsModelList(etcParams);
    }
}
