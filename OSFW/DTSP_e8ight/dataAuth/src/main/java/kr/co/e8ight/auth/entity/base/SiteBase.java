package kr.co.e8ight.auth.entity.base;

import javax.persistence.*;
import java.util.Objects;

@MappedSuperclass
public class SiteBase {
	
	@Id	
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(unique=true, nullable=false, updatable=false)
	private Integer id;

	@Column(nullable=false, length=50)
	private String constructionName;
		
	@Column(nullable=false, length=20)
	private String name;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getConstructionName() {
		return constructionName;
	}

	public void setConstructionName(String constructionName) {
		this.constructionName = constructionName;
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
		SiteBase siteBase = (SiteBase) o;
		return Objects.equals(id, siteBase.id) && Objects.equals(constructionName, siteBase.constructionName) && Objects.equals(name, siteBase.name);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, constructionName, name);
	}

	@Override
	public String toString() {
		return "SiteBase{" +
				"id=" + id +
				", constructionName='" + constructionName + '\'' +
				", name='" + name + '\'' +
				'}';
	}
}
