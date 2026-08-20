package kr.co.e8ight.ndxpro.translatorManager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class HistoryListResponseDto {
    private List<HistoryResponseDto> histories;
}
