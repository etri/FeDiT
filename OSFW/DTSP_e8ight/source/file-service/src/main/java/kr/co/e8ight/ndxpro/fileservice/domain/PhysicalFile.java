package kr.co.e8ight.ndxpro.fileservice.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
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

    @Setter
    private Long size;
    @Setter
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
