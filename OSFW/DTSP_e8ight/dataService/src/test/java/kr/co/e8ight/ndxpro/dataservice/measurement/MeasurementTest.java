package kr.co.e8ight.ndxpro.dataservice.measurement;

import kr.co.e8ight.ndxpro.dataservice.DataServiceApplication;
import kr.co.e8ight.ndxpro.dataservice.domain.ean.measurement.EnergyMeasurement;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

@Slf4j
@ActiveProfiles("dev")
@RunWith(SpringRunner.class)
@SpringBootTest(classes = {DataServiceApplication.class})
public class MeasurementTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    public void saveTest() {
        EnergyMeasurement energyMeasurement = EnergyMeasurement.builder()
                .buildingId("buildingId")
                .floorId("floorId")
                .zoneId("zoneId")
                .roomId("roomId")
                .collectionName("테스트 에너지")
                .build();
        mongoTemplate.save(energyMeasurement);
    }

}
