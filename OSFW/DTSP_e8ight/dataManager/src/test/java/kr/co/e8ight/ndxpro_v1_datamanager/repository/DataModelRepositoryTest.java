package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.List;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.NdxProV1DataManagerApplication;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.DataModelDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.util.DataModelException;
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
public class DataModelRepositoryTest {

    @Autowired
    private DataModelRepository dataModelRepository;


//    ObjectMapper objectMapper = new ObjectMapper();
//    DataModel dataModel = objectMapper.readValue(DataModelDefaultValue.dataModel, DataModel.class);

    DataModel dataModel = DataModelDefaultValue.dataModel;
    public DataModelRepositoryTest() throws JsonProcessingException {
    }


    @BeforeEach
    void before() {
        this.dataModelRepository.deleteAll();
    }

    @DisplayName("데이터모델 생성")
    @Test
    void createDataModel() throws JsonProcessingException {


        //given
        dataModelRepository.save(dataModel);

        //when
        List<DataModel> all = dataModelRepository.findAll();
        String type = all.get(0).getType();

        //then
        assertEquals(1, all.size());
        assertEquals(type, dataModel.getType());
    }

    @DisplayName("데이터모델 조회")
    @Test
    void readDataModel() {
        //given
        dataModelRepository.save(dataModel);

        //when
        DataModel dataModels = dataModelRepository.findByType(dataModel.getType()).orElseThrow(
                () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        //then
        assertEquals(dataModels.getType(), dataModel.getType());
        assertEquals(dataModels.getId(), dataModel.getId());
    }

    @DisplayName("데이터모델 수정")
    @Test
    void updateDataModel() {

        //given
        dataModelRepository.save(dataModel);

        //when
        DataModel dataModels = dataModelRepository.findByType(dataModel.getType()).orElseThrow(
                () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND)
        );
        List<DataModel> all = dataModelRepository.findAll();

        dataModels.setDescription("테스트 입니다");
        dataModelRepository.save(dataModels);

        DataModel dataModels2 = dataModelRepository.findByType(dataModel.getType()).orElseThrow(
                () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND)
        );

        //then
        assertEquals(1, all.size());
        assertEquals(dataModels2.getDescription(), "테스트 입니다");

    }

    @DisplayName("데이터 모델 삭제")
    @Test
    void deleteDataModel() {
        //given
        dataModelRepository.save(dataModel);

        //when
        DataModel dataModels = dataModelRepository.findByType(dataModel.getType()).orElseThrow(
                () -> new DataModelException(ErrorCode.RESOURCE_NOT_FOUND)
        );

        dataModelRepository.deleteById(dataModels.get_id());

        List<DataModel> all = dataModelRepository.findAll();

        //then
        assertEquals(0, all.size());

    }


}
