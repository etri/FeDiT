package kr.co.e8ight.ndxpro_v1_datamanager.controller;


import io.swagger.v3.oas.annotations.Operation;
import java.io.IOException;
import java.util.List;
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
public class DataModelController {

    private final DataModelService dataModelService;

    public DataModelController(DataModelService dataModelService) {
        this.dataModelService = dataModelService;
    }

    @PostMapping("/data-models")
    @Operation(summary = "dataModel 생성", description = "DataModelRequestDto")
    public String createDataModel(
            @RequestBody DataModelRequestDto dataModelRequestDto)
            throws IOException {
        log.info("Method createDataModel request msg='{}'" + dataModelRequestDto);
        return dataModelService.createDataModel(dataModelRequestDto);

    }

    @PostMapping("/data-models/version")
    @Operation(summary = "dataModel 버전업", description = "DataModelRequestDto")
    public String versionUpDataModel(
            @RequestBody DataModelRequestDto dataModelRequestDto)
            throws IOException {
        log.info("Method D versionUpDataModel msg='{}'" + dataModelRequestDto);
        return dataModelService.versionUpDataModel(dataModelRequestDto);

    }

    @GetMapping(value = "/data-models")
    @Operation(summary = "dataModel 전체조회(페이징)", description =
            "curePage : 페이지 번호 (필수)<br><br>" +
                    "size : 한 페이지 데이터 개수 (default : 25)<br><br>" +
                    "word : 검색할 단어 <br><br>" +
                    "isReady : 데이터 모델 준비 여부"
    )
    public PagingResult<List<String>> readAllDataModel(
            @RequestParam(defaultValue = "0") Integer curPage,
            @RequestParam(defaultValue = "25") Integer size,
            @RequestParam(required = false) String word,
            @RequestParam(required = false) Boolean isReady
    ) {
        log.info("Method readAllDataModel request msg='{}'");
        return dataModelService.readAllDataModel(curPage, size, word, isReady);
    }

    @GetMapping(value = "/data-models/{dataModelId}")
    @Operation(summary = "dataModel 단건 조회", description = "dataModelId : 데이터모델 타입")
    public DataModelResponseDto readDataModel(@PathVariable String dataModelId, @RequestParam(required = false) String version) {
        log.info("Method readDataModel request msg='{}'" + dataModelId);
        return dataModelService.readDataModel(dataModelId,version);
    }

    @GetMapping(value = "/data-models/all-version/{dataModelId}")
    @Operation(summary = "dataModel 버전 전체 조회", description = "dataModelId : 데이터모델 타입")
    public List<DataModelResponseDto> readAllModelVersion(@PathVariable String dataModelId) {
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
    @Operation(summary = "dataModel 중복 조회", description = "dataModelId : 데이터모델 타입")
    public Boolean duplicatedCheckDataModel(@PathVariable String dataModelId) {
//        log.info("Method duplicatedCheckDataModel request msg='{}'" + dataModelId);
        return dataModelService.duplicatedCheckDataModel(dataModelId);
    }

    @GetMapping(value = "/unit-code")
    @Operation(summary = "unitCode 그룹 조회", description = "단위 그룹 조회")
    public List<String> readUnitCodeGroup() {
        log.info("Method readUnitCodeGroup request msg='{}'");
        return dataModelService.readUnitCodeGroup();
    }

    @GetMapping(value = "/unit-code/{group}")
    @Operation(summary = "unitCode 그룹별 목록 조회", description = "group : 유니코드 그룹(speed,length)")
    public List<UnitCodeResponseDto> readUnitCode(
            @PathVariable String group) {
        log.info("Method readUnitCode request msg='{}'");
        return dataModelService.readUnitCode(group);
    }

    @PutMapping("/data-models")
    @Operation(summary = "dataModel 수정", description =
            "dataModelId : 데이터 모델 타입 <br><br>" +
                    "데이터 모델 준비 여부 확인 <br><br> " +
                    "데이터 모델 사용 여부 확인"
    )
    public String updateDataModel(@RequestBody DataModelRequestDto dataModelRequestDto)
            throws IOException {
        log.info("Method updateDataModel request msg='{}'" + dataModelRequestDto);
        return dataModelService.updateDataModel(dataModelRequestDto);
    }


    @PutMapping("/data-models/readiness/{dataModelId}")
    @Operation(summary = "dataModel 준비 상태 변경",
            description = "dataModelId : 데이터모델 타입")
    public String updateDataModelIsReady(@PathVariable String dataModelId) {
        log.info("Method updateDataModelIsReady request msg='{}'" + dataModelId);
        return dataModelService.updateDataModelIsReady(dataModelId);

    }

    @DeleteMapping("/data-models/{dataModelId}")
    @Operation(summary = "dataModel 삭제", description =
            "dataModelId : 데이터 모델 타입 <br><br>" +
                    "데이터 모델 준비 여부 확인 <br><br> " +
                    "데이터 모델 사용 여부 확인"
    )
    public String deleteDataModel(@PathVariable String dataModelId) {
        log.info("Method deleteDataModel request msg='{}'" + dataModelId);
        return dataModelService.deleteDataModel(dataModelId);
    }


}
