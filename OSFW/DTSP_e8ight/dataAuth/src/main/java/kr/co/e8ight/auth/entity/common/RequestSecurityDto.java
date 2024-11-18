package kr.co.e8ight.auth.entity.common;

import org.springframework.security.crypto.password.PasswordEncoder;

public interface RequestSecurityDto <T> {
    public T toEntity( PasswordEncoder passwordEncoder);
}