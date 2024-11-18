package kr.co.e8ight.auth.service;


import io.jsonwebtoken.Claims;
import kr.co.e8ight.auth.dto.JoinRequestDto;
import kr.co.e8ight.auth.dto.MemberDto;
import kr.co.e8ight.auth.dto.MemberResponseDto;
import kr.co.e8ight.auth.dto.PasswdResponseDto;
import kr.co.e8ight.auth.entity.AuthHistory;
import kr.co.e8ight.auth.entity.Member;
import kr.co.e8ight.auth.exception.AuthorizationException;
import kr.co.e8ight.auth.repository.AuthHistoryRepository;
import kr.co.e8ight.auth.repository.MemberRepository;
import kr.co.e8ight.auth.repository.MemberRepositoryQdsl;
import kr.co.e8ight.auth.type.ApproveLevel;
import kr.co.e8ight.auth.type.AuthType;
import kr.co.e8ight.auth.type.MemberStatus;
import kr.co.e8ight.auth.util.CryptoUtil;
import kr.co.e8ight.auth.util.JwtUtil;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


/**
 * @author eojin
 *
 */
@Slf4j
@Service
public class MemberService {

    private AuthHistoryRepository authHistoryRepository;
	private MemberRepository memberRepository;

    private MemberRepositoryQdsl memberRepositoryQdsl;

    private PasswordEncoder passwordEncoder;

    private ModelMapper modelMapper = new ModelMapper();

    private RegularExpression pwdRegularExpression;

    private JwtUtil jwtUtil;

    @Autowired
    public MemberService(MemberRepository memberRepository,
                         MemberRepositoryQdsl memberRepositoryQdsl,
						 PasswordEncoder passwordEncoder,
                         RegularExpression pwdRegularExpression,
                         JwtUtil jwtUtil,
                         AuthHistoryRepository authHistoryRepository
						 ) {
    	    	
        this.memberRepository = memberRepository;
        this.memberRepositoryQdsl = memberRepositoryQdsl;
        this.passwordEncoder = passwordEncoder;
        this.pwdRegularExpression = pwdRegularExpression;
        this.jwtUtil = jwtUtil;
        this.authHistoryRepository = authHistoryRepository;
    }

    public MemberResponseDto getMemberByMemberId(String memberId){

        Member member = memberRepositoryQdsl.findByMemberId(memberId)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. memberId="+memberId));

        return modelMapper.map(member, MemberResponseDto.class);
    }

    @Transactional(readOnly = true)
    public MemberResponseDto getMemberById(Integer id){

        Member member = memberRepository.findById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. id="+id));

        return modelMapper.map(member, MemberResponseDto.class);
    }

    public Integer findId(String memberId){
        Member member = memberRepositoryQdsl.findByMemberId(memberId)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. memberId="+memberId));

        return member.getId();
    }

    public String findMemberId(Integer id){
        Member member = memberRepository.findById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. id"+id));

        return member.getMemberId();
    }

	public MemberResponseDto getMemberByToken(String accessToken) {
		Claims claims = jwtUtil.parseClaims(accessToken.replace("Bearer ", ""));
		return this.getMemberById(Integer.parseInt(claims.getSubject()));
	}

    @Transactional
    public Member signup(JoinRequestDto memberRequestDto){

        Optional<Member> optMember = memberRepositoryQdsl.findByMemberId(memberRequestDto.getMemberId());
        Boolean isExist = optMember.isPresent();

        if (isExist)
            throw new AuthorizationException(ErrorCode.ALREADY_EXISTS, "MemberId exists. memberId="+memberRequestDto.getMemberId()+",id="+optMember.get().getId());

        String orgVerifyHp = CryptoUtil.ase256EncodeDefaultVal(memberRequestDto.getMbPhone());
        Member member = memberRequestDto.toEntity(passwordEncoder);
        member.setAuthType(memberRequestDto.getIsAdmin() ? AuthType.ADMIN : AuthType.USER);
        member.setStatus(MemberStatus.ACTIVE);
        member.setHp(orgVerifyHp);
        member.setEmail(memberRequestDto.getEmail());

        validatePassword(member);

        this.createMember(member);

        AuthHistory authHistory = AuthHistory.builder()
                        .member(member)
                        .authType(member.getAuthType())
                        .approveLevel(ApproveLevel.NONE)
                        .build();

        authHistoryRepository.save(authHistory);
        return member;
    }

    private void validatePassword(Member member) {
        // 패스워드 regExpression 확인
        Boolean isValid = pwdRegularExpression.pwdRegularExpressionChk(member.getPasswd(), null, member.getMemberId(), "pattern1");

        if (!isValid)
            throw new AuthorizationException(ErrorCode.UNAUTHORIZED, "Password is invalid.");
    }


    @Transactional(readOnly = true)
    public Page<MemberResponseDto> getMemberList(Pageable pageable){

        Page<Member> members = memberRepository.findAllBy(pageable);
        if (members.getTotalElements() == 0)
            throw new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Members are not found.");

        List<MemberResponseDto> memberResponseDtos = members.stream().map(p->{
            MemberResponseDto memberResponseDto = modelMapper.map(p, MemberResponseDto.class);
            return memberResponseDto;
        }).collect(Collectors.toList());

        return new PageImpl<MemberResponseDto>(memberResponseDtos, pageable, members.getTotalElements());
    }

    @Transactional
    protected void createMember(Member member){
        memberRepository.save(member);
    }

    protected Member getMember(Integer id, String memberId){

        if (id == null)
            id = this.findId(memberId);

        Integer finalId = id;
        Member member = memberRepository.findById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. id="+ finalId+",memberId="+memberId));

        return member;
    }

    @Transactional
    public long updateMember(MemberDto memberDto){

        String memberId = memberDto.getMemberId();
        Integer id = this.findId(memberId);

        Member member = memberRepository.findById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. id="+ id +",memberId="+memberId));


        String orgVerifyHp = CryptoUtil.ase256EncodeDefaultVal(memberDto.getMbPhone());

        member.setHp(orgVerifyHp);
        member.setEmail(memberDto.getEmail());

        memberRepository.save(member);

        return 0;
    }

    @Transactional
    public long deleteMember(Integer id, String memberId){
        Integer rId = null;
        if (id == null) {
            id = this.findId(memberId);
        }

        Integer finalId = id;
        Member member = memberRepository.findById(id)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "Member is not found. id="+ finalId +",memberId="+memberId));

        member.setDeleteYn(Boolean.TRUE);
        member.setStatus(MemberStatus.STOP);
        memberRepository.save(member);

        return 0;
    }

    @Transactional
    public PasswdResponseDto initPassword(Integer id, String memberId){
        Integer rId = id;
        if (id == null){
            rId = this.findId(memberId);
        }

        Member member = memberRepository.findById(rId)
                .orElseThrow(()-> new AuthorizationException(ErrorCode.RESOURCE_NOT_FOUND, "member is not found."));

        String initPasswd = this.getRamdomPassword(10);
        member.setPasswd(passwordEncoder.encode(initPasswd));

        memberRepository.save(member);

        return new PasswdResponseDto(member.getId(), member.getMemberId(), initPasswd);
    }


    private String getRamdomPassword(int size) {
        char[] charSet = new char[] {
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                '!', '@', '#', '$', '%', '^', '&' };

        StringBuffer sb = new StringBuffer();
        SecureRandom sr = new SecureRandom();
        sr.setSeed(new Date().getTime());

        int idx = 0;
        int len = charSet.length;
        for (int i=0; i<size; i++) {
            // idx = (int) (len * Math.random());
            idx = sr.nextInt(len);    // 강력한 난수를 발생시키기 위해 SecureRandom을 사용한다.
            sb.append(charSet[idx]);
        }
        return sb.toString();
    }

/*
    private Boolean removeReToken(TokenDto tokenReqDto) {
        RefreshTokenPK refreshTokenPK = new RefreshTokenPK(tokenReqDto.getId(), tokenReqDto.getRefreshToken());
         
        return refreshTokenRepository.existsById(refreshTokenPK).map(
        		isExist -> {
        			if (isExist) refreshTokenRepository.deleteById(refreshTokenPK);    
        			return isExist;
        		});

    }
*/
}
