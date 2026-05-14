package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.service.MetaAPIService;
import com.stoneitgt.dt.data.platform.admin.service.SyncEngineAPIService;
import com.stoneitgt.dt.data.platform.domain.meta.DigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.domain.meta.PaginatedDigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.domain.sync.DigitalTwinObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final MetaAPIService metaAPIService;
    private final SyncEngineAPIService syncEngineAPIService;

    /**
     * /meta/digitalTwins?curPage=1&pageListSize=10&arrayDataLimit=200&objectRefFormat=object
     *
     */
    @GetMapping("/meta/digital-twins")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwins(@RequestParam(value = "curPage", defaultValue = "1") Integer curPage,
                                                               @RequestParam(value = "pageListSize", defaultValue = "10") Integer pageListSize,
                                                               @RequestParam(value = "arrayDataLimit", defaultValue = "200") Integer arrayDataLimit,
                                                               @RequestParam(value = "objectRefFormat", defaultValue = "object") String objectRefFormat,
                                                               @RequestParam(value = "dTw_objs_attr", defaultValue = "digitalTwinObjects") String dTw_objs_attr,
                                                               @RequestParam(value = "dTw_attr_name", required = false) String dTw_attr_name) {
        Map<String, Object> response = new HashMap<>();
        try {
            PaginatedDigitalTwinMetadata paginatedDigitalTwinMetadata = metaAPIService.getDigitalTwins(curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_name);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", paginatedDigitalTwinMetadata);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twins", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/meta/digital-twins/{dTw_attr_dtid}/digital-objects")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwinObjects(@RequestParam(value = "curPage", defaultValue = "1") Integer curPage,
                                                                     @RequestParam(value = "pageListSize", defaultValue = "10") Integer pageListSize,
                                                                     @RequestParam(value = "arrayDataLimit", defaultValue = "200") Integer arrayDataLimit,
                                                                     @RequestParam(value = "objectRefFormat", defaultValue = "object") String objectRefFormat,
                                                                     @RequestParam(value = "dTw_objs_attr", defaultValue = "digitalTwinObjects") String dTw_objs_attr,
                                                                     @PathVariable(value = "dTw_attr_dtid", required = false) String dTw_attr_dtid) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<DigitalTwinMetadata.DigitalTwinObject> digitalTwinObjects = metaAPIService.getDigitalTwinObjects(curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_dtid);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", digitalTwinObjects);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin objects", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/meta/digital-twins/{dTw_attr_dtid}/digital-objects/{obj_attr_dtoid}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwinObjectInfo(@RequestParam(value = "curPage", defaultValue = "1") Integer curPage,
                                                                        @RequestParam(value = "pageListSize", defaultValue = "10") Integer pageListSize,
                                                                        @RequestParam(value = "arrayDataLimit", defaultValue = "200") Integer arrayDataLimit,
                                                                        @RequestParam(value = "objectRefFormat", defaultValue = "object") String objectRefFormat,
                                                                        @RequestParam(value = "dTw_objs_attr", defaultValue = "digitalTwinObjects") String dTw_objs_attr,
                                                                        @PathVariable(value = "dTw_attr_dtid", required = false) String dTw_attr_dtid,
                                                                        @PathVariable(value = "obj_attr_dtoid", required = false) String obj_attr_dtoid) {
        Map<String, Object> response = new HashMap<>();
        try {
            DigitalTwinMetadata.DigitalTwinObject digitalTwinObject = metaAPIService.getDigitalTwinObject(curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_dtid, obj_attr_dtoid);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", digitalTwinObject);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/sync-engine/digital-twins/{dtid}/digital-objects/{dtoid}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwinObjectBySyncEngine(@PathVariable("dtid") String dtid,
                                                                                @PathVariable("dtoid") String dtoid) {
        Map<String, Object> response = new HashMap<>();
        try {
            DigitalTwinObject digitalTwinObject = syncEngineAPIService.getDigitalTwinObject(dtid, dtoid);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", digitalTwinObject);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * DT-2026-SEOUL-001
     * D-KR-104111-0001
     * 광화문역 1번출구 유동인구 센서
     * 광화문역 1번 출구 인근의 실시간 인파 밀집도 및 유동인구 분석 센서 객체
     *
     */
    @PostMapping("/sync-engine/digital-twins/{dtid}/digital-objects/{dtoid}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createDigitalTwinObjectBySyncEngine(@PathVariable("dtid") String dtid,
                                                                                   @PathVariable("dtoid") String dtoid,
                                                                                   @RequestBody(required = true) Map<String, Object> params) {
        Map<String, Object> response = new HashMap<>();
        try {
            String digitalTwinObjectId = syncEngineAPIService.createDigitalTwinObject(dtid, dtoid, Integer.parseInt(params.get("augment_seq").toString()), params.get("augment_title").toString());
            if (digitalTwinObjectId == null) {
                response.put("status", GlobalConstant.API_STATUS.FAIL);
                response.put("message", "Digital Twin Object creation failed");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", digitalTwinObjectId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    /**
     * DT-2026-SEOUL-001
     * D-KR-104111-0001
     * 광화문역 1번출구 유동인구 센서
     * 광화문역 1번 출구 인근의 실시간 인파 밀집도 및 유동인구 분석 센서 객체
     */
    @PostMapping("/sync-engine/digital-twins/{dtid}/digital-objects/{dtoid}/data")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createDigitalTwinObjectDataBySyncEngine(
            @PathVariable("dtid") String dtid,
            @PathVariable("dtoid") String dtoid,
            @RequestBody(required = true) List<Map<String, Object>> datas) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean created = syncEngineAPIService.createDigitalTwinObjectData(dtid, dtoid, "rowtime", datas);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", created);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 디지털 트윈 객체(Digital Twin Object) 생성 및 업데이트 (Meta API 연동)
     */
    @PutMapping("/meta/digital-twins/{dtid}/digital-objects")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createDigitalTwinObjects(
            @PathVariable("dtid") String dtid,
            @RequestBody Map<String, List<DigitalTwinMetadata.DigitalTwinObject>> requestBody) {

        Map<String, Object> response = new HashMap<>();
        try {
            // 요청 Body에서 "digitalTwinObjects" 리스트 추출
            List<DigitalTwinMetadata.DigitalTwinObject> objects = requestBody.get("digitalTwinObjects");

            if (objects == null || objects.isEmpty()) {
                throw new IllegalArgumentException("'digitalTwinObjects' 리스트가 비어있거나 존재하지 않습니다.");
            }

            // MetaAPIService 호출
            List<String> objectIds = metaAPIService.createDigitalTwinObjects(dtid, objects);

            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", objectIds);
            response.put("message", "Digital Twin Objects created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating digital twin objects", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
