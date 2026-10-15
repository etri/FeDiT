package kr.co.e8ight.ndxpro_v1_datamanager.controller;


import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.config.SwaggerConfig;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.ContextRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ContextResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ErrorResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.service.ContextService;
import lombok.extern.slf4j.Slf4j;
import org.json.simple.parser.ParseException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/manager")
@Tag(name = SwaggerConfig.TAG_CONTEXT)
public class ContextController {

    private static final String CONTEXT_URL_DESCRIPTION =
            "context URL. `http(s)://` 로 시작하고 `.jsonld` 로 끝나야 합니다.";
    // context 서버 주소는 설정(ndxpro.context.server-url, 환경변수 CONTEXT_SERVER_URL)에서 읽는다.
    private static final String DEFAULT_CONTEXT_URL = "${ndxpro.context.server-url:http://localhost:3005}/e8ight-context-v1.01.jsonld";
    private static final String CONTEXT_URL_EXAMPLE = "http://context-server:3005/e8ight-context-v1.01.jsonld";

    private final ContextService contextService;

    public ContextController(ContextService contextService) {
        this.contextService = contextService;
    }

    @PostMapping(value = "/contexts")
    @Operation(summary = "커스텀 context 생성", description =
            "사용자 정의 `@context` 를 생성하고, 같은 URL 경로에 `.jsonld` 파일로 배포합니다.<br><br>"
                    + "**요청 규칙**<br>"
                    + "- `url` 은 `http(s)://` 로 시작하고 `.jsonld` 로 끝나야 하며, 중복될 수 없습니다.<br>"
                    + "- `@context` 의 각 항목은 `\"접두어\": \"URI\"` 또는 `\"용어\": \"접두어:용어\"` 형태여야 하며, "
                    + "값에 key 이름이 포함되어야 합니다. (예: `\"e8ight\": \"https://e8ight-data-models/\"`)<br><br>"
                    + "생성 후 *데이터 모델 등록* 으로 준비 완료된 모델을 추가하면 모델/속성 매핑이 context 에 자동으로 채워집니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공. 저장된 `@context` 내용을 반환",
                    content = @Content(examples = @ExampleObject(value = "{\n"
                            + "  \"e8ight\": \"https://e8ight-data-models/\",\n"
                            + "  \"common\": \"https://e8ight-data-models/common/\",\n"
                            + "  \"ngsi-ld\": \"https://uri.etsi.org/ngsi-ld/\"\n"
                            + "}"))),
            @ApiResponse(responseCode = "400", description = "URL 형식 오류 또는 `@context` 항목 검증 실패",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "같은 URL 의 context 가 이미 존재",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public Object createContext(
            @RequestBody ContextRequestDto contextRequestDto)
            throws IOException, ParseException {
        log.info("Method createContext request msg='{}'" + contextRequestDto);

        System.out.println(contextRequestDto.getValue());
        return contextService.createContext(contextRequestDto);
    }

    @PostMapping(value = "/contexts/import")
    @Operation(summary = "외부 context 임포트", description =
            "외부에 공개된 `.jsonld` 를 URL 로 내려받아 context 로 등록합니다. (기본값: NGSI-LD core context)<br><br>"
                    + "- 같은 URL 이 이미 등록돼 있으면 내용이 바뀐 경우에만 갱신합니다.<br>"
                    + "- 네트워크가 차단된(오프라인) 환경에서 호스트를 찾을 수 없으면 내장된 NGSI-LD core context 로 대체 등록합니다.<br>"
                    + "- 응답은 접두어를 전체 URI 로 풀어 쓴(확장된) 형태입니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "임포트 성공"),
            @ApiResponse(responseCode = "400", description = "URL 형식 오류 또는 내려받은 내용에 `@context` 가 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "URL 에서 context 를 찾을 수 없음 (원격 서버 404)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public Object importContext(
            @Parameter(description = "임포트할 외부 context URL", example = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld")
            @RequestParam(defaultValue = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld") String contextUrl) throws JsonProcessingException {
        log.info("Method importContext request msg='{}'" + contextUrl);
        return contextService.importContext(contextUrl);
    }


    @GetMapping(value = "/contexts")
    @Operation(summary = "context URL 목록 조회", description = "등록된 모든 context 의 URL 을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(examples = @ExampleObject(value = "[\n"
                    + "  \"https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld\",\n"
                    + "  \"http://context-server:3005/e8ight-context-v1.01.jsonld\"\n"
                    + "]")))
    public List<String> readContexts() {
        log.info("Method readContexts request msg='{}'");
        return contextService.readAllContext();

    }

    @GetMapping(value = "/contexts/version")
    @Operation(summary = "context URL 로 등록 이력 조회", description =
            "해당 URL 로 등록된 context 를 최신순으로 조회합니다. 응답에는 `url` 만 포함됩니다.<br>"
                    + "등록된 것이 없으면 빈 목록을 반환합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContextResponseDto.class))))
    public List<ContextResponseDto> readContextVersion(
            @Parameter(description = CONTEXT_URL_DESCRIPTION, example = "http://context-server:3005/e8ight-context.jsonld")
            @RequestParam(defaultValue = "${ndxpro.context.server-url:http://localhost:3005}/e8ight-context.jsonld") String contextUrl) {
        log.info("Method readContextVersion request msg='{}'" + contextUrl);
        return contextService.readContextVersion(contextUrl);

    }
    @GetMapping(value = "/context")
    @Operation(summary = "context 단건 조회", description =
            "URL 에 해당하는 context 의 `@context` 내용을 조회합니다.<br><br>"
                    + "- `full=true` : 접두어를 전체 URI 로 풀어 쓴 **확장 형태** (`\"Building\": \"https://e8ight-data-models/Building\"`)<br>"
                    + "- `full=false` : 저장된 **원본 형태** (`\"Building\": \"e8ight:Building\"`)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "URL 형식 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 URL 의 context 가 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ContextResponseDto readContext(
            @Parameter(description = CONTEXT_URL_DESCRIPTION, example = CONTEXT_URL_EXAMPLE)
            @RequestParam(defaultValue = DEFAULT_CONTEXT_URL)String contextUrl,
            @Parameter(description = "true=확장 형태(전체 URI), false=원본 형태(접두어)")
            @RequestParam(defaultValue = "true") Boolean full
    ) {
        log.info("Method readContext request msg='{}'" + contextUrl);
        return contextService.readContext(contextUrl,full);
    }

    @GetMapping(value = "/context/v1")
    @Operation(summary = "context 최초 등록본 목록 조회", description =
            "등록된 모든 context URL 에 대해 **가장 먼저 등록된** 문서의 URL 을 조회합니다. 응답에는 `url` 만 포함됩니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContextResponseDto.class))))
    public List<ContextResponseDto> readContextFirstVersion(
    ) {
        log.info("Method readContextFirstVersion request msg='{}'");
        return contextService.readContextFirstVersion();
    }

    @PutMapping(value = "/contexts/models/enrollment")
    @Operation(summary = "context 에 데이터 모델 등록", description =
            "**준비 완료(isReady=true)** 된 데이터 모델을 context 에 등록하고 `.jsonld` 파일을 갱신합니다.<br><br>"
                    + "등록되면 context 에 다음 항목이 추가됩니다.<br>"
                    + "- `\"{type}\": \"{리소스}:{type}\"` (예: `\"Building\": \"e8ight:Building\"`)<br>"
                    + "- `\"{type}:{속성명}\": \"{속성 매핑}\"` (모델의 `attributeNames` 및 하위 속성 매핑)<br><br>"
                    + "요청 본문은 등록할 데이터 모델 **type 의 배열**입니다. 여러 모델을 한 번에 등록할 수 있으며, "
                    + "하나라도 준비 전 상태면 전체가 실패합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "등록 성공",
                    content = @Content(examples = @ExampleObject(value = "CONTEXT UPDATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "준비 전(isReady=false) 데이터 모델이 포함됨",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "context 또는 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public Object registrationDataModelInContext(
            @Parameter(description = CONTEXT_URL_DESCRIPTION, example = CONTEXT_URL_EXAMPLE)
            @RequestParam(defaultValue = DEFAULT_CONTEXT_URL) String contextUrl,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "등록할 데이터 모델 type 목록",
                    content = @Content(examples = @ExampleObject(value = "[\"Building\", \"Parking\"]")))
            @RequestBody List<String> dataModels)
            throws IOException, ParseException {
        log.info("Method registrationDataModelInContext request msg='{}'" + contextUrl + dataModels);
        return contextService.registrationDataModelInContext(contextUrl,dataModels);

    }

    @PutMapping(value = "/contexts/models/un-enrollment")
    @Operation(summary = "context 에서 데이터 모델 등록 해제", description =
            "context 에서 데이터 모델과 그 속성 매핑을 제거하고 `.jsonld` 파일을 갱신합니다.<br><br>"
                    + "요청 본문은 해제할 데이터 모델 **type 의 배열**입니다. "
                    + "context 를 삭제하려면 먼저 등록된 모델을 모두 해제해야 합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "해제 성공",
                    content = @Content(examples = @ExampleObject(value = "CONTEXT UPDATE SUCCESS"))),
            @ApiResponse(responseCode = "404", description = "context 또는 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String unRegistrationDataModelInContext(
            @Parameter(description = CONTEXT_URL_DESCRIPTION, example = CONTEXT_URL_EXAMPLE)
            @RequestParam(defaultValue = DEFAULT_CONTEXT_URL) String contextUrl ,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "해제할 데이터 모델 type 목록",
                    content = @Content(examples = @ExampleObject(value = "[\"Building\"]")))
            @RequestBody List<String> dataModels)
            throws IOException, ParseException {
        log.info("Method unRegistrationDataModelInContext request msg='{}'" + contextUrl + dataModels);
        return contextService.unRegistrationDataModelInContext(contextUrl,dataModels);

    }

    @DeleteMapping(value = "/contexts")
    @Operation(summary = "context 삭제", description =
            "context 와 배포된 `.jsonld` 파일을 삭제합니다.<br><br>"
                    + "**데이터 모델이 하나라도 등록된 context 는 삭제할 수 없습니다.** 먼저 *데이터 모델 등록 해제* 를 진행하세요."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "삭제 성공",
                    content = @Content(examples = @ExampleObject(value = "CONTEXT DELETE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "데이터 모델이 등록된 context 는 삭제 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 URL 의 context 가 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String deleteContext(
            @Parameter(description = CONTEXT_URL_DESCRIPTION, example = CONTEXT_URL_EXAMPLE)
            @RequestParam(defaultValue = DEFAULT_CONTEXT_URL)
            String contextUrl) {
        log.info("Method deleteContext request msg='{}'" + contextUrl);
        return contextService.deleteContext(contextUrl);

    }

}
