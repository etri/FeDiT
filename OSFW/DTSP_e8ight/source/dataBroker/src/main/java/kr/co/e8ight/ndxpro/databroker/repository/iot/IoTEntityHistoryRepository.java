package kr.co.e8ight.ndxpro.databroker.repository.iot;

import java.util.Optional;
import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityHistory;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IoTEntityHistoryRepository extends MongoRepository<IoTEntityHistory, String> {

    @Aggregation(pipeline = {
            "{ '$match': { '$and': [ " +
                    "{ 'entity._id.id': ?0 }, " +
                    "{ 'entity.attrs.md.name': ?1 }, " +
                    "{ 'entity.attrs.md.value': ?2 } " +
                    "] } } ",
                    "{ '$limit': 1 }"
    })
    Optional<IoTEntityHistory> findFirstHistoryEntityData(String entityId, String attrName, String attrValue);
}
