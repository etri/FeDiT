package kr.co.e8ight.ndxpro.fileservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class PhysicalFilePathBuilderTest {

    @Value("${file-service.dir}")
    private String dir;

    @InjectMocks
    private FilePathBuilder filePathBuilder;

    @Test
    public void buildFilePathTest() {
        String path1 = filePathBuilder.buildPath(1L);
        String path2 = filePathBuilder.buildPath(65L);
        String path3 = filePathBuilder.buildPath(64*128L);
        String path4 = filePathBuilder.buildPath(64*128+1L);
        String path5 = filePathBuilder.buildPath(64*128*128+1L);
        String path6 = filePathBuilder.buildPath(64*128*128*128L);
        String path7 = filePathBuilder.buildPath(64*128*128*128+1L);

        assertThat(path1).isEqualTo(dir+"/0x00/0x00/0x00/0x00/");
        assertThat(path2).isEqualTo(dir+"/0x00/0x00/0x00/0x01/");
        assertThat(path3).isEqualTo(dir+"/0x00/0x00/0x00/0x7f/");
        assertThat(path4).isEqualTo(dir+"/0x00/0x00/0x01/0x00/");
        assertThat(path5).isEqualTo(dir+"/0x00/0x01/0x00/0x00/");
        assertThat(path6).isEqualTo(dir+"/0x00/0x7f/0x7f/0x7f/");
        assertThat(path7).isEqualTo(dir+"/0x01/0x00/0x00/0x00/");
    }
}