package kr.co.e8ight.ndxpro.dataservice.controller.ean.statistics;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "StatsEnergyMeasurementController", description = "에너지 측정 통계 관리")
@RestController
@RequestMapping("/ndxpro/v1/enrg-meas-stats")
public class StatsEnergyMeasurementController {
}
