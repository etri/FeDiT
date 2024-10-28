package kr.co.e8ight.ndxpro_v1_datamanager.service;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.ContextDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Context;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.ContextRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ContextResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.ContextRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ContextException;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.test.annotation.DirtiesContext;


@DirtiesContext
@ExtendWith(MockitoExtension.class)
@EnableAutoConfiguration(exclude = {
        FileService.class
})
public class ContextServiceTest {

    @Mock
    private ContextRepository contextRepository;

    @Mock
    private DataModelRepository dataModelRepository;
    @Spy
    private ObjectMapper objectMapper;
    @InjectMocks
    private ContextService contextService;

    @Mock
    private FileService fileService;

    ObjectMapper defaultObjectMapper = new ObjectMapper();
    ContextRequestDto contextRequestDto = defaultObjectMapper.readValue(ContextDefaultValue.context, ContextRequestDto.class);

    ContextRequestDto contextRequestDto1 = defaultObjectMapper.readValue(ContextDefaultValue.context2, ContextRequestDto.class);


    public ContextServiceTest() throws JsonProcessingException {
    }


    @BeforeEach
    void before() {
        this.contextRepository.deleteAll();
    }

    @Nested
    @DisplayName("컨텍스트 생성 성공케이스")
    class CreateContext {

        // 성공 케이스
        @DisplayName("컨텍스트 생성")
        @Test
        void createContext() throws IOException, ParseException {

            //given
            ArgumentCaptor<Context> captor = ArgumentCaptor.forClass(Context.class);
            contextService.createContext(contextRequestDto);

            //when
            verify(contextRepository, times(1)).save(captor.capture());
            Context values = captor.getValue();
            List<Context> allValues = captor.getAllValues();
            //then
            assertEquals(1, allValues.size());
            assertEquals(values.getUrl(), contextRequestDto.getUrl());
        }

        @DisplayName("컨텍스트 2개 생성")
        @Test
        void createTwoContext() throws IOException, ParseException {

            //given
            ArgumentCaptor<Context> captor = ArgumentCaptor.forClass(Context.class);
            contextService.createContext(contextRequestDto);
            contextService.createContext(contextRequestDto1);

            //when
            verify(contextRepository, times(2)).save(captor.capture());
            List<Context> allValues = captor.getAllValues();
            String version = allValues.get(0).getVersion();
            String version2 = allValues.get(1).getVersion();

            //then
            assertEquals(2, allValues.size());
            assertEquals(contextRequestDto.getVersion(),version);
            assertEquals(contextRequestDto1.getVersion(), version2);
        }
//
        @DisplayName("컨텍스트 임포트 테스트")
        @Test
        void importContext() throws JsonProcessingException {

            //given
            String url = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld";
            contextService.importContext(url);
            //when
            ArgumentCaptor<Context> captor = ArgumentCaptor.forClass(Context.class);
            verify(contextRepository, times(1)).save(captor.capture());
            List<Context> allValues = captor.getAllValues();
            int size = allValues.size();

            //then
            assertEquals(1, size);
        }

    }
//

    @DisplayName("컨텍스트 생성 실패케이스")
    @Nested
    class CreateContextFail {


        @DisplayName("컨텍스트 중복 생성")
        @Test
        void duplicatedContext() throws IOException {


            Context context = new Context();
            context.setUrl(contextRequestDto.getUrl());
            context.setDefaultUrl(contextRequestDto.getDefaultUrl());
            context.setVersion(contextRequestDto.getVersion());
            context.setValue(contextRequestDto.getValue());

            // given
            given(contextRepository.findByUrl(context.getUrl())).willReturn(Optional.of(context));

            // when
            ContextException contextException = assertThrows(ContextException.class, () -> {
                contextService.createContext(contextRequestDto);
            });
            String message = contextException.getMessage();

            //then
            assertEquals(message, "Already Exists. @context= "+context.getUrl() );

        }
//
        @DisplayName("컨텍스트 임포트 url 틀린경우")
        @Test
        void importContextFail() throws JsonProcessingException {

            //given
            String url = "https://uri.etsi.org/ngsi-ld/testFail/fail.jsonld";

            //when
            ContextException contextException = assertThrows(ContextException.class, () -> {
                contextService.importContext(url);
            });
            String message = contextException.getMessage();
            //then
            assertEquals(message,
                    "Not Found Context In= https://uri.etsi.org/ngsi-ld/testFail/fail.jsonld");
        }

        @DisplayName("컨텍스트 생성 시 url 유효성 검사")
        @Test
        void validContextUrl() {

            //given
            contextRequestDto.setUrl("asdasd");

            //when
            ContextException contextException = assertThrows(ContextException.class, () -> {
                contextService.createContext(contextRequestDto);
            });

            String message = contextException.getMessage();

            //then
            assertEquals(message, "Invalid Format ContextUrl= asdasd");


        }
//
        }
//
        @DisplayName("컨텍스트 생성시 value 유효성 검사2(value)")
        @Test
        void validContextValueDetail() throws IOException {

            //given
            String wrongValueContext = "{\n"
                    + "  \"url\":\"http://127.0.0.1:8080/e8ight-context-v1.01.jsonld\",\n"
                    + "  \"defaultUrl\":\"http://127.0.0.1:8080/e8ight-context.jsonld\",\n"
                    + "  \"version\" : \"v1.01\",\n"
                    + "  \"@context\": {\n"
                    + "        \"e8ight\": \"https://e8ight-data-models/\",\n"
                    + "        \"common\": \"https://e8ight-data-models/common/\",\n"
                    + "        \"ngsi-ld\": \"https://uri.etsi.org/ngsi-ld/\",\n"
                    + "        \"Vehicle\": \"test\"\n"
                    + "  }\n"
                    + "}\n"
                    + "\n";

            ContextRequestDto wrongContextRequestDto =
                    defaultObjectMapper.readValue(wrongValueContext, ContextRequestDto.class);
            //when
            ContextException contextException = assertThrows(ContextException.class, () -> {
                contextService.createContext(wrongContextRequestDto);
            });

            String message = contextException.getMessage();

            // then
            assertEquals(message, "@key= Vehicle @row= test");
        }
//
        @DisplayName("컨텍스트 생성시 value 유효성 검사3(key-value)")
        @Test
        void validContextValueDetail2() throws IOException {

            //given
        String wrongValueContext = "{\n"
                + "  \"url\":\"http://127.0.0.1:8080/e8ight-context-v1.01.jsonld\",\n"
                + "  \"defaultUrl\":\"http://127.0.0.1:8080/e8ight-context.jsonld\",\n"
                + "  \"version\" : \"v1.01\",\n"
                + "  \"@context\": {\n"
                + "        \"e8ight\": \"https://e8ight-data-models/\",\n"
                + "        \"common\": \"https://e8ight-data-models/common/\",\n"
                + "        \"ngsi-ld\": \"https://uri.etsi.org/ngsi-ld/\",\n"
                + "        \"Vehicle\": \"e8ight:test\"\n"
                + "  }\n"
                + "}\n"
                + "\n";

            ContextRequestDto wrongContextRequestDto =
                    defaultObjectMapper.readValue(wrongValueContext, ContextRequestDto.class);
            //when
            ContextException contextException = assertThrows(ContextException.class, () -> {
                contextService.createContext(wrongContextRequestDto);
            });

            String message = contextException.getMessage();

            // then
            assertEquals(message, "Key Value Not Matched= @key= Vehicle @row= e8ight:test");
        }



    @Nested
    @DisplayName("컨텍스트 조회 성공케이스")
    class ReadContext {

        @DisplayName("컨텍스트 조회")
        @Test
        void readContext() throws IOException {


            Context context = new Context();
            context.setUrl(contextRequestDto.getUrl());
            context.setDefaultUrl(contextRequestDto.getDefaultUrl());
            context.setVersion(contextRequestDto.getVersion());
            context.setValue(contextRequestDto.getValue());
            //given
            ArgumentCaptor<Context> captor = ArgumentCaptor.forClass(Context.class);
            contextRepository.save(context);
            verify(contextRepository, times(1)).save(captor.capture());

            //when
            given(contextRepository.findByUrl(context.getUrl())).willReturn(
                    Optional.of(context));

            ContextResponseDto contextResponseDto = contextService.readContext(context.getUrl(),
                    false);

            //then
            Context contextValue = captor.getValue();
            assertEquals(contextValue.getValue(), contextResponseDto.getContext());
        }

        //
        @DisplayName("컨텍스트 full url 조회")
        @Test
        void readContextSimple() {

            Context context = new Context();
            context.setUrl(contextRequestDto.getUrl());
            context.setDefaultUrl(contextRequestDto.getDefaultUrl());
            context.setVersion(contextRequestDto.getVersion());
            context.setValue(contextRequestDto.getValue());
            //given
            contextRepository.save(context);
            ArgumentCaptor<Context> captor = ArgumentCaptor.forClass(Context.class);
            verify(contextRepository, times(1)).save(captor.capture());

            given(contextRepository.findByUrl(context.getUrl())).willReturn(Optional.of(context));

            //when
            ContextResponseDto contextResponseDto = contextService.readContext(context.getUrl(),
                    true);
            List<Context> allValues = captor.getAllValues();
            Object oldValue = context.getValue();
            Object contextValue = contextResponseDto.getContext();
            Map<String, Object> oldContextInnerMap = (Map) oldValue;
            Map<String, Object> contextInnerMap = (Map) contextValue;

            List<String> contextKey = new ArrayList<>();
            for (Map.Entry<String, Object> entry : contextInnerMap.entrySet()) {
                contextKey.add(entry.getKey());
            }
            List<String> oldContextKey = new ArrayList<>();
            for (Map.Entry<String, Object> entry : oldContextInnerMap.entrySet()) {
                oldContextKey.add(entry.getKey());
            }

            //then
            assertTrue(contextKey.containsAll(oldContextKey));
            assertEquals(1, allValues.size());


        }

        //
        @DisplayName("컨텍스트 전체 조회")
        @Test
        void readAllContext() {
            //given
            List<String> contexts = new ArrayList<>();
            contexts.add("http://127.0.0.1:8080/e8ight-context.jsonld");
            contexts.add("http://127.0.0.2:8080/e8ight-context.jsonld");
            contexts.add("http://127.0.0.3:8080/e8ight-context.jsonld");

            //when
            given(contextRepository.findAllUrl()).willReturn(contexts);
            List<String> urls = contextService.readAllContext();

            //then
            assertEquals("http://127.0.0.1:8080/e8ight-context.jsonld", urls.get(0));
            assertEquals(3, urls.size());

        }
    }

    }

