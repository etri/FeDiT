package kr.co.e8ight.ndxpro_v1_datamanager.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.config.SwaggerConfig;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeSchemaService;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeService;
import kr.co.e8ight.ndxpro_v1_datamanager.service.ContextService;
import kr.co.e8ight.ndxpro_v1_datamanager.service.DataModelService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springdoc.core.SpringDocConfigProperties;
import org.springdoc.core.SpringDocConfiguration;
import org.springdoc.webmvc.core.MultipleOpenApiSupportConfiguration;
import org.springdoc.webmvc.core.SpringDocWebMvcConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Swagger(OpenAPI) 문서가 정상 생성되는지, 그리고 사용자 관점에서 필요한 정보(태그/설명/오류 응답)가 빠지지 않았는지 검증한다.
 * DB 나 외부 서비스 없이 컨트롤러 레이어만 띄워서 확인한다.
 */
@WebMvcTest
// 메인 애플리케이션 클래스(@EnableMongoAuditing)를 끌어오지 않도록 컨트롤러와 Swagger 설정만 명시적으로 구성한다.
@ContextConfiguration(classes = SwaggerDocsTest.TestConfig.class)
@TestPropertySource(properties = "logging.logstash.url=localhost:5000") // logback.xml 의 LOGSTASH 설정용
@ImportAutoConfiguration({SpringDocConfiguration.class, SpringDocConfigProperties.class,
        SpringDocWebMvcConfiguration.class, MultipleOpenApiSupportConfiguration.class})
class SwaggerDocsTest {

    @SpringBootConfiguration
    @Import({AttributeController.class, AttributeSchemaController.class,
            DataModelController.class, ContextController.class, SwaggerConfig.class})
    static class TestConfig {
    }

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    AttributeService attributeService;
    @MockBean
    AttributeSchemaService attributeSchemaService;
    @MockBean
    DataModelService dataModelService;
    @MockBean
    ContextService contextService;

    /** GET {path} 의 200 응답 스키마 $ref (media type 은 설정에 따라 달라지므로 첫 항목을 사용) */
    private static String responseSchemaRef(JsonNode docs, String path) {
        JsonNode content = docs.get("paths").get(path).get("get").get("responses").get("200").get("content");
        return content.elements().next().get("schema").get("$ref").asText();
    }

    /** 생성된 스펙을 읽어오고, 검토/공유용으로 build/openapi/ 아래에 파일로도 남긴다. */
    private JsonNode loadApiDocs() throws Exception {
        String body = mockMvc.perform(get("/v3/api-docs/NDXPRO_DATAMANAGER"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode docs = objectMapper.readTree(body);

        Path out = Paths.get("build", "openapi", "NDXPRO_DATAMANAGER.json");
        Files.createDirectories(out.getParent());
        Files.writeString(out, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(docs));
        return docs;
    }

    @Test
    @DisplayName("태그는 사용 흐름 순서(Attribute → AttributeSchema → DataModel → Context)로 노출된다")
    void tagsAreOrderedByWorkflow() throws Exception {
        JsonNode docs = loadApiDocs();

        List<String> tagNames = new ArrayList<>();
        docs.get("tags").forEach(t -> tagNames.add(t.get("name").asText()));

        assertThat(tagNames).containsExactly(SwaggerConfig.TAG_ATTRIBUTE, SwaggerConfig.TAG_ATTRIBUTE_SCHEMA,
                SwaggerConfig.TAG_DATA_MODEL, SwaggerConfig.TAG_CONTEXT);
        docs.get("tags").forEach(t -> assertThat(t.get("description").asText()).isNotBlank());
    }

    @Test
    @DisplayName("모든 API 는 태그·요약·설명을 갖고, 모든 파라미터에는 설명이 있다")
    void everyOperationIsDocumented() throws Exception {
        JsonNode docs = loadApiDocs();

        List<String> missing = new ArrayList<>();
        docs.get("paths").fields().forEachRemaining(path -> path.getValue().fields().forEachRemaining(op -> {
            String name = op.getKey().toUpperCase() + " " + path.getKey();
            JsonNode operation = op.getValue();
            if (!operation.has("tags") || operation.get("tags").isEmpty()) missing.add(name + " : tags");
            if (!operation.hasNonNull("summary") || operation.get("summary").asText().isBlank()) missing.add(name + " : summary");
            if (!operation.hasNonNull("description") || operation.get("description").asText().isBlank()) missing.add(name + " : description");
            if (operation.has("parameters")) {
                operation.get("parameters").forEach(p -> {
                    if (!p.hasNonNull("description")) missing.add(name + " : parameter " + p.get("name").asText());
                });
            }
        }));

        assertThat(missing).isEmpty();
    }

    @Test
    @DisplayName("변경(POST/PUT/DELETE) API 는 실패 응답(4xx)을 ErrorResponse 스키마로 문서화한다")
    void mutatingOperationsDocumentErrorResponses() throws Exception {
        JsonNode docs = loadApiDocs();

        assertThat(docs.at("/components/schemas/ErrorResponse/properties").fieldNames())
                .toIterable().containsExactlyInAnyOrder("type", "title", "detail", "code");

        List<String> missing = new ArrayList<>();
        docs.get("paths").fields().forEachRemaining(path -> path.getValue().fields().forEachRemaining(op -> {
            if (op.getKey().equals("get")) return;
            String name = op.getKey().toUpperCase() + " " + path.getKey();
            boolean hasClientError = false;
            for (Iterator<String> it = op.getValue().get("responses").fieldNames(); it.hasNext(); ) {
                if (it.next().startsWith("4")) hasClientError = true;
            }
            if (!hasClientError) missing.add(name);
        }));

        assertThat(missing).isEmpty();
    }

    @Test
    @DisplayName("페이징 응답은 실제 데이터 타입(DataModelResponseDto/AttributeResponseDto)으로 노출된다")
    void pagingResponsesExposeConcreteItemType() throws Exception {
        JsonNode docs = loadApiDocs();

        String dataModelPaging = responseSchemaRef(docs, "/ndxpro/v1/manager/data-models");
        String attributePaging = responseSchemaRef(docs, "/ndxpro/v1/manager/attributes");

        assertThat(dataModelPaging).endsWith("PagingResultListDataModelResponseDto");
        assertThat(attributePaging).endsWith("PagingResultListAttributeResponseDto");
        assertThat(docs.at("/components/schemas/PagingResultListDataModelResponseDto/properties/data/items/$ref").asText())
                .endsWith("DataModelResponseDto");
    }
}
