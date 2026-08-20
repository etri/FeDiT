package kr.co.e8ight.ndxpro.fileservice.service;

import org.springframework.stereotype.Component;
import org.springframework.util.DigestUtils;

@Component
public class UFIDBuilder {

    public String buildUFID(String checksum, String originalFilename) {
        String sourceString = checksum + originalFilename;
        return DigestUtils.md5DigestAsHex(sourceString.getBytes());
    }
}
