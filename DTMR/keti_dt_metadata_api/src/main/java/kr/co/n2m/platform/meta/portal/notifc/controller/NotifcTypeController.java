package kr.co.n2m.platform.meta.portal.notifc.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTypeVo;
import kr.co.n2m.platform.meta.portal.notifc.service.NotifcTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import static kr.co.n2m.platform.meta.architecture.component.ResponseComponent.makeResponseEntity;

@Tag(name = "알림 유형", description = "알림 유형 API")
@Slf4j
@Controller
@RequiredArgsConstructor
public class NotifcTypeController {

    private final NotifcTypeService notifcTypeService;

    /** 알림 유형 목록 조회 */
    @Operation(summary = "알림 유형 목록 조회")
    @GetMapping("/api/v1/portal/notifictypes")
    public ResponseEntity<Object> getNotifcTypeList(NotifcSearchVo searchVo) {
        return makeResponseEntity(notifcTypeService.getNotifcTypeList(searchVo), HttpStatus.OK);
    }

    /** 알림 유형 상세 조회 */
    @Operation(summary="알림 유형 상세 조회")
    @GetMapping("/api/v1/portal/notifictypes/{notifcTypeId}")
    public ResponseEntity<Object> getNotifcTypeDetail(@PathVariable String notifcTypeId) {
        NotifcTypeVo notifcTypeVo = notifcTypeService.getNotifcTypeDetail(notifcTypeId);
        if (notifcTypeVo == null) throw new ResNotFoundException("알림 유형이 존재하지 않습니다.");
        return makeResponseEntity(notifcTypeVo);
    }

    /** 알림 유형 ID 중복 조회 */
    @Operation(summary = "알림 유형 ID 중복 확인")
    @GetMapping("/api/v1/portal/notifictypes/check")
    public ResponseEntity<Object> isIdDuplicated(@RequestParam String notifcTypeId) {
        return makeResponseEntity(notifcTypeService.isNotifcTypeIdExist(notifcTypeId));
    }

    /** 알림 유형 등록 */
    @Operation(summary="알림 유형 등록")
    @PostMapping("/api/v1/portal/notifictypes")
    public ResponseEntity<Object> createNotifcType(@RequestBody NotifcTypeVo notifcTypeVo){
        String notifcTypeId = notifcTypeService.createNotifcType(notifcTypeVo);
        return makeResponseEntity(new ResultIdVo(notifcTypeId), HttpStatus.CREATED, "/api/v1/portal/notifictypes/" + notifcTypeId);
    }

    /** 알림 유형 수정 */
    @Operation(summary="알림 유형 수정")
    @PutMapping("/api/v1/portal/notifictypes/{notifcTypeId}")
    public ResponseEntity<Object> modifyNotifcType(@PathVariable String notifcTypeId, @RequestBody NotifcTypeVo notifcTypeVo) {
        notifcTypeService.modifyNotifcType(notifcTypeVo);
        return makeResponseEntity(new ResultIdVo(notifcTypeId));
    }

    /** 알림 유형 삭제 */
    @Operation(summary="알림 유형 삭제")
    @DeleteMapping("/api/v1/portal/notifictypes/{notifcTypeId}")
    public ResponseEntity<Object> deleteNotifcType(@PathVariable String notifcTypeId) {
        notifcTypeService.deleteNotifcType(notifcTypeId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
}