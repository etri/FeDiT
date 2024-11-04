package kr.co.e8ight.ndxpro_v1_datamanager.controller;

import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeSchemaRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeSchemaResponseDto;
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
public class AttributeSchemaController {

    private final AttributeSchemaService attributeSchemaService;

    public AttributeSchemaController(AttributeSchemaService attributeSchemaService) {
        this.attributeSchemaService = attributeSchemaService;
    }

    @PostMapping("/attribute-schemata")
    @Operation(summary = "attributeSchema 생성", description =
            "AttributeSchemaRequestDto")
    public String createAttributeSchema(
            @RequestBody AttributeSchemaRequestDto attributeSchemaRequestDto) {
        log.info("Method createAttributeSchema request msg='{}'" + attributeSchemaRequestDto);
        return attributeSchemaService.createAttributeSchema(attributeSchemaRequestDto);

    }

    @GetMapping("/attribute-schemata")
    @Operation(summary = "attributeSchemaId 전체 조회", description = "")
    public List<String> readAllAttributeSchemaId() {
        log.info("Method readAllAttributeSchemaId request msg='{}'");
        return attributeSchemaService.readAllAttributeSchemaId();

    }

    @GetMapping("/attribute-schemata/{attributeSchemaId}")
    @Operation(summary = "attributeSchema 단건 조회",
            description = "attributeSchemaId : 스키마 아이디")
    public AttributeSchemaResponseDto readAttributeSchema(@PathVariable String attributeSchemaId) {
        log.info("Method readAttributeSchema request msg='{}'" + attributeSchemaId);
        return attributeSchemaService.readAttributeSchema(attributeSchemaId);

    }

    @PutMapping("/attribute-schemata")
    @Operation(summary = "attributeSchema 수정 (attribute 등록)", description =
            "List String attributeId"
    )
    public String updateAttributeSchema(
            @RequestBody AttributeSchemaRequestDto attributeSchemaRequestDto) {
        log.info("Method updateAttributeSchema request msg='{}'" + attributeSchemaRequestDto);
        return attributeSchemaService.updateAttributeSchema(attributeSchemaRequestDto);
    }

    @DeleteMapping("/attribute-schemata/{attributeSchemaId}")
    @Operation(summary = "attributeSchema 삭제", description =
            "attributeSchemaId : 스키마 아이디 <br><br>" +
            "attribute 등록 여부 확인"
    )
    public String deleteAttributeSchema(@PathVariable String attributeSchemaId) {
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
