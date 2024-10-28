package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.Attribute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AttributeRepository extends MongoRepository<Attribute, String> {

    Optional<Attribute> findByid(String id);

//    @Aggregation(pipeline = {
//            "{'$project':  {" +
//                    "id: 1" +
//                    "}" +
//                    "}"
//    })

    Optional<Attribute> deleteByid(String id);

    Page<Attribute> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Attribute> findByIdContainingIgnoreCaseOrderByCreatedAtDesc(String word,Pageable pageable);
    Page<Attribute> findAllByOrderByIdAsc(Pageable pageable);
    Page<Attribute> findByIdContainingIgnoreCaseOrderByIdAsc(String word,Pageable pageable);



}
