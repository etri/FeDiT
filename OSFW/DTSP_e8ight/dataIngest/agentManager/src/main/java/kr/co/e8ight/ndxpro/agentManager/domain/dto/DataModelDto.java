package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import kr.co.e8ight.ndxpro.agentManager.domain.DataModel;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
public class DataModelDto {
    private String modelType;
    private String context;

    private static DataModelDto of(DataModel dataModel) {
        return new DataModelDto(dataModel.getModelType(), dataModel.getContext());
    }

    public static List<DataModelDto> of(List<DataModel> dataModels) {
        List<DataModelDto> dataModelList = new ArrayList<>();

        dataModels.forEach(dataModel -> dataModelList.add(DataModelDto.of(dataModel)));
        return dataModelList;
    }
}
