package kr.co.e8ight.ndxpro_v1_datamanager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.config.SwaggerConfig;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeSchemaRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeSchemaResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ErrorResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.service.AttributeSchemaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/manager")
@Tag(name = SwaggerConfig.TAG_ATTRIBUTE_SCHEMA)
public class AttributeSchemaController {

    private final AttributeSchemaService attributeSchemaService;

    public AttributeSchemaController(AttributeSchemaService attributeSchemaService) {
        this.attributeSchemaService = attributeSchemaService;
    }

    @PostMapping("/attribute-schemata")
    @Operation(summary = "속성 스키마 생성", description =
            "속성들을 묶는 스키마를 생성합니다.<br><br>"
                    + "- `attributes` 에 적은 속성 id 는 모두 **미리 등록된 속성**이어야 합니다. 비워두면 빈 스키마로 생성됩니다.<br>"
                    + "- 스키마에는 각 속성이 `{속성 type}:{속성 id}` 형태로 매핑되어 저장됩니다.<br>"
                    + "- `isReadOnly=true` 로 만들면 이후 수정/삭제가 불가능합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공",
                    content = @Content(examples = @ExampleObject(value = "ATTRIBUTE SCHEMA CREATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "스키마 id 누락 또는 형식 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "`attributes` 에 등록되지 않은 속성 id 가 포함됨",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "같은 id 의 스키마가 이미 존재",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String createAttributeSchema(
            @RequestBody AttributeSchemaRequestDto attributeSchemaRequestDto) {
        log.info("Method createAttributeSchema request msg='{}'" + attributeSchemaRequestDto);
        return attributeSchemaService.createAttributeSchema(attributeSchemaRequestDto);

    }

    @GetMapping("/attribute-schemata")
    @Operation(summary = "속성 스키마 id 목록 조회", description = "등록된 모든 속성 스키마의 id 를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(examples = @ExampleObject(value = "[\"city-schema.json\", \"common-schema.json\"]"))),
            @ApiResponse(responseCode = "404", description = "등록된 스키마가 하나도 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public List<String> readAllAttributeSchemaId() {
        log.info("Method readAllAttributeSchemaId request msg='{}'");
        return attributeSchemaService.readAllAttributeSchemaId();

    }

    @GetMapping("/attribute-schemata/{attributeSchemaId}")
    @Operation(summary = "속성 스키마 단건 조회", description =
            "스키마에 등록된 속성 매핑(`속성 id` → `type:id`)을 id 순으로 정렬해 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 id 의 스키마가 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public AttributeSchemaResponseDto readAttributeSchema(
            @Parameter(description = "속성 스키마 id", example = "city-schema.json")
            @PathVariable String attributeSchemaId) {
        log.info("Method readAttributeSchema request msg='{}'" + attributeSchemaId);
        return attributeSchemaService.readAttributeSchema(attributeSchemaId);

    }

    @PutMapping("/attribute-schemata")
    @Operation(summary = "속성 스키마 수정 (속성 목록 교체)", description =
            "`id` 로 찾은 스키마의 속성 목록을 요청의 `attributes` 로 **전체 교체**합니다.<br><br>"
                    + "- 기존 매핑은 모두 지워지고 요청에 적은 속성만 남습니다. 속성을 추가/제거하려면 최종 목록을 전부 보내세요.<br>"
                    + "- `attributes` 를 비우면 스키마의 속성이 모두 제거됩니다. (삭제 전 단계로 사용)<br>"
                    + "- 읽기 전용(isReadOnly) 스키마는 수정할 수 없습니다. `isReadOnly` 값은 변경되지 않습니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공",
                    content = @Content(examples = @ExampleObject(value = "ATTRIBUTE SCHEMA UPDATE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "읽기 전용 스키마는 수정 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "스키마가 없거나, `attributes` 에 등록되지 않은 속성 id 가 포함됨",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String updateAttributeSchema(
            @RequestBody AttributeSchemaRequestDto attributeSchemaRequestDto) {
        log.info("Method updateAttributeSchema request msg='{}'" + attributeSchemaRequestDto);
        return attributeSchemaService.updateAttributeSchema(attributeSchemaRequestDto);
    }

    @DeleteMapping("/attribute-schemata/{attributeSchemaId}")
    @Operation(summary = "속성 스키마 삭제", description =
            "속성 스키마를 삭제합니다.<br><br>"
                    + "- **속성이 하나라도 등록된 스키마는 삭제할 수 없습니다.** 먼저 *속성 스키마 수정* 에서 `attributes` 를 비워 주세요.<br>"
                    + "- 읽기 전용(isReadOnly) 스키마는 삭제할 수 없습니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "삭제 성공",
                    content = @Content(examples = @ExampleObject(value = "ATTRIBUTE SCHEMA DELETE SUCCESS"))),
            @ApiResponse(responseCode = "400", description = "읽기 전용 스키마이거나 속성이 남아 있어 삭제 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 id 의 스키마가 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public String deleteAttributeSchema(
            @Parameter(description = "속성 스키마 id", example = "city-schema.json")
            @PathVariable String attributeSchemaId) {
        log.info("Method deleteAttributeSchema request msg='{}'" + attributeSchemaId);
        return attributeSchemaService.deleteAttributeSchema(attributeSchemaId);
    }

//    @PutMapping("/attributes/register/{attributeSchemaId}")
//    @Operation(summary = "attributeSchema 에 attribute 등록", description = "")
//    public String registerAttribute(@PathVariable String attributeSchemaId,@RequestBody List<String> attributeId) {
//        log.info("Method registerAttribute request msg='{}'" + attributeSchemaId +" : "+attributeId);
//        return attributeSchemaService.registerAttribute(attributeSchemaId,attributeId);
//    }
//
//    @PutMapping("/attributes/cancellation/register/{attributeSchemaId}")
//    @Operation(summary = "attributeSchema 에 attribute 등록취소", description = "")
//    public String cancellationRegisterAttribute(@PathVariable String attributeSchemaId,@RequestBody List<String> attributeId) {
//        log.info("Method cancellationRegisterAttribute request msg='{}'" + attributeSchemaId +" : "+attributeId);
//        return attributeSchemaService.cancellationRegisterAttribute(attributeSchemaId,attributeId);
//    }


}
