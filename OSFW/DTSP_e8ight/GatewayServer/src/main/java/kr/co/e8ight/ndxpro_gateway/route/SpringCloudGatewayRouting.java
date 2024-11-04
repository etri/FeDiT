//package kr.co.e8ight.ndxpro_gateway.route;
//
//import kr.co.e8ight.ndxpro_gateway.filter.GlobalFilter;
//import kr.co.e8ight.ndxpro_gateway.filter.JwtAuthenticationGatewayFilterFactory;
//import org.springframework.cloud.gateway.filter.GatewayFilter;
//import org.springframework.cloud.gateway.route.RouteLocator;
//import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//
//import java.util.function.Consumer;
//
//@Configuration
//public class SpringCloudGatewayRouting {
//
//    @Bean
//    public RouteLocator configurationRoute(RouteLocatorBuilder routeLocatorBuilder) {
//
//        return routeLocatorBuilder.routes()
//                .route("dataManagerId", r -> r.path("/ndxpro/v1/manager/**")
//                        .filters(f->f
//
//                                .dedupeResponseHeader("Access-Control-Allow-Credentials Access-Control-Allow-Origin", "RETAIN_FIRST")
//
////                                .rewritePath("/ndxpro/v1/manager/swagger/?(?<segment>.*)", "/swagger-ui.html")
////                                .filter(jwtFilter.apply(jwtFilter.getConfigClass()))
//                        )
//                        .uri("lb://DATAMANAGER-SERVICE"))
//
//                .route("dataIngestId", r -> r.path("/ndxpro/v1/ingest/**")
//                        .uri("lb://DATAINGEST-SERVICE"))
//                .route("dataConverterId", r -> r.path("/ndxpro/v1/converter/**")
//                        .uri("lb://DATACONVERTER-SERVICE"))
//                .route("dataConverterBuilderId", r -> r.path("/ndxpro/v1/converter-builder/**")
//                        .uri("lb://CONVERTERBUILDER-SERVICE"))
//                .route("dataBrokerId", r -> r.path("/ndxpro/v1/broker/**")
//                        .filters(f->f
//                                .dedupeResponseHeader("Access-Control-Allow-Credentials Access-Control-Allow-Origin", "RETAIN_FIRST")
//                                .rewritePath("/ndxpro/v1/broker/swagger/?(?<segment>.*)","/swagger-ui/index.html"))
//                        .uri("lb://DATABROKER-SERVICE"))
//                .route("dataServiceId", r -> r.path("/ndxpro/v1/service/**")
//                        .filters(f->f
//                                .dedupeResponseHeader("Access-Control-Allow-Credentials Access-Control-Allow-Origin", "RETAIN_FIRST")
//                                .rewritePath("/ndxpro/v1/service/swagger/?(?<segment>.*)","/swagger-ui/index.html"))
//                        .uri("lb://DATASERVICE-SERVICE"))
//                .route("dataPredictionId", r -> r.path("/ndxpro/v1/prediction/**")
//                        .uri("lb://DATAPREDICTION-SERVICE"))
//                .build();
//    }
//
//
//}
//
