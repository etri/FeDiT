package kr.co.e8ight.auth.entity;

import lombok.*;

import javax.persistence.*;


@Setter @Getter
@AllArgsConstructor
@Builder
@Entity
@Table(name="refresh_token" ,schema = "member")
public class RefreshToken extends ReferenceEntity{
	
	@Id
	@GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column(name="id")
	private Integer Id;

	@OneToOne
	@JoinColumn(name="reg_id")
	private Member member;

    @Column(name="token")
	private String token;
    

	public RefreshToken() {
	}

	public RefreshToken updateValue(String token) {
        this.token = token;
        return this;
    }
}