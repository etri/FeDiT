package com.stoneitgt.dt.data.platform.admin.mapper;

import com.stoneitgt.dt.data.platform.domain.DataFileDownloadLog;
import com.stoneitgt.dt.data.platform.domain.ModelReferenceLog;
import org.apache.ibatis.annotations.Mapper;

import java.util.ArrayList;

@Mapper
public interface LogMapper {
    void insertDtDataFileLog(DataFileDownloadLog dataFileDownloadLog);

    void insertDtEtcDataFileLog(DataFileDownloadLog dataFileDownloadLog);

    void insertDtEtcModelReferenceLog(ModelReferenceLog modelReferenceLog);

    void insertDtModelReferenceLog(ModelReferenceLog modelReferenceLog);

    ArrayList<DataFileDownloadLog> findDtEtcDataFileLogsByEtcModelSeq(int etcModelSeq);

    ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogsByEtcModelSeq(int etcModelSeq);

    ArrayList<DataFileDownloadLog> findDtDataFileLogsByModelSeq(int modelSeq);

    ArrayList<ModelReferenceLog> findDtModelReferenceLogsByModelSeq(int modelSeq);

    ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogsRangeByEtcModelSeq(int etcModelSeq, String dateStr);

    ArrayList<DataFileDownloadLog> findDtEtcDataFileLogsRangeByEtcModelSeq(int etcModelSeq, String dateStr);

    ArrayList<ModelReferenceLog> findDtModelReferenceLogsRangeByModelSeq(int modelSeq, String dateStr);

    ArrayList<DataFileDownloadLog> findDtDataFileLogsRangeByModelSeq(int modelSeq, String dateStr);

    int countDtEtcModelByAlgorithm(int algrmSeq);

    int countDtModelByAlgorithm(int algrmSeq);

    ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogsRange(String dateStr);

    ArrayList<DataFileDownloadLog> findDtEtcDataFileLogsRange(String dateStr);

    ArrayList<ModelReferenceLog> findDtEtcModelReferenceLogs();

    ArrayList<DataFileDownloadLog> findDtEtcDataFileLogs();

    ArrayList<ModelReferenceLog> findDtModelReferenceLogsRange(String dateStr);

    ArrayList<DataFileDownloadLog> findDtDataFileLogsRange(String dateStr);

    ArrayList<ModelReferenceLog> findDtModelReferenceLogs();

    ArrayList<DataFileDownloadLog> findDtDataFileLogs();

    boolean checkDtModelReferenceLog(ModelReferenceLog modelReferenceLog);
}
