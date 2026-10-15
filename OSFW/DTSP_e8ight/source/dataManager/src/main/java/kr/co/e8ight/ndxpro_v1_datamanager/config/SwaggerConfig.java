package kr.co.e8ight.ndxpro_v1_datamanager.config;


import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.tags.Tag;
import java.util.List;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


// 웹페이지 경로 URL/swagger-ui.html
@Configuration
public class SwaggerConfig {

    public static final String TAG_ATTRIBUTE = "Attribute";
    public static final String TAG_ATTRIBUTE_SCHEMA = "AttributeSchema";
    public static final String TAG_DATA_MODEL = "DataModel";
    public static final String TAG_CONTEXT = "Context";

    private static final String DESCRIPTION =
            "NGSI-LD 기반 데이터 모델을 정의하고 `@context` 로 배포하는 DataManager API 입니다.\n\n"
                    + "### 사용 흐름\n"
                    + "1. **Attribute** – 모델에서 사용할 속성(`category`, `address` …)을 등록합니다.\n"
                    + "2. **AttributeSchema** – 속성을 스키마 단위로 묶어 관리합니다. (선택)\n"
                    + "3. **DataModel** – 속성을 조합해 데이터 모델을 만들고, 검토가 끝나면 *준비 완료(isReady)* 처리합니다.\n"
                    + "4. **Context** – 준비 완료된 모델을 `@context` 에 등록하면 Broker 가 참조할 `.jsonld` 파일이 배포됩니다.\n\n"
                    + "### 공통 규칙\n"
                    + "- 생성/수정/삭제 API 는 성공 시 `\"... SUCCESS\"` 형태의 문자열을 반환합니다.\n"
                    + "- 실패 시 HTTP 상태 코드와 함께 `ErrorResponse`(type, title, detail, code) 본문을 반환합니다.\n"
                    + "- 다른 리소스가 참조 중인 대상은 수정/삭제할 수 없습니다. "
                    + "(모델에서 사용 중인 속성, 모델이 등록된 context, 준비 완료된 모델 등)";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NDXPRO DataManager API")
                        .version("v1")
                        .description(DESCRIPTION)
                        .contact(new Contact().name("E8IGHT").url("https://www.e8ight.co.kr")));
    }

    /**
     * 태그 순서 = 사용 흐름 순서. 컨트롤러에서 수집된 태그를 이 목록으로 교체해 Swagger UI 에 선언 순서대로 표시한다.
     * (springdoc 이 컨트롤러 @Tag 를 뒤늦게 합치면서 순서가 흐트러지고 중복되는 것을 막기 위해 customiser 에서 처리)
     */
    private static final List<Tag> ORDERED_TAGS = List.of(
            new Tag().name(TAG_ATTRIBUTE)
                    .description("속성 관리 – 데이터 모델을 구성하는 개별 속성(Property, Relationship 등)을 등록합니다."),
            new Tag().name(TAG_ATTRIBUTE_SCHEMA)
                    .description("속성 스키마 관리 – 등록된 속성을 스키마(파일) 단위로 묶어 관리합니다."),
            new Tag().name(TAG_DATA_MODEL)
                    .description("데이터 모델 관리 – 속성을 조합하여 Entity 타입(모델)을 정의하고 버전/준비 상태를 관리합니다."),
            new Tag().name(TAG_CONTEXT)
                    .description("컨텍스트 관리 – `@context`(.jsonld) 를 생성하고 준비 완료된 데이터 모델을 등록/해제합니다.")
    );

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder() // 사용
                .group("NDXPRO_DATAMANAGER") // swagger 에나오는 definition
                .pathsToMatch("/ndxpro/v1/manager/**") // api로 시작하는 api 사용
                .packagesToScan("kr.co.e8ight.ndxpro_v1_datamanager")// 패키지 경로
                .addOpenApiCustomiser(openApi -> openApi.setTags(ORDERED_TAGS))
                .build();
    }

}
