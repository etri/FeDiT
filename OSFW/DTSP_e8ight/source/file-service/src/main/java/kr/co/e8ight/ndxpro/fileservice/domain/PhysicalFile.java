package kr.co.e8ight.ndxpro.fileservice.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Entity
@Table(name = "physical_file", schema = "file_service", indexes = {
        @Index(name = "file_checksum_idx", columnList = "checksum"),
        @Index(name = "file_path_idx", columnList = "path")})
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PhysicalFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long size;
    private String checksum;
    @Setter
    private String path;
    @Setter
    @Enumerated(EnumType.STRING)
    private FileStatus status;
    private boolean deleted;
    private Integer uploadFailCount;

    @Transient
    @JsonIgnore
    @Setter
    private MultipartFile multipartFile;

    public static PhysicalFile create(MultipartFile multipartFile, String checksum) {
        return PhysicalFile.builder()
                .size(multipartFile.getSize())
                .status(FileStatus.WAIT)
                .checksum(checksum)
                .deleted(false)
                .multipartFile(multipartFile)
                .uploadFailCount(0)
                .build();
    }

    public void plusUploadFailCount() {
        this.uploadFailCount += 1;
    }

    public void initUploadFailCount() {
        this.uploadFailCount = 0;
    }

    public void restore() {
        this.deleted = false;
    }

    public void delete() {
        this.deleted = true;
    }
}
