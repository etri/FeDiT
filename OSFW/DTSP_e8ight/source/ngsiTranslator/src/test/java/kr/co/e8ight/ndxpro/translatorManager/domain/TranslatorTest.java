package kr.co.e8ight.ndxpro.translatorManager.domain;

import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorRegisterDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TranslatorTest {

    private TranslatorRegisterDto registerDto(Boolean isCustomTopic) {
        return new TranslatorRegisterDto(16L, "PohangRainfallTranslator", "class PohangRainfallTranslator {}",
                "PohangRainfall", "http://context", isCustomTopic, "fdt_topic", "ngsild_topic",
                false, null, null);
    }

    @Test
    @DisplayName("agent 토픽을 그대로 쓰는 translator 는 agent 필터를 켠다")
    void filterEnabledForAgentTopic() {
        Translator translator = Translator.create(registerDto(false), "tester");

        assertThat(translator.isAgentFilterEnabled()).isTrue();
    }

    @Test
    @DisplayName("source topic 을 직접 지정한 translator 는 다른 agent 데이터를 쓸 수 있도록 필터를 끈다")
    void filterDisabledForCustomTopic() {
        Translator translator = Translator.create(registerDto(true), "tester");

        assertThat(translator.isAgentFilterEnabled()).isFalse();
    }

    @Test
    @DisplayName("설정 여부가 저장되기 전 translator(null)는 기존처럼 필터를 끈다")
    void filterDisabledForLegacyTranslator() {
        Translator translator = Translator.create(registerDto(null), "tester");

        assertThat(translator.isAgentFilterEnabled()).isFalse();
    }

    @Test
    @DisplayName("수정하면 custom topic 여부도 갱신된다")
    void updateCustomTopic() {
        Translator translator = Translator.create(registerDto(null), "tester");

        translator.update(registerDto(false), "tester");

        assertThat(translator.isAgentFilterEnabled()).isTrue();
    }

    @Test
    @DisplayName("재빌드 요청은 저장된 코드와 설정을 그대로 담는다")
    void registerDtoFromTranslator() {
        Translator translator = Translator.create(registerDto(false), "tester");

        TranslatorRegisterDto dto = TranslatorRegisterDto.from(translator);

        assertThat(dto.getName()).isEqualTo("PohangRainfallTranslator");
        assertThat(dto.getTranslateCode()).isEqualTo("class PohangRainfallTranslator {}");
        assertThat(dto.getAgentId()).isEqualTo(16L);
        assertThat(dto.getIsCustomTopic()).isFalse();
        assertThat(dto.getSourceTopic()).isEqualTo("fdt_topic");
    }
}
