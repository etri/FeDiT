package kr.co.e8ight.ndxpro.agentManager.domain;

import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_history", schema = "agent_manager")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EntityListeners(AuditingEntityListener.class)
public class AgentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long agentId;

    private String agentName;

    @Enumerated(value = EnumType.STRING)
    private AgentStatus agentStatus;

    private String operatedBy;

    @CreatedDate
    private LocalDateTime operatedAt;
}
