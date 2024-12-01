package net.jw.twin.tw_service_manager.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import net.jw.twin.repository.db.ext.restKeyExt.service.RestKeyServiceExt;
import net.jw.twin.tw_service_manager.rest.dto.DtoUsageRequest;
import net.jw.twin.tw_service_manager.rest.springDoc.schema.Response400;
import net.jw.twin.tw_service_manager.rest.springDoc.schema.Response500;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/v1")
@Tag(name="rest-key")
//@Validated
public class RestKeyController {
    @Autowired
    private RestKeyServiceExt restKeyServiceExt;

    @Operation(
            summary = "데이터 사용 요청",
            description = "요청한 데이터, Rest Key가 유효한지 살피고, 유효하다면 call_count를 1증가시키고 HttpStatus.Ok 응답.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(
                                    allOf = { DtoUsageRequest.class }
                            )
                    )
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "사용 요청한 데이터와 Rest Key 가 유효함, 사용설정 완료."),
                    @ApiResponse(responseCode = "400", description = "Bad Request!",
                            content = @Content(schema = @Schema(implementation = Response400.class))
                    ),
                    @ApiResponse(responseCode = "500", description = "에러발생",
                            content = @Content(schema = @Schema(implementation = Response500.class))
                    )
            }
    )
    @PostMapping("/rest-key/usage-request")
    @ResponseBody
//    @HandleRuntimeException("/rest-key/usage-request 처리도중 예외발생.")
    public ResponseEntity<?> usageRequest(@RequestBody DtoUsageRequest dtoUsageRequest) {
        restKeyServiceExt.usageRequest(dtoUsageRequest.serviceId, dtoUsageRequest.restKey);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(
            summary = "데이터 사용 요청 유효성 체크(테스트용)",
            description = "요청한 데이터, Rest Key가 유효한지 체크한다. 유효하면 HttpStatus.Ok 응답.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(
                                    allOf = { DtoUsageRequest.class }
                            )
                    )
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "사용 요청한 데이터와 Rest Key 가 유효함."),
                    @ApiResponse(responseCode = "400", description = "Bad Request!",
                            content = @Content(schema = @Schema(implementation = Response400.class))
                    ),
                    @ApiResponse(responseCode = "500", description = "에러발생",
                            content = @Content(schema = @Schema(implementation = Response500.class))
                    )
            }
    )
    @PostMapping("/rest-key/usage-request/validate")
    @ResponseBody
//    @HandleRuntimeException("/rest-key/usage-request/validate 처리도중 예외발생.")
    public ResponseEntity<?> usageRequestValidate(@RequestBody @Valid DtoUsageRequest dtoUsageRequest) {
        restKeyServiceExt.validateUsageRequest(dtoUsageRequest.serviceId, dtoUsageRequest.restKey);
        return new ResponseEntity<>(HttpStatus.OK);
    }


    @Operation(
            summary = "데이터 사용 요청",
            description = "요청한 데이터, Rest Key가 유효한지 살피고, 유효하다면 call_count를 1증가시키고 HttpStatus.Ok 응답.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "사용 요청한 데이터와 Rest Key 가 유효함, 사용설정 완료."),
                    @ApiResponse(responseCode = "400", description = "Bad Request!",
                            content = @Content(schema = @Schema(implementation = Response400.class))
                    ),
                    @ApiResponse(responseCode = "500", description = "에러발생",
                            content = @Content(schema = @Schema(implementation = Response500.class))
                    )
            }
    )
    @GetMapping("/rest-key/usage-request")
    @ResponseBody
//    @HandleRuntimeException("/rest-key/usage-request 처리도중 예외발생.")
    public ResponseEntity<?> getUsageRequest(
            @Parameter(description = "service_id", required = true) @RequestParam String serviceId,
            @Parameter(description = "rest_key", required = true) @RequestParam String restKey
    ) {
        restKeyServiceExt.usageRequest(serviceId, restKey);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(
            summary = "데이터 사용 요청 유효성 체크(테스트용)",
            description = "요청한 데이터, Rest Key가 유효한지 체크한다. 유효하면 HttpStatus.Ok 응답.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "사용 요청한 데이터와 Rest Key 가 유효함."),
                    @ApiResponse(responseCode = "400", description = "Bad Request!",
                            content = @Content(schema = @Schema(implementation = Response400.class))
                    ),
                    @ApiResponse(responseCode = "500", description = "에러발생",
                            content = @Content(schema = @Schema(implementation = Response500.class))
                    )
            }
    )
    @GetMapping("/rest-key/usage-request/validate")
    @ResponseBody
//    @HandleRuntimeException("/rest-key/usage-request/validate 처리도중 예외발생.")
    public ResponseEntity<?> getUsageRequestValidate(
            @Parameter(description = "service_id", required = true) @RequestParam("service_id") String serviceId,
            @Parameter(description = "rest_key", required = true) @RequestParam("rest_key") String restKey
    ) {
        restKeyServiceExt.validateUsageRequest(serviceId, restKey);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
