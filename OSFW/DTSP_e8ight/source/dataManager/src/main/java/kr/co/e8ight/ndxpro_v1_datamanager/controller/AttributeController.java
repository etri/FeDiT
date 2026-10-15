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
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ErrorResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeService;
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
@Tag(name = SwaggerConfig.TAG_ATTRIBUTE)
public class AttributeController {

    private final AttributeService attributeService;

    public AttributeController(AttributeService attributeService) {
        this.attributeService = attributeService;

    }

    @PostMapping(value = "/attributes")
    @Operation(summary = "속성 생성", description =
            "데이터 모델에서 사용할 속성을 등록합니다.<br><br>"
                    + "**요청 규칙**<br>"
                    + "- `id`, `type`, `valueType` 은 필수입니다.<br>"
                    + "- `id` 는 속성 이름으로, 중복될 수 없습니다.<br>"
                    + "- `valueType` 은 허용된 값만 사용할 수 있습니다. (요청 스키마의 `valueType` 설명 참고)<br>"
                    + "- `type` 은 context 에서 사용할 네임스페이스 접두어(prefix)입니다. 등록 시 `{type}:{id}` 로 매핑됩니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공",
                    content = @Content(examples = @ExampleObject(value = "ATTRIBUTE CREATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "필수 값 누락 또는 허용되지 않은 valueType",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "같은 id 의 속성이 이미 존재",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String createAttribute(@RequestBody AttributeRequestDto attributeRequestDto)
            throws IOException {
        log.info("Method createAttribute request msg='{}'" + attributeRequestDto);
        return attributeService.createAttribute(attributeRequestDto);

    }

    @GetMapping(value = "/attributes")
    @Operation(summary = "속성 목록 조회 (페이징)", description =
            "속성을 id 오름차순으로 페이징 조회합니다.<br><br>"
                    + "목록에는 `id`, `type` 만 포함됩니다. 상세 내용은 *속성 단건 조회* 를 이용하세요."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    public PagingResult<List<AttributeResponseDto>> readAllAttribute(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam (defaultValue ="0")Integer curPage,
            @Parameter(description = "한 페이지에 담을 데이터 개수", example = "25")
            @RequestParam(defaultValue = "25",required = false) Integer size,
            @Parameter(description = "id 에 포함된 검색어 (대소문자 구분 없음)", example = "cate")
            @RequestParam(required = false) String word
    ) {
        log.info("Method readAllAttribute request msg='{}'");
        return attributeService.readAllAttributeId(curPage, size, word);

    }

    @GetMapping(value = "/attributes/{attributeId}")
    @Operation(summary = "속성 단건 조회", description = "속성의 전체 정의를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 id 의 속성이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public AttributeResponseDto readSpecificAttribute(
            @Parameter(description = "속성 id (속성 이름)", example = "category")
            @PathVariable String attributeId) {
        log.info("Method readSpecificAttribute request msg='{}'" + attributeId);
        return attributeService.readSpecificAttribute(attributeId);

    }
    @GetMapping(value = "/attributes/usingModel/{attributeId}")
    @Operation(summary = "속성을 사용 중인 데이터 모델 조회", description =
            "해당 속성을 사용하고 있는 데이터 모델의 type 목록을 반환합니다. (하위 속성으로 사용 중인 경우 포함)<br><br>"
                    + "속성을 수정/삭제하기 전에 영향 범위를 확인할 때 사용합니다. 사용 중인 모델이 없으면 빈 목록을 반환합니다."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공",
            content = @Content(examples = @ExampleObject(value = "[\"Building\", \"Parking\"]")))
    public List<String> readUsingModel(
            @Parameter(description = "속성 id (속성 이름)", example = "category")
            @PathVariable String attributeId) {
        log.info("Method readUsingModel request msg='{}'" + attributeId);
        return attributeService.readUsingModel(attributeId);

    }

    @PutMapping(value = "/attributes")
    @Operation(summary = "속성 수정", description =
            "`id` 로 찾은 속성의 내용을 요청 본문으로 수정합니다.<br><br>"
                    + "- **데이터 모델에서 사용 중인 속성은 수정할 수 없습니다.** 먼저 *속성을 사용 중인 데이터 모델 조회* 로 확인하세요.<br>"
                    + "- 요청 본문 규칙은 *속성 생성* 과 동일합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(examples = @ExampleObject(value = "ATTRIBUTE UPDATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "필수 값 누락 또는 허용되지 않은 valueType",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 id 의 속성이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "422", description = "데이터 모델에서 사용 중인 속성은 수정 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String updateAttribute(
            @RequestBody AttributeRequestDto attributeRequestDto) {
        log.info("Method updateAttribute request msg='{}'" + attributeRequestDto);
        return attributeService.updateAttribute(attributeRequestDto);

    }

    @DeleteMapping(value = "/attributes/{attributeId}")
    @Operation(summary = "속성 삭제", description =
            "속성을 삭제합니다.<br><br>"
                    + "다음 경우에는 삭제할 수 없습니다.<br>"
                    + "- 데이터 모델에서 사용 중인 속성<br>"
                    + "- 속성 스키마에 등록된 속성 (먼저 *속성 스키마 수정* 으로 스키마에서 제거)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "삭제 성공",
                    content = @Content(examples = @ExampleObject(value = "ATTRIBUTE DELETE SUCCESS"))),
            @ApiResponse(responseCode = "404", description = "해당 id 의 속성이 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "422", description = "데이터 모델 또는 속성 스키마에서 사용 중인 속성은 삭제 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String deleteAttribute(
            @Parameter(description = "속성 id (속성 이름)", example = "category")
            @PathVariable String attributeId) {
        log.info("Method deleteAttribute request msg='{}'" + attributeId);
        return attributeService.deleteAttribute(attributeId);
    }

}
