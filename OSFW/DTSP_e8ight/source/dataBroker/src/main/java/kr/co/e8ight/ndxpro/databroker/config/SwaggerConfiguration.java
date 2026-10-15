package kr.co.e8ight.ndxpro.databroker.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
        info = @Info(
                title = "NDX PRO Data Broker API 명세서",
                version = "v1",
                description = "NGSI-LD Entity 조회/저장 및 시계열(Time Series) Entity 조회 API 입니다.<br><br>" +
                        "<b>공통 사항</b><br>" +
                        "- Link 헤더(context)는 <b>선택</b>입니다. 지정하면 해당 context 의 데이터만, 생략하면 id 만으로 조회합니다.<br>" +
                        "- 일시(DateTime) 값은 <code>yyyy-MM-ddTHH:mm:ss.SSS</code> 형식(UTC, 오프셋 없음)입니다.<br>" +
                        "- <code>q</code> 필터는 <code>속성명==값</code> 형식이며 <code>;</code> 로 여러 조건을 연결합니다. (연산자: ==, ~=, <=, >=)<br>" +
                        "- <code>options=count</code> 를 주면 응답 헤더 <code>totalPage</code>, <code>totalData</code> 에 전체 건수가 담깁니다."
        ),
        tags = {
                @Tag(name = SwaggerConfiguration.TAG_ENTITY,
                        description = "NGSI-LD Entity 의 최신 상태를 조회/저장합니다."),
                @Tag(name = SwaggerConfiguration.TAG_TIME_SERIES,
                        description = "시계열로 수집되는 Entity 의 <b>최신 스냅샷</b>, <b>이력(History)</b>, <b>특정 시점(Temporal)</b> 데이터를 조회합니다.<br><br>" +
                                "<b>시계열 조회 흐름</b><br>" +
                                "1. <code>GET /entities/iot</code> 로 조회 대상 entityId 확인 (이미 알고 있으면 생략)<br>" +
                                "2. <code>GET /entities/iot/history</code> 에 entityId + timeproperty(예: speed.observedAt) 로 기간별 이력 목록 조회<br>" +
                                "3. <code>GET /entities/iot/history/{historyId}</code> 로 특정 시점의 전체 속성값 조회"),
                @Tag(name = SwaggerConfiguration.TAG_TIME_SERIES_STATISTICS,
                        description = "시계열 Entity 수집 성공/실패 건수 및 수집 현황 통계를 조회합니다."),
                @Tag(name = SwaggerConfiguration.TAG_HEALTH_CHECK,
                        description = "서비스 상태 확인")
        }
)
@Configuration
public class SwaggerConfiguration {

    public static final String TAG_ENTITY = "Entity";
    public static final String TAG_TIME_SERIES = "Time Series Entity";
    public static final String TAG_TIME_SERIES_STATISTICS = "Time Series Statistics";
    public static final String TAG_HEALTH_CHECK = "Health Check";

    @Bean
    public GroupedOpenApi openApi(){
        return GroupedOpenApi.builder()
                .group("databroker")
                .pathsToMatch("/**")
                .packagesToScan("kr.co.e8ight.ndxpro.databroker")
                .build();
    }
}
