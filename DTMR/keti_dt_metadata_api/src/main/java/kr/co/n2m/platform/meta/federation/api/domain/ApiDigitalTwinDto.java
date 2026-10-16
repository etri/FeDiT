package kr.co.n2m.platform.meta.federation.api.domain;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.util.MapperUtil;
import lombok.Getter;
import lombok.Setter;

@Schema(description="디지털 트윈 Dto (등록/수정용)")
@Getter
@Setter
public class ApiDigitalTwinDto extends ApiDigitalTwinBaseDto {
	
	private List<Map<String, Object>> digitalTwinObjects;
	private List<Map<String, Object>> services;
	private List<Map<String, Object>> subscriptions;
	private List<Map<String, Object>> simulations;
	private List<Map<String, Object>> sensors;
	private List<Map<String, Object>> controllers;
	private List<Map<String, Object>> visualModels;
	private List<Map<String, Object>> behaviorModels;
	private List<Map<String, Object>> digitalTwins;
	private List<Map<String, Object>> federatedDigitalTwinObjects;
	private List<Map<String, Object>> relationships;
	private List<Map<String, Object>> validationModels;
	private List<Map<String, Object>> fidelityModels;
	
	private List<Map<String, Object>> etcInfo; // 저장소에 저장되지 않는 임시 필드값
	
    @Override
    public String toString() {
        return MapperUtil.toJsonWithNull(this);
    }
    
    public void initAndSetEtcInfo(@Nullable Object etcInfo) {
	    Map<String, Object> map = new LinkedHashMap<>();
	    map.put("inputData", etcInfo); 
	    map.put("outputData", null);
	    setEtcInfo(Collections.singletonList(map));
	}
    
    public void setEtcInfoOutputData(@Nullable Object outputData) {
    	if (this.etcInfo == null || this.etcInfo.size() == 0 || this.etcInfo.get(0) == null || !this.etcInfo.get(0).containsKey("outputData")) {
    		this.initAndSetEtcInfo(this.etcInfo);
    	}
    	this.etcInfo.get(0).put("outputData", outputData);
    }
    
}
