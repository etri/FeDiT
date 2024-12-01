package kr.co.jinwoosi.twgateway.config;

import kr.co.jinwoosi.twgateway.HostServiceInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.GatewayFilterSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.cloud.gateway.route.builder.UriSpec;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.List;

@Slf4j
@Component
public class TwRoutesLocator implements RouteLocator {
    private final RouteLocatorBuilder locatorBuilder;
    private final TwRoutesRefresher twRoutesRefresher;

//     private AuthenticationGatewayFilter gatewayFilter;
//     private WebClient baseWeb;
    private RouteLocatorBuilder.Builder routesBuilder;
    private Flux<Route> routes = Flux.empty();

    public TwRoutesLocator(RouteLocatorBuilder locatorBuilder, TwRoutesRefresher refresher, WebClient repositoryWeb) {
        this.locatorBuilder = locatorBuilder;
        this.twRoutesRefresher = refresher;
    }

//    @Value("${jcms.repository.login-form-path}")
//    String loginFormPath;
//    @Value("${jcms.repository.login-path}")
//    String loginPath;
//    @Value("${jcms.repository.userid}")
//    private String userId;
//    @Value("${jcms.repository.password}")
//    private String password;
//
//    @Value("${jcms.repository.node-detail-path}")
//    private String nodeDetailPath;

    public boolean checkUrl(String uri) {
        if(uri==null || uri.isEmpty()) return false;
        int start = uri.indexOf('/')+1;
        if(start<1 || start>=uri.length()) return false;
        int end = uri.indexOf('/', start);
        if(end < 0) return false;
        String id = uri.substring(start, end);
        log.debug("요청 ID : {}", id);
        return true;
    }

    /*public RouteInfo getNodeInfo(String sid) {
        if(sid==null || sid.isEmpty()) return null;
        try {
            MultiValueMap<String,String> param = new LinkedMultiValueMap<>();
            param.add("serviceId", sid);
            String rst = baseWeb
                    .post()
                    .uri(nodeDetailPath)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(param))
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorResume( e -> {
                        throw new RuntimeException(e.getMessage());
                    })
                    .block();

            log.debug(rst);

        } catch (Exception e) {
            log.error("노드 정보 에러 >>>> {}", e.getMessage());
            return null;
        }
        return null;
    }*/

    public void getAllUpdate(List<HostServiceInfo> list) {
        if(list == null) return;
        try {
            log.info("서비스 호스트 등록을 시작합니다.22");
            clearRoutes();
            updateServices(list);
            refresh();
            log.info("{}개 서비스 호스트 등록 하였습니다.", routes.count().block());
        } catch (Exception e) {
            log.error("전체 노드수집 에러 >>>> {}", e.getMessage());
        }
    }

    private void updateServices(List<HostServiceInfo> list) {
        if(list==null) return;
        for(HostServiceInfo info : list) {
            if (info == null) continue;
            if (info.getServiceId() == null || info.getServiceId().isEmpty()) {
                String id = info.getId()==null ? "" : info.getId();
                String nm = info.getName()==null ? "" : info.getName();
                log.error("서비스 ID가 정의되지 않음 >>>> Id: {},  Name: {}", id, nm);
            } else if(info.getStatus()==null || !info.getStatus().equals("approved")) {
                String nm = info.getName()==null ? "" : info.getName();
                log.error("승인되지 않은 서비스 >>>> 서비스Id: {},  Name: {}", info.getServiceId(), nm);
            } else {
                if(chkUrl(info.getRestUrl())) addRoute(info.getServiceId(), info.getRestUrl());
                if(chkUrl(info.getSwaggerUrl())) addRoute(info.getServiceId() + "api", info.getSwaggerUrl());
            }
        }
    }

    static public boolean chkUrl(String url) {
        if(url==null || url.isEmpty()) return false;
        return url.startsWith("http://") || url.startsWith("https://");
    }


    public void clearRoutes() {
        this.routesBuilder = this.locatorBuilder.routes();
    }
    @NonNull
    public void addRoute(@NonNull String id, @NonNull String url) {
        try {
            routesBuilder.route(id, r -> r
                    .path("/" + id + "/**")
                    .filters(f -> getRouteFilters(f, id))
                    .uri(url)
            );
            log.info("{} 서비스 {} 호스트 등록", id, url);
        } catch (Exception e) {
            log.error("호스트 등록 실패 >>> {}, {}", id, url);
        }
    }

    public void refresh() {
        this.routes = routesBuilder.build().getRoutes();
        this.twRoutesRefresher.refreshRoutes();
    }

    @NonNull
    private UriSpec getRouteFilters(GatewayFilterSpec filterSpec, String id) {
        filterSpec.rewritePath("/"+id+"/", "/");
        // filterSpec.filter(gatewayFilter.apply(new AuthenticationGatewayFilter.Config()));
        return filterSpec.filter(((exchange, chain) -> {
            log.info("Incoming request: {} {}",
                    exchange.getRequest().getMethod(),
                    exchange.getRequest().getPath());
            return chain.filter(exchange);
        }));
    }

    @Override
    public Flux<Route> getRoutes() {
        return this.routes;
    }

    /*public void getAllUpdate() {
        if(loginRepositoryWeb() == null) return;
        try {
            MultiValueMap<String, String> param = new LinkedMultiValueMap<>();
            param.add("start", "0");
            param.add("length", "1000");

            String rst = baseWeb
                    .post()
                    .uri(nodeListPath)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(param))
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorResume( e -> {
                        throw new RuntimeException(e.getMessage());
                    })
                    .block();

            Map<String,String> maps = JsonUtil.getMap(rst);
            List<RouteInfo> list = JsonUtil.getList(RouteInfo.class, maps.get("data"));
            clearRoutes();
            for(RouteInfo ri : list) {
                if(ri.getServiceId()!=null && !ri.getServiceId().isEmpty()) {
                    if(ri.getRestUri()!=null && !ri.getRestUri().isEmpty()) addRoute(ri.getServiceId(), ri.getRestUri());
                    if(ri.getSwaggerUri()!=null && !ri.getSwaggerUri().isEmpty()) addRoute(ri.getServiceId() + "api", ri.getSwaggerUri());
                } else {
                    log.error("서비스ID가 정의되지 않음 >>>> Id: {},  Name: {}", ri.getId(), ri.getName());
                }
            }
            refresh();
        } catch (Exception e) {
            log.error("전체 노드수집 에러 >>>> {}", e.getMessage());
        }
    }*/

/*    private WebClient loginRepositoryWeb() {
        try {
            baseWeb = null;
            if(loginFormPath==null || loginPath==null) throw new RuntimeException();
            MultiValueMap<String, String> data = new LinkedMultiValueMap<>();
            data.add("userLoginId", userId);
            data.add("userPwd", password);

            ResponseEntity<Void> rst = repositoryWeb
                    .post()
                    .uri(loginPath)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(data))
                    .retrieve()
                    .toBodilessEntity()
                    .onErrorResume( e -> { throw new RuntimeException(e.getMessage()); })
                    .block();

            HttpHeaders headers = Objects.requireNonNull(rst).getHeaders();
            if(! checkLogin(headers.getFirst(HttpHeaders.LOCATION))) throw new RuntimeException("로그인 실패");
            String sid = headers.getFirst(HttpHeaders.SET_COOKIE);
            if(sid == null) return null;
            if(sid.indexOf(';')>0) sid = sid.substring(0, sid.indexOf(';'));
            String[] sp = sid.split("=");
            baseWeb = repositoryWeb.mutate().defaultCookie(sp[0], sp[1]).build();

            return baseWeb;
        } catch (RuntimeException e) {
            log.error("리포지포리 서버연결 실패 >>>> {}", e.getMessage());
            return null;
        }
    }*/

/*    private boolean checkLogin(String str) {
        if(str==null || loginFormPath==null || str.length()<loginFormPath.length()) return true;
        return !str.startsWith(loginFormPath);
    }*/
}
