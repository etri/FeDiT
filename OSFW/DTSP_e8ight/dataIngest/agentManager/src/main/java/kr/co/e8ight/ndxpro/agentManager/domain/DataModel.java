package kr.co.e8ight.ndxpro.agentManager.domain;

import kr.co.e8ight.ndxpro.agentManager.domain.dto.DataModelDto;
import lombok.*;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "data_model", schema = "agent_manager")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class DataModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Agent agent;

    private String modelType;

    private String context;

    public void setAgent(Agent agent) {
        this.agent = agent;
        agent.getDataModels().add(this);
    }

    public static DataModel of(DataModelDto models) {
        return new DataModel(null, null, models.getModelType(), models.getContext());
    }

    public static List<DataModel> of(List<DataModelDto> models) {
        List<DataModel> modelsList = new ArrayList<>();
        models.stream().forEach(dataModel -> modelsList.add(DataModel.of(dataModel)));
        return modelsList;
    }

    public void setAgentNull() {
        this.agent = null;
    }
}
