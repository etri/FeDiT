package kr.co.e8ight.ndxpro_v1_datamanager.repository;


import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.NdxProV1DataManagerApplication;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.ContextDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Context;
import kr.co.e8ight.ndxpro_v1_datamanager.util.ContextException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;


@TestPropertySource(locations = "/application.yml")
@ContextConfiguration(classes = NdxProV1DataManagerApplication.class)
@DataMongoTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
public class ContextRepositoryTest {

    @Autowired
    private ContextRepository contextRepository;

    ObjectMapper objectMapper = new ObjectMapper();
    Context context = objectMapper.readValue(ContextDefaultValue.context, Context.class);

    public ContextRepositoryTest() throws JsonProcessingException {
    }


    @BeforeEach
    void before() {
        this.contextRepository.deleteAll();
    }

    @DisplayName("컨텍스트 생성")
    @Test
    void createContext() {
        //given
        Context save = contextRepository.save(context);

        //when
        List<Context> all = contextRepository.findAll();

        //then
        assertEquals(context.getId(), save.getId());
        assertEquals(context.getUrl(), save.getUrl());
        assertEquals(context.getValue(), save.getValue());
        assertEquals(1, all.size());
    }

    @DisplayName("컨텍스트 조회")
    @Test
    void readContext() {

        //given
        contextRepository.save(context);


        //when
        Context byUrl = contextRepository.findByUrl(context.getUrl()).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND)
        );

        assertEquals(byUrl.getId(), context.getId());
        assertEquals(byUrl.getUrl(), context.getUrl());
        assertEquals(byUrl.getValue(), context.getValue());

    }


    @DisplayName("컨텍스트 삭제")
    @Test
    void deleteContext() {

        //given
        contextRepository.save(context);


        //when
        Context byUrl = contextRepository.findByUrl(context.getUrl()).orElseThrow(
                () -> new ContextException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        contextRepository.deleteById(byUrl.getId());
        List<Context> all = contextRepository.findAll();

        //then
        assertEquals(0, all.size());
    }

}