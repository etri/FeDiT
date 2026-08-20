package kr.co.e8ight.fdttwinservice.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FdtTwinDto {

    private String federated_digital_object_id;

    List<Object> dataset;
}
