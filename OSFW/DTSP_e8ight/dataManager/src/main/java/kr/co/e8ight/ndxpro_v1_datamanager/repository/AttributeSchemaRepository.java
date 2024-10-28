package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import java.util.List;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.AttributeSchema;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttributeSchemaRepository extends MongoRepository<AttributeSchema, String> {

    Optional<AttributeSchema> findByid(String id);

    @Aggregation(pipeline = {
            "{'$project':  {" +
                    "id: 1" +
                    "}" +
                    "}"
    })
    List<String> findAllAttributeSchemaId();


    Optional<AttributeSchema> deleteByid(String id);
}
