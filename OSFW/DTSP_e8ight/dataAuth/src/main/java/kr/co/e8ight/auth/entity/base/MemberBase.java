package kr.co.e8ight.auth.entity.base;

import org.springframework.data.annotation.Id;


import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import java.util.Objects;


@MappedSuperclass
public class MemberBase {

	@Id	
	//@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(name="id")
	private Integer id;

	@Column(name="member_id")
	protected String memberId;
		
	@Column(name="name")
	protected String name;

	public MemberBase() {
	}

	public MemberBase(Integer id, String memberId, String name) {
		this.id = id;
		this.memberId = memberId;
		this.name = name;
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getMemberId() {
		return memberId;
	}

	public void setMemberId(String memberId) {
		this.memberId = memberId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		MemberBase that = (MemberBase) o;
		return Objects.equals(id, that.id) && Objects.equals(memberId, that.memberId) && Objects.equals(name, that.name);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, memberId, name);
	}

	@Override
	public String toString() {
		return "MemberBase{" +
				"id=" + id +
				", memberId='" + memberId + '\'' +
				", name='" + name + '\'' +
				'}';
	}
}