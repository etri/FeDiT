package com.stoneitgt.dt.data.platform.admin.service;

import com.stoneitgt.dt.data.platform.admin.mapper.LogMapper;
import com.stoneitgt.dt.data.platform.domain.DataFileDownloadLog;
import com.stoneitgt.dt.data.platform.domain.ModelReferenceLog;
import com.stoneitgt.dt.data.platform.domain.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Slf4j
@Service
public class LogService {
    @Autowired
    private LogMapper logMapper;

    @Autowired
    private UserService userService;

    public int insertDtDataFileLog(DataFileDownloadLog dataFileDownloadLog) {
        logMapper.insertDtDataFileLog(dataFileDownloadLog);
        return dataFileDownloadLog.getLogSeq();
    }

    public int insertDtEtcDataFileLog(DataFileDownloadLog dataFileDownloadLog) {
        logMapper.insertDtEtcDataFileLog(dataFileDownloadLog);
        return dataFileDownloadLog.getLogSeq();
    }

    public int insertDtEtcModelReferenceLog(ModelReferenceLog modelReferenceLog) {
        logMapper.insertDtEtcModelReferenceLog(modelReferenceLog);
        return modelReferenceLog.getLogSeq();
    }

    public int insertDtModelReferenceLog(ModelReferenceLog modelReferenceLog) {
        boolean isDuplicate = logMapper.checkDtModelReferenceLog(modelReferenceLog);
        if (!isDuplicate) {
            logMapper.insertDtModelReferenceLog(modelReferenceLog);
        }
        return modelReferenceLog.getLogSeq();
    }

    public ArrayList<DataFileDownloadLog> findDtEtcDataFileLogsByEtcModelSeq(int etcModelSeq) {
        ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logMapper.findDtEtcDataFileLogsByEtcModelSeq(etcModelSeq);
        for (DataFileDownloadLog dataFileDownloadLog : dataFileDownloadLogs) {
            User user = userService.getUserInfo(dataFileDownloadLog.getRegUserSeq());
            dataFileDownloadLog.setUserNm(user.getUserNm());
        }
        return dataFileDownloadLogs;
    }

    public ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogsByEtcModelSeq(int etcModelSeq) {
        ArrayList<ModelReferenceLog> modelReferenceLogs = logMapper.findDtEtcModelReferenceLogsByEtcModelSeq(etcModelSeq);
        for (ModelReferenceLog modelReferenceLog : modelReferenceLogs) {
            User user = userService.getUserInfo(modelReferenceLog.getRegUserSeq());
            modelReferenceLog.setUserNm(user.getUserNm());
        }
        return modelReferenceLogs;
    }

    public ArrayList<DataFileDownloadLog> findDtDataFileLogsByModelSeq(int modelSeq) {
        ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logMapper.findDtDataFileLogsByModelSeq(modelSeq);
        for (DataFileDownloadLog dataFileDownloadLog : dataFileDownloadLogs) {
            User user = userService.getUserInfo(dataFileDownloadLog.getRegUserSeq());
            dataFileDownloadLog.setUserNm(user.getUserNm());
        }
        return dataFileDownloadLogs;
    }

    public ArrayList<ModelReferenceLog> findDtModelReferenceLogsByModelSeq(int modelSeq) {
        ArrayList<ModelReferenceLog> modelReferenceLogs = logMapper.findDtModelReferenceLogsByModelSeq(modelSeq);
        for (ModelReferenceLog modelReferenceLog : modelReferenceLogs) {
            User user = userService.getUserInfo(modelReferenceLog.getRegUserSeq());
            modelReferenceLog.setUserNm(user.getUserNm());
        }
        return modelReferenceLogs;
    }

    public ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogsRangeByEtcModelSeq(int etcModelSeq, String dateStr) {
        ArrayList<ModelReferenceLog> modelReferenceLogs = logMapper.findDtEtcModelReferenceLogsRangeByEtcModelSeq(etcModelSeq, dateStr);
        for (ModelReferenceLog modelReferenceLog : modelReferenceLogs) {
            User user = userService.getUserInfo(modelReferenceLog.getRegUserSeq());
            modelReferenceLog.setUserNm(user.getUserNm());
        }
        return modelReferenceLogs;
    }

    public ArrayList<DataFileDownloadLog> findDtEtcDataFileLogsRangeByEtcModelSeq(int etcModelSeq, String dateStr) {
        ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logMapper.findDtEtcDataFileLogsRangeByEtcModelSeq(etcModelSeq, dateStr);
        for (DataFileDownloadLog dataFileDownloadLog : dataFileDownloadLogs) {
            User user = userService.getUserInfo(dataFileDownloadLog.getRegUserSeq());
            dataFileDownloadLog.setUserNm(user.getUserNm());
        }
        return dataFileDownloadLogs;
    }

    public ArrayList<ModelReferenceLog> findDtModelReferenceLogsRangeByModelSeq(int modelSeq, String dateStr) {
        ArrayList<ModelReferenceLog> modelReferenceLogs = logMapper.findDtModelReferenceLogsRangeByModelSeq(modelSeq, dateStr);
        for (ModelReferenceLog modelReferenceLog : modelReferenceLogs) {
            User user = userService.getUserInfo(modelReferenceLog.getRegUserSeq());
            modelReferenceLog.setUserNm(user.getUserNm());
        }
        return modelReferenceLogs;
    }

    public ArrayList<DataFileDownloadLog> findDtDataFileLogsRangeByModelSeq(int modelSeq, String dateStr) {
        ArrayList<DataFileDownloadLog> dataFileDownloadLogs = logMapper.findDtDataFileLogsRangeByModelSeq(modelSeq, dateStr);
        for (DataFileDownloadLog dataFileDownloadLog : dataFileDownloadLogs) {
            User user = userService.getUserInfo(dataFileDownloadLog.getRegUserSeq());
            dataFileDownloadLog.setUserNm(user.getUserNm());
        }
        return dataFileDownloadLogs;
    }

    public int countDtEtcModelByAlgorithm(int algrmSeq) {
        return logMapper.countDtEtcModelByAlgorithm(algrmSeq);
    }

    public int countDtModelByAlgorithm(int algrmSeq) {
        return logMapper.countDtModelByAlgorithm(algrmSeq);
    }

    public ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogsRange(String dateStr) {
        return logMapper.findDtEtcModelReferenceLogsRange(dateStr);
    }

    public ArrayList<DataFileDownloadLog> findDtEtcDataFileLogsRange(String dateStr) {
        return logMapper.findDtEtcDataFileLogsRange(dateStr);
    }

    public ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogs() {
        return logMapper.findDtEtcModelReferenceLogs();
    }

    public ArrayList<DataFileDownloadLog> findDtEtcDataFileLogs() {
        return logMapper.findDtEtcDataFileLogs();
    }

    public ArrayList<ModelReferenceLog> findDtModelReferenceLogsRange(String dateStr) {
        return logMapper.findDtModelReferenceLogsRange(dateStr);
    }

    public ArrayList<DataFileDownloadLog> findDtDataFileLogsRange(String dateStr) {
        return logMapper.findDtDataFileLogsRange(dateStr);
    }

    public ArrayList<ModelReferenceLog> findDtModelReferenceLogs() {
        return logMapper.findDtModelReferenceLogs();
    }

    public ArrayList<DataFileDownloadLog> findDtDataFileLogs() {
        return logMapper.findDtDataFileLogs();
    }
}
