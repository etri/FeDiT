package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.MakeMetaEtcModelSchedulerMapper;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class MakeMetaEtcModelSchedulerService extends BaseService {

    @Autowired
    private MakeMetaEtcModelSchedulerMapper makeMetaEtcModelSchedulerMapper;

    public List<Map<String, Object>> getMakeModelDoingList(Map<String, Object> targetParams) {
        return makeMetaEtcModelSchedulerMapper.getMakeModelDoingList(targetParams);
    }

    public List<Map<String, Object>> setMakeModelOutputColumns(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.setMakeModelOutputColumns(checkParams);
    }

    public List<Map<String, Object>> setMakeModelParams(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.setMakeModelParams(checkParams);
    }

    public List<Map<String, Object>> setMakeModelFiles(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.setMakeModelFiles(checkParams);
    }

    public List<Map<String, Object>> getOriginFiles(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.getOriginFiles(checkParams);
    }

    public void deleteSetRemodel(Map<String, Object> checkParams) {
        makeMetaEtcModelSchedulerMapper.deleteMakeModelFile(checkParams);
        makeMetaEtcModelSchedulerMapper.deleteMakeModelLoss(checkParams);
    }

    public int updateLearningBgngDt(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.updateLearningBgngDt(checkParams);

    }

    public int finishMakeModel(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.finishMakeModel(checkParams);
    }

    public int getCountModelFileInfo(Map<String, Object> modelParam) {
        return makeMetaEtcModelSchedulerMapper.getCountModelFileInfo(modelParam);
    }

    public int updateModelFileInfo(Map<String, Object> modelParam) {
        return makeMetaEtcModelSchedulerMapper.updateModelFileInfo(modelParam);
    }

    public int insertModelFileInfo(Map<String, Object> modelParam) {
        return makeMetaEtcModelSchedulerMapper.insertModelFileInfo(modelParam);
    }

    public List<Map<String, Object>> setMakeModelFeatureColumns(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.setMakeModelFeatureColumns(checkParams);
    }

    public int updateLearningDndDt(Map<String, Object> checkParams) {
        return makeMetaEtcModelSchedulerMapper.updateLearningDndDt(checkParams);
    }

    public String processorCreateAELearningModel(Map<String, Object> requestBody) {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/newpreproc/processorCreateAELearningModel/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        log.info("url -> {}", url);
        log.info("requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        return responseBody;
    }

    public String createModelGenerater_randomForest(Map<String, Object> requestBody) {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/metalearning/createModelGenerater_randomForest/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        log.info("url -> {}", url);
        log.info("requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        return responseBody;
    }

    public String createModelGenerater_brits_ori(Map<String, Object> requestBody) {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/metalearning/createModelGenerater_brits_ori/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        log.info("url -> {}", url);
        log.info("requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        return responseBody;
    }

    public String createModelGenerater_naomi(Map<String, Object> requestBody) {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/metalearning/createModelGenerater_naomi/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        log.info("url -> {}", url);
        log.info("requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        return responseBody;
    }

    public boolean checkStatus(int modelSeq, String status) {
        return makeMetaEtcModelSchedulerMapper.checkStatus(modelSeq, status);
    }
}
