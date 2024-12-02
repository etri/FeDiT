package net.jw.twin.tw_service_manager.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import net.jw.twin.common.exception.CustomException;
import net.jw.twin.common.response.ResponseService;
import net.jw.twin.common.response.model.ListResult;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.db.dataItem.service.DataItemService;
import net.jw.twin.tw_service_manager.exception.ErrorStatus;
import net.jw.twin.tw_service_manager.rest.dto.DtoDataItem;
import net.jw.twin.tw_service_manager.rest.springDoc.schema.Response200ListDataItem;
import net.jw.twin.tw_service_manager.rest.springDoc.schema.Response400;
import net.jw.twin.tw_service_manager.rest.springDoc.schema.Response500;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/v1")
@Tag(name = "data-item")
@RequiredArgsConstructor
public class DataItemController {

    private final ResponseService responseService;

    @Autowired
    private DataItemService dataItemService;

    @Operation(
            summary = "데이터 정보 요청",
            description = "요청한 조건에 맞는 데이터 리스트를 응답한다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "요청한 조건에 맞는 데이터 리스트 응답.",
                            content = @Content(schema = @Schema(implementation = Response200ListDataItem.class))
                    ),
                    @ApiResponse(responseCode = "400", description = "Bad Request!",
                            content = @Content(schema = @Schema(implementation = Response400.class))
                    ),
                    @ApiResponse(responseCode = "500", description = "에러발생",
                            content = @Content(schema = @Schema(implementation = Response500.class))
                    )
            }
    )
    @GetMapping("/data-item")
    @ResponseBody
    public ListResult<?> getList(@Parameter(description = "start_reg_dt(yyyy-MM-dd HH:mm:ss)", schema = @Schema(requiredMode = Schema.RequiredMode.NOT_REQUIRED)) @RequestParam(required = false) LocalDateTime start_reg_dt,
                                 @Parameter(description = "end_reg_dt(yyyy-MM-dd HH:mm:ss)", schema = @Schema(requiredMode = Schema.RequiredMode.NOT_REQUIRED)) @RequestParam(required = false) LocalDateTime end_reg_dt,
                                 @Parameter(description = "status", schema = @Schema(requiredMode = Schema.RequiredMode.NOT_REQUIRED)) @RequestParam(required = false) String status,
                                 @Parameter(description = "category", schema = @Schema(requiredMode = Schema.RequiredMode.NOT_REQUIRED)) @RequestParam(required = false) String category,
                                 @Parameter(description = "page_number", schema = @Schema(defaultValue = "1", requiredMode = Schema.RequiredMode.NOT_REQUIRED)) @RequestParam(required = false, defaultValue = "1") Integer page_number,
                                 @Parameter(description = "number_of_rows", schema = @Schema(requiredMode = Schema.RequiredMode.NOT_REQUIRED)) @RequestParam(required = false) Integer number_of_rows
    ) {
        DataItemSearch search = DataItemSearch.builder()
                .startRegDt(start_reg_dt)
                .endRegDt(end_reg_dt)
                .category(category)
                .pagingYn(false)
                .build();


        Integer totalCount = dataItemService.count(search);

        if(null!=number_of_rows) {
            Integer start = (page_number-1)*number_of_rows;
            search.setStart(start);
            search.setLength(number_of_rows);
            search.setPagingYn(true);
        } else {
            number_of_rows = totalCount;
        }

        List<DataItem> dataItemList = Optional.ofNullable(dataItemService.selectList(search)).orElseThrow(
                () -> new CustomException(ErrorStatus.DB__FAIL_SELECT_NOT_FOUND, "start_reg_dt:" + start_reg_dt + ", end_reg_dt:" + end_reg_dt + ", status:" + status + ", category:" + category, "data.table.dataItem")
        );

        List<DtoDataItem> dtoDataItemList = new ArrayList<>();
        dataItemList.forEach(item -> {
            DtoDataItem dtoDataItem = DtoDataItem.builder()
                    .id(item.getId())
                    .type(item.getType())
                    .name(item.getName())
                    .category(item.getCategory())
                    .dataCode(item.getDataCode())
                    .status(item.getStatus())
                    .swaggerTagList(item.getSwaggerTagList())
                    .apiType(item.getApiType())
                    .dataFormat(item.getDataFormat())
                    .serviceId(item.getServiceId())
                    .externalUrl(item.getExternalUrl())
                    .restIp(item.getRestIp())
                    .restPort(item.getRestPort())
                    .swaggerUrl(item.getSwaggerUrl())
                    .swaggerHomepath(item.getSwaggerHomepath())
                    .institutionId(item.getInstitutionId())
                    .description(item.getDescription())
                    .approvalTime(item.getApprovalTime())
                    .denialTime(item.getDenialTime())
                    .deprecatedTime(item.getDeprecatedTime())
                    .currentCallCount(item.getCurrentCallCount())
                    .maxCallCount(item.getMaxCallCount())
                    .regDt(item.getRegDt())
                    .build();
            dtoDataItemList.add(dtoDataItem);
        });

//        throw new RuntimeException("aaaaaaaaaaaa");
        return responseService.getListResult(
                1,
                number_of_rows,
                totalCount,
                dtoDataItemList
        );
    }
}
