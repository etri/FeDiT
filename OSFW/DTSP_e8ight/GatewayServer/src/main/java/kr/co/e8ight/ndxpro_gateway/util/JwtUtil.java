package kr.co.e8ight.ndxpro_gateway.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_gateway.exception.AuthorizationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.security.Key;


@Component
public class JwtUtil {
    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class.getName());

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

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Invalid JWT token signature.");
        } catch (ExpiredJwtException e) {
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Expired JWT token.");
        } catch (UnsupportedJwtException e) {
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Unsupported JWT token.");
        } catch (IllegalArgumentException e) {
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "The JWT token is invalid.");
        }
//        return false;
    }
}
