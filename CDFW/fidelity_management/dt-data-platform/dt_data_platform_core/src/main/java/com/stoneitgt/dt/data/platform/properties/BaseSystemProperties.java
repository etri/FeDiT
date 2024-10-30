package com.stoneitgt.dt.data.platform.properties;

import lombok.Data;

/**
 * yml 파일에 등록되어 있는 시스템 변수에 대한 클래스
 *
 * @author yh.kim
 */
@Data
public class BaseSystemProperties {

    private String allowIp;

    private String apiKey;

    private String uploadFilePath;

    private String uploadFileUrl;

    private String certDomain;

    private String resuorceLinkUrl;

    private int limitCsvRowCount;
    private int limitMakeModelCnt;


    private String dtFilePath;
    private String dtModelPath;
    private String dtDataPath;
    private String dtUploadPath;
    private String dtApiUrl;
    private String dtMetaApiUrl;
    private String dtKetiApiUrl;
    private String dtApiKey;
    private String dtN2mKey;

    private String dtMetaFilePath;
    private String dtEtcMetaFilePath;
    private String tmpSampleData;


}
