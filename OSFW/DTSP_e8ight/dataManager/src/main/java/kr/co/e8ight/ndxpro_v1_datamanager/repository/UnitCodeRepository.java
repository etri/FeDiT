package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.UnitCode;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UnitCodeRepository extends MongoRepository<UnitCode, String> {

    @Aggregation(pipeline = {
            "{'$project':  {" +
                    "group: 1,"+
                    "}" +
                    "}"
    })
    List<String> findAllGroup();

    List<UnitCode> findByGroup(String group);

}
