package kr.co.e8ight.ndxpro_v1_datamanager.controller;

import io.swagger.v3.oas.annotations.Operation;
import java.io.IOException;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.AttributeResponseDto;
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
public class AttributeController {

    private final AttributeService attributeService;

    public AttributeController(AttributeService attributeService) {
        this.attributeService = attributeService;

    }

    @PostMapping(value = "/attributes")
    @Operation(summary = "attribute 생성", description = "AttributeRequestDto")
    public String createAttribute(@RequestBody AttributeRequestDto attributeRequestDto)
            throws IOException {
        log.info("Method createAttribute request msg='{}'" + attributeRequestDto);
        return attributeService.createAttribute(attributeRequestDto);

    }

    @GetMapping(value = "/attributes")
    @Operation(summary = "attribute 전체 조회", description =
            "curePage : 페이지 번호 (필수)<br><br>" +
                    "size : 한 페이지 데이터 개수 (default : 25)<br><br>" +
                    "word : 검색할 단어 <br><br>")
    public PagingResult<List<String>> readAllAttribute(
            @RequestParam (defaultValue ="0")Integer curPage,
            @RequestParam(defaultValue = "25",required = false) Integer size,
            @RequestParam(required = false) String word
    ) {
        log.info("Method readAllAttribute request msg='{}'");
        return attributeService.readAllAttributeId(curPage, size, word);

    }

    @GetMapping(value = "/attributes/{attributeId}")
    @Operation(summary = "특정 attribute 조회", description =
            "attributeId : 속성 이름")
    public AttributeResponseDto readSpecificAttribute(@PathVariable String attributeId) {
        log.info("Method readSpecificAttribute request msg='{}'" + attributeId);
        return attributeService.readSpecificAttribute(attributeId);

    }
    @GetMapping(value = "/attributes/usingModel/{attributeId}")
    @Operation(summary = "attribute 를 사용 중인 모델 조회", description =
            "attributeId : 속성 이름")
    public List<String> readUsingModel(@PathVariable String attributeId) {
        log.info("Method readUsingModel request msg='{}'" + attributeId);
        return attributeService.readUsingModel(attributeId);

    }

    @PutMapping(value = "/attributes")
    @Operation(summary = "특정 attribute 수정", description =
                    "AttributeRequestDto <br><br>" +
                    "데이터 모델에서 사용 중 여부 확인"
    )
    public String updateAttribute(
            @RequestBody AttributeRequestDto attributeRequestDto) {
        log.info("Method updateAttribute request msg='{}'" + attributeRequestDto);
        return attributeService.updateAttribute(attributeRequestDto);

    }

    @DeleteMapping(value = "/attributes/{attributeId}")
    @Operation(summary = "특정 attribute 삭제", description =
            "attributeId : 속성 이름 <br><br>" +
                    "데이터 모델에서 사용 중 여부 확인 <br><br>" +
                    "스키마 등록 여부 확인"
    )
    public String deleteAttribute(
            @PathVariable String attributeId) {
        log.info("Method deleteAttribute request msg='{}'" + attributeId);
        return attributeService.deleteAttribute(attributeId);
    }

}
