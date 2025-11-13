package kr.co.n2m.platform.meta.federation.api.domain;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "디지털 트윈 종류")
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum ApiDigitalTwinType {
	
	SINGLE("single", "단일", "SingleDigitalTwin"),
    FEDERATED("federated", "연합", "FederatedDigitalTwin");

    private final String code;
    private final String krCode;
    private final String modelId;

    ApiDigitalTwinType(String code, String krCode, String modelId) {
        this.code = code;
        this.krCode = krCode;
        this.modelId = modelId;
    }

    public String code() {
        return code;
    }

    public String krCode() {
        return krCode;
    }
    
    public String modelId() {
        return modelId;
    }

    /**
     * code 값으로 enum 찾기
     */
    public static ApiDigitalTwinType fromCode(String code) {
        for (ApiDigitalTwinType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown DigitalTwinType code: " + code);
    }
    
    /**
     * krCode 값으로 enum 찾기
     */
    public static ApiDigitalTwinType fromKrCode(String krCode) {
        for (ApiDigitalTwinType type : values()) {
            if (type.krCode.equalsIgnoreCase(krCode)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown DigitalTwinType krCode: " + krCode);
    }    
    
    /**
     * modelId 값으로 enum 찾기
     */
    public static ApiDigitalTwinType fromModelId(String modelId) {
        for (ApiDigitalTwinType type : values()) {
            if (type.modelId.equalsIgnoreCase(modelId)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown DigitalTwinType modelId: " + modelId);
    }    
    
}
