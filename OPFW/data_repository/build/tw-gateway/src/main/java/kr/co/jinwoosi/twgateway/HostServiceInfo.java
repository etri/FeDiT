package kr.co.jinwoosi.twgateway;

import lombok.Data;

import java.util.Objects;

@Data
public class HostServiceInfo {
    private String id;
    private String type;
    private String name;;
    private String category;
    private String dataCode;
    private String status;
    private String swaggerTagList;
    private String apiType;
    private String dataFormat;
    private String serviceId;
    private String externalUrl;
    private String restIp;
    private String restPort;
    private String swaggerUrl;
    private String swaggerHomepath;
    private String provider;
    private String institutionId;
    private String manager;
    private String managerPhoneNumber;
    private String description;
    private String approvalTime;
    private String denialTime;
    private String deprecatedTime;
    private String currentCallCount;
    private String maxCallCount;
    private String regDt;

    public String getRestUrl() {
        if(restIp==null || restIp.trim().isEmpty()) return "";
        if(restPort==null || restPort.trim().isEmpty()) return restIp;
        return restIp + ":" + restPort;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (object == null || getClass() != object.getClass()) return false;
        HostServiceInfo that = (HostServiceInfo) object;
        return Objects.equals(serviceId, that.serviceId) && Objects.equals(restIp, that.restIp) && Objects.equals(restPort, that.restPort) && Objects.equals(swaggerUrl, that.swaggerUrl) && Objects.equals(swaggerHomepath, that.swaggerHomepath);
    }

    @Override
    public int hashCode() {
        return Objects.hash(serviceId, restIp, restPort, swaggerUrl, swaggerHomepath);
    }
}
