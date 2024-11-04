package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DataModelResponseDto {

    private String id;

    private String type;

    private String version;

    private String title;

    private String description;

    private Map<String, String> attributeNames;

    private HashMap<String, Object> attributes;

    private List<String> required;

    private List<String> reference;

    private Boolean isDynamic;

    private Boolean isReady;

    private List<String> observation;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @CreatedDate
    private LocalDateTime createdAt;


    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @LastModifiedDate
    private LocalDateTime modifiedAt;


    @Override
    public String toString() {
        return "DataModelResponseDto{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", version='" + version + '\'' +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", attributeNames=" + attributeNames +
                ", attributes=" + attributes +
                ", required=" + required +
                ", reference=" + reference +
                ", isDynamic=" + isDynamic +
                ", isReady=" + isReady +
                ", observation=" + observation +
                ", createdAt=" + createdAt +
                ", modifiedAt=" + modifiedAt +
                '}';
    }
}
