package kr.co.e8ight.auth.repository;


import kr.co.e8ight.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
//	RefreshToken findByRegIdAndDeviceId(Integer regId, String deviceId);
	Optional<RefreshToken> findByToken(String token);
//	void deleteAllByRegIdAndDeviceId(Integer regId, String deviceId);
}
