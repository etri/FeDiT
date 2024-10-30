package net.jcms.framework.security.springExt;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.security.model.User;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.jdbc.JdbcDaoImpl;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
public class CustomJdbcDaoImpl extends JdbcDaoImpl {

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<UserDetails> users = loadUsersByUsername(username);
        if (users.size() == 0) {
            log.debug("Query returned no results for user '" + username + "'");
            throw new UsernameNotFoundException(this.messages.getMessage("JdbcDaoImpl.notFound",
                    new Object[] { username }, "Username {0} not found"));
        }
        UserDetailsImpl user = (UserDetailsImpl)users.get(0); // contains no GrantedAuthority[]
        Set<GrantedAuthority> dbAuthsSet = new HashSet<>();
        if (getEnableAuthorities()) {
            dbAuthsSet.addAll(loadUserAuthorities(user.getUsername()));
        }
        if (getEnableGroups()) {
            dbAuthsSet.addAll(loadGroupAuthorities(user.getUsername()));
        }
        List<GrantedAuthority> dbAuths = new ArrayList<>(dbAuthsSet);
        user.setAuthorities(dbAuths);
//        addCustomAuthorities(user.getUsername(), dbAuths);
        if (dbAuths.size() == 0) {
            log.debug("User '" + username + "' has no authorities and will be treated as 'not found'");
            throw new UsernameNotFoundException(this.messages.getMessage("JdbcDaoImpl.noAuthority",
                    new Object[] { username }, "User {0} has no GrantedAuthority"));
        }
        return user;
//        return createUserDetails(username, user, dbAuths);
    }

    @Override
    protected List<UserDetails> loadUsersByUsername(String username) {
        return getJdbcTemplate().query(getUsersByUsernameQuery(), new String[] {username}, new RowMapper<UserDetails>() {
            public UserDetails mapRow(ResultSet rs, int rowNm) throws SQLException {
                Long userId = Long.valueOf(rs.getString(1));
                String userLoginId = rs.getString(2);
                String institutionIdString = rs.getString(3);
                Long institutionId = institutionIdString!=null?Long.parseLong(rs.getString(3)):null;
                String userPwd = rs.getString(4);
                String recSt = rs.getString(5);
                String userNm = rs.getString(6);

                User user = User.builder()
                        .userId(userId)
                        .userLoginId(userLoginId)
                        .institutionId(institutionId)
                        .userNm(userNm)
                        .userPwd(userPwd)
                        .recSt(recSt)
                        .build();
                return new UserDetailsImpl(user);
            }
        });
    }

    @Override
    protected List<GrantedAuthority> loadUserAuthorities(String username) {
        return getJdbcTemplate().query(getAuthoritiesByUsernameQuery(), new String[]{username}, new RowMapper<GrantedAuthority>() {
            @Override
            public GrantedAuthority mapRow(ResultSet rs, int rowNum) throws SQLException {
                String roleName = getRolePrefix() + rs.getString(2);
                return new SimpleGrantedAuthority(roleName);
            }
        });
    }

    @Override
    protected List<GrantedAuthority> loadGroupAuthorities(String username) {
        return super.loadGroupAuthorities(username);
    }
}
