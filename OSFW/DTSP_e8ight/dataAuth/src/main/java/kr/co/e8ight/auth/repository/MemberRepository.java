package kr.co.e8ight.auth.repository;


import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.type.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Integer> {
		
	List<Member> findByMemberIdAndStatus(String email, MemberStatus status);
//	List<Member> findByMemberIdAndNameAndmPhone(String email, String name, String mPhone);
	Page<Member> findAllBy(Pageable pageable);
	
	Optional<Member> findById(Integer id);
	Boolean existsByMemberId(String memberId);

}

