package net.jw.twin.repository.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Component
public class ShaUtil {
    private final static String salt = "aaa";

    private String bytesToHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder();
        for (byte b : bytes) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    private String salted(String text) {
        return salt + text;
    }

    public String createHash(String text) {
        MessageDigest md = null;
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        md.update(salted(text).getBytes());

        return bytesToHex(md.digest());
    }

    public boolean verifyHash(String hash, String text) {
        return hash.equals(createHash(salted(text)));
    }
}
