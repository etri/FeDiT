package kr.co.e8ight.ndxpro.fileservice.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Entity
@Table(name = "logical_file", schema = "file_service",
        indexes = @Index(name = "file_ufId_idx", columnList = "ufId"))
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LogicalFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ufId;
    private String originalName;
    private String extension;
    private String owner;
    private boolean deleted;

    @ManyToOne(fetch = FetchType.LAZY)
    private PhysicalFile physicalFile;

    public static LogicalFile create(String ufId, MultipartFile multipartFile, PhysicalFile physicalFile) {
        return LogicalFile.builder()
                .ufId(ufId)
                .originalName(multipartFile.getOriginalFilename())
                .extension(StringUtils.getFilenameExtension(multipartFile.getOriginalFilename()))
                //todo owner
                .owner("tester")
                .deleted(false)
                .physicalFile(physicalFile)
                .build();
    }

    public static LogicalFile create(String ufId, String filename, PhysicalFile physicalFile) {
        return LogicalFile.builder()
                .ufId(ufId)
                .originalName(filename)
                .extension(StringUtils.getFilenameExtension(filename))
                //todo owner
                .owner("tester")
                .deleted(false)
                .physicalFile(physicalFile)
                .build();
    }

    public void delete() {
        this.deleted = true;
    }

    public void restore() {
        this.deleted = false;
    }
}
