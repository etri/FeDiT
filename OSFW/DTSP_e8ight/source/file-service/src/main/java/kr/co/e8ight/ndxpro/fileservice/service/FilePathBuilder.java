package kr.co.e8ight.ndxpro.fileservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FilePathBuilder {

    @Value("${file-service.dir}")
    private String dir;

    public String buildPath(Long id) {
        long num = id - 1 ;
        return dir + "/" +
                getHexStringFromLong(maskLong(num, 0B1111111111111111111111111111111111000000000000000000000000000L) >> 27) +
                "/" +
                getHexStringFromLong(maskLong(num, 0B0000000000000000000000000000000000111111100000000000000000000L) >> 20) +
                "/" +
                getHexStringFromLong(maskLong(num, 0B0000000000000000000000000000000000000000011111110000000000000L) >> 13) +
                "/" +
                getHexStringFromLong(maskLong(num, 0B0000000000000000000000000000000000000000000000001111111000000L) >> 6) +
                "/";
    }

    private static long maskLong(long num, long mask) {
        return num & mask;
    }

    private String getHexStringFromLong(long num) {
        return String.format("0x%02x", num);
    }
}
