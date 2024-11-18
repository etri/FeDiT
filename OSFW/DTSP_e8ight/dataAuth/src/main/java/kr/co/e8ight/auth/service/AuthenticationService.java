package kr.co.e8ight.auth.service;

import io.jsonwebtoken.Claims;
import kr.co.e8ight.auth.dto.LoginRequestDto;
import kr.co.e8ight.auth.dto.TokenDto;
import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.entity.RefreshToken;
import kr.co.e8ight.auth.exception.AuthorizationException;
import kr.co.e8ight.auth.repository.MemberRepository;
import kr.co.e8ight.auth.repository.MemberRepositoryQdsl;
import kr.co.e8ight.auth.repository.RefreshTokenRepository;
import kr.co.e8ight.auth.repository.RefreshTokenRepositoryQdsl;
import kr.co.e8ight.auth.type.MemberStatus;
import kr.co.e8ight.auth.util.JwtUtil;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthenticationService {

    private MemberRepository memberRepository;

    private MemberRepositoryQdsl memberRepositoryQdsl;
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenRepositoryQdsl refreshTokenRepositoryQdsl;
    private JwtUtil jwtUtil;

    private PasswordEncoder passwordEncoder;

    public AuthenticationService(MemberRepository memberRepository, MemberRepositoryQdsl memberRepositoryQdsl, RefreshTokenRepository refreshTokenRepository, RefreshTokenRepositoryQdsl refreshTokenRepositoryQdsl, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.memberRepositoryQdsl = memberRepositoryQdsl;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenRepositoryQdsl = refreshTokenRepositoryQdsl;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public TokenDto login(LoginRequestDto loginRequestDto) {
        /**
         * login이 되면 access token, refresh token 발급 (기존 refresh token 삭제)
         */
        Member rMember = memberRepositoryQdsl.findByMemberId(loginRequestDto.getMemberId())
                .orElseThrow(() -> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "member id is not found. id=" + loginRequestDto.getMemberId()));

        if (rMember.getStatus().equals(MemberStatus.STOP))
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "This is a suspended member. memberId="+rMember.getMemberId());

        if (!passwordEncoder.matches(loginRequestDto.getPasswd(), rMember.getPasswd()))
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Invalid password memberId=" + loginRequestDto.getMemberId());

        TokenDto tokenDto = jwtUtil.generateTokenDto(rMember);
        Integer regId = rMember.getId();
        String refToken = tokenDto.getRefreshToken();
        Member bMember = new Member(regId);

        RefreshToken refreshToken = RefreshToken.builder()
                .member(bMember)
                .token(refToken)
                .build();

        memberRepository.save(rMember);

        Optional<RefreshToken> optRefreshToken = refreshTokenRepositoryQdsl.findByRegId(regId);
        if (optRefreshToken.isPresent())
            refreshTokenRepository.deleteById(optRefreshToken.get().getId());

        refreshTokenRepository.save(refreshToken);

        return tokenDto;
    }

    @Transactional
    public void logout(String memberId) {
        Member rMember = memberRepositoryQdsl.findByMemberId(memberId)
                .orElseThrow(() -> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member not found. id=" + memberId));

        Optional<RefreshToken> optRefreshToken = refreshTokenRepositoryQdsl.findByRegId(rMember.getId());
        if (optRefreshToken.isPresent())
            refreshTokenRepository.deleteById(optRefreshToken.get().getId());
    }

    @Transactional
    public TokenDto reToken(TokenDto tokenReqDto) {
        Optional<RefreshToken> optRefreshToken = refreshTokenRepository.findByToken(tokenReqDto.getRefreshToken());
        RefreshToken refreshToken = optRefreshToken.orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED, "Invalid token"));

        Claims claims = jwtUtil.parseClaims(tokenReqDto.getAccessToken());
        Integer memberId = Integer.parseInt(claims.getSubject());

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member not found. memberId="+memberId));

        TokenDto tokenDto = jwtUtil.generateTokenDto(member);

        refreshTokenRepository.delete(refreshToken);
        refreshTokenRepository.save(RefreshToken.builder()
                .member(member)
                .token(tokenDto.getRefreshToken())
                .build());

        return tokenDto;
    }

    @Transactional
    public TokenDto reAccessToken(TokenDto tokenReqDto) {
        Optional<RefreshToken> optRefreshToken = refreshTokenRepository.findByToken(tokenReqDto.getRefreshToken());
        RefreshToken refreshToken = optRefreshToken.orElseThrow(() -> new AuthorizationException(ErrorCode.UNAUTHORIZED, "Invalid reFresh token"));

        try {
            Boolean isExpired = jwtUtil.isTokenExpired(refreshToken.getToken());
        }catch (Exception e){
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED,"RefreshToken is expired.");
        }

        Member member = refreshToken.getMember();
        TokenDto tokenDto = jwtUtil.accessTokenDto(member, refreshToken.getToken());

/*        Claims claims = jwtUtil.parseClaims(tokenReqDto.getAccessToken());
        Integer memberId = Integer.parseInt(claims.getSubject());

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member not found. memberId="+memberId));

        TokenDto tokenDto = jwtUtil.accessTokenDto(member, refreshToken.getToken());*/

        return tokenDto;
    }
}
