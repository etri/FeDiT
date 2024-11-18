package kr.co.e8ight.auth.util;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import kr.co.e8ight.auth.dto.TokenDto;
import kr.co.e8ight.auth.entity.Member;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String AUTHORITIES_KEY = "auth";

    @Value("${token.access_expiration_time}")
    private String ACCESS_TOKEN_EXPIRE_TIME;
    @Value("${token.refresh_expiration_time}")
    private String REFRESH_TOKEN_EXPIRE_TIME;
//    private static final long ACCESS_TOKEN_EXPIRE_TIME = 1000 * 60 * 60 ;
//    private static final long REFRESH_TOKEN_EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30 ;  // 30일

    @Value("${token.secret}")
    private String secret;

    private Key key;

    @PostConstruct
    public void init(){
        String keyBytes = Encoders.BASE64.encode(secret.getBytes());
        this.key = Keys.hmacShaKeyFor(keyBytes.getBytes());
    }

    public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public boolean isTokenExpired(String token) {
        return this.getAllClaimsFromToken(token).getExpiration().before(new Date());
    }

    public boolean isInvalid(String token) {
        return this.isTokenExpired(token);
    }

    public TokenDto generateTokenDto(Member member) {
        long now = (new Date()).getTime();


        // Access Token 생성
        Date accessTokenExpiresIn = new Date(now + Long.parseLong(ACCESS_TOKEN_EXPIRE_TIME));
        String accessToken = Jwts.builder()
                .setSubject(String.valueOf(member.getId()))
                .claim(AUTHORITIES_KEY, member.getAuthType())
                .setExpiration(accessTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();

        // Refresh Token 생성
        String refreshToken = Jwts.builder()
                .setExpiration(new Date(now + (Long.parseLong(REFRESH_TOKEN_EXPIRE_TIME))))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();

        return TokenDto.builder()
                .id(member.getId())
                .accessToken(accessToken)
                .accessTokenExpiresIn(accessTokenExpiresIn.getTime())
                .refreshToken(refreshToken)
                .build();
            
    }

    public TokenDto accessTokenDto(Member member, String refreshToken) {
        long now = (new Date()).getTime();


        // Access Token 생성
        Date accessTokenExpiresIn = new Date(now + Long.parseLong(ACCESS_TOKEN_EXPIRE_TIME));
        String accessToken = Jwts.builder()
                .setSubject(String.valueOf(member.getId()))
                .claim(AUTHORITIES_KEY, member.getAuthType())
                .setExpiration(accessTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();


        return TokenDto.builder()
                .id(member.getId())
                .accessToken(accessToken)
                .accessTokenExpiresIn(accessTokenExpiresIn.getTime())
                .refreshToken(refreshToken)
                .build();

    }

    public Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }
}
