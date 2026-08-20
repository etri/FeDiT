package kr.co.e8ight.fdttwinservice.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import kr.co.e8ight.fdttwinservice.dto.FdtTwinResponseDto;
import kr.co.e8ight.fdttwinservice.service.FdtTwinService;
import kr.co.e8ight.fdttwinservice.util.exception.FdtTwinException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "FdtTwin Management")
@Slf4j
@RestController
@RequestMapping("/api/fdt")
@RequiredArgsConstructor
public class FdtTwinController {

    private final FdtTwinService fdtTwinService;

    @GetMapping(value = "/tour/load")
    public FdtTwinResponseDto getTouristFdtData(@
            RequestParam(required = false) String measure_position_id,
            @RequestParam String federated_digital_object_id,
            @RequestParam String secret_key) throws JsonProcessingException {
        //4d8cf9f0-0654-4bc1-bb34-edd6539d1efa
        log.info("Method getTouristFdtData request msg='{}'" + federated_digital_object_id);

        if (!secret_key.equals("4d8cf9f0-0654-4bc1-bb34-edd6539d1efa")) {
            throw new FdtTwinException(ErrorCode.UNAUTHORIZED, "Invalid secret key");
        }
        return fdtTwinService.getTouristFdtData(measure_position_id, federated_digital_object_id);
    }
}
