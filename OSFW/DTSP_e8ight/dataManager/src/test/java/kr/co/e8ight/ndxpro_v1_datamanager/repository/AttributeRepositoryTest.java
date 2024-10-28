package kr.co.e8ight.ndxpro_v1_datamanager.repository;


import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.NdxProV1DataManagerApplication;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.AttributeDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import kr.co.e8ight.ndxpro_v1_datamanager.util.AttributeException;
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
public class AttributeRepositoryTest {

    @Autowired
    private AttributeRepository attributeRepository;

    ObjectMapper objectMapper = new ObjectMapper();

    Attribute defaultAttribute = objectMapper.readValue(AttributeDefaultValue.attribute,
            Attribute.class);

    public AttributeRepositoryTest() throws JsonProcessingException {
    }

    @BeforeEach
    void before() {
        this.attributeRepository.deleteAll();
    }

    @DisplayName("Attribute 생성")
    @Test
    void createAttribute() {
        Attribute attribute = new Attribute();
        attribute.setId("speed");
        attribute.setTitle("test");
        attribute.setDescription("test");
        attribute.setValueType("Double");
        attribute.setType("e8ight");

        //given
        attributeRepository.save(attribute);
        //when
        List<Attribute> all = attributeRepository.findAll();
        String title = all.get(0).getTitle();
        int size = all.size();
        //then
        assertEquals(attribute.getTitle(), title);
        assertEquals(1, size);
    }

    @DisplayName("Attribute 조회")
    @Test
    void readAttribute() {
        Attribute attribute = new Attribute();
        attribute.setId("speed");
        attribute.setTitle("test");
        attribute.setDescription("test");
        attribute.setValueType("Double");
        attribute.setType("e8ight");

        //given
        attributeRepository.save(attribute);

        //when
        Attribute findAttribute = attributeRepository.findByid(attribute.getId()).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        //then
        assertEquals(findAttribute.getTitle(), attribute.getTitle());
        assertEquals(findAttribute.getValueType(), attribute.getValueType());

    }

    @DisplayName("Attribute 수정")
    @Test
    void updateAttribute() {
        //given
        attributeRepository.save(defaultAttribute);

        //when
        Attribute attribute = attributeRepository.findByid(defaultAttribute.getId()).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND)
        );

        attribute.setTitle("테스트 입니다");
        attributeRepository.save(attribute);

        Attribute newAttribute = attributeRepository.findByid(defaultAttribute.getId()).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        List<Attribute> all = attributeRepository.findAll();

        //then
        assertEquals(1, all.size());
        assertEquals(newAttribute.getTitle(), "테스트 입니다");


    }

    @DisplayName("Attribute 삭제")
    @Test
    void deleteAttribute() {
        //given
        attributeRepository.save(defaultAttribute);
        //when
        Attribute attribute = attributeRepository.findByid(defaultAttribute.getId()).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        List<Attribute> allAfter = attributeRepository.findAll();

        attributeRepository.deleteById(attribute.get_id());

        List<Attribute> allBefore = attributeRepository.findAll();
        //then
        assertEquals(1, allAfter.size());
        assertEquals(0, allBefore.size());


    }

}
