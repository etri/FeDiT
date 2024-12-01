package net.jcms.framework.security.model;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
public class UserSearch extends User {
	
	private String userLoginIdLike;
	private String userNmLike;
	@Builder.Default
	List<String> roleAuthList = new ArrayList<>();
	
//	public String getUserLoginIdLike() {
//		return userLoginIdLike;
//	}
//	public void setUserLoginIdLike(String userLoginIdLike) {
//		this.userLoginIdLike = userLoginIdLike;
//	}
//	public String getUserNmLike() {
//		return userNmLike;
//	}
//	public void setUserNmLike(String userNmLike) {
//		this.userNmLike = userNmLike;
//	}
	
	
}
