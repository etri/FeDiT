package kr.co.e8ight.ndxpro.databroker.domain;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityId {

    @Field("id")
    private String id;

    private String type;

    private String servicePath;
}
