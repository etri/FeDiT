package kr.co.e8ight.ndxpro_v1_datamanager.controller;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.config.SwaggerConfig;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ErrorResponseDto;
import org.json.simple.parser.ParseException;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.DataModelRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.DataModelResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.UnitCodeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.service.DataModelService;
import kr.co.e8ight.ndxpro_v1_datamanager.util.PagingResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/manager")
@Tag(name = SwaggerConfig.TAG_DATA_MODEL)
public class DataModelController {

    private final DataModelService dataModelService;

    public DataModelController(DataModelService dataModelService) {
        this.dataModelService = dataModelService;
    }

    @PostMapping("/data-models")
    @Operation(summary = "데이터 모델 생성", description =
            "새 데이터 모델을 **버전 1.0, 준비 전(isReady=false)** 상태로 생성합니다.<br><br>"
                    + "**요청 규칙**<br>"
                    + "- `type` 은 대문자로 시작해야 하며(`Building`), 이미 존재하는 type 은 생성할 수 없습니다.<br>"
                    + "- `id` 는 `urn:{리소스}:{type}:` 형식이어야 합니다. (예: `urn:e8ight:Building:`)<br>"
                    + "- `attributes` 는 1개 이상이어야 하고, 모든 key 가 `attributeNames` 에도 존재해야 합니다.<br>"
                    + "- `required` 에 적은 속성은 `attributes` 에 정의되어 있어야 합니다.<br><br>"
                    + "생성 후에는 **수정 → 준비 완료 → context 등록** 순으로 진행합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공",
                    content = @Content(examples = @ExampleObject(value = "DATA MODEL CREATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "필수 값 누락, id/type 형식 오류, attributeNames 누락 등 요청 검증 실패",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "같은 type 의 데이터 모델이 이미 존재",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String createDataModel(
            @RequestBody DataModelRequestDto dataModelRequestDto)
            throws IOException {
        log.info("Method createDataModel request msg='{}'" + dataModelRequestDto);
        return dataModelService.createDataModel(dataModelRequestDto);

    }

    @PostMapping("/data-models/version")
    @Operation(summary = "데이터 모델 버전업", description =
            "기존 데이터 모델의 **minor 버전을 올린 새 버전**을 생성합니다. (1.0 → 1.1 → 1.2 …)<br><br>"
                    + "- `type` 으로 기존 모델을 찾고, 요청 본문 내용으로 새 버전 문서를 만듭니다. 기존 버전은 그대로 유지됩니다.<br>"
                    + "- 새 버전은 `isReady=false` 로 생성되므로 사용 전 다시 준비 완료 처리가 필요합니다.<br>"
                    + "- 요청 본문 규칙은 *데이터 모델 생성* 과 동일합니다. (`version` 값은 무시됨)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "버전업 성공",
                    content = @Content(examples = @ExampleObject(value = "DATA MODEL VERSION UP SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "요청 검증 실패",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "`type` 에 해당하는 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String versionUpDataModel(
            @RequestBody DataModelRequestDto dataModelRequestDto)
            throws IOException {
        log.info("Method D versionUpDataModel msg='{}'" + dataModelRequestDto);
        return dataModelService.versionUpDataModel(dataModelRequestDto);

    }

    @GetMapping(value = "/data-models")
    @Operation(summary = "데이터 모델 목록 조회 (페이징)", description =
            "데이터 모델을 type 오름차순으로 페이징 조회합니다. 같은 type 의 여러 버전이 있으면 최신 버전이 먼저 나옵니다.<br><br>"
                    + "목록에는 `id`, `type`, `version`, `isReady` 만 포함됩니다. "
                    + "상세 내용은 *데이터 모델 단건 조회* 를 이용하세요."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    public PagingResult<List<DataModelResponseDto>> readAllDataModel(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(defaultValue = "0") Integer curPage,
            @Parameter(description = "한 페이지에 담을 데이터 개수", example = "25")
            @RequestParam(defaultValue = "25") Integer size,
            @Parameter(description = "type 에 포함된 검색어 (대소문자 구분 없음)", example = "Build")
            @RequestParam(required = false) String word,
            @Parameter(description = "준비 상태 필터. true=준비 완료 모델만, false=준비 전 모델만, 생략=전체")
            @RequestParam(required = false) Boolean isReady
    ) {
        log.info("Method readAllDataModel request msg='{}'");
        return dataModelService.readAllDataModel(curPage, size, word, isReady);
    }

    @GetMapping(value = "/data-models/{dataModelId}")
    @Operation(summary = "데이터 모델 단건 조회", description =
            "데이터 모델의 전체 정의(속성, 필수 속성, 참고 문서 등)를 조회합니다.<br><br>"
                    + "`version` 을 생략하면 **최신 버전**을 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 type(또는 type+version) 의 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public DataModelResponseDto readDataModel(
            @Parameter(description = "데이터 모델 type", example = "Building")
            @PathVariable String dataModelId,
            @Parameter(description = "조회할 버전. 생략 시 최신 버전", example = "1.0")
            @RequestParam(required = false) String version) {
        log.info("Method readDataModel request msg='{}'" + dataModelId);
        return dataModelService.readDataModel(dataModelId,version);
    }

    @GetMapping(value = "/data-models/all-version/{dataModelId}")
    @Operation(summary = "데이터 모델 전체 버전 조회", description =
            "특정 type 의 데이터 모델을 **모든 버전**에 대해 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 type 의 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public List<DataModelResponseDto> readAllModelVersion(
            @Parameter(description = "데이터 모델 type", example = "Building")
            @PathVariable String dataModelId) {
        log.info("Method readAllModelVersion request msg='{}'" + dataModelId);
        return dataModelService.readAllModelVersion(dataModelId);
    }

//    @GetMapping(value = "/data-models/version/{dataModelId}")
//    @Operation(summary = "dataModel 단건 조회", description = "dataModelId : 데이터모델 타입, version : 데이터모델 버전")
//    public DataModelResponseDto readDataModelVersion(@PathVariable String dataModelId,
//            @RequestParam String version) {
//        log.info("Method readDataModelVersion request msg='{}'" + dataModelId);
//        return dataModelService.readDataModelVersion(dataModelId, version);
//    }

    @GetMapping(value = "/data-models/check-duplicate/{dataModelId}")
    @Operation(summary = "데이터 모델 type 사용 가능 여부 확인", description =
            "모델을 생성하기 전에 type 이 사용 가능한지 확인합니다.<br><br>"
                    + "- `true` : 사용 가능 (같은 type 의 모델이 없음)<br>"
                    + "- `false` : 사용 불가 (이미 존재)"
    )
    @ApiResponse(responseCode = "200", description = "확인 성공",
            content = @Content(schema = @Schema(implementation = Boolean.class), examples = @ExampleObject(value = "true")))
    public Boolean duplicatedCheckDataModel(
            @Parameter(description = "확인할 데이터 모델 type", example = "Building")
            @PathVariable String dataModelId) {
//        log.info("Method duplicatedCheckDataModel request msg='{}'" + dataModelId);
        return dataModelService.duplicatedCheckDataModel(dataModelId);
    }

    @GetMapping(value = "/unit-code")
    @Operation(summary = "단위 코드 그룹 목록 조회", description =
            "속성의 `unitCode` 에 사용할 수 있는 단위 그룹 목록(speed, length, temperature …)을 조회합니다.<br>"
                    + "그룹별 실제 코드는 *단위 코드 그룹별 목록 조회* 로 확인하세요."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(examples = @ExampleObject(value = "[\"speed\", \"length\", \"temperature\"]")))
    public List<String> readUnitCodeGroup() {
        log.info("Method readUnitCodeGroup request msg='{}'");
        return dataModelService.readUnitCodeGroup();
    }

    @GetMapping(value = "/unit-code/{group}")
    @Operation(summary = "단위 코드 그룹별 목록 조회", description =
            "특정 그룹에 속한 단위 코드(UN/CEFACT)와 기호를 조회합니다. 없는 그룹이면 빈 목록을 반환합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    public List<UnitCodeResponseDto> readUnitCode(
            @Parameter(description = "단위 그룹 이름", example = "speed")
            @PathVariable String group) {
        log.info("Method readUnitCode request msg='{}'");
        return dataModelService.readUnitCode(group);
    }

    @PutMapping("/data-models")
    @Operation(summary = "데이터 모델 수정", description =
            "`type` 으로 찾은 **최신 버전** 모델의 내용을 요청 본문으로 덮어씁니다.<br><br>"
                    + "- **준비 완료(isReady=true) 된 모델은 수정할 수 없습니다.** 내용을 바꾸려면 *버전업* 을 사용하세요.<br>"
                    + "- 요청 본문 규칙은 *데이터 모델 생성* 과 동일합니다. (`version`, `isReady` 값은 무시됨)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(examples = @ExampleObject(value = "DATA MODEL UPDATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "요청 검증 실패",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "`type` 에 해당하는 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "422", description = "준비 완료된 모델은 수정 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String updateDataModel(@RequestBody DataModelRequestDto dataModelRequestDto)
            throws IOException {
        log.info("Method updateDataModel request msg='{}'" + dataModelRequestDto);
        return dataModelService.updateDataModel(dataModelRequestDto);
    }


    @PutMapping("/data-models/readiness/{dataModelId}")
    @Operation(summary = "데이터 모델 준비 완료 처리", description =
            "최신 버전 모델을 **준비 완료(isReady=true)** 상태로 변경합니다.<br><br>"
                    + "- 준비 완료된 모델만 context 에 등록할 수 있습니다.<br>"
                    + "- 준비 완료 후에는 수정할 수 없으며, 되돌릴 수도 없습니다. 변경이 필요하면 *버전업* 을 사용하세요."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "변경 성공",
                    content = @Content(examples = @ExampleObject(value = "DATA MODEL READY UPDATE SUCCESS"))),
            @ApiResponse(responseCode = "404", description = "해당 type 의 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String updateDataModelIsReady(
            @Parameter(description = "데이터 모델 type", example = "Building")
            @PathVariable String dataModelId) {
        log.info("Method updateDataModelIsReady request msg='{}'" + dataModelId);
        return dataModelService.updateDataModelIsReady(dataModelId);

    }

    @DeleteMapping("/data-models/{dataModelId}")
    @Operation(summary = "데이터 모델 삭제", description =
            "해당 type 의 **최신 버전** 모델을 삭제합니다.<br><br>"
                    + "삭제 전에 이 모델이 등록된 모든 context 에서 모델 및 속성 매핑을 자동으로 제거하고 `.jsonld` 파일을 갱신합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "삭제 성공",
                    content = @Content(examples = @ExampleObject(value = "DATA MODEL DELETE SUCCESS"))),
            @ApiResponse(responseCode = "404", description = "해당 type 의 데이터 모델이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String deleteDataModel(
            @Parameter(description = "데이터 모델 type", example = "Building")
            @PathVariable String dataModelId) throws IOException, ParseException {
        log.info("Method deleteDataModel request msg='{}'" + dataModelId);
        return dataModelService.deleteDataModel(dataModelId);
    }


}
