package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorHistory;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class HistoryResponseDto {
    @Schema(description = "History ID")
    private Long id;

    @Schema(description = "Agent ID")
    private Long translatorId;

    @Schema(description = "Agent Name")
    private String translatorName;

    @Schema(description = "Agent ID")
    private TranslatorStatus translatorStatus;

    @Schema(description = "Agent ID")
    private String operatedBy;

    @Schema(description = "Agent ID")
    private LocalDateTime operatedAt;

    public static HistoryResponseDto of(TranslatorHistory translatorHistory) {
        return HistoryResponseDto.builder()
                .id(translatorHistory.getId())
                .translatorId(translatorHistory.getTranslatorId())
                .translatorName(translatorHistory.getTranslatorName())
                .translatorStatus(translatorHistory.getTranslatorStatus())
                .operatedBy(translatorHistory.getOperatedBy())
                .operatedAt(translatorHistory.getOperatedAt())
                .build();
    }
}