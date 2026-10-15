package kr.co.e8ight.ndxpro.fileservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class UFIDBuilderTest {

    @InjectMocks
    private UFIDBuilder ufIDBuilder;

    @Test
    public void buildUfIdTest() {
        String checksum = "b6221445c4a347e405231d07ac02d3df";
        String fileName = "file.txt";

        String ufId1 = ufIDBuilder.buildUFID(checksum, fileName);
        System.out.println(checksum + " + " + fileName);

        fileName = "file2.txt";

        String ufId2 = ufIDBuilder.buildUFID(checksum, fileName);
        System.out.println(checksum + " + " + fileName);

        checksum = checksum + "123";

        String ufId4 = ufIDBuilder.buildUFID(checksum, fileName);
        System.out.println(checksum + " + " + fileName);

        assertThat(ufId1.equals(ufId2)).isFalse();
        assertThat(ufId2.equals(ufId4)).isFalse();
        assertThat(ufId1.equals(ufId4)).isFalse();
    }
}