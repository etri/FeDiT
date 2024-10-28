package kr.co.e8ight.ndxpro.databroker.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityProviderDto {

    String provider;

    EntityDto entity;
}
