package kr.co.e8ight.ndxpro_v1_datamanager.repository;

import java.util.List;
import java.util.Optional;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.DataModel;
import kr.co.e8ight.ndxpro_v1_datamanager.util.CountResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DataModelRepository extends MongoRepository<DataModel, String> {

//    Optional<DataModel> findByTypeAndContext(String type, String context);


    Optional<DataModel> findByType(String type);

    Optional<DataModel> findFirstByAndTypeOrderByCreatedAtDesc(String type);

    Optional<DataModel> findByTypeAndVersion(String type, String version);

    @Aggregation(pipeline = {
            "{ '$match': { 'type': ?0 } }",
            "{ '$project': { 'id': 1, 'type': 1, 'version': 1, 'isReady': 1, 'createdAt': 1 } }",
            "{ '$sort': { 'createdAt': -1 } }"
    })
    Optional<List<DataModel>> findAllDataModelVersion(String type);

    @Aggregation(pipeline = {
            "{'$project':  {" +
                    "type: 1," +
                    "attributeNames:1," +
                    "attributes: 1" +
                    "}" +
                    "}"
    })
    List<DataModel> findAllDataModel();

    @Aggregation(pipeline = {
            "{ '$match': { 'type': { '$regex' : ?0 ,'$options' : 'i' }} }",
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{ '$match': {'isReady': ?1} }",
            "{ '$sort': { 'type': 1} }",
            "{'$skip':  ?2}",
            "{'$limit':  ?3}"
    })
    List<DataModel> findByIsReadyAndTypeContainingIgnoreCaseOrderByTypeAscCreatedAtDesc(String word,Boolean isReady, Integer pageNumber, Integer pageSize);

    @Aggregation(pipeline = {
            "{ '$match': { 'type': { '$regex' : ?0 ,'$options' : 'i' }} }",
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{ '$match': {'isReady': ?1} }",
            "{  $count: 'totalData'}"
    })
    CountResult countByIsReadyAndTypeContainingIgnoreCase(String word,Boolean isReady);



    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{ '$match': {'isReady': ?0} }",
            "{ '$sort': { 'type': 1} }",
            "{'$skip':  ?1}",
            "{'$limit':  ?2}"
    })
    List<DataModel> findAllByIsReadyOrderByTypeAscCreatedAtDesc(Boolean isReady, Integer pageNumber, Integer pageSize);

    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{ '$match': {'isReady': ?0} }",
            "{  $count: 'totalData'}"
    })
    CountResult countAllByIsReady(Boolean isReady);






    @Aggregation(pipeline = {
            "{ '$match': { 'type': { '$regex' : ?0 ,'$options' : 'i' }} }",
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' }} }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{ '$sort': { 'type': 1} }",
            "{'$skip':  ?1}",
            "{'$limit':  ?2}"
    })
    List<DataModel> findByTypeContainingIgnoreCaseOrderByTypeAscCreatedAtDesc(String word, Integer pageNumber, Integer pageSize);

    @Aggregation(pipeline = {
            "{ '$match': { 'type': { '$regex' : ?0 ,'$options' : 'i' }} }",
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{  $count: 'totalData'}"
    })
    CountResult countByTypeContainingIgnoreCase(String word);




    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{ '$sort': { 'type': 1} }",
            "{'$skip':  ?0}",
            "{'$limit':  ?1}"
    })
    List<DataModel> findAllByOrderByTypeAscCreatedAtDesc(Integer pageNumber, Integer pageSize);

    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$type', 'lastDocument': { '$last': '$$ROOT' } } }",
            "{ '$replaceRoot': { 'newRoot': '$lastDocument' } }",
            "{  $count: 'totalData'}"
    })
    CountResult countAll();



}
