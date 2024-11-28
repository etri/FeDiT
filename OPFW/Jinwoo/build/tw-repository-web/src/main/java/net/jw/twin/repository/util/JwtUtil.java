package net.jw.twin.repository.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.*;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;
//
//@Slf4j
//@Component
//public class JwtUtil {
//    @Value("${rest.jwt.secret}")
//    private String jwtSecret;
//
//    @Value("${rest.jwt.expirationMs}")
//    private int jwtExpirationMs;
//
//    public static String aesAlg = "AES/CBC/PKCS5Padding";
//    private final String aesKey = "01234567890123456789012345678901";
//    private final String aesIv = aesKey.substring(0, 16); // 16byte
//
//    private SecretKey key() {
//        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
//    }
//
//    public String createToken(String loginId) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, InvalidKeyException, UnsupportedEncodingException, IllegalBlockSizeException, BadPaddingException {
//        return createToken(loginId, null);
//    }
//
//    public String createToken(String loginId, Long duration) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, InvalidKeyException, UnsupportedEncodingException, IllegalBlockSizeException, BadPaddingException {
//        Cipher cipher = Cipher.getInstance(aesAlg);
//        SecretKeySpec keySpec = new SecretKeySpec(aesKey.getBytes(), "AES");
//        IvParameterSpec ivParamSpec = new IvParameterSpec(aesIv.getBytes());
//        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivParamSpec);
//
//        byte[] encrypted = cipher.doFinal(loginId.getBytes("UTF-8"));
//        String cipherText = Base64.getEncoder().encodeToString(encrypted);
//
//        return Jwts.builder()
//                .subject(cipherText)
//                .issuedAt(new Date())
//                .expiration(duration!=null?new Date((new Date()).getTime()+duration):null)
//                .signWith(key())
//                .compact();
//    }
//
//    public boolean validateToken(String token) {
//        try {
//            Jws<Claims> claimsJws = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
//            return true;
//        } catch (JwtException e) {
//            return false;
//        }
//    }
//
//    public String getUserLoginIdFromToken(String token) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
//        Jws<Claims> claimsJws = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
//        String cipherText = claimsJws.getPayload().getSubject();
//
//        Cipher cipher = Cipher.getInstance(aesAlg);
//        SecretKeySpec keySpec = new SecretKeySpec(aesKey.getBytes(), "AES");
//        IvParameterSpec ivParamSpec = new IvParameterSpec(aesIv.getBytes());
//        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivParamSpec);
//
//        byte[] decodedBytes = Base64.getDecoder().decode(cipherText);
//        byte[] decrypted = cipher.doFinal(decodedBytes);
//        return new String(decrypted, "UTF-8");
//    }
//}
