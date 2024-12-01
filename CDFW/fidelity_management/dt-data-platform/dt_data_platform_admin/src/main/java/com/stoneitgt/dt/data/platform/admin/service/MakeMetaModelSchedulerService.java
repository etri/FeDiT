package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.MakeMetaModelSchedulerMapper;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class MakeMetaModelSchedulerService extends BaseService {

    @Autowired
    private MakeMetaModelSchedulerMapper makeMetaModelSchedulerMapper;

    public List<Map<String, Object>> getMakeModelDoingList(Map<String, Object> targetParams) {
        return makeMetaModelSchedulerMapper.getMakeModelDoingList(targetParams);
    }

    public List<Map<String, Object>> setMakeModelOutputColumns(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.setMakeModelOutputColumns(checkParams);
    }

    public List<Map<String, Object>> setMakeModelFeatureColumns(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.setMakeModelFeatureColumns(checkParams);
    }

    public List<Map<String, Object>> setMakeModelParams(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.setMakeModelParams(checkParams);
    }

    public List<Map<String, Object>> setMakeModelFiles(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.setMakeModelFiles(checkParams);
    }

    public int finishMakeModel(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.finishMakeModel(checkParams);
    }

    public void deleteSetRemodel(Map<String, Object> checkParams) {
        makeMetaModelSchedulerMapper.deleteMakeModelFile(checkParams);
        makeMetaModelSchedulerMapper.deleteMakeModelFid(checkParams);
        makeMetaModelSchedulerMapper.deleteMakeModelLoss(checkParams);
    }

    public List<Map<String, Object>> getOriginFiles(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.getOriginFiles(checkParams);
    }

    public int updateLearningBgngDt(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.updateLearningBgngDt(checkParams);

    }

    public int updateLearningDndDt(Map<String, Object> checkParams) {
        return makeMetaModelSchedulerMapper.updateLearningDndDt(checkParams);
    }

    public JSONObject createMetaBasicModel(Map<String, Object> requestBody) throws ParseException {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/metalearning/createModelGenerater/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);
        log.info("createMetaModel, /dt/metalearning/createModelGenerater/, requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();

        JSONParser parser = new JSONParser();
        JSONObject result = (JSONObject) parser.parse(responseBody);
        return result;
    }

    public JSONObject createMetaDeepARModel(Map<String, Object> requestBody) throws ParseException {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/metalearning/createModelGenerater_deepAR/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);
        log.info("createMetaDeepARModel, /dt/metalearning/createModelGenerater_deepAR/, requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();

        JSONParser parser = new JSONParser();
        JSONObject result = (JSONObject) parser.parse(responseBody);
        return result;
    }

    public JSONObject createMetaNBeatsModel(Map<String, Object> requestBody) throws ParseException {
        RestTemplate restTemplate = new RestTemplate();

        String url = systemProperties.getDtApiUrl() + "/dt/metalearning/createModelGenerater_nbeats/";
        String contentType = "application/json";
        String authKey = "Token " + systemProperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);
        log.info("createMetaNBeatsModel, /dt/metalearning/createModelGenerater_nbeats/, requestBody -> {}", requestBody);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();

        JSONParser parser = new JSONParser();
        JSONObject result = (JSONObject) parser.parse(responseBody);
        return result;
    }

    public boolean checkStatus(int modelSeq, String status) {
        return makeMetaModelSchedulerMapper.checkStatus(modelSeq, status);
    }
}
