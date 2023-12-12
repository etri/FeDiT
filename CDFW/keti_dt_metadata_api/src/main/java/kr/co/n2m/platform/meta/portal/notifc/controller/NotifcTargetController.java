package kr.co.n2m.platform.meta.portal.notifc.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.n2m.platform.meta.architecture.domain.ResultIdVo;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTargetVo;
import kr.co.n2m.platform.meta.portal.notifc.service.NotifcTargetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import static kr.co.n2m.platform.meta.architecture.component.ResponseComponent.makeResponseEntity;

@Tag(name = "알림 대상", description = "알림 대상 API")
@Slf4j
@Controller
@RequiredArgsConstructor
public class NotifcTargetController {

    private final NotifcTargetService notifcTargetService;

    /** 알림 대상 목록 조회 */
    @Operation(summary = "알림 대상 목록 조회")
    @GetMapping("/api/v1/portal/notifictargets")
    public ResponseEntity<Object> getNotifcTargetList(NotifcSearchVo searchVo) {
        return makeResponseEntity(notifcTargetService.getNotifcTargetList(searchVo), HttpStatus.OK);
    }

    /** 알림 대상 상세 조회 */
    @Operation(summary="알림 대상 상세 조회")
    @GetMapping("/api/v1/portal/notifictargets/{notifcTgtId}")
    public ResponseEntity<Object> getNotifcTypeDetail(@PathVariable String notifcTgtId) {
        NotifcTargetVo notifcTargetVo = notifcTargetService.getNotifcTargetDetail(notifcTgtId);
        if (notifcTargetVo == null) throw new ResNotFoundException("알림 대상이 존재하지 않습니다.");
        return makeResponseEntity(notifcTargetVo);
    }

    /** 알림 대상 등록 */
    @Operation(summary="알림 대상 등록")
    @PostMapping("/api/v1/portal/notifictargets")
    public ResponseEntity<Object> createNotifcTarget(@RequestBody NotifcTargetVo notificTargetVo){
        String notifcTgtId = notifcTargetService.createNotifcTarget(notificTargetVo);
        return makeResponseEntity(new ResultIdVo(notifcTgtId), HttpStatus.CREATED, "/api/v1/portal/notifictargets/" + notifcTgtId);
    }

    /** 알림 대상 수정 */
    @Operation(summary="알림 대상 수정")
    @PutMapping("/api/v1/portal/notifictargets/{notifcTgtId}")
    public ResponseEntity<Object> modifyNotifcTarget(@PathVariable String notifcTgtId, @RequestBody NotifcTargetVo notificTargetVo) {
        notifcTargetService.modifyNotifcTarget(notificTargetVo);
        return makeResponseEntity(new ResultIdVo(notifcTgtId));
    }

    /** 알림 대상 삭제 */
    @Operation(summary="알림 대상 삭제")
    @DeleteMapping("/api/v1/portal/notifictargets/{notifcTgtId}")
    public ResponseEntity<Object> deleteNotifcTarget(@PathVariable String notifcTgtId) {
        notifcTargetService.deleteNotifcTarget(notifcTgtId);
        return makeResponseEntity(null, HttpStatus.NO_CONTENT);
    }
}