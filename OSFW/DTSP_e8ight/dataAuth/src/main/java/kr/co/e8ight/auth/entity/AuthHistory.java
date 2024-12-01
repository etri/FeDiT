package kr.co.e8ight.auth.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.e8ight.auth.entity.converter.ApproveLevelConverter;
import kr.co.e8ight.auth.entity.converter.AuthTypeConverter;
import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.data.domain.Persistable;

import javax.persistence.*;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="auth_his", schema = "member")
public class AuthHistory extends ReferenceEntity implements Persistable<Integer> {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column
    private Integer id;

    @JsonIgnoreProperties({"passwd", "hp", "status", "authType", "deleteYn", "refreshToken"})
    @ManyToOne(targetEntity = Member.class, fetch=FetchType.EAGER)
    @JoinColumn(name="reg_id", nullable = false)
    private Member member;

    @Column(name="req_role")
    @ColumnDefault("'MB'")
    @Convert(converter = AuthTypeConverter.class)
    private AuthType authType;

    @Column(name="approve_lv", nullable = false)
    @ColumnDefault("'NN'")
    @Convert(converter = ApproveLevelConverter.class)
    private ApproveLevel approveLevel;

    @Column(name="rj_reason")
    private String rjReason;

    @Override
    public boolean isNew() {
        return createAt == null;
    }
}
