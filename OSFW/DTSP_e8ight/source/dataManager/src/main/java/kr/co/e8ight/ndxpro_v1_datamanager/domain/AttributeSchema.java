package kr.co.e8ight.ndxpro_v1_datamanager.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@Document(collection = "attributeSchema")
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class AttributeSchema {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    @Column(
            name = "_id",
            nullable = false,
            columnDefinition = "ObjectId"
    )
    private String _id;

    private String id;

    private Map<String, String> value;

    private Boolean isReadOnly;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    public void updateAttributeSchema(String attributeSchemaId) {
        this.id=attributeSchemaId;
    }
}
