package kr.co.e8ight.ndxpro_v1_datamanager.service;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.defaultvalue.DataModelDefaultValue;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.UnitCode;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.DataModelRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.DataModelResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.UnitCodeResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.DataModelRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.repository.UnitCodeRepository;
import kr.co.e8ight.ndxpro_v1_datamanager.util.DataModelException;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext
@ExtendWith(MockitoExtension.class)
@EnableAutoConfiguration(exclude = {
        FileService.class
})
public class DataModelServiceTest {

    @Mock
    private DataModelRepository dataModelRepository;
    @Mock
    private UnitCodeRepository  unitCodeRepository;
    @InjectMocks
    private DataModelService dataModelService;

    DataModelRequestDto dataModelRequestDto;

    DataModel dataModel;

    @BeforeEach
    void before() {
        dataModelRequestDto = DataModelDefaultValue.initialDataModelRequestDto();
        dataModel = DataModelDefaultValue.initialDataModel();
        this.dataModelRepository.deleteAll();
    }

    @Nested
    @DisplayName("데이터모델 생성 성공케이스")
    class CreateDataModel {

        // 성공 케이스
        @DisplayName("데이터모델 생성")
        @Test
        void createDataModel() throws IOException, ParseException {

            //given
            ArgumentCaptor<DataModel> captor = ArgumentCaptor.forClass(DataModel.class);

            //when
//            DataModelRequestDto finalDataModelRequestDto = dataModelRequestDto1;
            //when
            dataModelService.createDataModel(dataModelRequestDto);
            verify(dataModelRepository, times(1)).save(captor.capture());
            DataModel value = captor.getValue();
            List<DataModel> allValues = captor.getAllValues();

            // then
            assertEquals(1, allValues.size());
            assertEquals(value.getType(), dataModelRequestDto.getType());
        }

        @DisplayName("DataModel 2개 생성")
        @Test
        void createTwoDataModel() throws IOException, ParseException {

//            dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;

            //given
            DataModelRequestDto dataModelRequestDto1 = dataModelRequestDto;
            DataModelRequestDto dataModelRequestDto2 = dataModelRequestDto;
            dataModelRequestDto2.setId("urn:e8ight:Signal:");
            dataModelRequestDto2.setType("Signal");

            ArgumentCaptor<DataModel> captor = ArgumentCaptor.forClass(DataModel.class);
            //given
            dataModelService.createDataModel(dataModelRequestDto1);
            dataModelService.createDataModel(dataModelRequestDto2);

            //when
            verify(dataModelRepository, times(2)).save(captor.capture());
            List<DataModel> allValues = captor.getAllValues();
            String type = captor.getAllValues().get(0).getType();
            String type2 = captor.getAllValues().get(1).getType();

            //then
            assertEquals(2, allValues.size());
            assertEquals(dataModelRequestDto.getType(), type);
            assertEquals(dataModelRequestDto2.getType(), type2);
        }


    }

    @DisplayName("데이터 모델 생성 실패케이스")
    @Nested
    class CreateDataModelFail {

        @DisplayName("데이터 모델 중복 생성")
        @Test
        void duplicatedDataModel() {

            //given
//            dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;
            dataModel = DataModelDefaultValue.dataModel;

            dataModelRequestDto.setType("Vehicle");
            dataModelRequestDto.setId("urn:e8ight:Vehicle:");

            given(dataModelRepository.findByType(dataModelRequestDto.getType()))
                    .willReturn(Optional.of(dataModel));

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.createDataModel(dataModelRequestDto);
            });
            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "Already Exists. DataModel= " + dataModelRequestDto.getType());

        }

        @DisplayName("데이터 모델 필수 파라미터 체크 Id")
        @Test
        void validateParameterId() {

            //given
            DataModelRequestDto dataModelRequestDto1 = new DataModelRequestDto();
            dataModelRequestDto1 = dataModelRequestDto;
            //when
            dataModelRequestDto1.setId(null);

            //when
            DataModelRequestDto finalDataModelRequestDto = dataModelRequestDto1;
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.validateParameter(finalDataModelRequestDto);
            });
            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "DataModel Id Is Empty");
        }

        @DisplayName("데이터 모델 필수 파라미터 체크 타입")
        @Test
        void validateParameterType() {
            //given
//            dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;
            dataModelRequestDto.setType(null);

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.validateParameter(dataModelRequestDto);
            });
            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "DataModel Type Is Empty");
        }

        @DisplayName("데이터 모델 필수 파라미터 체크 Id 포멧")
        @Test
        void validateParameterIdFormat() {

            //given
//            dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;
            dataModelRequestDto.setId("urTTTTTn:ngsi-ld:Vsssehicle:");
            dataModelRequestDto.setType("Vehicle");
            //when
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.validateParameter(dataModelRequestDto);
            });
            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "Invalid Format ID= " + dataModelRequestDto.getId() + " Type= "
                    + dataModelRequestDto.getType());
        }

        @DisplayName("데이터 모델 생성시 attributeType 체크 실패")
        @Test
        void checkAttributeType() {

//            dataModelRequestDto = DataModelDefaultValue.dataModelRequestDto;
            //given
            HashMap<String, Object> attributeValue = new HashMap<>();
            attributeValue.put("type", "WrongProperty");
            attributeValue.put("description", "차량 종류");
            attributeValue.put("valueType", "Enum");
            attributeValue.put("enum", List.of("bus", "truck", "bike"));

            HashMap<String, Object> attribute = new HashMap<>();
            attribute.put("vehicleType", attributeValue);
            DataModelRequestDto dataModelRequestDto1 = new DataModelRequestDto();
            dataModelRequestDto1 = dataModelRequestDto;
            dataModelRequestDto1.setAttributes(attribute);

            //when
            DataModelRequestDto finalDataModelRequestDto = dataModelRequestDto1;
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.createDataModel(finalDataModelRequestDto);
            });

            String message = dataModelException.getMessage();
            //then
            assertEquals(message,
                    "Mismatch attributeType and valueType. key=vehicleType, attributeType=WrongProperty");

        }

//        @DisplayName("데이터 모델 required attribute 체크")
//        @Test
//        void checkRequiredInAttributeAny() {
//            //given
//            dataModel.setRequired(null);
//
//            //when
//            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
//                dataModelService.checkRequiredInAttribute(dataModel);
//            });
//            String message = dataModelException.getMessage();
//
//            //then
//            assertEquals(message, "Require Should Be At Least One");
//
//        }

        @DisplayName("데이터 모델 required attribute 체크")
        @Test
        void checkRequiredInAttribute() {

            dataModel = DataModelDefaultValue.dataModel;
            //given
            dataModel.setRequired(List.of("test"));

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.checkRequiredInAttribute(dataModel);
            });
            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "Attribute Does Not Include Required= test");

        }

    }

    @Nested
    @DisplayName("데이터모델 조회 성공케이스")
    class ReadDataModel {

        @DisplayName("데이터모델 단건 조회")
        @Test
        void readDataModel() throws IOException {

            dataModel = DataModelDefaultValue.dataModel;
            //given
            given(dataModelRepository.findByType(dataModel.getType())).willReturn(
                    Optional.of(dataModel));

            //when
            DataModelResponseDto dataModelResponseDto = dataModelService.readDataModel(
                    dataModel.getType(),null);

            //then
            assertEquals(dataModel.getType(), dataModelResponseDto.getType());
        }

        @DisplayName("데이터모델 unitCode 그룹 조회")
        @Test
        void readDataModelUnitCodeGroup() throws IOException {


            List<String> group = new ArrayList<>();
            group.add("길이");
            group.add("속도");
            //given
            given(unitCodeRepository.findAllGroup()).willReturn(group);

            //when
            List<String> strings = dataModelService.readUnitCodeGroup();
            String group1 = strings.get(0);
            String group2 = strings.get(1);


            //then
            assertEquals(group1,"길이");
            assertEquals(group2,"속도");
        }

        @DisplayName("데이터모델 unitCode 그룹별 목록 조회")
        @Test
        void readDataModelUnitCode() throws IOException {

            String group = "길이";

            UnitCode unitCode = new UnitCode();
            unitCode.setId("1");
            unitCode.setGroup("길이");
            unitCode.setCode("CMT");
            unitCode.setSymbol("cm");

            UnitCode unitCode1 = new UnitCode();
            unitCode1.setId("2");
            unitCode1.setGroup("길이");
            unitCode1.setCode("KTM");
            unitCode1.setSymbol("km");

            List<UnitCode> unitCodes = new ArrayList<>();
            unitCodes.add(unitCode);
            unitCodes.add(unitCode1);
            //given
            given(unitCodeRepository.findByGroup(group)).willReturn(unitCodes);

            //when
            List<UnitCodeResponseDto> strings = dataModelService.readUnitCode(group);
            String symbol = strings.get(0).getSymbol();
            String symbol1 = strings.get(1).getSymbol();


            //then
            assertEquals(symbol,"cm");
            assertEquals(symbol1,"km");
        }
    }

    @Nested
    @DisplayName("데이터모델 조회 실패케이스")
    class ReadDataModelFail {

        @DisplayName("데이터 모델이 존재하지 않을때")
        @Test
        void readContext() {

            dataModel = DataModelDefaultValue.dataModel;
            //given
            String type = dataModel.getType();

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class, () -> {
                dataModelService.readDataModel(type,null);
            });

            String message = dataModelException.getMessage();

            //then
            assertEquals(message,
                    "Not Exists. DataModel= " + dataModel.getType());
        }
    }

    @Nested
    @DisplayName("데이터모델 수정 성공케이스")
    class updateDataModel {

        @DisplayName("데이터모델 수정")
        @Test
        void updateDataModel() throws IOException {

            //given
            ArgumentCaptor<DataModel> captor = ArgumentCaptor.forClass(DataModel.class);

            String title = dataModelRequestDto.getTitle();

            when(dataModelRepository.findByType(dataModel.getType())).thenReturn(
                    Optional.of(dataModel));

            //when
            dataModelRequestDto.setTitle("제목 변경");
            dataModelService.updateDataModel(dataModelRequestDto);

            verify(dataModelRepository, times(1)).save(captor.capture());

            List<DataModel> allValues = captor.getAllValues();
            String newTitle = captor.getValue().getTitle();

            //then
            assertEquals(1, allValues.size());
            assertNotEquals(title, newTitle);

        }

        @DisplayName("데이터모델 준비 상태 수정")
        @Test
        void updateDataModelIsReady() throws IOException {

            //given
            ArgumentCaptor<DataModel> captor = ArgumentCaptor.forClass(DataModel.class);

            when(dataModelRepository.findByType(dataModel.getType())).thenReturn(
                    Optional.of(dataModel));

            Boolean afterIsReady = dataModel.getIsReady();
            //when
            dataModelService.updateDataModelIsReady(dataModel.getType());

            verify(dataModelRepository, times(1)).save(captor.capture());

            List<DataModel> allValues = captor.getAllValues();
            Boolean beforeIsReady = captor.getValue().getIsReady();

            //then
            assertEquals(1, allValues.size());
            assertFalse(afterIsReady);
            assertTrue(beforeIsReady);

        }


    }

    @Nested
    @DisplayName("데이터모델 수정 실패케이스")
    class updateDataModelFail {

        @DisplayName("준비완료 된 데이터모델 수정")
        @Test
        void updateDataModelStatus() throws IOException {

            //given
            dataModel.setIsReady(true);
            given(dataModelRepository.findByType(dataModel.getType())).willReturn(
                    Optional.of(dataModel));

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class,
                    () -> {
                        dataModelService.updateDataModel(dataModelRequestDto);
                    });

            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "You cannot modify a ready model= " + dataModel.getType());

        }

        @DisplayName("데이터모델 수정시 타입이 같지 않음")
        @Test
        void updateDataModelNoChanges() throws IOException {

            //given
            dataModelRequestDto.setId("test");

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class,
                    () -> {
                        dataModelService.updateDataModel(dataModelRequestDto);
                    });

            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "Invalid Format ID= test Type= " + dataModel.getType());

        }

    }

    @Nested
    @DisplayName("데이터모델 삭제 성공케이스")
    class deleteDataModel {

        @DisplayName("데이터모델 삭제 성공")
        @Test
        void deleteDataModel() throws IOException {

            //given

            given(dataModelRepository.findByType(dataModel.getType())).willReturn(
                    Optional.of(dataModel));

            //when
            String message = dataModelService.deleteDataModel(dataModel.getType());

            assertEquals(message, "DATA MODEL DELETE SUCCESS");

        }
    }
    @Nested
    @DisplayName("데이터모델 삭제 실패케이스")
    class deleteDataModelFail {
        @DisplayName("데이터모델 준비완료 일때")
        @Test
        void deleteDataModelFail() throws IOException {

            dataModel.setIsReady(true);
            given(dataModelRepository.findByType(dataModel.getType())).willReturn(
                    Optional.of(dataModel));

            //when
            DataModelException dataModelException = assertThrows(DataModelException.class,
                    () -> {
                        dataModelService.deleteDataModel(dataModel.getType());
                    });

            String message = dataModelException.getMessage();

            //then
            assertEquals(message, "You cannot modify a ready model= " + dataModel.getType());


    }
}
}
