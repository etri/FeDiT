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
        String documentName = "ndxpro";

        String ufId1 = ufIDBuilder.buildUFID(checksum, fileName, documentName);
        System.out.println(checksum + " + " + fileName + " + " + documentName);

        fileName = "file2.txt";

        String ufId2 = ufIDBuilder.buildUFID(checksum, fileName, documentName);
        System.out.println(checksum + " + " + fileName + " + " + documentName);

        documentName = "ndxpro2";

        String ufId3 = ufIDBuilder.buildUFID(checksum, fileName, documentName);
        System.out.println(checksum + " + " + fileName + " + " + documentName);

        checksum = checksum + "123";

        String ufId4 = ufIDBuilder.buildUFID(checksum, fileName, documentName);
        System.out.println(checksum + " + " + fileName + " + " + documentName);

        assertThat(ufId1.equals(ufId2)).isFalse();
        assertThat(ufId2.equals(ufId3)).isFalse();
        assertThat(ufId1.equals(ufId3)).isFalse();
        assertThat(ufId3.equals(ufId4)).isFalse();
    }
}