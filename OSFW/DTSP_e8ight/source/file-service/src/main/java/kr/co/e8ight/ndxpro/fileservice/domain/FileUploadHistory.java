package kr.co.e8ight.ndxpro.fileservice.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_upload_history", schema = "file_service")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FileUploadHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private PhysicalFile physicalFile;

    private String result;

    private String message;

    private LocalDateTime dateTime;
}
