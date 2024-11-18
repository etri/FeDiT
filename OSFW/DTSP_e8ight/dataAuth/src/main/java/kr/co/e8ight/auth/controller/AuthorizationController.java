package kr.co.e8ight.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import kr.co.e8ight.auth.dto.AuthorityResposeDto;
import kr.co.e8ight.auth.dto.ErrorDTO;
import kr.co.e8ight.auth.dto.MemberResponseDto;
import kr.co.e8ight.auth.entity.AuthHistory;
import kr.co.e8ight.auth.service.AuthorizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/auth")
public class AuthorizationController {
    private final AuthorizationService authorizationService;

    public AuthorizationController(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    @Operation(summary = "멤버 권한 요청", description = "멤버 권한 레벨업 요청합니다.")
    @PostMapping(value="/reqLevelUpById")
    public ResponseEntity<?> requestToAdminById(@RequestParam Integer id){
        log.info("id="+id);
        Boolean result = authorizationService.reqLevelUp(id, null);

        return new ResponseEntity<>(result? "Success" :
                new ErrorDTO(404, "There is no member or has already been leveled up. id="+id), HttpStatus.OK);
    }

    @Operation(summary = "멤버 권한 요청", description = "멤버id로 권한 레벨업 요청합니다.")
    @PostMapping(value="/reqLevelUp")
    public ResponseEntity<?> requestToAdminByMemberId(@RequestParam String memberId){
        log.info("memberId="+memberId);
        Boolean result = authorizationService.reqLevelUp(null, memberId);

        return new ResponseEntity<>(result? "Success" :
                new ErrorDTO(404, "There is no member or has already been leveled up. memberId="+memberId), HttpStatus.OK);
    }

    @Operation(summary = "권한 요청한 멤버 목록", description = "권한을 요청한 멤버 목록을 조회한다.")
    @GetMapping(value="/applyMemberList")
    public ResponseEntity<Page<AuthHistory>> getMemberToAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size){

        log.info("page={}, size={}", page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<AuthHistory> authHistoryPage =authorizationService.applyMemberList(pageable);

        return new ResponseEntity<>(authHistoryPage, HttpStatus.OK);
    }

    @Operation(summary = "멤버 권한 승인", description = "멤버의 권한을 승인합니다.")
    @PostMapping(value="/approveById")
    public ResponseEntity<String> approveToAdminById(@RequestParam Integer id){
        log.info("id= {}", id);
        MemberResponseDto memberDto = authorizationService.approveToAdmin(id, null);

        return new ResponseEntity<>("success", HttpStatus.OK);
    }

    @Operation(summary = "멤버 권한 승인", description = "멤버id로 권한을 승인합니다.")
    @PostMapping(value="/approve")
    public ResponseEntity<String> approveToAdminByMemberId(@RequestParam String memberId){
        log.info("memberId="+memberId);
        MemberResponseDto memberDto = authorizationService.approveToAdmin(null, memberId);

        return new ResponseEntity<>("Success", HttpStatus.OK);
    }

    @Operation(summary = "멤버리스트 권한 승인", description = "id리스트로 권한을 승인합니다.")
    @PostMapping(value="/approveListByIds")
    public ResponseEntity<List<MemberResponseDto>> approveListToAdminByIds(@RequestParam List<Integer> ids){
        ids.forEach(p->{
            log.info("id="+p);
        });

        List<MemberResponseDto> memberResponseDtos = authorizationService.approveListToAdmin(ids, null);

        return new ResponseEntity<>(memberResponseDtos, HttpStatus.OK);
    }

    @Operation(summary = "멤버리스트 권한 승인", description = "멤버id 리스트로 권한을 승인합니다.")
    @PostMapping(value="/approveList")
    public ResponseEntity<List<MemberResponseDto>> approveListToAdminByMemberIds(@RequestParam List<String> memberIds){
        memberIds.forEach(p->{
            log.info("memberId="+p);
        });

        List<MemberResponseDto> memberResponseDtos = authorizationService.approveListToAdmin(null, memberIds);

        return new ResponseEntity<>(memberResponseDtos, HttpStatus.OK);
    }

    @Operation(summary = "사용자 상태 변경 이력조회", description = "사용자 상태 변경한 이력을 조회한다.")
    @GetMapping(value="/getMemberHisListById")
    public List<AuthorityResposeDto> getMemberHistoryById(@RequestParam Integer id){
        log.info("id="+id);
        List<AuthorityResposeDto> authHistories =authorizationService.getMemHistory(id, null);

        return authHistories;
    }

    @Operation(summary = "사용자 상태 변경 이력조회", description = "사용자 상태 변경한 이력을 조회한다.")
    @GetMapping(value="/getMemberHisList")
    public List<AuthorityResposeDto> getMemberHistoryByMemberId(@RequestParam String memberId){
        log.info("memberId="+memberId);
        List<AuthorityResposeDto> authHistories =authorizationService.getMemHistory(null, memberId);

        log.info("history ="+authHistories.size());


        return authHistories;
    }
}
