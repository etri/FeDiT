package kr.co.e8ight.ndxpro.databroker.domain.iot;

import kr.co.e8ight.ndxpro.databroker.domain.Entity;
import kr.co.e8ight.ndxpro.databroker.domain.EntityId;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection="iotEntities")
public class IoTEntity extends Entity implements Persistable<EntityId> {

}
