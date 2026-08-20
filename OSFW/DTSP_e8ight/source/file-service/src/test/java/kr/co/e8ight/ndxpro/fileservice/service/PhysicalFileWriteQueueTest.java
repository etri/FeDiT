package kr.co.e8ight.ndxpro.fileservice.service;

import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import kr.co.e8ight.ndxpro.fileservice.domain.PhysicalFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@TestPropertySource(locations = "classpath:application.yml")
@ExtendWith(MockitoExtension.class)
class PhysicalFileWriteQueueTest {

    @InjectMocks
    FileWriteQueue fileWriteQueue;

    @BeforeEach
    public void setUp() {
        ReflectionTestUtils.setField(fileWriteQueue, "capacity", 10L);
    }
    
    @Test
    void offerTest() {
        MockMultipartFile multipartFile1 = new MockMultipartFile("file", "file1.txt", "text/html; charset=utf-8", new byte[]{1,2,3});
        PhysicalFile physicalFile1 = PhysicalFile.create(multipartFile1, "b6221445c4a347e405231d07ac02d3da");
        fileWriteQueue.offer(physicalFile1);
        assertThat(fileWriteQueue.getUsedSize()).isEqualTo(physicalFile1.getSize());

        MockMultipartFile multipartFile2 = new MockMultipartFile("file", "file2.txt", "text/html; charset=utf-8", new byte[]{1,2,3,4,5});
        PhysicalFile physicalFile2 = PhysicalFile.create(multipartFile2, "b6221445c4a347e405231d07ac02d3db");
        fileWriteQueue.offer(physicalFile2);
        assertThat(fileWriteQueue.getUsedSize()).isEqualTo(physicalFile1.getSize() + physicalFile2.getSize());

        MockMultipartFile multipartFile3 = new MockMultipartFile("file", "file3.txt", "text/html; charset=utf-8", new byte[]{1,2});
        PhysicalFile physicalFile3 = PhysicalFile.create(multipartFile3, "b6221445c4a347e405231d07ac02d3dc");
        fileWriteQueue.offer(physicalFile3);
        assertThat(fileWriteQueue.getUsedSize()).isEqualTo(physicalFile1.getSize() + physicalFile2.getSize() + physicalFile3.getSize());

        MockMultipartFile multipartFile4 = new MockMultipartFile("file", "file4.txt", "text/html; charset=utf-8", new byte[]{1,2,3,4,5,6});
        PhysicalFile physicalFile4 = PhysicalFile.create(multipartFile4, "b6221445c4a347e405231d07ac02d3dd");
        assertThrows(FileException.class, () -> fileWriteQueue.offer(physicalFile4));
        assertThat(fileWriteQueue.getUsedSize()).isEqualTo(physicalFile1.getSize() + physicalFile2.getSize() + physicalFile3.getSize());
    }

    @Test
    void pollTest() {
        MockMultipartFile multipartFile1 = new MockMultipartFile("file", "file1.txt", "text/html; charset=utf-8", new byte[]{1,2,3});
        PhysicalFile physicalFile1 = PhysicalFile.create(multipartFile1, "b6221445c4a347e405231d07ac02d3da");
        fileWriteQueue.offer(physicalFile1);
        MockMultipartFile multipartFile2 = new MockMultipartFile("file", "file2.txt", "text/html; charset=utf-8", new byte[]{1,2,3,4,5});
        PhysicalFile physicalFile2 = PhysicalFile.create(multipartFile2, "b6221445c4a347e405231d07ac02d3db");
        fileWriteQueue.offer(physicalFile2);

        assertThat(fileWriteQueue.poll().getChecksum()).isEqualTo(physicalFile1.getChecksum());

        MockMultipartFile multipartFile3 = new MockMultipartFile("file", "file3.txt", "text/html; charset=utf-8", new byte[]{1,2});
        PhysicalFile physicalFile3 = PhysicalFile.create(multipartFile3, "b6221445c4a347e405231d07ac02d3dc");
        fileWriteQueue.offer(physicalFile3);

        assertThat(fileWriteQueue.poll().getChecksum()).isEqualTo(physicalFile3.getChecksum());

        assertThat(fileWriteQueue.poll().getChecksum()).isEqualTo(physicalFile2.getChecksum());

        assertThat(fileWriteQueue.isEmpty()).isTrue();
    }
}