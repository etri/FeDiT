package kr.co.e8ight.ndxpro.translatorManager.domain;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import javax.persistence.Entity;
import java.time.LocalDateTime;

@Entity
@Table(name = "translator_history", schema = "ngsi_translator")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EntityListeners(AuditingEntityListener.class)
public class TranslatorHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long translatorId;

    private String translatorName;

    @Enumerated(value = EnumType.STRING)
    private TranslatorStatus translatorStatus;

    private String operatedBy;

    @CreatedDate
    private LocalDateTime operatedAt;
}
