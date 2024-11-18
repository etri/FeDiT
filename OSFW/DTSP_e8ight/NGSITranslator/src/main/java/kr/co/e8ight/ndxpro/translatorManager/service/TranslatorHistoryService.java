package kr.co.e8ight.ndxpro.translatorManager.service;

import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorHistory;
import kr.co.e8ight.ndxpro.translatorManager.dto.HistoryListResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.dto.HistoryResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.repository.TranslatorHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TranslatorHistoryService {

    private final TranslatorHistoryRepository translatorHistoryRepository;

    public HistoryListResponseDto getHistories() {
        List<TranslatorHistory> agentHistoryList = translatorHistoryRepository.findAll();

        List<HistoryResponseDto> historyResponseDtoList = new ArrayList<>();

        agentHistoryList.forEach(agentHistory -> historyResponseDtoList.add(
                HistoryResponseDto.of(agentHistory)
        ));

        return new HistoryListResponseDto(historyResponseDtoList);
    }

    public TranslatorHistory recordHistory(Translator translator, String memberId) {
        TranslatorHistory translatorHistory = TranslatorHistory.builder()
                .translatorId(translator.getId())
                .translatorName(translator.getName())
                .translatorStatus(translator.getStatus())
                .operatedBy(memberId)
                .build();

        return translatorHistoryRepository.save(translatorHistory);
    }
}
