package kr.co.e8ight.ndxpro.databroker.repository;

import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.domain.EntityId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntityRepository extends MongoRepository<Entity, EntityId> {
    Entity findByIdIdAndContext(String entityId, String context);
}
