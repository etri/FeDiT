package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Optional;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.NdxProV1DataManagerApplication;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
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
public class AttributeSchemaRepositoryTest {

    @Autowired
    private AttributeSchemaRepository attributeSchemaRepository;

    @Autowired
    private AttributeRepository attributeRepository;

    @BeforeEach
    void before() {
        this.attributeSchemaRepository.deleteAll();
    }

    @DisplayName("AttributeSchema 생성")
    @Test
    void createAttributeSchema() {

        String id = "city.custom-schema.json";
        AttributeSchema attributeSchema = new AttributeSchema();
        attributeSchema.setId(id);
        //given
        attributeSchemaRepository.save(attributeSchema);
        //when
        List<AttributeSchema> all = attributeSchemaRepository.findAll();
        String schemaId = all.get(0).getId();
        int size = all.size();
        //then
        assertEquals(id, schemaId);
        assertEquals(1, size);
    }

    @DisplayName("AttributeSchema 조회")
    @Test
    void readAttributeSchema() {

        String id = "city.custom-schema.json";
        AttributeSchema newAttributeSchema = new AttributeSchema();
        newAttributeSchema.setId(id);

        //given
        attributeSchemaRepository.save(newAttributeSchema);

        //when
        AttributeSchema attributeSchema = attributeSchemaRepository.findByid(id).orElseThrow(
                () -> new AttributeException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        //then
        assertEquals(attributeSchema.getId(), id);
    }

    @DisplayName("AttributeSchema 수정")
    @Test
    void updateAttributeSchema() {

        String id = "city.custom-schema.json";
        String newId = "city2.custom-schema.json";
        AttributeSchema attributeSchema = new AttributeSchema();
        attributeSchema.setId(id);
        //given
        attributeSchemaRepository.save(attributeSchema);

        Optional<AttributeSchema> byid = attributeSchemaRepository.findByid(id);
        AttributeSchema attributeSchema1 = byid.get();
        attributeSchema1.updateAttributeSchema(newId);

        attributeSchemaRepository.save(attributeSchema1);
        //when
        List<AttributeSchema> all = attributeSchemaRepository.findAll();
        String schemaId = all.get(0).getId();
        int size = all.size();
        //then
        assertEquals(newId, schemaId);
        assertEquals(1, size);
    }

    @DisplayName("AttributeSchema 삭제")
    @Test
    void deleteAttributeSchema() {

        //given
        String id = "city.custom-schema.json";
        AttributeSchema attributeSchema = new AttributeSchema();
        attributeSchema.setId(id);

        //when
        attributeSchemaRepository.save(attributeSchema);
        List<AttributeSchema> allBefore = attributeSchemaRepository.findAll();
        int beforeSize = allBefore.size();
        attributeSchemaRepository.deleteByid(attributeSchema.getId());
        List<AttributeSchema> allAfter = attributeSchemaRepository.findAll();
        int afterSize = allAfter.size();

        //then
        assertEquals(1, beforeSize);
        assertEquals(0, afterSize);
    }
}
