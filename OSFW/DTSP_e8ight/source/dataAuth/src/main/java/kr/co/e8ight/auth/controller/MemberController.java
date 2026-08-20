package kr.co.e8ight.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import kr.co.e8ight.auth.dto.*;
import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.service.MemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/auth")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @Operation(summary = "회원가입", description = "회원가입 api입니다.")
    @PostMapping("/signup")
    public ResponseEntity<Member> signup(@Valid @RequestBody JoinRequestDto memberRequestDto){
        log.info("signup="+memberRequestDto.toString());
        return new ResponseEntity<>(memberService.signup(memberRequestDto), HttpStatus.OK);
    }

    @Operation(summary = "전체멤버조회", description = "전체멤버조회를 페이징으로 요청합니다.")
    @GetMapping(value="/members")
    public ResponseEntity<Page<MemberResponseDto>> memberList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size){
        log.info("page ={}, size={}", page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return new ResponseEntity<>(memberService.getMemberList(pageable), HttpStatus.OK);
    }

    @Operation(summary = "멤버조회", description = "멤버id로 멤버정보를 조회합니다.")
    @GetMapping(value="/getMember")
    public MemberResponseDto memberDetail(@RequestParam(name = "memberId") String memberId){
        log.info("memberId="+memberId);
        return memberService.getMemberByMemberId(memberId);
    }

    @Operation(summary = "멤버조회", description = "멤버 db pk id로 조회힙나디.")
    @GetMapping(value="/getMemberById")
    public MemberResponseDto memberDetail(@RequestParam Integer id){
        log.info("id="+id);
        return memberService.getMemberById(id);
    }

    @Operation(summary = "멤버조회", description = "멤버 accessToken으로 멤버정보를 조회합니다.")
    @GetMapping(value="/getMemberByToken")
    public MemberResponseDto memberDetailByToken(@Valid @RequestHeader(HttpHeaders.AUTHORIZATION) String accessToken){
        log.info("accessToken="+accessToken);
        return memberService.getMemberByToken(accessToken);
    }

    @Operation(summary = "멤버수정", description = "멤버id로 멤버정보를 수정합니다.")
    @PostMapping(value="/updMember")
    public ResponseEntity<String> updMemberInfo(@Valid @RequestBody MemberDto memberDto){
        log.info("memberId="+memberDto.toString());
        long result = memberService.updateMember(memberDto);

        return new ResponseEntity<>("Success", HttpStatus.OK);
    }


    @Operation(summary = "멤버삭제", description = "멤버id로 멤버정보를 삭제합니다.")
    @PostMapping(value="/delete")
    public ResponseEntity<String> delete(@RequestParam String memberId){
        log.info("memberId="+memberId);
        long result = memberService.deleteMember(null, memberId);

        return new ResponseEntity<>("Success", HttpStatus.OK);
    }

    @Operation(summary = "멤버삭제", description = "멤버 db pk id로 멤버정보를 삭제합니다.")
    @PostMapping(value="/deleteById")
    public ResponseEntity<String> delete(@RequestParam Integer id){
        log.info("id="+id);
        long result = memberService.deleteMember(id, null);

        return new ResponseEntity<>("success", HttpStatus.OK);
    }

    @Operation(summary = "비밀번호 초기화", description = "비밀번호 초기화입니다..")
    @PutMapping(value="/initPasswd")
    public ResponseEntity<PasswdResponseDto> initPassword(@RequestParam(value="memberId", defaultValue = "e8ight2810") String memberId){
        log.info("memberId="+memberId);
        return new ResponseEntity<>(memberService.initPassword(null, memberId), HttpStatus.OK);
    }

    @Operation(summary = "비밀번호 초기화", description = "멤버 db pk id로 조회하여 비밀번호를 초기화합니다.")
    @PutMapping(value="/initPasswdById")
    public ResponseEntity<PasswdResponseDto> initPassword(@RequestParam Integer id){
        log.info("id="+id);

        return new ResponseEntity<>(memberService.initPassword(id, null), HttpStatus.OK);
    }
}
