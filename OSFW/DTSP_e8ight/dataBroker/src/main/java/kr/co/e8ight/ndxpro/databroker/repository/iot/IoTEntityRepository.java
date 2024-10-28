package kr.co.e8ight.ndxpro.databroker.repository.iot;

import kr.co.e8ight.ndxpro.databroker.domain.EntityId;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IoTEntityRepository extends MongoRepository<IoTEntity, EntityId> {
    IoTEntity findByIdId(String entityId);

    IoTEntity findByIdIdAndContext(String entityId, String context);
}
