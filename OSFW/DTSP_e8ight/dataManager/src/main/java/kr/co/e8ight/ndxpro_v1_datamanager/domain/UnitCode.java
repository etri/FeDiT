package kr.co.e8ight.ndxpro_v1_datamanager.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Getter
@Setter
@ToString
@Document(collection = "unitCode")
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class UnitCode {


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

    private String group;

    private String code;

    private String symbol;

    private String groupName;

}
