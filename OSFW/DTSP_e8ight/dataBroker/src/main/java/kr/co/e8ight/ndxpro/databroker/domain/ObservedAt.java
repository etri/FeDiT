package kr.co.e8ight.ndxpro.databroker.domain;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document
public class ObservedAt {
    String name;
    String value;
}
