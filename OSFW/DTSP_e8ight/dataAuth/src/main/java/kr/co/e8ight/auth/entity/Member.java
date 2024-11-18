package kr.co.e8ight.auth.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.e8ight.auth.entity.converter.AuthTypeConverter;
import kr.co.e8ight.auth.entity.converter.BooleanToStringConverter;
import kr.co.e8ight.auth.entity.converter.MemberStatusConverter;
import kr.co.e8ight.auth.type.AuthType;
import kr.co.e8ight.auth.type.MemberStatus;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import javax.persistence.*;
import java.util.List;

/**
 * The persistent class for the member database table.
 * 
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Setter @Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="member", schema = "member")
public class Member extends ReferenceEntity{
	@Id
	@GeneratedValue(strategy= GenerationType.IDENTITY)
	@Column
	private Integer id;

	@Column(name="member_id", nullable = false, length =12 )
	protected String memberId;

	@Column(name="name", nullable = false, length = 50)
	protected String name;

	@JsonIgnore
	@Column(name="passwd", nullable = false, length = 255)
	private String passwd;

	@Column(name="mb_phone", nullable = false, length = 255)
	private String hp;

	@Column(name="email", nullable = false, length = 255)
	private String email;

	@Column(name="status", nullable = false, length = 1)
	@ColumnDefault("'A'")
	@Convert(converter = MemberStatusConverter.class)
	private MemberStatus status;

	@Column(name="auth_type", nullable = false, length = 2)
	@ColumnDefault("'MB'")
	@Convert(converter = AuthTypeConverter.class)
	private AuthType authType;

	@Column(name="delete_yn", nullable = false, length = 1)
	@ColumnDefault("'N'")
	@Convert(converter = BooleanToStringConverter.class)
	private Boolean deleteYn;

	@OneToOne(mappedBy = "member")
	private RefreshToken refreshToken;

//	@OneToMany(mappedBy = "member")
//	private List<AuthHistory> authHistoryList;

	public Member(Integer id) {
		this.id = id;
	}
}