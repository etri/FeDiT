package kr.co.e8ight.ndxpro.databroker.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection="entities")
public class Entity implements Persistable<EntityId> {

    @Id
    @JsonProperty("_id")
    private EntityId id;

    private LinkedHashMap<String, String> attrNames;

    private List<Attribute> attrs;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @CreatedDate
    private LocalDateTime creDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @LastModifiedDate
    private LocalDateTime modDate;

    @Field("@context")
    @JsonProperty("@context")
    private String context;

    @Override
    public boolean isNew() {
        return creDate == null;
    }

}
