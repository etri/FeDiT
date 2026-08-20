package kr.co.e8ight.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import kr.co.e8ight.auth.dto.LoginRequestDto;
import kr.co.e8ight.auth.dto.TokenDto;
import kr.co.e8ight.auth.service.AuthenticationService;
import kr.co.e8ight.auth.service.MemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Operation(summary = "로그인", description = "로그인 api입니다.")
    @PostMapping(value="/login")
    public ResponseEntity<TokenDto> login(@Valid @RequestBody LoginRequestDto loginRequestDto){
        log.info("[loginRequestDto : {}] ", loginRequestDto.toString());
        return new ResponseEntity<>(authenticationService.login(loginRequestDto), HttpStatus.OK);
    }

    @Operation(summary = "로그아웃", description = "로그아웃시 token 삭제됩니다.")
    @PostMapping(value="/logout")
    public ResponseEntity<String> logout(@RequestParam(value="memberId", defaultValue = "e8ight2810") String memberId ){
        log.info("[memberId : {}] ", memberId);
        authenticationService.logout(memberId);
        return new ResponseEntity<>("Success", HttpStatus.OK);
    }

    @Operation(summary = "access토큰 재발급", description = "refresh token으로 access token 재발급됩니다.")
    @PostMapping("/reAccessToken")
    public ResponseEntity<TokenDto> reIssue(@Valid @RequestBody TokenDto tokenDto) {
        log.info("tokenDto="+tokenDto);
        return new ResponseEntity<>(authenticationService.reAccessToken(tokenDto), HttpStatus.OK);
    }
}
