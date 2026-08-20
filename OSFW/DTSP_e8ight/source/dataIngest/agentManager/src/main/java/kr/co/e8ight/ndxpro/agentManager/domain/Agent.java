package kr.co.e8ight.ndxpro.agentManager.domain;

import kr.co.e8ight.ndxpro.agentManager.config.Constants;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn
@Table(name = "agent_info", schema = "agent_manager")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EntityListeners(AuditingEntityListener.class)
public abstract class Agent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    @Setter
    private String name;

    @Enumerated(EnumType.STRING)
    private AgentType type;

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DataModel> dataModels = new ArrayList<>();

    @Setter
    @Enumerated(EnumType.STRING)
    private AgentStatus status;

    private String configPath;

    private String configFileName;

    @Setter
    private Long pid;

    private Boolean isCustomTopic;

    @Setter
    private String topic;

    private LocalDateTime lastSourceSignalDatetime;
    private LocalDateTime lastSinkSignalDatetime;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    /**
     * conf 파일을 사용자가 직접 편집했는지 여부.
     * true 면 요청 필드로부터 conf 를 재생성할 때 편집 내용이 사라지므로 재생성을 막는다.
     * (positional 생성자를 subclass 가 쓰고 있어 필드는 항상 맨 뒤에 추가한다)
     */
    private Boolean isCustomConfig;

    public static Agent create(AgentRequestDto requestDto, String confPath) {
        if ( requestDto.getType().equals(AgentType.HTTP) ) {
            return HttpAgent.create(requestDto, confPath);
        } else if ( requestDto.getType().equals(AgentType.HTTPS) ) {
            return HttpsAgent.create(requestDto, confPath);
        } else if ( requestDto.getType().equals(AgentType.KAFKA) ) {
            return KafkaAgent.create(requestDto, confPath);
        }
        throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Agent type : " + requestDto.getType() + "is invalid.");
    }

    public void update(AgentRequestDto requestDto) {
        this.name = requestDto.getName();
        generateConfigFileName();

        for (DataModel dataModel : this.dataModels) {
            dataModel.setAgentNull();
        }
        this.dataModels.clear();
        for (DataModel dataModel : DataModel.of(requestDto.getModels())) {
            dataModel.setAgent(this);
        }

        if ( !requestDto.getIsCustomTopic() ) {
            this.topic = "ndxpro.ingest.agent_" + this.id;
        } else {
            if ( requestDto.getTopic() == null || requestDto.getTopic().equals("") ) {
                throw new AgentException(ErrorCode.BAD_REQUEST_DATA, "Kafka target topic is required.");
            }
            this.topic = requestDto.getTopic();
        }
        this.isCustomTopic = requestDto.getIsCustomTopic();
        this.type = requestDto.getType();
    }

    public void generateConfigFileName() {
        this.configFileName = this.id + "_" + this.name + Constants.CONF_FILE_EXTENSION;
    }

    public String getConfigFileFullPath() {
        return this.getConfigPath() + this.getConfigFileName();
    }

    public void initializeSignalDatetime() {
        updateLastSinkSignalDatetime();
        updateLastSourceSignalDatetime();
    }

    public void updateLastSourceSignalDatetime() {
        this.lastSourceSignalDatetime = LocalDateTime.now();
    }

    public void updateLastSinkSignalDatetime() {
        this.lastSinkSignalDatetime = LocalDateTime.now();
    }

    public void delete() {
        this.status = AgentStatus.DELETED;
    }

    public boolean isCustomConfig() {
        return Boolean.TRUE.equals(this.isCustomConfig);
    }

    public void markCustomConfig() {
        this.isCustomConfig = true;
    }

    public void clearCustomConfig() {
        this.isCustomConfig = false;
    }
}
