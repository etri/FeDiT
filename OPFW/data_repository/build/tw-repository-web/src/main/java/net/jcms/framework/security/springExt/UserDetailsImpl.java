package net.jcms.framework.security.springExt;

import lombok.Getter;
import net.jcms.framework.security.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.Assert;

import java.io.Serializable;
import java.util.*;

public class UserDetailsImpl implements UserDetails {

    @Getter
    private User user;
    private Set<GrantedAuthority> authorities;

    public UserDetailsImpl(User user) {
        this.user = user;
    }

    public void setAuthorities(Collection<? extends GrantedAuthority> authorities) {
        this.authorities = Collections.unmodifiableSet(sortAuthorities(authorities));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getUserPwd();
    }

    @Override
    public String getUsername() {
        return user.getUserLoginId();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    private static SortedSet<GrantedAuthority> sortAuthorities(Collection<? extends GrantedAuthority> authorities) {
        Assert.notNull(authorities, "authorities null.");

        SortedSet<GrantedAuthority> sortedSet = new TreeSet<GrantedAuthority>(new AuthorityComparator());

        for(GrantedAuthority authority : authorities) {
            sortedSet.add(authority);
        }

        return sortedSet;
    }

    private static class AuthorityComparator implements Comparator<GrantedAuthority>, Serializable {

        @Override
        public int compare(GrantedAuthority o1, GrantedAuthority o2) {
            if(o2.getAuthority() == null) {
                return -1;
            }

            if(o1.getAuthority() == null) {
                return 1;
            }

            return o1.getAuthority().compareTo(o2.getAuthority());
        }
    }


}
