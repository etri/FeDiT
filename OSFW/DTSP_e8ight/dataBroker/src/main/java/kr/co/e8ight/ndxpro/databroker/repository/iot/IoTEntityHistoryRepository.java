package kr.co.e8ight.ndxpro.databroker.repository.iot;

import kr.co.e8ight.ndxpro.databroker.domain.iot.IoTEntityHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IoTEntityHistoryRepository extends MongoRepository<IoTEntityHistory, String> {
}
