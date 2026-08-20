package kr.co.e8ight.ndxpro.databroker.controller.statistics;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.dto.iot.IoTEntityValidationDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityDataModelListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsListDto;
import kr.co.e8ight.ndxpro.databroker.dto.statistics.IoTEntityStatisticsDto;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.service.statistics.IoTEntityStatisticsService;
import kr.co.e8ight.ndxpro.databroker.util.DataBrokerDateFormat;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/broker")
public class IoTEntityStatisticsController {

    private final IoTEntityStatisticsService ioTEntityStatisticsService;

    public IoTEntityStatisticsController(IoTEntityStatisticsService ioTEntityStatisticsService) {
        this.ioTEntityStatisticsService = ioTEntityStatisticsService;
    }

    @Operation(
            summary = "IoT Entity 수집 성공/실패 건 갯수 조회",
            method = "GET"
    )
    @GetMapping("/statistics")
    public IoTEntityStatisticsDto getTotalEntities(
            @RequestParam @Schema(example = "2023-03-28") String date,
            @RequestParam(required = false) @Schema(example = "SimulationVehicle") String dataModel,
            @RequestParam(required = false) @Schema(example = "UOS") String provider) {
        log.info("getTotalEntities request date={}", date);
        LocalDate localDate = LocalDate.parse(date);
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(localDate);
        return ioTEntityStatisticsService.getTotalEntities(parsedDate, dataModel, provider);
    }

    @Operation(
            summary = "일자 별 IoT Entity 수집 성공/실패 건 갯수 조회",
            method = "GET"
    )
    @GetMapping("/statistics/date-range")
    public IoTEntityStatisticsListDto getTotalEntitiesByDateRange(
            @RequestParam @Schema(example = "2023-03-21") String startDate,
            @RequestParam @Schema(example = "2023-03-28") String endDate,
            @RequestParam(required = false) @Schema(example = "SimulationVehicle") String dataModel,
            @RequestParam(required = false) @Schema(example = "UOS") String provider) {
        log.info("getTotalEntitiesByDateRange request startDate={}, endDate={}, dataModel={}, provider={}", startDate, endDate, dataModel, provider);
        LocalDate startLocalDate = LocalDate.parse(startDate);
        LocalDate endLocalDate = LocalDate.parse(endDate);
        if(startLocalDate.compareTo(endLocalDate) > 0)
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "startDate should be before than equal endDate.");
        Date parsedStartDate = DataBrokerDateFormat.formatLocalDateToDate(startLocalDate);
        Date parsedEndDate = DataBrokerDateFormat.formatLocalDateToDate(endLocalDate);
        List<Date> dateList = getDateList(startLocalDate, endLocalDate);
        return ioTEntityStatisticsService.getTotalEntitiesByDateRange(dateList, parsedStartDate, parsedEndDate, dataModel, provider);
    }

    @Operation(
            summary = "모델 별 IoT Entity 수집 성공/실패 건 갯수 조회",
            method = "GET"
    )
    @GetMapping("/statistics/model-type")
    public IoTEntityStatisticsListDto getTotalEntitiesByDataModel(
            @RequestParam @Schema(example = "2023-03-28") String date) {
        log.info("getTotalEntitiesByDataModel request date={}", date);
        LocalDate localDate = LocalDate.parse(date);
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(localDate);
        return ioTEntityStatisticsService.getTotalEntitiesByDataModel(parsedDate);
    }

    @Operation(
            summary = "수집처 별 IoT Entity 수집 성공/실패 건 갯수 조회",
            method = "GET"
    )
    @GetMapping("/statistics/provider")
    public IoTEntityStatisticsListDto getTotalEntitiesByProvider(
            @RequestParam @Schema(example = "2023-03-28") String date,
            @RequestParam @Schema(example = "SimulationVehicle") String dataModel) {
        log.info("getTotalEntitiesByProvider request date={}, dataModel={}", date, dataModel);
        LocalDate localDate = LocalDate.parse(date);
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(localDate);
        return ioTEntityStatisticsService.getTotalEntitiesByProvider(parsedDate, dataModel);
    }

    @Operation(
            summary = "수집 날짜 리스트 조회",
            method = "GET"
    )
    @GetMapping("/statistics/list/date")
    public List<String> getEntityCollectionDateList(
            @RequestParam @Schema(example = "2023") int year,
            @RequestParam @Schema(example = "3") int month) {
        log.info("getEntityCollectionDateList request year={}, month={}", year, month);
        if(year <= 0)
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid year. year=" + year);
        if(month <= 0 || month > 12)
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Invalid month. month=" + month);
        return ioTEntityStatisticsService.getEntityCollectionDateList(year, month);
    }

    @Operation(
            summary = "수집 모델 리스트 조회",
            method = "GET"
    )
    @GetMapping("/statistics/list/model-type")
    public IoTEntityDataModelListDto getEntityCollectionDataModelList(
            @RequestParam @Schema(example = "2023-03-28") String date) {
        log.info("getEntityCollectionDataModelList request date={}", date);
        LocalDate localDate = LocalDate.parse(date);
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(localDate);
        return ioTEntityStatisticsService.getEntityCollectionDataModelList(parsedDate);
    }

    @Operation(
            summary = "IoT Entity 수집 실패 건 상세 조회",
            method = "GET"
    )
    @GetMapping("/statistics/fail")
    public ResponseEntity<List<IoTEntityValidationDto>> getFailTotalEntitiesByDataModelAndProvider(
            @RequestParam @Schema(example = "2023-03-28") String date,
            @RequestParam(required = false) @Schema(example = "SimulationPedestrian") String dataModel,
            @RequestParam(required = false) @Schema(example = "UOS") String provider,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) @Schema(example = "count") String options) {
        log.info("getFailTotalEntitiesByDataModelAndProvider request date={}, dataModel={}, provider={}", date, dataModel, provider);
        LocalDate localDate = LocalDate.parse(date);
        Date parsedDate = DataBrokerDateFormat.formatLocalDateToDate(localDate);
        LocalDate nextDate = localDate.plusDays(1);
        Date parsedNextDate = DataBrokerDateFormat.formatLocalDateToDate(nextDate);
        Page<IoTEntityValidationDto> ioTEntityValidationDtos = ioTEntityStatisticsService.getFailTotalEntitiesByDataModelAndProvider(parsedDate, parsedNextDate, dataModel, provider, offset, limit);
        return getResponseEntityByOptions(options, ioTEntityValidationDtos.getContent(), ioTEntityValidationDtos.getTotalPages(), ioTEntityValidationDtos.getTotalElements());
    }

    public List<Date> getDateList(LocalDate startLocalDate, LocalDate endLocalDate) {
        Stream<LocalDate> dates = startLocalDate.datesUntil(endLocalDate.plusDays(1));
        List<LocalDate> localDateList = dates.collect(Collectors.toList());
        List<Date> dateList = new ArrayList<>();
        localDateList.stream().forEach((localDate -> {
            dateList.add(DataBrokerDateFormat.formatLocalDateToDate(localDate));
        }));
        return dateList;
    }

    public ResponseEntity getResponseEntityByOptions(String options, Object content, int page, long data) {
        if(!ValidateUtil.isEmptyData(options)) {
            if (options.contains("count")) {
                HttpHeaders headers = new HttpHeaders();
                headers.set("totalPage", String.valueOf(page));
                headers.set("totalData", String.valueOf(data));
                return new ResponseEntity<>(content, headers, HttpStatus.OK);
            } else {
                throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Not Supported options. options=" + options);
            }
        } else {
            return new ResponseEntity<>(content, HttpStatus.OK);
        }
    }
}
