package kr.co.jinwoosi.twgateway;

import lombok.Data;

@Data
public class RouteInfo {
    private String id;
    private String name;
    private String serviceId;
    private String externalUri;
    private String restUri;
    private String swaggerUri;
    private String swaggerHomepath;
}
