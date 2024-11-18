package kr.co.e8ight.ndxpro_v1_datamanager.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.AttributeRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.util.AttributeException;
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
@Document(collection = "attribute")
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class Attribute {

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
    private String type;

    private String attributeType;
    private String title;

    private String description;

    private String valueType;

    private String format;

//
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @CreatedDate
    private LocalDateTime createdAt;


    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @LastModifiedDate
    private LocalDateTime modifiedAt;

    public void update(AttributeRequestDto attributeRequestDto) {
        this.id = attributeRequestDto.getId();
        this.title = attributeRequestDto.getTitle();
        this.description = attributeRequestDto.getDescription();
        this.valueType = attributeRequestDto.getValueType();
        this.type = attributeRequestDto.getType();
        this.format = attributeRequestDto.getFormat();
    }

    public void setAttributeType(String attributeType) {
        if (attributeType.equals("Property")
                || attributeType.equals("GeoProperty")
                || attributeType.equals("Relationship")){
            this.attributeType = attributeType;
        }else {
            throw new AttributeException(ErrorCode.INVALID_REQUEST,
                    "AttributeType can only come with Property, GeoProperty, and relationship");
        }
    }
}
