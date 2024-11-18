package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import java.util.List;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Context;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface ContextRepository extends MongoRepository<Context, String> {

    Optional<Context> findByUrl(String url);

//    Optional<Context> findFirstByDefaultUrlOrderByCreatedAtDesc(String url);

    List<Context> findByUrlOrderByCreatedAtDesc(String url);

    @Aggregation(pipeline = {
            "{'$project':  {" +
                    "url: 1" +
                    "}" +
                    "}"
    })
    List<String> findAllUrl();

}
