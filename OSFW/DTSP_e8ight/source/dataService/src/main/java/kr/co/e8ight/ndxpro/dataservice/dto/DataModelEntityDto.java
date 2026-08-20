package kr.co.e8ight.ndxpro.dataservice.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class DataModelEntityDto {

    private String context;

    private String model;

    private int totalPage;

    private long totalData;

    List<EntityProviderDto> entities;
}
