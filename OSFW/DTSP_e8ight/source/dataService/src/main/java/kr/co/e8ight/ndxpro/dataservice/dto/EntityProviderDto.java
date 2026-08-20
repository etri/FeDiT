package kr.co.e8ight.ndxpro.dataservice.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityProviderDto {

    private String provider;

    private String entityId;
}
