package kr.co.e8ight.auth.entity.base;

import javax.persistence.*;
import java.util.Objects;


/**
 * The persistent class for the com_code database table.
 * 
 */

@MappedSuperclass
public class CodeBase {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(unique=true, nullable=false, length=20)
	private String code;

	@Column(length=50)
	private String name;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
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
		CodeBase codeBase = (CodeBase) o;
		return Objects.equals(code, codeBase.code) && Objects.equals(name, codeBase.name);
	}

	@Override
	public int hashCode() {
		return Objects.hash(code, name);
	}

	@Override
	public String toString() {
		return "CodeBase{" +
				"code='" + code + '\'' +
				", name='" + name + '\'' +
				'}';
	}
}