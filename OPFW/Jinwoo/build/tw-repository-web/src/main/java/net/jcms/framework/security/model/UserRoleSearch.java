package net.jcms.framework.security.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
@ToString
public class UserRoleSearch extends UserRole {
    private String userIdLike;
    private Boolean limitYn;

//    public String getUserIdLike() {
//        return userIdLike;
//    }
//    public void setUserIdLike(String userIdLike) {
//        this.userIdLike = userIdLike;
//    }
//    public Boolean getLimitYn() {
//        return limitYn;
//    }
//    public void setLimitYn(Boolean limitYn) {
//        this.limitYn = limitYn;
//    }
}